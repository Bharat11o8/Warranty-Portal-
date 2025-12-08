import db from '../config/database';
import { EmailService } from '../services/email.service';
import { ActivityLogService } from '../services/activity-log.service';
export class AdminController {
    static async getDashboardStats(req, res) {
        try {
            // 1. Total Warranties
            const [warranties] = await db.execute('SELECT COUNT(*) as count FROM warranty_registrations');
            const totalWarranties = warranties[0].count;
            // 2. Total Vendors
            const [vendors] = await db.execute("SELECT COUNT(*) as count FROM user_roles WHERE role = 'vendor'");
            const totalVendors = vendors[0].count;
            // 3. Total Customers
            const [customers] = await db.execute("SELECT COUNT(*) as count FROM user_roles WHERE role = 'customer'");
            const totalCustomers = customers[0].count;
            // 4. Pending Approvals (Pending Warranties)
            const [pending] = await db.execute("SELECT COUNT(*) as count FROM warranty_registrations WHERE status = 'pending'");
            const pendingApprovals = pending[0].count;
            // 5. Validated Warranties
            const [validated] = await db.execute("SELECT COUNT(*) as count FROM warranty_registrations WHERE status = 'validated'");
            const validatedWarranties = validated[0].count;
            // 6. Rejected Warranties
            const [rejected] = await db.execute("SELECT COUNT(*) as count FROM warranty_registrations WHERE status = 'rejected'");
            const rejectedWarranties = rejected[0].count;
            res.json({
                success: true,
                stats: {
                    totalWarranties,
                    totalVendors,
                    totalCustomers,
                    pendingApprovals,
                    validatedWarranties,
                    rejectedWarranties
                }
            });
        }
        catch (error) {
            console.error('Get dashboard stats error:', error);
            res.status(500).json({ error: 'Failed to fetch dashboard stats' });
        }
    }
    static async getAllVendors(req, res) {
        try {
            const query = `
                SELECT 
                    p.id,
                    p.name as contact_name,
                    p.email,
                    p.phone_number,
                    vd.store_name,
                    vd.store_email,
                    vd.city,
                    vd.state,
                    vd.address as full_address,
                    vd.pincode,
                    COALESCE(vv.is_verified, false) as is_verified,
                    vv.verified_at,
                    (SELECT COUNT(*) FROM manpower WHERE vendor_id = vd.id) as manpower_count,
                    (SELECT GROUP_CONCAT(name SEPARATOR ', ') FROM manpower WHERE vendor_id = vd.id) as manpower_names,
                    (SELECT COUNT(*) FROM warranty_registrations wr 
                     WHERE wr.manpower_id IN (SELECT id FROM manpower WHERE vendor_id = vd.id)
                    ) as total_warranties,
                    (SELECT COUNT(*) FROM warranty_registrations wr 
                     WHERE wr.manpower_id IN (SELECT id FROM manpower WHERE vendor_id = vd.id)
                     AND wr.status = 'validated'
                    ) as validated_warranties,
                    (SELECT COUNT(*) FROM warranty_registrations wr 
                     WHERE wr.manpower_id IN (SELECT id FROM manpower WHERE vendor_id = vd.id)
                     AND wr.status = 'pending'
                    ) as pending_warranties,
                    (SELECT COUNT(*) FROM warranty_registrations wr 
                     WHERE wr.manpower_id IN (SELECT id FROM manpower WHERE vendor_id = vd.id)
                     AND wr.status = 'rejected'
                    ) as rejected_warranties
                FROM profiles p
                JOIN user_roles ur ON p.id = ur.user_id
                LEFT JOIN vendor_details vd ON p.id = vd.user_id
                LEFT JOIN vendor_verification vv ON p.id = vv.user_id
                WHERE ur.role = 'vendor'
                ORDER BY p.created_at DESC
            `;
            const [vendorsList] = await db.execute(query);
            console.log(`[Admin] Fetched ${vendorsList.length} vendors`);
            // Log vendor verification status for debugging
            vendorsList.forEach((vendor) => {
                console.log(`[Admin] Vendor ${vendor.email}: is_verified=${vendor.is_verified}, verified_at=${vendor.verified_at}`);
            });
            res.json({
                success: true,
                vendors: vendorsList
            });
        }
        catch (error) {
            console.error('Get all vendors error:', error);
            res.status(500).json({ error: 'Failed to fetch vendors' });
        }
    }
    static async getVendorDetails(req, res) {
        try {
            const { id } = req.params;
            // Get vendor profile and details
            const [vendor] = await db.execute(`
                SELECT 
                    p.id AS user_id,
                    p.name AS contact_name,
                    p.email,
                    p.phone_number,
                    vd.id AS vendor_details_id,
                    vd.store_name,
                    vd.address,
                    vd.city,
                    vd.state,
                    vd.pincode,
                    vv.is_verified,
                    vv.verified_at
                FROM profiles p
                LEFT JOIN vendor_details vd ON p.id = vd.user_id
                LEFT JOIN vendor_verification vv ON p.id = vv.user_id
                WHERE p.id = ?
            `, [id]);
            if (vendor.length === 0) {
                return res.status(404).json({ error: 'Vendor not found' });
            }
            const vendorData = vendor[0];
            // Get manpower using vendor_details_id with points system
            let manpower = [];
            if (vendorData.vendor_details_id) {
                const [manpowerResult] = await db.execute(`
                    SELECT 
                        m.*,
                        (SELECT COUNT(*) FROM warranty_registrations w WHERE w.manpower_id = m.id) as total_applications,
                        (SELECT COUNT(*) FROM warranty_registrations w 
                         WHERE w.manpower_id = m.id AND w.status = 'validated') as points,
                        (SELECT COUNT(*) FROM warranty_registrations w 
                         WHERE w.manpower_id = m.id AND w.status = 'pending') as pending_points,
                        (SELECT COUNT(*) FROM warranty_registrations w 
                         WHERE w.manpower_id = m.id AND w.status = 'rejected') as rejected_points
                    FROM manpower m 
                    WHERE m.vendor_id = ?
                    ORDER BY points DESC, m.name ASC
                `, [vendorData.vendor_details_id]);
                manpower = manpowerResult;
            }
            // Get warranties based on vendor's manpower (not user_id)
            const [warrantyList] = await db.execute(`
                SELECT wr.*, 
                       p.name as submitted_by_name, 
                       p.email as submitted_by_email,
                       m.name as manpower_name_from_db
                FROM warranty_registrations wr
                LEFT JOIN profiles p ON wr.user_id = p.id
                LEFT JOIN manpower m ON wr.manpower_id = m.id
                WHERE wr.manpower_id IN (SELECT id FROM manpower WHERE vendor_id = ?)
                ORDER BY wr.created_at DESC
            `, [vendorData.vendor_details_id]);
            res.json({
                success: true,
                vendor: vendorData,
                manpower,
                warranties: warrantyList
            });
        }
        catch (error) {
            console.error('Get vendor details error:', error);
            res.status(500).json({ error: 'Failed to fetch vendor details' });
        }
    }
    static async updateVendorVerification(req, res) {
        try {
            const { id } = req.params;
            const { is_verified, rejection_reason } = req.body;
            if (typeof is_verified !== 'boolean') {
                return res.status(400).json({ error: 'is_verified must be a boolean' });
            }
            // Get vendor details for email
            const [vendor] = await db.execute('SELECT name, email FROM profiles WHERE id = ?', [id]);
            if (vendor.length === 0) {
                return res.status(404).json({ error: 'Vendor not found' });
            }
            const vendorData = vendor[0];
            // Update verification status
            await db.execute('UPDATE vendor_verification SET is_verified = ?, verified_at = NOW() WHERE user_id = ?', [is_verified, id]);
            // Send email notification
            try {
                if (is_verified) {
                    // Send approval email
                    await EmailService.sendVendorApprovalConfirmation(vendorData.email, vendorData.name);
                    console.log(`✓ Vendor approval email sent to ${vendorData.email}`);
                }
                else {
                    // Send rejection email
                    await EmailService.sendVendorRejectionNotification(vendorData.email, vendorData.name, rejection_reason);
                    console.log(`✓ Vendor rejection email sent to ${vendorData.email}`);
                }
            }
            catch (emailError) {
                console.error('Email sending error:', emailError);
                // Don't fail the request if email fails
            }
            // Log the activity
            const admin = req.user;
            await ActivityLogService.log({
                adminId: admin.id,
                adminName: admin.name,
                adminEmail: admin.email,
                actionType: is_verified ? 'VENDOR_APPROVED' : 'VENDOR_REJECTED',
                targetType: 'VENDOR',
                targetId: id,
                targetName: vendorData.name,
                details: { rejection_reason: rejection_reason || null },
                ipAddress: req.ip || req.socket?.remoteAddress
            });
            res.json({
                success: true,
                message: `Vendor ${is_verified ? 'approved' : 'rejected'} successfully`
            });
        }
        catch (error) {
            console.error('Update vendor verification error:', error);
            res.status(500).json({ error: 'Failed to update vendor verification' });
        }
    }
    static async deleteVendor(req, res) {
        try {
            const { id } = req.params;
            // Delete from profiles - cascading should handle the rest
            const [user] = await db.execute('SELECT id FROM profiles WHERE id = ?', [id]);
            if (user.length === 0) {
                return res.status(404).json({ error: 'Vendor not found' });
            }
            await db.execute('DELETE FROM profiles WHERE id = ?', [id]);
            // Log the activity
            const admin = req.user;
            await ActivityLogService.log({
                adminId: admin.id,
                adminName: admin.name,
                adminEmail: admin.email,
                actionType: 'VENDOR_DELETED',
                targetType: 'VENDOR',
                targetId: id,
                targetName: undefined,
                ipAddress: req.ip || req.socket?.remoteAddress
            });
            res.json({
                success: true,
                message: 'Vendor deleted successfully'
            });
        }
        catch (error) {
            console.error('Delete vendor error:', error);
            res.status(500).json({ error: 'Failed to delete vendor' });
        }
    }
    static async updateWarrantyStatus(req, res) {
        try {
            const { uid } = req.params;
            const { status, rejectionReason } = req.body;
            if (!['validated', 'rejected'].includes(status)) {
                return res.status(400).json({ error: 'Invalid status' });
            }
            if (status === 'rejected' && !rejectionReason) {
                return res.status(400).json({ error: 'Rejection reason is required when rejecting a warranty' });
            }
            // Get warranty details for email
            const [warranty] = await db.execute(`SELECT 
                    id,
                    uid,
                    customer_name, 
                    customer_email, 
                    customer_phone,
                    product_type, 
                    car_make, 
                    car_model, 
                    product_details,
                    manpower_id
                FROM warranty_registrations 
                WHERE uid = ? OR id = ?`, [uid, uid]);
            if (warranty.length === 0) {
                return res.status(404).json({ error: 'Warranty not found' });
            }
            const warrantyData = warranty[0];
            let productDetails = {};
            try {
                productDetails = typeof warrantyData.product_details === 'string'
                    ? JSON.parse(warrantyData.product_details)
                    : warrantyData.product_details || {};
            }
            catch (e) {
                console.error("Error parsing product_details:", e);
                productDetails = {};
            }
            // Update status using the actual record ID to be safe
            await db.execute('UPDATE warranty_registrations SET status = ?, rejection_reason = ? WHERE id = ?', [status, status === 'rejected' ? rejectionReason : null, warrantyData.id]);
            // Send email notification to customer only if email is provided
            if (warrantyData.customer_email && warrantyData.customer_email.trim()) {
                try {
                    if (status === 'validated') {
                        // Send approval email to customer
                        await EmailService.sendWarrantyApprovalToCustomer(warrantyData.customer_email, warrantyData.customer_name, warrantyData.uid, warrantyData.product_type, warrantyData.car_make, warrantyData.car_model, productDetails);
                        console.log(`✓ Warranty approval email sent to customer: ${warrantyData.customer_email}`);
                    }
                    else {
                        // Send rejection email to customer
                        await EmailService.sendWarrantyRejectionToCustomer(warrantyData.customer_email, warrantyData.customer_name, warrantyData.uid, warrantyData.product_type, warrantyData.car_make, warrantyData.car_model, rejectionReason, productDetails);
                        console.log(`✓ Warranty rejection email sent to customer: ${warrantyData.customer_email}`);
                    }
                }
                catch (emailError) {
                    console.error('Customer email sending error:', emailError);
                    // Don't fail the request if email fails
                }
            }
            else {
                console.log(`ℹ️ No customer email provided, skipping email notification for warranty ${warrantyData.uid}`);
            }
            // Send email notification to vendor (if manpower is involved)
            if (warrantyData.manpower_id) {
                try {
                    // Get vendor details from manpower
                    const [vendorInfo] = await db.execute(`SELECT 
                            p.email as vendor_email,
                            vd.store_name as vendor_name,
                            m.name as manpower_name
                        FROM manpower m
                        JOIN vendor_details vd ON m.vendor_id = vd.id
                        JOIN profiles p ON vd.user_id = p.id
                        WHERE m.id = ?`, [warrantyData.manpower_id]);
                    if (vendorInfo.length > 0) {
                        const vendor = vendorInfo[0];
                        if (status === 'validated') {
                            // Send approval email to vendor
                            await EmailService.sendWarrantyApprovalToVendor(vendor.vendor_email, vendor.vendor_name, warrantyData.customer_name, warrantyData.customer_phone, warrantyData.product_type, warrantyData.car_make, warrantyData.car_model, vendor.manpower_name, warrantyData.uid);
                            console.log(`✓ Warranty approval email sent to vendor: ${vendor.vendor_email}`);
                        }
                        else {
                            // Send rejection email to vendor
                            await EmailService.sendWarrantyRejectionToVendor(vendor.vendor_email, vendor.vendor_name, warrantyData.customer_name, warrantyData.customer_phone, warrantyData.product_type, warrantyData.car_make, warrantyData.car_model, vendor.manpower_name, warrantyData.uid, rejectionReason);
                            console.log(`✓ Warranty rejection email sent to vendor: ${vendor.vendor_email}`);
                        }
                    }
                }
                catch (vendorEmailError) {
                    console.error('Vendor email sending error:', vendorEmailError);
                    // Don't fail the request if vendor email fails
                }
            }
            // Log the activity
            const admin = req.user;
            await ActivityLogService.log({
                adminId: admin.id,
                adminName: admin.name,
                adminEmail: admin.email,
                actionType: status === 'validated' ? 'WARRANTY_APPROVED' : 'WARRANTY_REJECTED',
                targetType: 'WARRANTY',
                targetId: warrantyData.uid,
                targetName: warrantyData.customer_name,
                details: {
                    product_type: warrantyData.product_type,
                    rejection_reason: rejectionReason || null
                },
                ipAddress: req.ip || req.socket?.remoteAddress
            });
            res.json({
                success: true,
                message: `Warranty ${status} successfully`
            });
        }
        catch (error) {
            console.error('Update warranty status error:', error);
            res.status(500).json({ error: 'Failed to update warranty status' });
        }
    }
    static async getAllWarranties(req, res) {
        try {
            // Get all warranties with user details including role
            const [warrantyList] = await db.execute(`
                SELECT 
                    wr.*,
                    p.name as submitted_by_name,
                    p.email as submitted_by_email,
                    ur.role as submitted_by_role,
                    m.name as manpower_name_from_db
                FROM warranty_registrations wr
                LEFT JOIN profiles p ON wr.user_id = p.id
                LEFT JOIN user_roles ur ON p.id = ur.user_id
                LEFT JOIN manpower m ON wr.manpower_id = m.id
                ORDER BY wr.created_at DESC
            `);
            // Parse JSON product_details
            const formattedWarranties = warrantyList.map((warranty) => ({
                ...warranty,
                product_details: JSON.parse(warranty.product_details)
            }));
            res.json({
                success: true,
                warranties: formattedWarranties
            });
        }
        catch (error) {
            console.error('Get all warranties error:', error);
            res.status(500).json({ error: 'Failed to fetch warranties' });
        }
    }
    static async getCustomers(req, res) {
        try {
            // Get unique customers with their warranty statistics
            // Group ONLY by customer_email to ensure one entry per unique email
            const [customers] = await db.execute(`
                SELECT 
                    MAX(customer_name) as customer_name,
                    customer_email,
                    MAX(customer_phone) as customer_phone,
                    MAX(COALESCE(customer_address, JSON_UNQUOTE(JSON_EXTRACT(product_details, '$.customerAddress')))) as customer_address,
                    COUNT(*) as total_warranties,
                    SUM(CASE WHEN status = 'validated' THEN 1 ELSE 0 END) as validated_warranties,
                    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_warranties,
                    SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_warranties,
                    MIN(created_at) as first_warranty_date,
                    MAX(created_at) as last_warranty_date
                FROM warranty_registrations
                GROUP BY customer_email
                ORDER BY last_warranty_date DESC
            `);
            res.json({
                success: true,
                customers
            });
        }
        catch (error) {
            console.error('Get customers error:', error);
            res.status(500).json({ error: 'Failed to fetch customers' });
        }
    }
    static async getCustomerDetails(req, res) {
        try {
            const { email } = req.params;
            // Get customer basic info from first warranty
            const [customerInfo] = await db.execute(`
                SELECT 
                    customer_name,
                    customer_email,
                    customer_phone,
                    customer_address
                FROM warranty_registrations
                WHERE customer_email = ?
                LIMIT 1
            `, [email]);
            if (customerInfo.length === 0) {
                return res.status(404).json({ error: 'Customer not found' });
            }
            // Get all warranties for this customer
            const [warrantyList] = await db.execute(`
                SELECT 
                    wr.*,
                    p.name as submitted_by_name,
                    p.email as submitted_by_email,
                    m.name as manpower_name_from_db
                FROM warranty_registrations wr
                LEFT JOIN profiles p ON wr.user_id = p.id
                LEFT JOIN manpower m ON wr.manpower_id = m.id
                WHERE wr.customer_email = ?
                ORDER BY wr.created_at DESC
            `, [email]);
            res.json({
                success: true,
                customer: customerInfo[0],
                warranties: warrantyList
            });
        }
        catch (error) {
            console.error('Get customer details error:', error);
            res.status(500).json({ error: 'Failed to fetch customer details' });
        }
    }
    static async deleteCustomer(req, res) {
        try {
            const { email } = req.params;
            // Check if customer exists
            const [customer] = await db.execute('SELECT customer_email FROM warranty_registrations WHERE customer_email = ? LIMIT 1', [email]);
            if (customer.length === 0) {
                return res.status(404).json({ error: 'Customer not found' });
            }
            // Delete all warranties for this customer
            await db.execute('DELETE FROM warranty_registrations WHERE customer_email = ?', [email]);
            // Log the activity
            const admin = req.user;
            await ActivityLogService.log({
                adminId: admin.id,
                adminName: admin.name,
                adminEmail: admin.email,
                actionType: 'CUSTOMER_DELETED',
                targetType: 'CUSTOMER',
                targetId: email,
                targetName: email,
                ipAddress: req.ip || req.socket?.remoteAddress
            });
            res.json({
                success: true,
                message: 'Customer and all associated warranties deleted successfully'
            });
        }
        catch (error) {
            console.error('Delete customer error:', error);
            res.status(500).json({ error: 'Failed to delete customer' });
        }
    }
    // Admin Management Methods
    static async getAllAdmins(req, res) {
        try {
            const query = `
                SELECT 
                    p.id,
                    p.name,
                    p.email,
                    p.phone_number,
                    p.created_at
                FROM profiles p
                JOIN user_roles ur ON p.id = ur.user_id
                WHERE ur.role = 'admin'
                ORDER BY p.created_at DESC
            `;
            const [admins] = await db.execute(query);
            res.json({
                success: true,
                admins
            });
        }
        catch (error) {
            console.error('Get all admins error:', error);
            res.status(500).json({ error: 'Failed to fetch admins' });
        }
    }
    static async createAdmin(req, res) {
        try {
            const { name, email, phone } = req.body;
            const invitedBy = req.user;
            // Validate required fields
            if (!name || !email || !phone) {
                return res.status(400).json({
                    error: 'Name, email, and phone are required'
                });
            }
            // Check if email already exists
            const [existingEmail] = await db.execute('SELECT id FROM profiles WHERE email = ?', [email]);
            if (existingEmail.length > 0) {
                return res.status(400).json({
                    error: 'An account with this email already exists'
                });
            }
            // Check if phone number already exists
            const [existingPhone] = await db.execute('SELECT id FROM profiles WHERE phone_number = ?', [phone]);
            if (existingPhone.length > 0) {
                return res.status(400).json({
                    error: 'An account with this phone number already exists'
                });
            }
            // Generate UUID for new admin
            const { v4: uuidv4 } = await import('uuid');
            const userId = uuidv4();
            // Create profile (no password needed for OTP-based auth)
            await db.execute('INSERT INTO profiles (id, name, email, phone_number) VALUES (?, ?, ?, ?)', [userId, name, email, phone]);
            // Add admin role
            await db.execute('INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, ?)', [uuidv4(), userId, 'admin']);
            // Send invitation email
            try {
                await EmailService.sendAdminInvitation(email, name, invitedBy.name || 'An Administrator');
                console.log(`✓ Admin invitation email sent to: ${email}`);
            }
            catch (emailError) {
                console.error('Failed to send admin invitation email:', emailError);
                // Don't fail the request if email fails
            }
            // Log the activity
            await ActivityLogService.log({
                adminId: invitedBy.id,
                adminName: invitedBy.name,
                adminEmail: invitedBy.email,
                actionType: 'ADMIN_CREATED',
                targetType: 'ADMIN',
                targetId: userId,
                targetName: name,
                details: { email, phone },
                ipAddress: req.ip || req.socket?.remoteAddress
            });
            res.json({
                success: true,
                message: 'Admin created successfully and invitation email sent',
                admin: {
                    id: userId,
                    name,
                    email,
                    phone_number: phone
                }
            });
        }
        catch (error) {
            console.error('Create admin error:', error);
            res.status(500).json({ error: 'Failed to create admin' });
        }
    }
    static async getActivityLogs(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 50;
            const offset = parseInt(req.query.offset) || 0;
            const adminId = req.query.adminId;
            const actionType = req.query.actionType;
            const result = await ActivityLogService.getLogs({
                limit,
                offset,
                adminId,
                actionType
            });
            res.json({
                success: true,
                logs: result.logs,
                total: result.total,
                limit,
                offset
            });
        }
        catch (error) {
            console.error('Get activity logs error:', error);
            res.status(500).json({ error: 'Failed to fetch activity logs' });
        }
    }
}
