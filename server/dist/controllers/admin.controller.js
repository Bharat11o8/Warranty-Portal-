import db, { getISTTimestamp } from '../config/database.js';
import { EmailService } from '../services/email.service.js';
import { ActivityLogService } from '../services/activity-log.service.js';
import { NotificationService } from '../services/notification.service.js';
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
            // 4. Pending Approvals (Pending Warranties - Second Stage)
            const [pending] = await db.execute("SELECT COUNT(*) as count FROM warranty_registrations WHERE status = 'pending'");
            const pendingApprovals = pending[0].count;
            // 5. Pending Vendor Approvals (Pending Vendor - First Stage)
            const [pendingVendor] = await db.execute("SELECT COUNT(*) as count FROM warranty_registrations WHERE status = 'pending_vendor'");
            const pendingVendorApprovals = pendingVendor[0].count;
            // 6. Validated Warranties
            const [validated] = await db.execute("SELECT COUNT(*) as count FROM warranty_registrations WHERE status = 'validated'");
            const validatedWarranties = validated[0].count;
            // 7. Rejected Warranties
            const [rejected] = await db.execute("SELECT COUNT(*) as count FROM warranty_registrations WHERE status = 'rejected'");
            const rejectedWarranties = rejected[0].count;
            // 8. Monthly Statistics (Last 12 months - expanded from 6)
            const [monthlyStats] = await db.execute(`
                SELECT 
                    DATE_FORMAT(created_at, '%Y-%m') as month,
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'validated' THEN 1 ELSE 0 END) as approved,
                    SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
                    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_admin,
                    SUM(CASE WHEN status = 'pending_vendor' THEN 1 ELSE 0 END) as pending_vendor
                FROM warranty_registrations 
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
                GROUP BY DATE_FORMAT(created_at, '%Y-%m')
                ORDER BY month ASC
            `);
            // 9. Monthly Customer Stats (Last 12 months - expanded from 6)
            // Determine New vs Returning based on when the customer FIRST registered a warranty
            const [monthlyCustomerStats] = await db.execute(`
                WITH FirstSeen AS (
                    SELECT customer_email, MIN(created_at) as first_date
                    FROM warranty_registrations 
                    GROUP BY customer_email
                )
                SELECT 
                    DATE_FORMAT(wr.created_at, '%Y-%m') as month,
                    COUNT(DISTINCT wr.customer_email) as active_customers,
                    COUNT(DISTINCT CASE 
                        WHEN DATE_FORMAT(fs.first_date, '%Y-%m') = DATE_FORMAT(wr.created_at, '%Y-%m') 
                        THEN wr.customer_email 
                    END) as new_customers
                FROM warranty_registrations wr
                JOIN FirstSeen fs ON wr.customer_email = fs.customer_email
                WHERE wr.created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
                GROUP BY DATE_FORMAT(wr.created_at, '%Y-%m')
                ORDER BY month ASC
            `);
            const formattedCustomerStats = monthlyCustomerStats.map((stat) => ({
                month: stat.month,
                active_customers: Number(stat.active_customers),
                new_customers: Number(stat.new_customers),
                returning_customers: Number(stat.active_customers) - Number(stat.new_customers)
            }));
            res.json({
                success: true,
                stats: {
                    totalWarranties,
                    totalVendors,
                    totalCustomers,
                    pendingApprovals,
                    pendingVendorApprovals,
                    validatedWarranties,
                    rejectedWarranties,
                    monthlyStats,
                    monthlyCustomerStats: formattedCustomerStats
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
                    COALESCE(vv.is_active, true) as is_active,
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
                      AND wr.status IN ('pending', 'pending_vendor')
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
                    vd.store_code,
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
                         WHERE w.manpower_id = m.id AND w.status IN ('pending', 'pending_vendor')) as pending_points,
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
            await db.execute('UPDATE vendor_verification SET is_verified = ?, verified_at = ? WHERE user_id = ?', [is_verified, getISTTimestamp(), id]);
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
            // Send real-time notification
            try {
                await NotificationService.notify(id, {
                    title: is_verified ? 'Store Approved! ✓' : 'Store Verification Update',
                    message: is_verified
                        ? 'Congratulations! Your store has been verified and approved.'
                        : `Your store verification was not successful. Reason: ${rejection_reason}`,
                    type: is_verified ? 'system' : 'alert',
                    link: '/profile'
                });
            }
            catch (notifError) {
                console.error('Failed to send vendor verification notification:', notifError);
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
    /**
     * Toggle vendor activation status
     */
    static async toggleVendorActivation(req, res) {
        try {
            const { id } = req.params;
            const { is_active } = req.body;
            if (typeof is_active !== 'boolean') {
                return res.status(400).json({ error: 'is_active must be a boolean' });
            }
            // Get vendor details
            const [vendor] = await db.execute('SELECT name, email FROM profiles WHERE id = ?', [id]);
            if (vendor.length === 0) {
                return res.status(404).json({ error: 'Vendor not found' });
            }
            const vendorData = vendor[0];
            // Update activation status
            await db.execute('UPDATE vendor_verification SET is_active = ? WHERE user_id = ?', [is_active, id]);
            // Send real-time notification
            try {
                await NotificationService.notify(id, {
                    title: is_active ? 'Store Activated' : 'Store Deactivated',
                    message: is_active
                        ? 'Your store has been activated. You can now access your account.'
                        : 'Your store has been deactivated. Please contact admin for assistance.',
                    type: is_active ? 'system' : 'alert'
                });
            }
            catch (notifError) {
                console.error('Failed to send vendor activation notification:', notifError);
            }
            // Log the activity
            const admin = req.user;
            await ActivityLogService.log({
                adminId: admin.id,
                adminName: admin.name,
                adminEmail: admin.email,
                actionType: is_active ? 'VENDOR_ACTIVATED' : 'VENDOR_DEACTIVATED',
                targetType: 'VENDOR',
                targetId: id,
                targetName: vendorData.name,
                ipAddress: req.ip || req.socket?.remoteAddress
            });
            res.json({
                success: true,
                message: `Franchise ${is_active ? 'activated' : 'deactivated'} successfully`
            });
        }
        catch (error) {
            console.error('Toggle vendor activation error:', error);
            res.status(500).json({ error: 'Failed to toggle vendor activation' });
        }
    }
    /**
     * Update store code for QR generation
     */
    static async updateStoreCode(req, res) {
        try {
            const { id } = req.params;
            const { store_code } = req.body;
            // Validate store_code format (letters + numbers, 3-20 chars)
            if (!store_code || !/^[A-Za-z0-9]{3,20}$/.test(store_code)) {
                return res.status(400).json({
                    error: 'Invalid store code format. Use 3-20 alphanumeric characters (e.g., FGM168)'
                });
            }
            // Normalize to uppercase
            const normalizedCode = store_code.toUpperCase();
            // Check if store_code already exists for another vendor
            const [existing] = await db.execute('SELECT id FROM vendor_details WHERE store_code = ? AND user_id != ?', [normalizedCode, id]);
            if (existing.length > 0) {
                return res.status(400).json({
                    error: 'This store code is already in use by another franchise'
                });
            }
            // Update store_code
            await db.execute('UPDATE vendor_details SET store_code = ? WHERE user_id = ?', [normalizedCode, id]);
            // Log the activity
            const admin = req.user;
            const [vendor] = await db.execute('SELECT store_name FROM vendor_details WHERE user_id = ?', [id]);
            await ActivityLogService.log({
                adminId: admin.id,
                adminName: admin.name,
                adminEmail: admin.email,
                actionType: 'STORE_CODE_UPDATED',
                targetType: 'VENDOR',
                targetId: id,
                targetName: vendor[0]?.store_name || 'Unknown',
                details: { store_code: normalizedCode },
                ipAddress: req.ip || req.socket?.remoteAddress
            });
            res.json({
                success: true,
                store_code: normalizedCode,
                message: 'Store code updated successfully'
            });
        }
        catch (error) {
            console.error('Update store code error:', error);
            res.status(500).json({ error: 'Failed to update store code' });
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
            // Get warranty details for email (including store info)
            const [warranty] = await db.execute(`SELECT 
                    wr.id,
                    wr.uid,
                    wr.customer_name, 
                    wr.customer_email, 
                    wr.customer_phone,
                    wr.customer_address,
                    wr.product_type,
                    wr.warranty_type,
                    wr.car_make, 
                    wr.car_model, 
                    wr.product_details,
                    wr.manpower_id,
                    vd.store_name,
                    vd.store_email,
                    vd.address as store_address,
                    vd.city as store_city,
                    vd.state as store_state,
                    m.name as applicator_name
                FROM warranty_registrations wr
                LEFT JOIN manpower m ON wr.manpower_id = m.id
                LEFT JOIN vendor_details vd ON m.vendor_id = vd.id
                WHERE wr.uid = ? OR wr.id = ?`, [uid, uid]);
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
            // Update status using the UID (actual primary key)
            // CRITICAL: Ensure we have a valid UID before updating
            if (!warrantyData.uid) {
                console.error('CRITICAL: warrantyData.uid is null/undefined! Aborting update to prevent mass update.');
                return res.status(500).json({ error: 'Internal error: Warranty UID not found' });
            }
            console.log(`Updating warranty: uid=${uid}, resolved_uid=${warrantyData.uid}, new_status=${status}`);
            await db.execute('UPDATE warranty_registrations SET status = ?, rejection_reason = ? WHERE uid = ?', [status, status === 'rejected' ? rejectionReason : null, warrantyData.uid]);
            // Send email notification to customer only if email is provided
            if (warrantyData.customer_email && warrantyData.customer_email.trim()) {
                try {
                    // Prepare store address string
                    const storeFullAddress = [warrantyData.store_address, warrantyData.store_city, warrantyData.store_state]
                        .filter(Boolean).join(', ');
                    if (status === 'validated') {
                        // Send approval email to customer
                        await EmailService.sendWarrantyApprovalToCustomer(warrantyData.customer_email, warrantyData.customer_name, warrantyData.uid, warrantyData.product_type, warrantyData.car_make, warrantyData.car_model, productDetails, warrantyData.warranty_type, warrantyData.store_name, storeFullAddress, warrantyData.store_email, warrantyData.applicator_name);
                        console.log(`✓ Warranty approval email sent to customer: ${warrantyData.customer_email}`);
                    }
                    else {
                        // Send rejection email to customer
                        await EmailService.sendWarrantyRejectionToCustomer(warrantyData.customer_email, warrantyData.customer_name, warrantyData.uid, warrantyData.product_type, warrantyData.car_make, warrantyData.car_model, rejectionReason, productDetails, warrantyData.warranty_type, warrantyData.store_name, storeFullAddress, warrantyData.store_email, warrantyData.applicator_name);
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
                            await EmailService.sendWarrantyApprovalToVendor(vendor.vendor_email, vendor.vendor_name, warrantyData.customer_name, warrantyData.customer_phone, warrantyData.product_type, warrantyData.car_make, warrantyData.car_model, vendor.manpower_name, warrantyData.uid, productDetails, warrantyData.warranty_type);
                            console.log(`✓ Warranty approval email sent to vendor: ${vendor.vendor_email}`);
                        }
                        else {
                            // Send rejection email to vendor
                            await EmailService.sendWarrantyRejectionToVendor(vendor.vendor_email, vendor.vendor_name, warrantyData.customer_name, warrantyData.customer_phone, warrantyData.product_type, warrantyData.car_make, warrantyData.car_model, vendor.manpower_name, warrantyData.uid, rejectionReason, productDetails, warrantyData.warranty_type);
                            console.log(`✓ Warranty rejection email sent to vendor: ${vendor.vendor_email}`);
                        }
                    }
                }
                catch (vendorEmailError) {
                    console.error('Vendor email sending error:', vendorEmailError);
                    // Don't fail the request if vendor email fails
                }
                // Send real-time notification to vendor
                try {
                    const [vendorUser] = await db.execute(`SELECT vd.user_id FROM manpower m 
                         JOIN vendor_details vd ON m.vendor_id = vd.id 
                         WHERE m.id = ?`, [warrantyData.manpower_id]);
                    if (vendorUser.length > 0) {
                        const vendorUserId = vendorUser[0].user_id;
                        await NotificationService.notify(vendorUserId, {
                            title: status === 'validated' ? 'Warranty Approved! ✓' : 'Warranty Rejected ✗',
                            message: status === 'validated'
                                ? `The warranty for ${warrantyData.customer_name} (${warrantyData.uid}) has been approved.`
                                : `The warranty for ${warrantyData.customer_name} (${warrantyData.uid}) was rejected. Reason: ${rejectionReason}`,
                            type: 'warranty',
                            link: `/dashboard/vendor`
                        });
                    }
                    // 4. Notify Customer
                    if (warrantyData.user_id) {
                        await NotificationService.notify(warrantyData.user_id, {
                            title: status === 'validated' ? 'Warranty Validated! ✓' : 'Warranty Rejected ✗',
                            message: status === 'validated'
                                ? `Your warranty for ${warrantyData.uid} has been validated by AutoForm.`
                                : `Your warranty for ${warrantyData.uid} was rejected. Reason: ${rejectionReason}`,
                            type: 'warranty',
                            link: `/dashboard/customer`
                        });
                    }
                }
                catch (notifError) {
                    console.error('Failed to send warranty status notification:', notifError);
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
                targetName: warrantyData.uid,
                details: {
                    customer_name: warrantyData.customer_name,
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
            // Pagination parameters
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 30;
            const offset = (page - 1) * limit;
            // Extract Filters
            const { status, search, product_type, make, date_from, date_to } = req.query;
            let conditions = [];
            let params = [];
            // 1. Dynamic Filters
            // Status Filtering
            // Admin logic: matches exactly what the filter says usually
            if (status && status !== 'all') {
                if (status === 'pending') {
                    conditions.push("wr.status = 'pending_vendor'");
                }
                else if (status === 'pending_ho') {
                    conditions.push("wr.status = 'pending'");
                }
                else {
                    conditions.push('wr.status = ?');
                    params.push(status);
                }
            }
            // Product Type
            if (product_type && product_type !== 'all') {
                conditions.push('wr.product_type = ?');
                params.push(product_type);
            }
            // Make
            if (make && make !== 'all') {
                conditions.push('wr.car_make = ?');
                params.push(make);
            }
            // Model
            const { model } = req.query;
            if (model && model !== 'all') {
                conditions.push('wr.car_model = ?');
                params.push(model);
            }
            // Search
            if (search) {
                const searchTerm = `%${search}%`;
                conditions.push(`(
                    wr.customer_name LIKE ? OR 
                    wr.customer_phone LIKE ? OR 
                    wr.uid LIKE ? OR 
                    wr.car_make LIKE ? OR 
                    wr.car_model LIKE ?
                )`);
                params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
            }
            // Date Range
            if (date_from && date_to) {
                conditions.push('wr.created_at BETWEEN ? AND ?');
                params.push(new Date(date_from), new Date(date_to));
            }
            // 2. Build Query
            const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
            // Count Query
            const countQuery = `SELECT COUNT(*) as total FROM warranty_registrations wr ${whereClause}`;
            const [countResult] = await db.execute(countQuery, params);
            const totalCount = countResult[0].total;
            const totalPages = Math.ceil(totalCount / limit);
            // Get all warranties with user details including role (with pagination)
            const mainQuery = `
                SELECT 
                    wr.*,
                    p.name as submitted_by_name,
                    p.email as submitted_by_email,
                    ur.role as submitted_by_role,
                    m.name as manpower_name_from_db,
                    vd.store_name as vendor_store_name,
                    vd.store_email as vendor_store_email,
                    vp.phone_number as vendor_phone_number
                FROM warranty_registrations wr
                LEFT JOIN profiles p ON wr.user_id = p.id
                LEFT JOIN user_roles ur ON p.id = ur.user_id
                LEFT JOIN manpower m ON wr.manpower_id = m.id
                LEFT JOIN vendor_details vd ON m.vendor_id = vd.id
                LEFT JOIN profiles vp ON vd.user_id = vp.id
                ${whereClause}
                ORDER BY wr.created_at DESC
                LIMIT ? OFFSET ?
            `;
            const mainParams = [...params, limit, offset];
            const [warrantyList] = await db.execute(mainQuery, mainParams);
            // Parse JSON product_details
            const formattedWarranties = warrantyList.map((warranty) => ({
                ...warranty,
                product_details: JSON.parse(warranty.product_details)
            }));
            res.json({
                success: true,
                warranties: formattedWarranties,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalCount,
                    limit,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1
                }
            });
        }
        catch (error) {
            console.error('Get all warranties error:', error);
            res.status(500).json({ error: 'Failed to fetch warranties' });
        }
    }
    static async getWarrantyById(req, res) {
        try {
            const { id } = req.params;
            // Try to find warranty by uid, id, or as a UUID in uid
            const query = `
                SELECT 
                    wr.*,
                    p.name as submitted_by_name,
                    p.email as submitted_by_email,
                    ur.role as submitted_by_role,
                    m.name as manpower_name_from_db,
                    vd.store_name as vendor_store_name,
                    vd.store_email as vendor_store_email,
                    vp.phone_number as vendor_phone_number
                FROM warranty_registrations wr
                LEFT JOIN profiles p ON wr.user_id = p.id
                LEFT JOIN user_roles ur ON p.id = ur.user_id
                LEFT JOIN manpower m ON wr.manpower_id = m.id
                LEFT JOIN vendor_details vd ON m.vendor_id = vd.id
                LEFT JOIN profiles vp ON vd.user_id = vp.id
                WHERE wr.uid = ? OR wr.id = ?
                LIMIT 1
            `;
            const [result] = await db.execute(query, [id, id]);
            if (result.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Warranty not found'
                });
            }
            // Parse JSON product_details
            const warranty = {
                ...result[0],
                product_details: JSON.parse(result[0].product_details || '{}')
            };
            res.json({
                success: true,
                warranty
            });
        }
        catch (error) {
            console.error('Get warranty by ID error:', error);
            res.status(500).json({ error: 'Failed to fetch warranty' });
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
                    SUM(CASE WHEN status IN ('pending', 'pending_vendor') THEN 1 ELSE 0 END) as pending_warranties,
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
                    m.name as manpower_name_from_db,
                    vd.store_name as vendor_store_name
                FROM warranty_registrations wr
                LEFT JOIN profiles p ON wr.user_id = p.id
                LEFT JOIN manpower m ON wr.manpower_id = m.id
                LEFT JOIN vendor_details vd ON m.vendor_id = vd.id
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
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 30;
            const offset = (page - 1) * limit;
            const adminId = req.query.adminId;
            const actionType = req.query.actionType;
            const result = await ActivityLogService.getLogs({
                limit,
                offset,
                adminId,
                actionType
            });
            const totalPages = Math.ceil(result.total / limit);
            res.json({
                success: true,
                logs: result.logs,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalCount: result.total,
                    limit,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1
                }
            });
        }
        catch (error) {
            console.error('Get activity logs error:', error);
            res.status(500).json({ error: 'Failed to fetch activity logs' });
        }
    }
}
