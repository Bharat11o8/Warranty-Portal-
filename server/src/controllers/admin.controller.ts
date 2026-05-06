import { Request, Response } from 'express';
import db, { getISTTimestamp } from '../config/database.js';
import { EmailService } from '../services/email.service.js';
import { ActivityLogService } from '../services/activity-log.service.js';
import { NotificationService } from '../services/notification.service.js';

export class AdminController {
    static async getDashboardStats(_req: Request, res: Response) {
        try {
            // 1. Total Warranties
            const [warranties]: any = await db.execute('SELECT COUNT(*) as count FROM warranty_registrations');
            const totalWarranties = warranties[0].count;

            // 2. Total Vendors
            const [vendors]: any = await db.execute("SELECT COUNT(*) as count FROM user_roles WHERE role = 'vendor'");
            const totalVendors = vendors[0].count;

            // 3. Total Customers (Registered + Guests, excluding Vendors)
            const [customers]: any = await db.execute(`
                SELECT COUNT(*) as count FROM (
                    -- 1. Registered Customers (from profiles)
                    SELECT p.name as customer_name, p.email, p.phone_number
                    FROM profiles p
                    JOIN user_roles ur ON p.id = ur.user_id
                    WHERE ur.role = 'customer'
                    AND p.email NOT IN (SELECT email FROM profiles p2 JOIN user_roles ur2 ON p2.id = ur2.user_id WHERE ur2.role = 'vendor')

                    UNION

                    -- 2. Guest Customers (from warranty_registrations)
                    SELECT sub.customer_name, sub.customer_email, sub.customer_phone
                    FROM (
                        SELECT customer_name, customer_email, customer_phone 
                        FROM warranty_registrations 
                        GROUP BY customer_name, customer_email, customer_phone
                    ) sub
                    LEFT JOIN (
                        SELECT p.email, p.phone_number, p.id FROM profiles p 
                        JOIN user_roles ur ON p.id = ur.user_id WHERE ur.role = 'customer'
                    ) reg_cust ON (sub.customer_email = reg_cust.email OR sub.customer_phone = reg_cust.phone_number)
                    LEFT JOIN (
                        SELECT p.email, p.name FROM profiles p 
                        JOIN user_roles ur ON p.id = ur.user_id WHERE ur.role = 'vendor'
                    ) vendor_match ON sub.customer_email = vendor_match.email AND sub.customer_name = vendor_match.name
                    WHERE reg_cust.id IS NULL AND vendor_match.name IS NULL
                    AND (
                        (sub.customer_email IS NOT NULL AND sub.customer_email != '' AND sub.customer_email != 'N/A')
                        OR 
                        (sub.customer_phone IS NOT NULL AND sub.customer_phone != '' AND sub.customer_phone != 'N/A')
                    )
                ) combined`);
            const totalCustomers = customers[0].count;

            // 4. Pending Approvals (Pending Warranties - Second Stage)
            const [pending]: any = await db.execute("SELECT COUNT(*) as count FROM warranty_registrations WHERE status = 'pending'");
            const pendingApprovals = pending[0].count;

            // 5. Pending Vendor Approvals (Pending Vendor - First Stage)
            const [pendingVendor]: any = await db.execute("SELECT COUNT(*) as count FROM warranty_registrations WHERE status = 'pending_vendor'");
            const pendingVendorApprovals = pendingVendor[0].count;

            // 6. Validated Warranties
            const [validated]: any = await db.execute("SELECT COUNT(*) as count FROM warranty_registrations WHERE status = 'validated'");
            const validatedWarranties = validated[0].count;

            // 7. Rejected Warranties
            const [rejected]: any = await db.execute("SELECT COUNT(*) as count FROM warranty_registrations WHERE status = 'rejected'");
            const rejectedWarranties = rejected[0].count;

            // 8. Monthly Statistics (Last 12 months - expanded from 6)
            const [monthlyStats]: any = await db.execute(`
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
            const [monthlyCustomerStats]: any = await db.execute(`
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

            const formattedCustomerStats = monthlyCustomerStats.map((stat: any) => ({
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
        } catch (error: any) {
            console.error('Get dashboard stats error:', error);
            res.status(500).json({ error: 'Failed to fetch dashboard stats' });
        }
    }

    static async getAllVendors(_req: Request, res: Response) {
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
                    vd.latitude,
                    vd.longitude,
                    COALESCE(vv.is_verified, false) as is_verified,
                    COALESCE(vv.is_active, true) as is_active,
                    vv.verified_at,
                    (SELECT COUNT(*) FROM manpower WHERE vendor_id = vd.id) as manpower_count,
                    (SELECT GROUP_CONCAT(name SEPARATOR ', ') FROM manpower WHERE vendor_id = vd.id) as manpower_names,
                    (SELECT COUNT(*) FROM warranty_registrations wr 
                     WHERE (wr.manpower_id IN (SELECT id FROM manpower WHERE vendor_id = vd.id)
                        OR (wr.installer_name = vd.store_name AND wr.installer_contact = vd.store_email)
                        OR wr.user_id = p.id)
                    ) as total_warranties,
                    (SELECT COUNT(*) FROM warranty_registrations wr 
                     WHERE (wr.manpower_id IN (SELECT id FROM manpower WHERE vendor_id = vd.id)
                        OR (wr.installer_name = vd.store_name AND wr.installer_contact = vd.store_email)
                        OR wr.user_id = p.id)
                     AND wr.status = 'validated'
                    ) as validated_warranties,
                     (SELECT COUNT(*) FROM warranty_registrations wr 
                      WHERE (wr.manpower_id IN (SELECT id FROM manpower WHERE vendor_id = vd.id)
                        OR (wr.installer_name = vd.store_name AND wr.installer_contact = vd.store_email)
                        OR wr.user_id = p.id)
                      AND wr.status IN ('pending', 'pending_vendor')
                     ) as pending_warranties,
                    (SELECT COUNT(*) FROM warranty_registrations wr 
                     WHERE (wr.manpower_id IN (SELECT id FROM manpower WHERE vendor_id = vd.id)
                        OR (wr.installer_name = vd.store_name AND wr.installer_contact = vd.store_email)
                        OR wr.user_id = p.id)
                     AND wr.status = 'rejected'
                    ) as rejected_warranties
                FROM profiles p
                JOIN user_roles ur ON p.id = ur.user_id
                LEFT JOIN vendor_details vd ON p.id = vd.user_id
                LEFT JOIN vendor_verification vv ON p.id = vv.user_id
                WHERE ur.role = 'vendor'
                ORDER BY p.created_at DESC
            `;

            const [vendorsList]: any = await db.execute(query);

            console.log(`[Admin] Fetched ${vendorsList.length} vendors`);

            // Log vendor verification status for debugging
            vendorsList.forEach((vendor: any) => {
                console.log(`[Admin] Vendor ${vendor.email}: is_verified=${vendor.is_verified}, verified_at=${vendor.verified_at}`);
            });

            res.json({
                success: true,
                vendors: vendorsList
            });
        } catch (error: any) {
            console.error('Get all vendors error:', error);
            res.status(500).json({ error: 'Failed to fetch vendors' });
        }
    }

    static async getVendorDetails(req: Request, res: Response) {
        try {
            const { id } = req.params;

            // Get vendor profile and details
            const [vendor]: any = await db.execute(`
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
                    vd.latitude,
                    vd.longitude,
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
            let manpower: any[] = [];
            if (vendorData.vendor_details_id) {
                const [manpowerResult]: any = await db.execute(`
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

                // Check for "Store Owner" (Default) submissions
                const [ownerStats]: any = await db.execute(`
                    SELECT 
                        COUNT(*) as total_applications,
                        SUM(CASE WHEN status = 'validated' THEN 1 ELSE 0 END) as points,
                        SUM(CASE WHEN status IN ('pending', 'pending_vendor') THEN 1 ELSE 0 END) as pending_points,
                        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_points
                    FROM warranty_registrations
                    WHERE (manpower_id = 'owner' OR manpower_id IS NULL OR manpower_id = '')
                      AND (installer_name = ? OR user_id = ?)
                `, [vendorData.store_name, vendorData.user_id]);

                if (ownerStats[0].total_applications > 0) {
                    manpower.push({
                        id: 'owner',
                        vendor_id: vendorData.vendor_details_id,
                        name: `${vendorData.contact_name} (Store Owner)`,
                        phone: vendorData.phone_number,
                        is_active: 1,
                        total_applications: ownerStats[0].total_applications,
                        points: ownerStats[0].points || 0,
                        pending_points: ownerStats[0].pending_points || 0,
                        rejected_points: ownerStats[0].rejected_points || 0,
                        is_virtual: true
                    });
                }
            }

            // Get warranties based on vendor's manpower, store name, or user_id
            const [warrantyList]: any = await db.execute(`
                SELECT wr.*, 
                       p.name as submitted_by_name, 
                       p.email as submitted_by_email,
                       m.name as manpower_name_from_db,
                       (SELECT latitude FROM vendor_details WHERE id = ?) as store_lat,
                       (SELECT longitude FROM vendor_details WHERE id = ?) as store_lng
                FROM warranty_registrations wr
                LEFT JOIN profiles p ON wr.user_id = p.id
                LEFT JOIN manpower m ON wr.manpower_id = m.id
                WHERE (wr.manpower_id IN (SELECT id FROM manpower WHERE vendor_id = ?)
                   OR wr.installer_name = ?
                   OR wr.user_id = ?)
                ORDER BY wr.created_at DESC
            `, [vendorData.vendor_details_id, vendorData.vendor_details_id, vendorData.vendor_details_id, vendorData.store_name, vendorData.user_id]);

            res.json({
                success: true,
                vendor: vendorData,
                manpower,
                warranties: warrantyList
            });
        } catch (error: any) {
            console.error('Get vendor details error:', error);
            res.status(500).json({ error: 'Failed to fetch vendor details' });
        }
    }

    static async updateVendorVerification(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { is_verified, rejection_reason } = req.body;

            if (typeof is_verified !== 'boolean') {
                return res.status(400).json({ error: 'is_verified must be a boolean' });
            }

            // Get vendor details for email
            const [vendor]: any = await db.execute(
                'SELECT name, email FROM profiles WHERE id = ?',
                [id]
            );

            if (vendor.length === 0) {
                return res.status(404).json({ error: 'Vendor not found' });
            }

            const vendorData = vendor[0];

            // Update verification status
            await db.execute(
                'UPDATE vendor_verification SET is_verified = ?, verified_at = ? WHERE user_id = ?',
                [is_verified, getISTTimestamp(), id]
            );

            // Send email notification
            try {
                if (is_verified) {
                    // Send approval email
                    await EmailService.sendVendorApprovalConfirmation(
                        vendorData.email,
                        vendorData.name
                    );
                    console.log(`✓ Vendor approval email sent to ${vendorData.email}`);
                } else {
                    // Send rejection email
                    await EmailService.sendVendorRejectionNotification(
                        vendorData.email,
                        vendorData.name,
                        rejection_reason
                    );
                    console.log(`✓ Vendor rejection email sent to ${vendorData.email}`);
                }
            } catch (emailError: any) {
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
            } catch (notifError) {
                console.error('Failed to send vendor verification notification:', notifError);
            }

            // Log the activity
            const admin = (req as any).user;
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
        } catch (error: any) {
            console.error('Update vendor verification error:', error);
            res.status(500).json({ error: 'Failed to update vendor verification' });
        }
    }

    /**
     * Toggle vendor activation status
     */
    static async toggleVendorActivation(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { is_active } = req.body;

            if (typeof is_active !== 'boolean') {
                return res.status(400).json({ error: 'is_active must be a boolean' });
            }

            // Get vendor details
            const [vendor]: any = await db.execute(
                'SELECT name, email FROM profiles WHERE id = ?',
                [id]
            );

            if (vendor.length === 0) {
                return res.status(404).json({ error: 'Vendor not found' });
            }

            const vendorData = vendor[0];

            // Update activation status
            await db.execute(
                'UPDATE vendor_verification SET is_active = ? WHERE user_id = ?',
                [is_active, id]
            );

            // Send real-time notification
            try {
                await NotificationService.notify(id, {
                    title: is_active ? 'Store Activated' : 'Store Deactivated',
                    message: is_active
                        ? 'Your store has been activated. You can now access your account.'
                        : 'Your store has been deactivated. Please contact admin for assistance.',
                    type: is_active ? 'system' : 'alert'
                });
            } catch (notifError) {
                console.error('Failed to send vendor activation notification:', notifError);
            }

            // Log the activity
            const admin = (req as any).user;
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
        } catch (error: any) {
            console.error('Toggle vendor activation error:', error);
            res.status(500).json({ error: 'Failed to toggle vendor activation' });
        }
    }

    /**
     * Update store code for QR generation
     */
    static async updateStoreCode(req: Request, res: Response) {
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
            const [existing]: any = await db.execute(
                'SELECT id FROM vendor_details WHERE store_code = ? AND user_id != ?',
                [normalizedCode, id]
            );

            if (existing.length > 0) {
                return res.status(400).json({
                    error: 'This store code is already in use by another franchise'
                });
            }

            // Update store_code
            await db.execute(
                'UPDATE vendor_details SET store_code = ? WHERE user_id = ?',
                [normalizedCode, id]
            );

            // Log the activity
            const admin = (req as any).user;
            const [vendor]: any = await db.execute(
                'SELECT store_name FROM vendor_details WHERE user_id = ?',
                [id]
            );

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
        } catch (error: any) {
            console.error('Update store code error:', error);
            res.status(500).json({ error: 'Failed to update store code' });
        }
    }

    /**
     * Update vendor location coordinates
     */
    static async updateVendorCoordinates(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { latitude, longitude } = req.body;

            await db.execute(
                'UPDATE vendor_details SET latitude = ?, longitude = ? WHERE user_id = ?',
                [latitude || null, longitude || null, id]
            );

            const admin = (req as any).user;
            await ActivityLogService.log({
                adminId: admin.id,
                adminName: admin.name,
                adminEmail: admin.email,
                actionType: 'VENDOR_COORDINATES_UPDATED',
                targetType: 'VENDOR',
                targetId: id,
                targetName: undefined,
                details: { latitude, longitude },
                ipAddress: req.ip || req.socket?.remoteAddress
            });

            res.json({
                success: true,
                message: 'Coordinates updated successfully',
                coordinates: { latitude, longitude }
            });
        } catch (error: any) {
            console.error('Update coordinates error:', error);
            res.status(500).json({ error: 'Failed to update coordinates' });
        }
    }

    static async updateVendorProfile(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { store_name, contact_name, email, phone_number } = req.body;

            if (!store_name || !contact_name || !email || !phone_number) {
                return res.status(400).json({ error: 'All fields are required' });
            }

            const connection = await db.getConnection();
            try {
                await connection.beginTransaction();

                const [existingEmail]: any = await connection.execute(
                    'SELECT id FROM profiles WHERE email = ? AND id != ?',
                    [email, id]
                );
                if (existingEmail.length > 0) {
                    return res.status(400).json({ error: 'Email already in use by another account' });
                }

                await connection.execute(
                    'UPDATE profiles SET name = ?, email = ?, phone_number = ? WHERE id = ?',
                    [contact_name, email, phone_number, id]
                );

                await connection.execute(
                    'UPDATE vendor_details SET store_name = ?, store_email = ? WHERE user_id = ?',
                    [store_name, email, id]
                );

                await connection.commit();

                const admin = (req as any).user;
                await ActivityLogService.log({
                    adminId: admin.id,
                    adminName: admin.name,
                    adminEmail: admin.email,
                    actionType: 'VENDOR_PROFILE_UPDATED',
                    targetType: 'VENDOR',
                    targetId: id,
                    targetName: store_name,
                    ipAddress: req.ip || req.socket?.remoteAddress
                });

                res.json({
                    success: true,
                    message: 'Vendor profile updated successfully'
                });
            } catch (transactionError: any) {
                await connection.rollback();
                throw transactionError;
            } finally {
                connection.release();
            }
        } catch (error: any) {
            console.error('Update vendor profile error:', error);
            res.status(500).json({ error: 'Failed to update vendor profile' });
        }
    }

    static async deleteVendor(req: Request, res: Response) {
        try {
            const { id } = req.params;

            // Delete from profiles - cascading should handle the rest
            const [user]: any = await db.execute('SELECT id FROM profiles WHERE id = ?', [id]);

            if (user.length === 0) {
                return res.status(404).json({ error: 'Vendor not found' });
            }

            await db.execute('DELETE FROM profiles WHERE id = ?', [id]);

            // Log the activity
            const admin = (req as any).user;
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
        } catch (error: any) {
            console.error('Delete vendor error:', error);
            res.status(500).json({ error: 'Failed to delete vendor' });
        }
    }

    static async updateWarrantyStatus(req: Request, res: Response) {
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
            const [warranty]: any = await db.execute(
                `SELECT 
                    wr.id,
                    wr.uid,
                    wr.user_id,
                    wr.installer_name,
                    wr.customer_name, 
                    wr.customer_email, 
                    wr.customer_phone,
                    wr.customer_address,
                    wr.product_type,
                    wr.warranty_type,
                    wr.car_make,
                    wr.car_model,
                    wr.registration_number,
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
                LEFT JOIN vendor_details vd ON (wr.installer_name = vd.store_name AND wr.installer_contact = vd.store_email)
                WHERE wr.uid = ? OR wr.id = ?`,
                [uid, uid]
            );

            if (warranty.length === 0) {
                return res.status(404).json({ error: 'Warranty not found' });
            }

            const warrantyData = warranty[0];
            let productDetails = {};
            try {
                productDetails = typeof warrantyData.product_details === 'string'
                    ? JSON.parse(warrantyData.product_details)
                    : warrantyData.product_details || {};
            } catch (e) {
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

            await db.execute(
                'UPDATE warranty_registrations SET status = ?, rejection_reason = ? WHERE uid = ?',
                [status, status === 'rejected' ? rejectionReason : null, warrantyData.uid]
            );

            // Mark UID as used ONLY when validated, and free it up if rejected
            if (warrantyData.product_type === 'seat-cover') {
                if (status === 'validated') {
                    const usedTimestamp = getISTTimestamp();
                    await db.execute(
                        'UPDATE pre_generated_uids SET is_used = TRUE, used_at = ? WHERE uid = ?',
                        [usedTimestamp, warrantyData.uid]
                    );
                } else if (status === 'rejected') {
                    await db.execute(
                        'UPDATE pre_generated_uids SET is_used = FALSE, used_at = NULL WHERE uid = ?',
                        [warrantyData.uid]
                    );
                }
            }

            // Send email notification to customer only if email is provided
            if (warrantyData.customer_email && warrantyData.customer_email.trim()) {
                try {
                    // Prepare store address string
                    const storeFullAddress = [warrantyData.store_address, warrantyData.store_city, warrantyData.store_state]
                        .filter(Boolean).join(', ');

                    if (status === 'validated') {
                        // Send approval email to customer
                        await EmailService.sendWarrantyApprovalToCustomer(
                            warrantyData.customer_email,
                            warrantyData.customer_name,
                            warrantyData.uid,
                            warrantyData.product_type,
                            warrantyData.registration_number,
                            warrantyData.car_make,
                            warrantyData.car_model,
                            productDetails,
                            warrantyData.warranty_type,
                            warrantyData.store_name,
                            storeFullAddress,
                            warrantyData.store_email,
                            warrantyData.applicator_name
                        );
                        console.log(`✓ Warranty approval email sent to customer: ${warrantyData.customer_email}`);
                    } else {
                        // Send rejection email to customer
                        await EmailService.sendWarrantyRejectionToCustomer(
                            warrantyData.customer_email,
                            warrantyData.customer_name,
                            warrantyData.uid,
                            warrantyData.product_type,
                            warrantyData.registration_number,
                            rejectionReason,
                            warrantyData.car_make,
                            warrantyData.car_model,
                            productDetails,
                            warrantyData.warranty_type,
                            warrantyData.store_name,
                            storeFullAddress,
                            warrantyData.store_email,
                            warrantyData.applicator_name
                        );
                        console.log(`✓ Warranty rejection email sent to customer: ${warrantyData.customer_email}`);
                    }
                } catch (emailError: any) {
                    console.error('Customer email sending error:', emailError);
                    // Don't fail the request if email fails
                }
            } else {
                console.log(`ℹ️ No customer email provided, skipping email notification for warranty ${warrantyData.uid}`);
            }

            // Send email + notification to franchise/vendor
            // Strategy: try manpower lookup first, fall back to installer_name (store name)
            try {
                let vendorEmail: string | null = null;
                let vendorName: string | null = warrantyData.store_name || null;
                let vendorUserId: string | null = null;
                let applicatorName: string | null = warrantyData.applicator_name || null;

                // 1. Try manpower lookup (real DB manpower ID)
                const manpowerId = warrantyData.manpower_id;
                if (manpowerId && manpowerId !== 'owner') {
                    const [vendorInfo]: any = await db.execute(
                        `SELECT 
                            p.email as vendor_email,
                            p.id as vendor_user_id,
                            vd.store_name as vendor_name,
                            m.name as manpower_name
                        FROM manpower m
                        JOIN vendor_details vd ON m.vendor_id = vd.id
                        JOIN profiles p ON vd.user_id = p.id
                        WHERE m.id = ?`,
                        [manpowerId]
                    );
                    if (vendorInfo.length > 0) {
                        vendorEmail = vendorInfo[0].vendor_email;
                        vendorName = vendorInfo[0].vendor_name;
                        vendorUserId = vendorInfo[0].vendor_user_id;
                        applicatorName = vendorInfo[0].manpower_name || applicatorName;
                    }
                }

                // 2. Fallback: find vendor by installer_name (catches QR/direct/owner submissions)
                if (!vendorEmail && warrantyData.installer_name) {
                    const [vendorByName]: any = await db.execute(
                        `SELECT p.email as vendor_email, p.id as vendor_user_id, vd.store_name as vendor_name
                         FROM vendor_details vd
                         JOIN profiles p ON vd.user_id = p.id
                         WHERE vd.store_name = ? AND vd.store_email = ?
                         LIMIT 1`,
                        [warrantyData.installer_name, warrantyData.installer_contact]
                    );
                    if (vendorByName.length > 0) {
                        vendorEmail = vendorByName[0].vendor_email;
                        vendorName = vendorByName[0].vendor_name;
                        vendorUserId = vendorByName[0].vendor_user_id;
                    }
                }

                // 3. Send vendor email if we found one
                if (vendorEmail && vendorName) {
                    if (status === 'validated') {
                        await EmailService.sendWarrantyApprovalToVendor(
                            vendorEmail,
                            vendorName,
                            warrantyData.customer_name,
                            warrantyData.customer_phone,
                            warrantyData.product_type,
                            warrantyData.registration_number,
                            applicatorName ?? '',
                            warrantyData.uid,
                            warrantyData.car_make,
                            warrantyData.car_model,
                            productDetails,
                            warrantyData.warranty_type
                        );
                        console.log(`✓ Warranty approval email sent to vendor: ${vendorEmail}`);
                    } else {
                        await EmailService.sendWarrantyRejectionToVendor(
                            vendorEmail,
                            vendorName,
                            warrantyData.customer_name,
                            warrantyData.customer_phone,
                            warrantyData.product_type,
                            warrantyData.registration_number,
                            applicatorName ?? '',
                            rejectionReason,
                            warrantyData.uid,
                            warrantyData.car_make,
                            warrantyData.car_model,
                            productDetails,
                            warrantyData.warranty_type
                        );
                        console.log(`✓ Warranty rejection email sent to vendor: ${vendorEmail}`);
                    }
                } else {
                    console.log(`ℹ️ No vendor email found for warranty ${warrantyData.uid}, skipping vendor email`);
                }

                // 4. Send real-time notification to vendor
                if (vendorUserId) {
                    await NotificationService.notify(vendorUserId, {
                        title: status === 'validated' ? 'Warranty Approved! ✓' : 'Warranty Rejected ✗',
                        message: status === 'validated'
                            ? `The warranty for ${warrantyData.customer_name} (${warrantyData.uid}) has been approved.`
                            : `The warranty for ${warrantyData.customer_name} (${warrantyData.uid}) was rejected. Reason: ${rejectionReason}`,
                        type: 'warranty',
                        link: `/dashboard/vendor`
                    });
                }

                // 5. Notify Customer
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
            } catch (notifError: any) {
                console.error('Failed to send vendor/customer notifications:', notifError);
                // Don't fail the request if notifications fail
            }

            // Log the activity
            const admin = (req as any).user;
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
        } catch (error: any) {
            console.error('Update warranty status error:', error);
            res.status(500).json({ error: 'Failed to update warranty status' });
        }
    }

    static async getAllWarranties(req: Request, res: Response) {
        try {
            // Pagination parameters
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 30;
            const offset = (page - 1) * limit;

            // Extract Filters
            const { status, search, product_type, make, date_from, date_to } = req.query;

            let conditions: string[] = [];
            let params: any[] = [];

            // 1. Dynamic Filters

            // Status Filtering
            // Admin logic: matches exactly what the filter says usually
            if (status && status !== 'all') {
                if (status === 'pending') {
                    conditions.push("wr.status = 'pending_vendor'");
                } else if (status === 'pending_ho') {
                    conditions.push("wr.status = 'pending'");
                } else {
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
                    wr.registration_number LIKE ? OR 
                    wr.car_make LIKE ? OR 
                    wr.car_model LIKE ? OR
                    wr.installer_name LIKE ? OR
                    vd_m.store_name LIKE ? OR
                    vd_i.store_name LIKE ? OR
                    vd_owner.store_name LIKE ? OR
                    vd_m.city LIKE ? OR
                    vd_i.city LIKE ? OR
                    vd_owner.city LIKE ?
                )`);
                params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
            }

            // Date Range
            if (date_from && date_to) {
                conditions.push('wr.created_at BETWEEN ? AND ?');
                params.push(new Date(date_from as string), new Date(date_to as string));
            }

            // 2. Build Query
            const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

            // Count Query (must include the same JOINs used in search conditions)
            const countQuery = `
                SELECT COUNT(*) as total
                FROM warranty_registrations wr
                LEFT JOIN manpower m ON wr.manpower_id = m.id
                LEFT JOIN vendor_details vd_m ON (wr.manpower_id IS NOT NULL AND wr.manpower_id NOT LIKE 'owner-%' AND m.vendor_id = vd_m.id)
                LEFT JOIN vendor_details vd_i ON (wr.installer_name = vd_i.store_name AND wr.installer_contact = vd_i.store_email)
                LEFT JOIN vendor_details vd_owner ON (
                    wr.manpower_id LIKE 'owner-%' AND
                    vd_owner.id = REPLACE(wr.manpower_id, 'owner-', '')
                )
                ${whereClause}
            `;
            const [countResult]: any = await db.execute(countQuery, params);
            const totalCount = countResult[0].total;
            const totalPages = Math.ceil(totalCount / limit);

            // Get all warranties with user details including role (with pagination)
            const mainQuery = `
                SELECT 
                    wr.*,
                    p.name as submitted_by_name,
                    p.email as submitted_by_email,
                    (SELECT ur.role FROM user_roles ur WHERE ur.user_id = p.id LIMIT 1) as submitted_by_role,
                    m.name as manpower_name_from_db,
                    COALESCE(vd_m.store_name, vd_i.store_name, vd_owner.store_name) as vendor_store_name,
                    COALESCE(vd_m.store_email, vd_i.store_email, vd_owner.store_email) as vendor_store_email,
                    COALESCE(vd_m.city, vd_i.city, vd_owner.city) as vendor_city,
                    COALESCE(vd_m.state, vd_i.state, vd_owner.state) as vendor_state,
                    COALESCE(vd_m.latitude, vd_i.latitude, vd_owner.latitude) as store_lat,
                    COALESCE(vd_m.longitude, vd_i.longitude, vd_owner.longitude) as store_lng,
                    vp.phone_number as vendor_phone_number
                FROM warranty_registrations wr
                LEFT JOIN profiles p ON wr.user_id = p.id
                LEFT JOIN manpower m ON wr.manpower_id = m.id
                LEFT JOIN vendor_details vd_m ON (wr.manpower_id IS NOT NULL AND wr.manpower_id NOT LIKE 'owner-%' AND m.vendor_id = vd_m.id)
                LEFT JOIN vendor_details vd_i ON (
                    (wr.installer_name = vd_i.store_name OR wr.installer_name = CONCAT(vd_i.store_name, ' - ', vd_i.city)) 
                    AND wr.installer_contact = vd_i.store_email
                )
                LEFT JOIN profiles vp ON COALESCE(vd_m.user_id, vd_i.user_id) = vp.id
                LEFT JOIN vendor_details vd_owner ON (
                    wr.manpower_id LIKE 'owner-%' AND
                    vd_owner.id = REPLACE(wr.manpower_id, 'owner-', '')
                )
                ${whereClause}
                ORDER BY wr.created_at DESC
                LIMIT ? OFFSET ?
            `;

            const mainParams = [...params, limit, offset];
            const [warrantyList]: any = await db.execute(mainQuery, mainParams);

            // Parse JSON product_details
            const formattedWarranties = warrantyList.map((warranty: any) => ({
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
        } catch (error: any) {
            console.error('Get all warranties error:', error);
            res.status(500).json({ error: 'Failed to fetch warranties' });
        }
    }

    static async getWarrantyById(req: Request, res: Response) {
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
                LEFT JOIN vendor_details vd ON (
                    (wr.manpower_id IS NOT NULL AND wr.manpower_id NOT LIKE 'owner-%' AND m.vendor_id = vd.id) OR
                    (wr.installer_name = vd.store_name AND wr.installer_contact = vd.store_email)
                )
                LEFT JOIN profiles vp ON vd.user_id = vp.id
                WHERE wr.uid = ? OR wr.id = ?
                LIMIT 1
            `;

            const [result]: any = await db.execute(query, [id, id]);

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
        } catch (error: any) {
            console.error('Get warranty by ID error:', error);
            res.status(500).json({ error: 'Failed to fetch warranty' });
        }
    }

    static async getCustomers(_req: Request, res: Response) {
        try {
            // Get both registered customers (from profiles) and guests (from registrations)
            const [customers]: any = await db.execute(`
                SELECT 
                    customer_name,
                    customer_email,
                    customer_phone,
                    NULL as customer_address,
                    total_warranties,
                    validated_warranties,
                    pending_warranties,
                    rejected_warranties,
                    first_warranty_date,
                    last_warranty_date,
                    registered_at
                FROM (
                    -- 1. Registered Customers (from profiles)
                    SELECT 
                        p.name as customer_name,
                        p.email as customer_email,
                        p.phone_number as customer_phone,
                        COUNT(wr.uid) as total_warranties,
                        SUM(CASE WHEN wr.status = 'validated' THEN 1 ELSE 0 END) as validated_warranties,
                        SUM(CASE WHEN wr.status IN ('pending', 'pending_vendor') THEN 1 ELSE 0 END) as pending_warranties,
                        SUM(CASE WHEN wr.status = 'rejected' THEN 1 ELSE 0 END) as rejected_warranties,
                        MIN(wr.created_at) as first_warranty_date,
                        MAX(wr.created_at) as last_warranty_date,
                        p.created_at as registered_at
                    FROM profiles p
                    JOIN user_roles ur ON p.id = ur.user_id
                    LEFT JOIN warranty_registrations wr ON p.email = wr.customer_email
                    WHERE ur.role = 'customer'
                    -- Exclude exact vendor profile matches
                    AND p.email NOT IN (SELECT email FROM profiles p2 JOIN user_roles ur2 ON p2.id = ur2.user_id WHERE ur2.role = 'vendor')
                    GROUP BY p.id

                    UNION ALL

                    -- 2. Guest Customers (identified by Name + Phone + Email combo)
                    SELECT 
                        sub.customer_name,
                        sub.customer_email,
                        sub.customer_phone,
                        sub.total_warranties,
                        sub.validated_warranties,
                        sub.pending_warranties,
                        sub.rejected_warranties,
                        sub.first_warranty_date,
                        sub.last_warranty_date,
                        sub.first_warranty_date as registered_at
                    FROM (
                        SELECT 
                            customer_name,
                            customer_email,
                            customer_phone,
                            COUNT(uid) as total_warranties,
                            SUM(CASE WHEN status = 'validated' THEN 1 ELSE 0 END) as validated_warranties,
                            SUM(CASE WHEN status IN ('pending', 'pending_vendor') THEN 1 ELSE 0 END) as pending_warranties,
                            SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_warranties,
                            MIN(created_at) as first_warranty_date,
                            MAX(created_at) as last_warranty_date
                        FROM warranty_registrations
                        GROUP BY customer_name, customer_email, customer_phone
                    ) sub
                    -- Exclude if they are already in the "Registered Customers" list
                    LEFT JOIN (
                        SELECT p.email, p.phone_number, p.id FROM profiles p 
                        JOIN user_roles ur ON p.id = ur.user_id WHERE ur.role = 'customer'
                    ) reg_cust ON (sub.customer_email = reg_cust.email OR sub.customer_phone = reg_cust.phone_number)
                    -- SMARTS: Exclude if the customer name EXACTLY matches a vendor name using that email
                    -- This allows "Jignesh" to show up even if he used "Ishan's" email.
                    LEFT JOIN (
                        SELECT p.email, p.name FROM profiles p 
                        JOIN user_roles ur ON p.id = ur.user_id WHERE ur.role = 'vendor'
                    ) vendor_match ON sub.customer_email = vendor_match.email AND sub.customer_name = vendor_match.name
                    
                    WHERE reg_cust.id IS NULL      -- Not a registered customer
                    AND vendor_match.name IS NULL  -- Name doesn't match the vendor profile
                    -- Basic sanity: must have either a valid email OR a valid phone
                    AND (
                        (sub.customer_email IS NOT NULL AND sub.customer_email != '' AND sub.customer_email != 'N/A')
                        OR 
                        (sub.customer_phone IS NOT NULL AND sub.customer_phone != '' AND sub.customer_phone != 'N/A')
                    )
                ) combined
                ORDER BY registered_at DESC
            `);

            res.json({
                success: true,
                customers
            });
        } catch (error: any) {
            console.error('Get customers error:', error);
            res.status(500).json({ error: 'Failed to fetch customers' });
        }
    }

    static async getCustomerDetails(req: Request, res: Response) {
        try {
            const { email } = req.params;

            // Get customer basic info from profiles OR guest info from registrations
            const [customerInfo]: any = await db.execute(`
                SELECT 
                    customer_name,
                    customer_email,
                    customer_phone,
                    NULL as customer_address
                FROM (
                    -- Try profiles first
                    SELECT 
                        p.name as customer_name,
                        p.email as customer_email,
                        p.phone_number as customer_phone
                    FROM profiles p
                    JOIN user_roles ur ON p.id = ur.user_id
                    WHERE p.email = ? AND ur.role = 'customer'
                    
                    UNION ALL
                    
                    -- Fallback to guests from registrations
                    SELECT 
                        wr.customer_name as customer_name,
                        wr.customer_email as customer_email,
                        wr.customer_phone as customer_phone
                    FROM warranty_registrations wr
                    LEFT JOIN profiles p INNER JOIN user_roles ur ON p.id = ur.user_id AND ur.role = 'customer' ON wr.customer_email = p.email
                    WHERE wr.customer_email = ? AND ur.id IS NULL
                    LIMIT 1
                ) combined
                LIMIT 1
            `, [email, email]);

            if (customerInfo.length === 0) {
                return res.status(404).json({ error: 'Customer not found' });
            }

            // Get all warranties for this customer
            const [warrantyList]: any = await db.execute(`
                SELECT 
                    wr.*,
                    p.name as submitted_by_name,
                    p.email as submitted_by_email,
                    m.name as manpower_name_from_db,
                    vd.store_name as vendor_store_name
                FROM warranty_registrations wr
                LEFT JOIN profiles p ON wr.user_id = p.id
                LEFT JOIN manpower m ON wr.manpower_id = m.id
                LEFT JOIN vendor_details vd ON (wr.installer_name = vd.store_name AND wr.installer_contact = vd.store_email)
                WHERE wr.customer_email = ?
                ORDER BY wr.created_at DESC
            `, [email]);

            res.json({
                success: true,
                customer: customerInfo[0],
                warranties: warrantyList
            });
        } catch (error: any) {
            console.error('Get customer details error:', error);
            res.status(500).json({ error: 'Failed to fetch customer details' });
        }
    }

    static async deleteCustomer(req: Request, res: Response) {
        try {
            const { email } = req.params;

            // Check if customer exists in profiles
            const [customer]: any = await db.execute(
                `SELECT p.id, p.email FROM profiles p 
                 JOIN user_roles ur ON p.id = ur.user_id 
                 WHERE p.email = ? AND ur.role = 'customer' 
                 LIMIT 1`,
                [email]
            );

            if (customer.length === 0) {
                return res.status(404).json({ error: 'Customer not found' });
            }

            // Get user ID to delete
            const user_id = customer[0].id;

            // Delete from profiles - cascading should handle warranty_registrations
            await db.execute('DELETE FROM profiles WHERE id = ?', [user_id]);

            // Log the activity
            const admin = (req as any).user;
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
        } catch (error: any) {
            console.error('Delete customer error:', error);
            res.status(500).json({ error: 'Failed to delete customer' });
        }
    }

    // Admin Management Methods
    static async getAllAdmins(_req: Request, res: Response) {
        try {
            const query = `
                SELECT 
                    p.id,
                    p.name,
                    p.email,
                    p.phone_number,
                    p.created_at,
                    COALESCE(ap.is_super_admin, 0) as is_super_admin,
                    ap.permissions
                FROM profiles p
                JOIN user_roles ur ON p.id = ur.user_id
                LEFT JOIN admin_permissions ap ON p.id = ap.admin_id
                WHERE ur.role = 'admin'
                ORDER BY ap.is_super_admin DESC, p.created_at ASC
            `;

            const [admins]: any = await db.execute(query);

            // Parse permissions JSON for each admin
            const adminList = admins.map((admin: any) => ({
                ...admin,
                is_super_admin: admin.is_super_admin === 1 || admin.is_super_admin === true,
                permissions: admin.permissions
                    ? (typeof admin.permissions === 'string' ? JSON.parse(admin.permissions) : admin.permissions)
                    : {}
            }));

            res.json({
                success: true,
                admins: adminList
            });
        } catch (error: any) {
            console.error('Get all admins error:', error);
            res.status(500).json({ error: 'Failed to fetch admins' });
        }
    }

    static async createAdmin(req: Request, res: Response) {
        try {
            const { name, email, phone, permissions } = req.body;
            const invitedBy = (req as any).user;

            // Validate required fields
            if (!name || !email || !phone) {
                return res.status(400).json({
                    error: 'Name, email, and phone are required'
                });
            }

            // Check if email already exists
            const [existingEmail]: any = await db.execute(
                'SELECT id FROM profiles WHERE email = ?',
                [email]
            );

            if (existingEmail.length > 0) {
                return res.status(400).json({
                    error: 'An account with this email already exists'
                });
            }

            // Check if phone number already exists
            const [existingPhone]: any = await db.execute(
                'SELECT id FROM profiles WHERE phone_number = ?',
                [phone]
            );

            if (existingPhone.length > 0) {
                return res.status(400).json({
                    error: 'An account with this phone number already exists'
                });
            }

            // Generate UUID for new admin
            const { v4: uuidv4 } = await import('uuid');
            const userId = uuidv4();

            // Normalize permissions — default all to false if not provided
            const defaultPermissions = {
                overview:          { read: false, write: false },
                warranties:        { read: false, write: false },
                warranty_products: { read: false, write: false },
                uid_management:    { read: false, write: false },
                warranty_form:     { read: false, write: false },
                vendors:           { read: false, write: false },
                customers:         { read: false, write: false },
                products:          { read: false, write: false },
                announcements:     { read: false, write: false },
                grievances:        { read: false, write: false },
                posm:              { read: false, write: false },
                ecatalogue:        { read: false, write: false },
                terms:             { read: false, write: false },
                old_warranties:    { read: false, write: false },
                activity_logs:     { read: false, write: false },
            };
            const resolvedPermissions = permissions || defaultPermissions;

            // Create profile (no password needed for OTP-based auth)
            await db.execute(
                'INSERT INTO profiles (id, name, email, phone_number) VALUES (?, ?, ?, ?)',
                [userId, name, email, phone]
            );

            // Add admin role
            await db.execute(
                'INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, ?)',
                [uuidv4(), userId, 'admin']
            );

            // Insert permissions row (is_super_admin = false for all invited admins)
            await db.execute(
                'INSERT INTO admin_permissions (id, admin_id, is_super_admin, permissions) VALUES (?, ?, 0, ?)',
                [uuidv4(), userId, JSON.stringify(resolvedPermissions)]
            );

            // Send invitation email
            try {
                await EmailService.sendAdminInvitation(
                    email,
                    name,
                    invitedBy.name || 'An Administrator'
                );
                console.log(`✓ Admin invitation email sent to: ${email}`);
            } catch (emailError: any) {
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
                    phone_number: phone,
                    is_super_admin: false,
                    permissions: resolvedPermissions
                }
            });
        } catch (error: any) {
            console.error('Create admin error:', error);
            res.status(500).json({ error: 'Failed to create admin' });
        }
    }

    static async updateAdminPermissions(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { permissions } = req.body;
            const actor = (req as any).user;

            if (!permissions || typeof permissions !== 'object') {
                return res.status(400).json({ error: 'permissions object is required' });
            }

            // Prevent modifying a Super Admin's permissions
            const [target]: any = await db.execute(
                'SELECT is_super_admin FROM admin_permissions WHERE admin_id = ?',
                [id]
            );

            if (target.length === 0) {
                return res.status(404).json({ error: 'Admin permissions record not found' });
            }

            const isSuperAdmin = target[0].is_super_admin === 1 || target[0].is_super_admin === true;
            if (isSuperAdmin) {
                return res.status(403).json({ error: 'Super Admin permissions cannot be modified' });
            }

            // Ensure write implies read for all modules
            const normalized: Record<string, { read: boolean; write: boolean }> = {};
            for (const [module, perm] of Object.entries(permissions as any)) {
                const p = perm as { read: boolean; write: boolean };
                normalized[module] = {
                    read: p.write ? true : p.read,   // write implies read
                    write: p.write
                };
            }

            await db.execute(
                'UPDATE admin_permissions SET permissions = ? WHERE admin_id = ?',
                [JSON.stringify(normalized), id]
            );

            // Get admin name for log
            const [adminProfile]: any = await db.execute(
                'SELECT name FROM profiles WHERE id = ?',
                [id]
            );

            await ActivityLogService.log({
                adminId: actor.id,
                adminName: actor.name,
                adminEmail: actor.email,
                actionType: 'ADMIN_PERMISSIONS_UPDATED',
                targetType: 'ADMIN',
                targetId: id,
                targetName: adminProfile[0]?.name || 'Unknown',
                details: { permissions: normalized },
                ipAddress: req.ip || req.socket?.remoteAddress
            });

            res.json({
                success: true,
                message: 'Permissions updated successfully',
                permissions: normalized
            });
        } catch (error: any) {
            console.error('Update admin permissions error:', error);
            res.status(500).json({ error: 'Failed to update permissions' });
        }
    }

    static async deleteAdmin(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const actor = (req as any).user;

            // Cannot delete yourself
            if (id === actor.id) {
                return res.status(400).json({ error: 'You cannot delete your own admin account' });
            }

            // Cannot delete a Super Admin
            const [target]: any = await db.execute(
                'SELECT is_super_admin FROM admin_permissions WHERE admin_id = ?',
                [id]
            );

            if (target.length > 0) {
                const isSuperAdmin = target[0].is_super_admin === 1 || target[0].is_super_admin === true;
                if (isSuperAdmin) {
                    return res.status(403).json({ error: 'Super Admin account cannot be deleted' });
                }
            }

            // Get admin name for log
            const [adminProfile]: any = await db.execute(
                'SELECT name, email FROM profiles WHERE id = ?',
                [id]
            );

            if (adminProfile.length === 0) {
                return res.status(404).json({ error: 'Admin not found' });
            }

            // Delete — CASCADE handles admin_permissions row
            await db.execute('DELETE FROM profiles WHERE id = ?', [id]);

            await ActivityLogService.log({
                adminId: actor.id,
                adminName: actor.name,
                adminEmail: actor.email,
                actionType: 'ADMIN_DELETED',
                targetType: 'ADMIN',
                targetId: id,
                targetName: adminProfile[0]?.name || 'Unknown',
                details: { email: adminProfile[0]?.email },
                ipAddress: req.ip || req.socket?.remoteAddress
            });

            res.json({
                success: true,
                message: 'Admin account removed successfully'
            });
        } catch (error: any) {
            console.error('Delete admin error:', error);
            res.status(500).json({ error: 'Failed to delete admin' });
        }
    }

    static async getActivityLogs(req: Request, res: Response) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 30;
            const offset = (page - 1) * limit;
            const adminId = req.query.adminId as string;
            const actionType = req.query.actionType as string;

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
        } catch (error: any) {
            console.error('Get activity logs error:', error);
            res.status(500).json({ error: 'Failed to fetch activity logs' });
        }
    }

    // ── Resubmissions Staging Handlers ───────────────────────────────────────────────────

    static async getResubmissions(req: Request, res: Response) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 50;
            const offset = (page - 1) * limit;

            const [countResult]: any = await db.execute('SELECT COUNT(*) as total FROM warranty_resubmissions WHERE status = "pending_review"');
            const totalCount = countResult[0].total;
            const totalPages = Math.ceil(totalCount / limit);

            const [resubmissions]: any = await db.execute(`
                SELECT 
                    wr.*,
                    p.name as submitted_by_name,
                    p.email as submitted_by_email,
                    m.name as manpower_name_from_db,
                    vd.store_name as vendor_store_name,
                    vd.store_email as vendor_store_email,
                    vd.city as vendor_city
                FROM warranty_resubmissions wr
                LEFT JOIN profiles p ON wr.user_id = p.id
                LEFT JOIN manpower m ON wr.manpower_id = m.id
                LEFT JOIN vendor_details vd ON (m.vendor_id = vd.id OR (wr.installer_name = vd.store_name AND wr.installer_contact = vd.store_email))
                WHERE wr.status = 'pending_review'
                ORDER BY wr.created_at DESC
                LIMIT ? OFFSET ?
            `, [limit, offset]);

            const formatted = resubmissions.map((r: any) => ({
                ...r,
                product_details: JSON.parse(r.product_details),
                fraud_flags: r.fraud_flags ? JSON.parse(r.fraud_flags) : {},
                uid: r.original_uid // For frontend compatibility
            }));

            res.json({
                success: true,
                resubmissions: formatted,
                pagination: { currentPage: page, totalPages, totalCount, limit }
            });
        } catch (error) {
            console.error('Get resubmissions error:', error);
            res.status(500).json({ error: 'Failed to fetch resubmissions' });
        }
    }

    static async approveResubmission(req: Request, res: Response) {
        let connection;
        try {
            const { id } = req.params;
            const sql = 'SELECT * FROM warranty_resubmissions WHERE id = ? AND status = "pending_review"';
            const [rows]: any = await db.execute(sql, [id]);
            
            if (rows.length === 0) {
                return res.status(404).json({ error: 'Resubmission not found or already processed' });
            }
            
            const staging = rows[0];
            
            // Using a transaction to ensure atomic update of both tables
            connection = await db.getConnection();
            await connection.beginTransaction();

            // 1. Overwrite the main table data with the staging data and set status to approved
            await connection.execute(`
                UPDATE warranty_registrations SET
                    customer_name = ?, customer_email = ?, customer_phone = ?,
                    customer_address = ?, car_make = ?, car_model = ?, car_year = ?,
                    registration_number = ?, purchase_date = ?, installer_name = ?, 
                    installer_contact = ?, product_details = ?, manpower_id = ?,
                    status = 'validated', seat_cover_photo_url = ?, car_outer_photo_url = ?
                WHERE uid = ?
            `, [
                staging.customer_name, staging.customer_email, staging.customer_phone,
                staging.customer_address, staging.car_make, staging.car_model, staging.car_year,
                staging.registration_number, staging.purchase_date, staging.installer_name,
                staging.installer_contact, staging.product_details, staging.manpower_id,
                staging.seat_cover_photo_url, staging.car_outer_photo_url,
                staging.original_uid
            ]);

            // 2. Mark staging as approved
            await connection.execute('UPDATE warranty_resubmissions SET status = "approved" WHERE id = ?', [id]);

            // 3. Mark UID as used in pre_generated_uids if it's a seat cover
            if (staging.product_type === 'seat-cover') {
                const usedTimestamp = new Date().toISOString().slice(0, 19).replace('T', ' '); // Simple helper for YYYY-MM-DD HH:MM:SS
                await connection.execute(
                    'UPDATE pre_generated_uids SET is_used = TRUE, used_at = ? WHERE uid = ?',
                    [usedTimestamp, staging.original_uid]
                );
            }

            await connection.commit();

            // Send Email logic can be triggered here if needed, but keeping it simple for DB sync first
            
            const admin = (req as any).user;
            await ActivityLogService.log({
                adminId: admin.id,
                adminName: admin.name,
                adminEmail: admin.email,
                actionType: 'approve_resubmission',
                targetType: 'WARRANTY',
                targetId: staging.original_uid,
                targetName: staging.original_uid,
                details: { status: 'validated' }
            });

            res.json({ success: true, message: 'Resubmission approved successfully' });
        } catch (error) {
            if (connection) await connection.rollback();
            console.error('Approve resubmission error:', error);
            res.status(500).json({ error: 'Failed to approve resubmission' });
        } finally {
            if (connection) connection.release();
        }
    }

    static async rejectResubmission(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { notes } = req.body;
            
            const [rows]: any = await db.execute('SELECT original_uid FROM warranty_resubmissions WHERE id = ?', [id]);
            if (rows.length === 0) return res.status(404).json({ error: 'Resubmission not found' });
            
            await db.execute(
                'UPDATE warranty_resubmissions SET status = "rejected", admin_notes = ? WHERE id = ?',
                [notes || 'Rejected by admin', id]
            );

            const admin = (req as any).user;
            await ActivityLogService.log({
                adminId: admin.id,
                adminName: admin.name,
                adminEmail: admin.email,
                actionType: 'reject_resubmission',
                targetType: 'WARRANTY',
                targetId: rows[0].original_uid,
                targetName: rows[0].original_uid,
                details: { notes }
            });

            res.json({ success: true, message: 'Resubmission rejected' });
        } catch (error) {
            console.error('Reject resubmission error:', error);
            res.status(500).json({ error: 'Failed to reject resubmission' });
        }
    }
}
