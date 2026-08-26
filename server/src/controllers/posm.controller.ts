import { Response } from 'express';
import db from '../config/database.js';
import { AuthRequest } from '../middleware/auth.js';
import { vendorRepository } from '../repositories/vendor.repository.js';
import { posmRepository } from '../repositories/posm.repository.js';
import { NotificationService } from '../services/notification.service.js';
import { ActivityLogService } from '../services/activity-log.service.js';

class POSMController {
    private async authorizeRequestAccess(req: AuthRequest, requestIdParam: string) {
        const requestId = Number.parseInt(requestIdParam, 10);
        if (!Number.isInteger(requestId) || requestId <= 0) {
            return { error: { status: 400, body: { success: false, error: 'Invalid ticket id' } } };
        }

        const request = await posmRepository.findById(requestIdParam);
        if (!request) {
            return { error: { status: 404, body: { success: false, error: 'Ticket not found' } } };
        }

        if (req.user?.role === 'admin') {
            return { requestId, request };
        }

        const userId = req.user?.id;
        if (!userId) {
            return { error: { status: 401, body: { success: false, error: 'Unauthorized' } } };
        }

        const vendor = await vendorRepository.findByUserId(userId);
        if (!vendor || vendor.id !== request.franchise_id) {
            return { error: { status: 403, body: { success: false, error: 'Access denied.' } } };
        }

        return { requestId, request };
    }

    /**
     * Generate unique sequential ticket ID (PO-0000001)
     */
    private async generateTicketId(): Promise<string> {
        const [rows]: any = await db.execute(
            `SELECT ticket_id FROM posm_requests
             WHERE ticket_id LIKE 'PO-%'
             ORDER BY ticket_id DESC
             LIMIT 1`
        );

        let nextNumber = 1;
        if (rows.length > 0) {
            const lastId: string = rows[0].ticket_id;
            const parts = lastId.split('-');
            const lastNum = parseInt(parts[1], 10);
            if (!isNaN(lastNum)) nextNumber = lastNum + 1;
        }

        const padded = String(nextNumber).padStart(7, '0');
        return `PO-${padded}`;
    }

    /**
     * Submit a new POSM request (Franchise only)
     * POST /api/posm
     */
    submitRequest = async (req: AuthRequest, res: Response) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, error: 'Unauthorized' });
            }

            // Find franchise ID for this user
            const vendor = await vendorRepository.findByUserId(userId);
            if (!vendor) {
                return res.status(403).json({ success: false, error: 'Access denied. Only franchises can raise POSM requests.' });
            }

            const { requirement } = req.body;
            if (!requirement || requirement.trim().length === 0) {
                return res.status(400).json({ success: false, error: 'Requirement description is mandatory' });
            }

            // Get uploaded files from multer (Cloudinary/Local)
            const uploadedFiles = req.files as Express.Multer.File[];
            const attachmentUrls = uploadedFiles?.map((file: any) => file.path || file.secure_url || file.url) || [];

            const ticketId = await this.generateTicketId();

            // 1. Create the request
            const requestId = await posmRepository.createPOSMRequest({
                ticket_id: ticketId,
                franchise_id: vendor.id,
                requirement: requirement,
                created_by_role: 'franchise',
                created_by: userId,
                status: 'open'
            });

            // 2. Add the first message if there's an attachment or just the requirement as message
            // Requirement is already in the request record, but we can also store it as the first message for the chat flow
            await posmRepository.createMessage({
                request_id: requestId,
                sender_id: userId,
                sender_role: 'franchise',
                message: requirement,
                attachments: attachmentUrls.length > 0 ? attachmentUrls : null
            });

            // 3. Log Activity
            await ActivityLogService.log({
                adminId: userId,
                actionType: 'CREATE_POSM_REQUEST',
                details: { ticketId, requestId }
            });

            return res.status(201).json({
                success: true,
                message: 'POSM request submitted successfully',
                data: { ticketId, requestId }
            });

        } catch (error: any) {
            console.error('Submit POSM request error:', error);
            return res.status(500).json({ success: false, error: 'Failed to submit POSM request' });
        }
    }

    /**
     * Raise a POSM request on a franchise's behalf (Admin only)
     * POST /api/posm/admin/on-behalf
     *
     * Requirements often arrive by phone or email rather than through the
     * portal. This records one against the named store so it enters the same
     * queue as a self-raised ticket. The franchise is named explicitly here
     * instead of taken from the session, so the caller is checked as admin at
     * the route and the target store is verified below.
     */
    submitRequestOnBehalf = async (req: AuthRequest, res: Response) => {
        try {
            const adminId = req.user?.id;
            if (!adminId) {
                return res.status(401).json({ success: false, error: 'Unauthorized' });
            }

            const { requirement, franchiseId } = req.body;

            if (!franchiseId) {
                return res.status(400).json({ success: false, error: 'Choose the franchise this request is for' });
            }
            if (!requirement || requirement.trim().length === 0) {
                return res.status(400).json({ success: false, error: 'Requirement description is mandatory' });
            }

            // The admin vendor list and vendor_details use different id spaces,
            // so accept either and store the resolved vendor_details.id — the
            // column posm_requests.franchise_id has a FK onto it.
            const [vendorRows]: any = await db.execute(
                `SELECT vd.id, vd.store_name
                 FROM vendor_details vd
                 WHERE vd.id = ? OR vd.user_id = ?
                 LIMIT 1`,
                [franchiseId, franchiseId]
            );

            if (!vendorRows.length) {
                return res.status(404).json({ success: false, error: 'Franchise not found' });
            }

            const franchise = vendorRows[0];

            const uploadedFiles = req.files as Express.Multer.File[];
            const attachmentUrls = uploadedFiles?.map((file: any) => file.path || file.secure_url || file.url) || [];

            const ticketId = await this.generateTicketId();

            const requestId = await posmRepository.createPOSMRequest({
                ticket_id: ticketId,
                franchise_id: franchise.id,
                requirement: requirement,
                created_by_role: 'admin',
                created_by: adminId,
                status: 'open'
            });

            // Logged as a franchise message so the ticket reads as the store's
            // requirement, which is whose it is. The admin who entered it is
            // recorded in the activity log below.
            await posmRepository.createMessage({
                request_id: requestId,
                sender_id: adminId,
                sender_role: 'franchise',
                message: requirement,
                attachments: attachmentUrls.length > 0 ? attachmentUrls : null
            });

            await ActivityLogService.log({
                adminId,
                adminName: (req.user as any)?.name,
                adminEmail: (req.user as any)?.email,
                actionType: 'CREATE_POSM_REQUEST_ON_BEHALF',
                targetType: 'POSM_REQUEST',
                targetId: String(requestId),
                targetName: franchise.store_name,
                details: { ticketId, requestId, franchiseId: franchise.id },
                ipAddress: req.ip || req.socket?.remoteAddress
            });

            return res.status(201).json({
                success: true,
                message: `POSM request raised for ${franchise.store_name}`,
                data: { ticketId, requestId }
            });

        } catch (error: any) {
            console.error('Submit POSM request on behalf error:', error);
            return res.status(500).json({ success: false, error: 'Failed to submit POSM request' });
        }
    }

    /**
     * Get all requests for the logged-in franchise
     * GET /api/posm
     */
    getFranchiseRequests = async (req: AuthRequest, res: Response) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, error: 'Unauthorized' });
            }

            const vendor = await vendorRepository.findByUserId(userId);
            if (!vendor) {
                return res.status(403).json({ success: false, error: 'Access denied.' });
            }

            const requests = await posmRepository.getFranchiseRequests(vendor.id);
            return res.json({ success: true, data: requests });

        } catch (error: any) {
            console.error('Get franchise requests error:', error);
            return res.status(500).json({ success: false, error: 'Failed to fetch requests' });
        }
    }

    /**
     * Get ticket details and message history
     * GET /api/posm/:id
     */
    getTicketDetails = async (req: AuthRequest, res: Response) => {
        try {
            const access = await this.authorizeRequestAccess(req, req.params.id);
            if (access.error) {
                return res.status(access.error.status).json(access.error.body);
            }

            const messages = await posmRepository.getMessages(access.requestId);

            return res.json({
                success: true,
                data: {
                    ...access.request,
                    messages
                }
            });

        } catch (error: any) {
            console.error('Get ticket details error:', error);
            return res.status(500).json({ success: false, error: 'Failed to fetch ticket details' });
        }
    }

    /**
     * Send a new message in the chat
     * POST /api/posm/:id/messages
     */
    sendMessage = async (req: AuthRequest, res: Response) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, error: 'Unauthorized' });
            }

            const { message } = req.body;

            const access = await this.authorizeRequestAccess(req, req.params.id);
            if (access.error) {
                return res.status(access.error.status).json(access.error.body);
            }

            // Uploaded files
            const uploadedFiles = req.files as Express.Multer.File[];
            const attachmentUrls = uploadedFiles?.map((file: any) => file.path || file.secure_url || file.url) || [];

            if (!message && attachmentUrls.length === 0) {
                return res.status(400).json({ success: false, error: 'Message or attachment is required' });
            }

            await posmRepository.createMessage({
                request_id: access.requestId,
                sender_id: userId,
                sender_role: req.user?.role === 'admin' ? 'admin' : 'franchise',
                message: message || null,
                attachments: attachmentUrls.length > 0 ? attachmentUrls : null
            });

            return res.json({ success: true, message: 'Message sent' });

        } catch (error: any) {
            console.error('Send message error:', error);
            return res.status(500).json({ success: false, error: 'Failed to send message' });
        }
    }

    /**
     * Get all requests (Admin only)
     * GET /api/posm/admin/all
     */
    getAllRequests = async (req: AuthRequest, res: Response) => {
        try {
            if (req.user?.role !== 'admin') {
                return res.status(403).json({ success: false, error: 'Access denied.' });
            }

            const requests = await posmRepository.getAllRequests();
            return res.json({ success: true, data: requests });

        } catch (error: any) {
            console.error('Get all requests error:', error);
            return res.status(500).json({ success: false, error: 'Failed to fetch requests' });
        }
    }

    /**
     * Update request status or internal notes (Admin only)
     * PUT /api/posm/:id/status
     */
    updateRequest = async (req: AuthRequest, res: Response) => {
        try {
            if (req.user?.role !== 'admin') {
                return res.status(403).json({ success: false, error: 'Access denied.' });
            }

            const { id } = req.params;
            const requestId = parseInt(id);
            const { status, internalNotes } = req.body;

            if (!status) {
                return res.status(400).json({ success: false, error: 'Status is required' });
            }

            const updated = await posmRepository.updateStatus(requestId, status, internalNotes);

            if (updated) {
                // Log status change
                await ActivityLogService.log({
                    adminId: req.user?.id!,
                    actionType: 'UPDATE_POSM_STATUS',
                    targetType: 'POSM_REQUEST',
                    targetId: id,
                    details: { status, internalNotes }
                });

                return res.json({ success: true, message: 'Request updated successfully' });
            } else {
                return res.status(404).json({ success: false, error: 'Request not found' });
            }

        } catch (error: any) {
            console.error('Update POSM request error:', error);
            return res.status(500).json({ success: false, error: 'Failed to update request' });
        }
    }
}

export default new POSMController();
