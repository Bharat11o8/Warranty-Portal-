
import { Response } from 'express';
import db, { getISTTimestamp } from '../config/database.js';
import { AuthRequest } from '../middleware/auth.js';
import { EmailService } from '../services/email.service.js';
import { NotificationService } from '../services/notification.service.js';

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

            // Send confirmation email
            try {
                // Fetch customer details
                const [userRows]: any = await db.execute('SELECT name, email FROM profiles WHERE id = ?', [userId]);
                const customerName = userRows[0]?.name || 'Customer';
                const customerEmail = userRows[0]?.email || req.user?.email;

                // Fetch store name if franchiseId is present
                let storeName: string | undefined;
                if (franchiseId) {
                    const [storeRows]: any = await db.execute('SELECT store_name FROM vendor_details WHERE id = ?', [franchiseId]);
                    storeName = storeRows[0]?.store_name;
                }

                // Send email asynchronously
                EmailService.sendGrievanceConfirmationEmail(
                    customerEmail,
                    customerName,
                    {
                        ticket_id: ticketId,
                        category,
                        subject,
                        description,
                        store_name: storeName,
                        created_at: new Date().toISOString()
                    }
                ).catch((err: any) => console.error('Failed to send grievance confirmation email:', err));

            } catch (emailError) {
                console.error('Error preparing grievance email:', emailError);
                // Don't fail the request if email fails
            }



            // Notifications
            try {
                // 1. Notify Admins
                await NotificationService.broadcast({
                    title: `New Grievance: ${ticketId}`,
                    message: `A new grievance has been submitted by a customer. Subject: ${subject}`,
                    type: 'warranty',
                    link: `/admin/grievances/${ticketId}`,
                    targetRole: 'admin'
                });

                // 2. Notify Franchise if applicable
                if (franchiseId) {
                    // Find user_id for this franchise
                    const [vendorRows]: any = await db.execute(
                        'SELECT user_id FROM vendor_details WHERE id = ?',
                        [franchiseId]
                    );
                    if (vendorRows.length > 0) {
                        await NotificationService.notify(vendorRows[0].user_id, {
                            title: `New Grievance Assigned: ${ticketId}`,
                            message: `A customer has registered a grievance against your store. Details: ${subject}`,
                            type: 'warranty',
                            link: `/dashboard/vendor`
                        });
                    }
                }
            } catch (notifError) {
                console.error('Failed to send grievance submission notifications:', notifError);
            }

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
     * Submit a new grievance (Franchise/Vendor)
     * POST /api/grievance/franchise
     */
    submitFranchiseGrievance = async (req: AuthRequest, res: Response) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, error: 'Unauthorized' });
            }

            const { department, departmentDetails, category, subject, description, attachments } = req.body;

            // Validation
            if (!department || !category || !subject || !description) {
                return res.status(400).json({
                    success: false,
                    error: 'Department, category, subject, and description are required'
                });
            }

            // Validate department
            const validDepartments = ['plant', 'distributor', 'asm'];
            if (!validDepartments.includes(department.toLowerCase())) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid department. Must be Plant, Distributor, or ASM'
                });
            }

            // Require details for Distributor and ASM
            if (['distributor', 'asm'].includes(department.toLowerCase()) && !departmentDetails) {
                return res.status(400).json({
                    success: false,
                    error: 'Name/details are required for Distributor and ASM'
                });
            }

            // Get franchise details
            const [vendorRows]: any = await db.execute(
                'SELECT id, store_name, store_email as email FROM vendor_details WHERE user_id = ?',
                [userId]
            );

            if (vendorRows.length === 0) {
                return res.status(403).json({
                    success: false,
                    error: 'Franchise account not found'
                });
            }

            const vendor = vendorRows[0];
            const ticketId = this.generateTicketId();

            // Insert grievance
            await db.execute(
                `INSERT INTO grievances 
                (ticket_id, customer_id, source_type, department, department_details, category, subject, description, attachments, status, created_at, status_updated_at)
                VALUES (?, ?, 'franchise', ?, ?, ?, ?, ?, ?, 'submitted', ?, ?)`,
                [
                    ticketId,
                    userId,
                    department.toLowerCase(),
                    departmentDetails || null,
                    category,
                    subject,
                    description,
                    attachments ? JSON.stringify(attachments) : null,
                    getISTTimestamp(),
                    getISTTimestamp()
                ]
            );

            // Create notification for admin
            try {
                await db.execute(
                    `INSERT INTO notifications (user_id, title, message, type, link, created_at) 
                     SELECT id, ?, ?, 'warning', ?, ? 
                     FROM profiles WHERE role = 'admin'`,
                    [
                        `🏪 Franchise Grievance: ${ticketId}`,
                        `Franchise "${vendor.store_name}" submitted a grievance to ${department}. Subject: ${subject}`,
                        `/admin/grievances/${ticketId}`,
                        getISTTimestamp()
                    ]
                );
            } catch (notifError) {
                console.error('Failed to send franchise grievance notification:', notifError);
            }

            // Send confirmation email to franchise
            try {
                await EmailService.sendFranchiseGrievanceConfirmationEmail(
                    vendor.email,
                    vendor.store_name,
                    {
                        ticket_id: ticketId,
                        category,
                        subject,
                        department,
                        department_details: departmentDetails
                    }
                );
            } catch (emailError) {
                console.error('Failed to send franchise grievance confirmation email:', emailError);
            }

            return res.status(201).json({
                success: true,
                message: 'Grievance submitted successfully',
                data: { ticketId }
            });

        } catch (error: any) {
            console.error('Submit franchise grievance error:', error.message, error.code, error.sqlMessage);
            return res.status(500).json({
                success: false,
                error: 'Failed to submit grievance: ' + (error.sqlMessage || error.message)
            });
        }
    }

    /**
     * Get franchise's submitted grievances
     * GET /api/grievance/franchise/submitted
     */
    getFranchiseSubmittedGrievances = async (req: AuthRequest, res: Response) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, error: 'Unauthorized' });
            }

            const [grievances] = await db.execute(
                `SELECT g.*, 
                    CASE 
                        WHEN g.department = 'plant' THEN 'Plant'
                        WHEN g.department = 'distributor' THEN CONCAT('Distributor: ', COALESCE(g.department_details, 'N/A'))
                        WHEN g.department = 'asm' THEN CONCAT('ASM: ', COALESCE(g.department_details, 'N/A'))
                        ELSE g.department
                    END as department_display
                FROM grievances g
                WHERE g.customer_id = ? AND g.source_type = 'franchise'
                ORDER BY g.created_at DESC`,
                [userId]
            );

            return res.json({ success: true, data: grievances });

        } catch (error: any) {
            console.error('Get franchise submitted grievances error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch submitted grievances'
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
                CASE 
                    WHEN g.source_type = 'franchise' THEN vd_franchise.store_name
                    ELSE p.name 
                END as customer_name,
                
                CASE 
                    WHEN g.source_type = 'franchise' THEN vd_franchise.store_email
                    ELSE p.email 
                END as customer_email,

                CASE 
                    WHEN g.source_type = 'franchise' THEN CONCAT(UPPER(COALESCE(g.department, '')), COALESCE(CONCAT(' - ', g.department_details), ''))
                    ELSE vd_customer.store_name 
                END as franchise_name,
                
                COALESCE(vd_customer.address, vd_franchise.address) as franchise_address,
                COALESCE(vd_customer.city, vd_franchise.city) as franchise_city
         FROM grievances g
         LEFT JOIN profiles p ON g.customer_id = p.id
         LEFT JOIN vendor_details vd_customer ON g.franchise_id = vd_customer.id
         LEFT JOIN vendor_details vd_franchise ON g.source_type = 'franchise' AND g.customer_id = vd_franchise.user_id
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
                    updates.push('resolved_at = ?');
                    values.push(getISTTimestamp());
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

            // Notify User (Franchise/Customer) about status update
            try {
                // Get the grievance owner to notify
                const [rows]: any = await db.execute('SELECT customer_id, ticket_id FROM grievances WHERE id = ?', [id]);
                if (rows.length > 0) {
                    const g = rows[0];
                    await NotificationService.notify(g.customer_id, {
                        title: `Grievance Updated: ${g.ticket_id}`,
                        message: `Status changed to ${status}. Details available in portal.`,
                        type: 'warranty',
                        link: `/grievance/view/${id}`
                    });
                    // Notify admins about the status change
                    await NotificationService.broadcast({
                        title: `Grievance ${g.ticket_id} Status Updated`,
                        message: `Grievance ${g.ticket_id} status changed to ${status}.`,
                        type: 'warranty',
                        link: `/admin/grievances/${g.ticket_id}?id=${id}`, // Assuming admin url structure
                        targetUsers: [],
                        targetRole: 'admin'
                    });
                }
            } catch (e) {
                console.error("Failed to notify user of grievance update", e);
            }


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

            // Notify Customer about new remarks
            try {
                const [rows]: any = await db.execute('SELECT customer_id, ticket_id FROM grievances WHERE id = ?', [id]);
                if (rows.length > 0) {
                    await NotificationService.notify(rows[0].customer_id, {
                        title: `Update on Grievance: ${rows[0].ticket_id}`,
                        message: `${userRole === 'admin' ? 'Admin' : 'Franchise'} has added remarks to your ticket.`,
                        type: 'warranty',
                        link: `/grievance/view/${id}`
                    });
                }
            } catch (notifError) {
                console.error('Failed to notify customer of remarks:', notifError);
            }

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
                updates.push('status_updated_at = ?');
                values.push(getISTTimestamp());
                if (status === 'resolved' || status === 'rejected') {
                    updates.push('resolved_at = ?');
                    values.push(getISTTimestamp());
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

            // Notify Customer about admin update
            try {
                const [rows]: any = await db.execute('SELECT customer_id, ticket_id FROM grievances WHERE id = ?', [id]);
                if (rows.length > 0) {
                    await NotificationService.notify(rows[0].customer_id, {
                        title: `Update on Grievance: ${rows[0].ticket_id}`,
                        message: `Admin has updated your grievance details.`,
                        type: 'warranty',
                        link: `/grievance/view/${id}`
                    });
                }
            } catch (notifError) {
                console.error('Failed to notify customer of admin update:', notifError);
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

    /**
     * Send grievance assignment email to external team member
     * POST /api/grievance/:id/send-assignment-email
     */
    sendAssignmentEmail = async (req: AuthRequest, res: Response) => {
        try {
            const { id } = req.params;
            const { assigneeName, assigneeEmail, remarks } = req.body;
            const userRole = req.user?.role;

            // Admin only
            if (userRole !== 'admin') {
                return res.status(403).json({ success: false, error: 'Admin access required' });
            }

            // Validate inputs
            if (!assigneeName || !assigneeEmail) {
                return res.status(400).json({
                    success: false,
                    error: 'Assignee name and email are required'
                });
            }

            // Basic email format validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(assigneeEmail)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid email format'
                });
            }

            // Fetch grievance with all required data
            const [rows]: any = await db.execute(
                `SELECT g.*, 
                p.name as customer_name, 
                p.email as customer_email,
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

            // Update assigned_to field
            await db.execute(
                'UPDATE grievances SET assigned_to = ? WHERE id = ?',
                [assigneeName, id]
            );

            // Send email
            const { EmailService } = await import('../services/email.service.js');
            const emailSent = await EmailService.sendGrievanceAssignmentEmail(
                assigneeEmail,
                assigneeName,
                {
                    ticket_id: grievance.ticket_id,
                    category: grievance.category,
                    sub_category: grievance.sub_category,
                    subject: grievance.subject,
                    description: grievance.description,
                    customer_name: grievance.customer_name,
                    franchise_name: grievance.franchise_name,
                    franchise_address: grievance.franchise_address,
                    franchise_city: grievance.franchise_city,
                    attachments: grievance.attachments,
                    created_at: grievance.created_at
                },
                remarks || undefined
            );

            if (!emailSent) {
                return res.status(500).json({
                    success: false,
                    error: 'Failed to send email. Please try again.'
                });
            }

            // Save assignment record to database
            const assignmentType = req.body.assignmentType || 'initial';
            const adminName = 'Admin';

            await db.execute(
                `INSERT INTO grievance_assignments 
                 (grievance_id, assignee_name, assignee_email, remarks, assignment_type, sent_by, sent_by_name)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [id, assigneeName, assigneeEmail, remarks || null, assignmentType, req.user?.id, adminName]
            );

            return res.json({
                success: true,
                message: `Email sent successfully to ${assigneeEmail}`
            });

        } catch (error: any) {
            console.error('Send assignment email error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to send assignment email'
            });
        }
    }

    /**
     * Get assignment history for a grievance
     * GET /api/grievance/:id/assignments
     */
    getAssignmentHistory = async (req: AuthRequest, res: Response) => {
        try {
            const { id } = req.params;
            const userRole = req.user?.role;

            // Only admin can view assignment history
            if (userRole !== 'admin') {
                return res.status(403).json({ success: false, error: 'Admin access required' });
            }

            const [assignments] = await db.execute(
                `SELECT id, assignee_name, assignee_email, remarks, assignment_type, 
                        email_sent_at, sent_by, sent_by_name
                 FROM grievance_assignments 
                 WHERE grievance_id = ?
                 ORDER BY email_sent_at DESC`,
                [id]
            );

            return res.json({ success: true, data: assignments });

        } catch (error: any) {
            console.error('Get assignment history error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch assignment history'
            });
        }
    }
}

export default new GrievanceController();
