import { Response } from 'express';
import db from '../config/database.js';
import { AuthRequest } from '../middleware/auth.js';

/**
 * Grievance Controller
 * Handles customer grievances/complaints
 */
class GrievanceController {

    /**
     * Generate unique ticket ID (GR-XXXXXX)
     */
    private generateTicketId(): string {
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `GR-${timestamp}${random}`.substring(0, 12);
    }

    /**
     * Submit a new grievance (Customer only)
     * POST /api/grievance
     */
    submitGrievance = async (req: AuthRequest, res: Response) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, error: 'Unauthorized' });
            }

            const {
                franchiseId,
                warrantyUid,
                category,
                subCategory,
                subject,
                description
            } = req.body;

            // Get uploaded files from multer (Cloudinary)
            const uploadedFiles = req.files as Express.Multer.File[];
            const attachmentUrls = uploadedFiles?.map((file: any) => file.path || file.secure_url || file.url) || [];

            // Validate required fields
            if (!category || !subject || !description) {
                return res.status(400).json({
                    success: false,
                    error: 'Category, subject, and description are required'
                });
            }

            // Check if attachment is required for this category
            const attachmentRequiredCategories = ['product_issue', 'billing_issue'];
            if (attachmentRequiredCategories.includes(category)) {
                if (!uploadedFiles || uploadedFiles.length === 0) {
                    return res.status(400).json({
                        success: false,
                        error: 'Attachment is required for product or billing issues'
                    });
                }
            }

            const ticketId = this.generateTicketId();



            const [result] = await db.execute(
                `INSERT INTO grievances 
         (ticket_id, customer_id, franchise_id, warranty_uid, category, sub_category, subject, description, attachments)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    ticketId,
                    userId,
                    franchiseId || null,
                    warrantyUid || null,
                    category,
                    subCategory || null,
                    subject,
                    description,
                    JSON.stringify(attachmentUrls)
                ]
            );



            return res.status(201).json({
                success: true,
                message: 'Grievance submitted successfully',
                data: { ticketId }
            });

        } catch (error: any) {
            console.error('Submit grievance error:', error.message, error.code, error.sqlMessage);
            return res.status(500).json({
                success: false,
                error: 'Failed to submit grievance: ' + (error.sqlMessage || error.message)
            });
        }
    }

    /**
     * Get customer's grievances
     * GET /api/grievance
     */
    getMyGrievances = async (req: AuthRequest, res: Response) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, error: 'Unauthorized' });
            }

            const [grievances] = await db.execute(
                `SELECT g.*, vd.store_name as franchise_name
         FROM grievances g
         LEFT JOIN vendor_details vd ON g.franchise_id = vd.id
         WHERE g.customer_id = ?
         ORDER BY g.created_at DESC`,
                [userId]
            );

            // Sanitization: Remove admin_notes
            const sanitizedGrievances = (grievances as any[]).map(g => {
                const { admin_notes, ...rest } = g;
                return rest;
            });

            return res.json({ success: true, data: sanitizedGrievances });

        } catch (error: any) {
            console.error('Get grievances error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch grievances'
            });
        }
    }

    /**
     * Get grievances for a franchise (Vendor)
     * GET /api/grievance/vendor
     */
    getVendorGrievances = async (req: AuthRequest, res: Response) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, error: 'Unauthorized' });
            }

            // Get vendor's franchise ID
            const [vendorRows]: any = await db.execute(
                'SELECT id FROM vendor_details WHERE user_id = ?',
                [userId]
            );

            if (!vendorRows || vendorRows.length === 0) {
                return res.status(404).json({ success: false, error: 'Vendor not found' });
            }

            const franchiseId = vendorRows[0].id;

            const [grievances] = await db.execute(
                `SELECT g.*, p.name as customer_name, p.email as customer_email, p.phone_number as customer_phone
         FROM grievances g
         LEFT JOIN profiles p ON g.customer_id = p.id
         WHERE g.franchise_id = ?
         ORDER BY g.created_at DESC`,
                [franchiseId]
            );

            // Sanitization: Remove admin_notes
            const sanitizedGrievances = (grievances as any[]).map(g => {
                const { admin_notes, ...rest } = g;
                return rest;
            });

            return res.json({ success: true, data: sanitizedGrievances });

        } catch (error: any) {
            console.error('Get vendor grievances error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch grievances'
            });
        }
    }

    /**
     * Get all grievances (Admin)
     * GET /api/grievance/admin
     */
    getAllGrievances = async (req: AuthRequest, res: Response) => {
        try {
            const userRole = req.user?.role;
            if (userRole !== 'admin') {
                return res.status(403).json({ success: false, error: 'Admin access required' });
            }

            const [grievances] = await db.execute(
                `SELECT g.*, 
                p.name as customer_name, 
                p.email as customer_email,
                vd.store_name as franchise_name,
                vd.address as franchise_address,
                vd.city as franchise_city
         FROM grievances g
         LEFT JOIN profiles p ON g.customer_id = p.id
         LEFT JOIN vendor_details vd ON g.franchise_id = vd.id
         ORDER BY 
           CASE g.priority 
             WHEN 'urgent' THEN 1 
             WHEN 'high' THEN 2 
             ELSE 3 
           END,
           g.created_at DESC`
            );

            return res.json({ success: true, data: grievances });

        } catch (error: any) {
            console.error('Get all grievances error:', error.message, error.code, error.sqlMessage);
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch grievances: ' + (error.sqlMessage || error.message)
            });
        }
    }

    /**
     * Get single grievance by ID
     * GET /api/grievance/:id
     */
    getGrievanceById = async (req: AuthRequest, res: Response) => {
        try {
            const { id } = req.params;
            const userId = req.user?.id;
            const userRole = req.user?.role;

            const [rows]: any = await db.execute(
                `SELECT g.*, 
                p.name as customer_name, 
                p.email as customer_email,
                p.phone_number as customer_phone,
                vd.store_name as franchise_name,
                vd.address as franchise_address,
                vd.city as franchise_city
         FROM grievances g
         LEFT JOIN profiles p ON g.customer_id = p.id
         LEFT JOIN vendor_details vd ON g.franchise_id = vd.id
         WHERE g.id = ?`,
                [id]
            );

            if (!rows || rows.length === 0) {
                return res.status(404).json({ success: false, error: 'Grievance not found' });
            }

            const grievance = rows[0];

            // Check access permissions
            if (userRole === 'customer' && grievance.customer_id !== userId) {
                return res.status(403).json({ success: false, error: 'Access denied' });
            }

            // Sanitization: Remove admin_notes if not admin
            if (userRole !== 'admin') {
                delete grievance.admin_notes;
            }

            return res.json({ success: true, data: grievance });

        } catch (error: any) {
            console.error('Get grievance by ID error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch grievance'
            });
        }
    }

    /**
     * Assign grievance to someone (Admin only)
     * PUT /api/grievance/:id/assign
     */
    assignGrievance = async (req: AuthRequest, res: Response) => {
        try {
            const { id } = req.params;
            const { assignedTo } = req.body;
            const userRole = req.user?.role;

            if (userRole !== 'admin') {
                return res.status(403).json({ success: false, error: 'Access denied' });
            }

            await db.execute(
                'UPDATE grievances SET assigned_to = ? WHERE id = ?',
                [assignedTo || null, id]
            );

            return res.json({ success: true, message: 'Grievance assigned successfully' });

        } catch (error: any) {
            console.error('Assign grievance error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to assign grievance'
            });
        }
    }

    /**
     * Update grievance status (Vendor/Admin)
     * PUT /api/grievance/:id/status
     */
    updateStatus = async (req: AuthRequest, res: Response) => {
        try {
            const { id } = req.params;
            const { status, priority } = req.body;
            const userRole = req.user?.role;

            if (!['vendor', 'admin'].includes(userRole || '')) {
                return res.status(403).json({ success: false, error: 'Access denied' });
            }

            const validStatuses = ['submitted', 'under_review', 'in_progress', 'resolved', 'rejected'];
            if (status && !validStatuses.includes(status)) {
                return res.status(400).json({ success: false, error: 'Invalid status' });
            }

            const updates: string[] = [];
            const values: any[] = [];

            if (status) {
                updates.push('status = ?');
                values.push(status);

                if (status === 'resolved' || status === 'rejected') {
                    updates.push('resolved_at = NOW()');
                }
            }

            if (priority) {
                updates.push('priority = ?');
                values.push(priority);
            }

            if (updates.length === 0) {
                return res.status(400).json({ success: false, error: 'No updates provided' });
            }

            values.push(id);

            await db.execute(
                `UPDATE grievances SET ${updates.join(', ')} WHERE id = ?`,
                values
            );

            return res.json({ success: true, message: 'Status updated successfully' });

        } catch (error: any) {
            console.error('Update status error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to update status'
            });
        }
    }

    /**
     * Add remarks (Vendor/Admin)
     * PUT /api/grievance/:id/remarks
     */
    addRemarks = async (req: AuthRequest, res: Response) => {
        try {
            const { id } = req.params;
            const { remarks } = req.body;
            const userRole = req.user?.role;

            if (!remarks) {
                return res.status(400).json({ success: false, error: 'Remarks are required' });
            }

            let field: string;
            if (userRole === 'admin') {
                field = 'admin_remarks';
            } else if (userRole === 'vendor') {
                field = 'franchise_remarks';
            } else {
                return res.status(403).json({ success: false, error: 'Access denied' });
            }

            await db.execute(
                `UPDATE grievances SET ${field} = ? WHERE id = ?`,
                [remarks, id]
            );

            return res.json({ success: true, message: 'Remarks added successfully' });

        } catch (error: any) {
            console.error('Add remarks error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to add remarks'
            });
        }
    }

    /**
     * Admin update (Status, Remarks, Internal Notes)
     * PUT /api/grievance/:id/admin-update
     */
    adminUpdateGrievance = async (req: AuthRequest, res: Response) => {
        try {
            const { id } = req.params;
            const { status, admin_remarks, admin_notes } = req.body;
            const userRole = req.user?.role;

            if (userRole !== 'admin') {
                return res.status(403).json({ success: false, error: 'Access denied' });
            }

            const updates: string[] = [];
            const values: any[] = [];

            if (status) {
                updates.push('status = ?');
                values.push(status);
                if (status === 'resolved' || status === 'rejected') {
                    updates.push('resolved_at = NOW()');
                }
            }

            if (admin_remarks !== undefined) {
                updates.push('admin_remarks = ?');
                values.push(admin_remarks);
            }

            if (admin_notes !== undefined) {
                updates.push('admin_notes = ?');
                values.push(admin_notes);
            }

            if (updates.length > 0) {
                values.push(id);
                await db.execute(
                    `UPDATE grievances SET ${updates.join(', ')} WHERE id = ?`,
                    values
                );
            }

            return res.json({ success: true, message: 'Grievance updated successfully' });

        } catch (error: any) {
            console.error('Admin update error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to update grievance'
            });
        }
    }

    /**
     * Add customer rating (after resolution)
     * PUT /api/grievance/:id/rating
     */
    addRating = async (req: AuthRequest, res: Response) => {
        try {
            const { id } = req.params;
            const { rating, feedback } = req.body;
            const userId = req.user?.id;

            // Validate rating
            if (!rating || rating < 1 || rating > 5) {
                return res.status(400).json({ success: false, error: 'Rating must be between 1 and 5' });
            }

            // Check if grievance belongs to user and is resolved
            const [rows]: any = await db.execute(
                'SELECT customer_id, status FROM grievances WHERE id = ?',
                [id]
            );

            if (!rows || rows.length === 0) {
                return res.status(404).json({ success: false, error: 'Grievance not found' });
            }

            if (rows[0].customer_id !== userId) {
                return res.status(403).json({ success: false, error: 'Access denied' });
            }

            if (rows[0].status !== 'resolved' && rows[0].status !== 'rejected') {
                return res.status(400).json({
                    success: false,
                    error: 'Can only rate resolved or rejected grievances'
                });
            }

            await db.execute(
                'UPDATE grievances SET customer_rating = ?, customer_feedback = ? WHERE id = ?',
                [rating, feedback || null, id]
            );

            return res.json({ success: true, message: 'Rating submitted successfully' });

        } catch (error: any) {
            console.error('Add rating error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to submit rating'
            });
        }
    }
}

export default new GrievanceController();
