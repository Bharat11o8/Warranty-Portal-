import { Request, Response } from 'express';
import db, { getISTTimestamp } from '../config/database.js';
import { EmailService } from '../services/email.service.js';
import { ActivityLogService } from '../services/activity-log.service.js';
import { NotificationService } from '../services/notification.service.js';
import { WhatsAppService } from '../services/whatsapp.service.js';
import { v4 as uuidv4 } from 'uuid';
import {
    getMobileRegistrationUsage,
    normalizeCustomerMobile
} from '../utils/customerMobileLimits.js';

/**
 * Run a promise-returning function with retries and exponential backoff
 */
async function runWithRetry<T>(
    fn: () => Promise<T>,
    retries = 3,
    initialDelay = 5000,
    description = 'operation'
): Promise<T> {
    let lastError: any;
    let delay = initialDelay;
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            return await fn();
        } catch (error: any) {
            lastError = error;
            console.warn(`[Retry] Attempt ${attempt} failed for ${description}. Error: ${error?.message || error}`);
            if (attempt < retries) {
                console.log(`[Retry] Waiting ${delay}ms before next attempt...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 3; // Exponential backoff: 5s, 15s, 45s...
            }
        }
    }
    console.error(`[Retry] All ${retries} attempts failed for ${description}. Final error:`, lastError);
    throw lastError;
}

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

    static async getAllVendors(req: Request, res: Response) {
        try {
            const { startDate, endDate, dateField } = req.query as { startDate?: string; endDate?: string; dateField?: string };
            const hasRange = Boolean(startDate && endDate);
            const rangeColumn = dateField === 'purchase_date' ? 'u.purchase_date' : 'u.created_at';

            // Warranty attribution (manpower / installer match / user_id) is computed
            // once via a UNION of three indexed join paths (deduped per vendor+uid),
            // then aggregated in a single GROUP BY — instead of re-evaluating an
            // un-indexable triple-OR condition in 12 correlated subqueries per vendor.
            // When no date range is given, in_range is 1 so range_* equal the totals,
            // matching the old behaviour.
            const inRangeExpr = hasRange
                ? `CASE WHEN ${rangeColumn} BETWEEN ? AND ? THEN 1 ELSE 0 END`
                : '1';
            const queryParams = hasRange ? [`${startDate} 00:00:00`, `${endDate} 23:59:59`] : [];

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
                    dist.id as distributor_id,
                    COALESCE(vv.is_verified, false) as is_verified,
                    COALESCE(vv.is_active, true) as is_active,
                    COALESCE(vd.is_distributor, false) as is_distributor,
                    COALESCE(vd.is_franchise, true) as is_franchise,
                    vv.verified_at,
                    COALESCE(mp.manpower_count, 0) as manpower_count,
                    mp.manpower_names,
                    COALESCE(wagg.total_warranties, 0) as total_warranties,
                    COALESCE(wagg.validated_warranties, 0) as validated_warranties,
                    COALESCE(wagg.pending_warranties, 0) as pending_warranties,
                    COALESCE(wagg.rejected_warranties, 0) as rejected_warranties,
                    COALESCE(wagg.range_total_warranties, 0) as range_total_warranties,
                    COALESCE(wagg.range_validated_warranties, 0) as range_validated_warranties,
                    COALESCE(wagg.range_pending_warranties, 0) as range_pending_warranties,
                    COALESCE(wagg.range_rejected_warranties, 0) as range_rejected_warranties,
                    COALESCE(oa.order_pending_count, 0) as order_pending_count,
                    COALESCE(oa.order_confirmed_count, 0) as order_confirmed_count,
                    COALESCE(oa.order_declined_count, 0) as order_declined_count,
                    COALESCE(oa.order_total_count, 0) as order_total_count,
                    cats.allowed_category_names,
                    COALESCE(dist.allowed_brands, 'AF') as distributor_allowed_brands,
                    COALESCE(vd.allowed_brands, 'AF') as franchise_allowed_brands
                FROM profiles p
                JOIN user_roles ur ON p.id = ur.user_id
                LEFT JOIN vendor_details vd ON p.id = vd.user_id
                LEFT JOIN vendor_verification vv ON p.id = vv.user_id
                LEFT JOIN distributors dist ON dist.profile_id = p.id
                LEFT JOIN (
                    SELECT vendor_id,
                           COUNT(*) as manpower_count,
                           GROUP_CONCAT(name SEPARATOR ', ') as manpower_names
                    FROM manpower
                    GROUP BY vendor_id
                ) mp ON mp.vendor_id = vd.id
                LEFT JOIN (
                    SELECT t.vkey,
                           COUNT(*) as total_warranties,
                           SUM(CASE WHEN t.status = 'validated' THEN 1 ELSE 0 END) as validated_warranties,
                           SUM(CASE WHEN t.status IN ('pending', 'pending_vendor') THEN 1 ELSE 0 END) as pending_warranties,
                           SUM(CASE WHEN t.status = 'rejected' THEN 1 ELSE 0 END) as rejected_warranties,
                           SUM(t.in_range) as range_total_warranties,
                           SUM(CASE WHEN t.in_range = 1 AND t.status = 'validated' THEN 1 ELSE 0 END) as range_validated_warranties,
                           SUM(CASE WHEN t.in_range = 1 AND t.status IN ('pending', 'pending_vendor') THEN 1 ELSE 0 END) as range_pending_warranties,
                           SUM(CASE WHEN t.in_range = 1 AND t.status = 'rejected' THEN 1 ELSE 0 END) as range_rejected_warranties
                    FROM (
                        SELECT u.vkey, u.status, ${inRangeExpr} as in_range
                        FROM (
                            SELECT vd2.user_id as vkey, wr.uid, wr.status, wr.created_at, wr.purchase_date
                            FROM manpower m
                            JOIN vendor_details vd2 ON vd2.id = m.vendor_id
                            JOIN warranty_registrations wr ON wr.manpower_id = m.id
                            UNION
                            SELECT vd3.user_id, wr.uid, wr.status, wr.created_at, wr.purchase_date
                            FROM vendor_details vd3
                            JOIN warranty_registrations wr
                              ON wr.installer_name = vd3.store_name
                             AND wr.installer_contact = vd3.store_email
                            UNION
                            SELECT wr.user_id, wr.uid, wr.status, wr.created_at, wr.purchase_date
                            FROM warranty_registrations wr
                        ) u
                    ) t
                    GROUP BY t.vkey
                ) wagg ON wagg.vkey = p.id
                LEFT JOIN (
                    SELECT distributor_id,
                           SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as order_pending_count,
                           SUM(CASE WHEN status IN ('processing', 'shipped', 'delivered') THEN 1 ELSE 0 END) as order_confirmed_count,
                           SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as order_declined_count,
                           COUNT(*) as order_total_count
                    FROM store_orders
                    GROUP BY distributor_id
                ) oa ON oa.distributor_id = dist.id
                LEFT JOIN (
                    SELECT dac.distributor_id,
                           GROUP_CONCAT(sc.name ORDER BY sc.name SEPARATOR ', ') as allowed_category_names
                    FROM distributor_allowed_categories dac
                    JOIN store_categories sc ON sc.id = dac.category_id
                    GROUP BY dac.distributor_id
                ) cats ON cats.distributor_id = dist.id
                WHERE ur.role = 'vendor'
                ORDER BY p.created_at DESC
            `;

            const [vendorsList]: any = await db.execute(query, queryParams);

            console.log(`[Admin] Fetched ${vendorsList.length} vendors`);

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
                    dist.id AS distributor_id,
                    vd.id AS vendor_details_id,
                    vd.store_name,
                    vd.store_code,
                    vd.address,
                    vd.city,
                    vd.state,
                    vd.pincode,
                    vd.latitude,
                    vd.longitude,
                    dist.gst_number,
                    dist.area_head_name,
                    vv.is_verified,
                    COALESCE(vv.is_active, true) as is_active,
                    vv.verified_at,
                    COALESCE(dist.allowed_brands, 'AF') as distributor_allowed_brands,
                    COALESCE(vd.allowed_brands, 'AF') as franchise_allowed_brands
                FROM profiles p
                LEFT JOIN vendor_details vd ON p.id = vd.user_id
                LEFT JOIN vendor_verification vv ON p.id = vv.user_id
                LEFT JOIN distributors dist ON dist.profile_id = p.id
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
                       COALESCE(vd_m.store_name, vd_i.store_name, vd_owner.store_name) as vendor_store_name,
                       COALESCE(vd_m.store_email, vd_i.store_email, vd_owner.store_email) as vendor_store_email,
                       vp.phone_number as vendor_phone_number,
                       COALESCE(vd_m.latitude, vd_i.latitude, vd_owner.latitude) as store_lat,
                       COALESCE(vd_m.longitude, vd_i.longitude, vd_owner.longitude) as store_lng
                FROM warranty_registrations wr
                LEFT JOIN profiles p ON wr.user_id = p.id
                LEFT JOIN manpower m ON wr.manpower_id = m.id
                LEFT JOIN vendor_details vd_m ON (wr.manpower_id IS NOT NULL AND wr.manpower_id NOT LIKE 'owner-%' AND m.vendor_id = vd_m.id)
                LEFT JOIN vendor_details vd_i ON (
                    (wr.installer_name = vd_i.store_name OR wr.installer_name = CONCAT(vd_i.store_name, ' - ', vd_i.city)) 
                    AND wr.installer_contact = vd_i.store_email
                )
                LEFT JOIN vendor_details vd_owner ON (
                    wr.manpower_id LIKE 'owner-%' AND
                    vd_owner.id = REPLACE(wr.manpower_id, 'owner-', '')
                )
                LEFT JOIN profiles vp ON COALESCE(vd_m.user_id, vd_i.user_id, vd_owner.user_id) = vp.id
                WHERE (wr.manpower_id IN (SELECT id FROM manpower WHERE vendor_id = ?)
                   OR wr.installer_name = ?
                   OR wr.user_id = ?)
                ORDER BY wr.created_at DESC
            `, [vendorData.vendor_details_id, vendorData.store_name, vendorData.user_id]);

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
                    console.log(`âœ“ Vendor approval email sent to ${vendorData.email}`);
                } else {
                    // Send rejection email
                    await EmailService.sendVendorRejectionNotification(
                        vendorData.email,
                        vendorData.name,
                        rejection_reason
                    );
                    console.log(`âœ“ Vendor rejection email sent to ${vendorData.email}`);
                }
            } catch (emailError: any) {
                console.error('Email sending error:', emailError);
                // Don't fail the request if email fails
            }

            // Send real-time notification
            try {
                await NotificationService.notify(id, {
                    title: is_verified ? 'Store Approved! âœ“' : 'Store Verification Update',
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
     * Update allowed_brands for a vendor (franchise or distributor)
     */
    static async updateVendorAllowedBrands(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { allowed_brands, target } = req.body;

            if (!['AF', 'AC', 'AFAC'].includes(allowed_brands)) {
                return res.status(400).json({ error: 'allowed_brands must be AF, AC, or AFAC' });
            }

            if (target === 'distributor') {
                const { distributor_id } = req.body;
                let result: any;
                if (distributor_id) {
                    [result] = await db.execute(
                        `UPDATE distributors SET allowed_brands = ? WHERE id = ?`,
                        [allowed_brands, distributor_id]
                    ) as any;
                } else {
                    [result] = await db.execute(
                        `UPDATE distributors SET allowed_brands = ? WHERE profile_id = ?`,
                        [allowed_brands, id]
                    ) as any;
                }
                if (result.affectedRows === 0) {
                    return res.status(404).json({ error: 'Distributor record not found. Ensure distributor status is enabled first.' });
                }
            } else {
                const [result]: any = await db.execute(
                    `UPDATE vendor_details SET allowed_brands = ? WHERE user_id = ?`,
                    [allowed_brands, id]
                );
                if (result.affectedRows === 0) {
                    return res.status(404).json({ error: 'Franchise record not found.' });
                }
            }

            res.json({ success: true, message: `Brand assignment updated to ${allowed_brands}` });
        } catch (error: any) {
            console.error('Update allowed_brands error:', error);
            res.status(500).json({ error: 'Failed to update brand assignment' });
        }
    }

    /**
     * Update vendor distributor status (toggles is_distributor and maps to distributors table)
     */
    static async updateVendorDistributorStatus(req: Request, res: Response) {
        const connection = await db.getConnection();
        try {
            const { id } = req.params;
            const { is_distributor } = req.body;

            if (typeof is_distributor !== 'boolean') {
                return res.status(400).json({ error: 'is_distributor must be a boolean' });
            }

            await connection.beginTransaction();

            // Check if vendor exists
            const [vendor]: any = await connection.execute(
                `SELECT p.name, p.email, p.phone_number, vd.store_name, vd.store_email, vd.address, vd.city, vd.state, vd.pincode
                 FROM profiles p
                 JOIN vendor_details vd ON p.id = vd.user_id
                 WHERE p.id = ?`,
                [id]
            );

            if (vendor.length === 0) {
                await connection.rollback();
                return res.status(404).json({ error: 'Vendor details not found' });
            }

            const vendorData = vendor[0];

            // 1. Update is_distributor in vendor_details
            await connection.execute(
                'UPDATE vendor_details SET is_distributor = ? WHERE user_id = ?',
                [is_distributor, id]
            );

            if (is_distributor) {
                // Check if a distributor record already exists for this vendor profile
                const [existingDist]: any = await connection.execute(
                    'SELECT id FROM distributors WHERE profile_id = ?',
                    [id]
                );

                if (existingDist.length === 0) {
                    // Create new distributor record linked to this profile
                    const newDistId = uuidv4();
                    await connection.execute(
                        `INSERT INTO distributors (id, name, email, phone_number, address, city, state, pincode, profile_id)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [
                            newDistId,
                            vendorData.store_name,
                            vendorData.store_email || vendorData.email,
                            vendorData.phone_number || '0000000000',
                            vendorData.address || '',
                            vendorData.city || '',
                            vendorData.state || '',
                            vendorData.pincode || '',
                            id
                        ]
                    );
                    console.log(`[Admin] Created distributor record for vendor ${id} with id ${newDistId}`);
                }
            } else {
                // Find the distributor record before disassociating
                const [distRecord]: any = await connection.execute(
                    'SELECT id FROM distributors WHERE profile_id = ?',
                    [id]
                );

                if (distRecord.length > 0) {
                    const distId = distRecord[0].id;
                    // Unmap any vendor_details currently assigned to this distributor
                    await connection.execute(
                        'UPDATE vendor_details SET distributor_id = NULL WHERE distributor_id = ?',
                        [distId]
                    );
                    console.log(`[Admin] Unmapped all franchises from distributor ${distId}`);
                }

                // If revoking distributor status, set profile_id = NULL for their linked distributor record
                // This keeps historical order linkages intact but disassociates the franchise from managing it.
                await connection.execute(
                    'UPDATE distributors SET profile_id = NULL WHERE profile_id = ?',
                    [id]
                );
                console.log(`[Admin] Disassociated distributor record from profile ${id}`);
            }

            await connection.commit();

            // Log the activity
            const admin = (req as any).user;
            await ActivityLogService.log({
                adminId: admin.id,
                adminName: admin.name,
                adminEmail: admin.email,
                actionType: is_distributor ? 'VENDOR_PROMOTED_DISTRIBUTOR' : 'VENDOR_DEMOTED_DISTRIBUTOR',
                targetType: 'VENDOR',
                targetId: id,
                targetName: vendorData.store_name,
                ipAddress: req.ip || req.socket?.remoteAddress
            });

            res.json({
                success: true,
                message: `Franchise ${is_distributor ? 'promoted to distributor' : 'demoted from distributor'} successfully`
            });

        } catch (error: any) {
            await connection.rollback();
            console.error('Update vendor distributor status error:', error);
            res.status(500).json({ error: 'Failed to update vendor distributor status' });
        } finally {
            connection.release();
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
            let { store_name, contact_name, email, phone_number, address, city, state, pincode, gst_number, area_head_name } = req.body;

            // SBP-DB: Trim string lengths to prevent database overflow (Data Too Long) edge cases
            store_name = store_name?.substring(0, 255);
            contact_name = contact_name?.substring(0, 100);
            email = email?.substring(0, 100);
            phone_number = phone_number?.substring(0, 15);
            // Optional address/registration fields — normalize empty strings to null
            address = address ? String(address).substring(0, 500) : null;
            city = city ? String(city).substring(0, 100) : null;
            state = state ? String(state).substring(0, 100) : null;
            pincode = pincode ? String(pincode).substring(0, 10) : null;
            gst_number = gst_number ? String(gst_number).substring(0, 20) : null;
            area_head_name = area_head_name ? String(area_head_name).substring(0, 255) : null;

            if (!store_name || !contact_name || !email || !phone_number) {
                return res.status(400).json({ error: 'Store name, contact name, email and phone number are required' });
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

                const [existingPhone]: any = await connection.execute(
                    'SELECT id FROM profiles WHERE phone_number = ? AND id != ?',
                    [phone_number, id]
                );
                if (existingPhone.length > 0) {
                    return res.status(400).json({ error: 'Phone number already in use by another account' });
                }

                await connection.execute(
                    'UPDATE profiles SET name = ?, email = ?, phone_number = ? WHERE id = ?',
                    [contact_name, email, phone_number, id]
                );

                await connection.execute(
                    'UPDATE vendor_details SET store_name = ?, store_email = ?, address = ?, city = ?, state = ?, pincode = ? WHERE user_id = ?',
                    [store_name, email, address, city, state, pincode, id]
                );

                // Keep the distributor dashboard in sync with the updated profile.
                // The distributor-facing UI reads from the distributors table, so if we
                // only update profiles/vendor_details it will continue showing stale data.
                await connection.execute(
                    'UPDATE distributors SET name = ?, email = ?, phone_number = ?, address = ?, city = ?, state = ?, pincode = ?, gst_number = ?, area_head_name = ? WHERE profile_id = ?',
                    [store_name, email, phone_number, address, city, state, pincode, gst_number, area_head_name, id]
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

            if (!['validated', 'rejected', 'pending'].includes(status)) {
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
                    wr.status,
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
                    wr.purchase_date,
                    wr.created_at,
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

            // SHIELD: Prevent invalid state transitions
            // Only allow moving back to pending from 'rejected' status
            if (status === 'pending' && warrantyData.status !== 'rejected') {
                return res.status(400).json({ error: `Cannot move to pending from ${warrantyData.status} status. Only rejected warranties can be overridden.` });
            }

            console.log(`[SHIELD] Updating warranty: uid=${uid}, current_status=${warrantyData.status}, new_status=${status}`);

            const connection = await db.getConnection();
            try {
                await connection.beginTransaction();

                // 1. Update the main registration status
                let timestampUpdates = '';
                if (status === 'validated') timestampUpdates = ', validated_at = NOW()';
                if (status === 'rejected') timestampUpdates = ', rejected_at = NOW()';
                
                await connection.execute(
                    `UPDATE warranty_registrations SET status = ?, rejection_reason = ? ${timestampUpdates} WHERE uid = ? LIMIT 1`,
                    [status, status === 'rejected' ? rejectionReason : null, warrantyData.uid]
                );

                // Log the action to the immutable analytics_events table
                await connection.execute(
                    `INSERT INTO analytics_events (warranty_id, action_type, performed_by) VALUES (?, ?, ?)`,
                    [warrantyData.id, status, 'system_admin']
                );

                // 2. UID Management Shield
                if (warrantyData.product_type === 'seat-cover') {
                    if (status === 'validated') {
                        const usedTimestamp = getISTTimestamp();
                        await connection.execute(
                            'UPDATE pre_generated_uids SET is_used = TRUE, used_at = ? WHERE uid = ?',
                            [usedTimestamp, warrantyData.uid]
                        );
                    } else if (status === 'rejected') {
                        await connection.execute(
                            'UPDATE pre_generated_uids SET is_used = FALSE, used_at = NULL WHERE uid = ?',
                            [warrantyData.uid]
                        );
                    } else if (status === 'pending' && warrantyData.status === 'rejected') {
                        // Re-reserve the UID if it was previously released during rejection
                        await connection.execute(
                            'UPDATE pre_generated_uids SET is_used = TRUE, used_at = ? WHERE uid = ?',
                            [getISTTimestamp(), warrantyData.uid]
                        );
                    }
                }

                await connection.commit();
            } catch (err) {
                await connection.rollback();
                throw err;
            } finally {
                connection.release();
            }

            // Return success response to admin immediately to prevent UI lag
            res.json({
                success: true,
                message: `Warranty ${status} successfully`
            });

            // Send notifications and log activities asynchronously in the background
            (async () => {
                try {
                    // Send email notification to customer only if email is provided
                    if (warrantyData.customer_email && warrantyData.customer_email.trim()) {
                        try {
                            // Prepare store address string
                            const storeFullAddress = [warrantyData.store_address, warrantyData.store_city, warrantyData.store_state]
                                .filter(Boolean).join(', ');

                            if (status === 'validated') {
                                // â”€â”€ Customer Approval: WhatsApp first, email fallback â”€â”€
                                let approvalWaSent = false;
                                if (process.env.ENABLE_WHATSAPP === 'true' && warrantyData.customer_phone) {
                                    try {
                                        const purchaseDate = (warrantyData.purchase_date || warrantyData.created_at)
                                            ? new Date(warrantyData.purchase_date || warrantyData.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                                            : 'N/A';
                                        const productName = (productDetails as any)?.product || (productDetails as any)?.productName || warrantyData.product_type || 'Autoform Product';
                                        approvalWaSent = await runWithRetry(
                                            () => WhatsAppService.sendWarrantyApprovedCustomer(
                                                warrantyData.customer_phone,
                                                warrantyData.customer_name,
                                                productName,
                                                warrantyData.registration_number || 'N/A',
                                                warrantyData.uid,
                                                warrantyData.store_name || warrantyData.installer_name || 'Autoform Store',
                                                'Active',
                                                purchaseDate,
                                                warrantyData.warranty_type || 'Standard'
                                            ),
                                            3,
                                            5000,
                                            `WhatsApp Customer Approval (${warrantyData.uid})`
                                        );
                                        console.log(`[WhatsApp] Warranty approval sent to customer: ${warrantyData.customer_phone}`);
                                    } catch (waErr) {
                                        console.error('[WhatsApp] Failed to send approval to customer:', waErr);
                                    }
                                }
                                // Send Email (always live alongside WhatsApp)
                                await runWithRetry(
                                    () => EmailService.sendWarrantyApprovalToCustomer(
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
                                        warrantyData.applicator_name,
                                        (warrantyData.purchase_date || warrantyData.created_at)
                                            ? new Date(warrantyData.purchase_date || warrantyData.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                                            : 'N/A'
                                    ),
                                    3,
                                    5000,
                                    `Email Customer Approval (${warrantyData.uid})`
                                );
                                console.log(`âœ“ Warranty approval email sent to customer: ${warrantyData.customer_email}`);
                            } else if (status === 'rejected') {
                                // â”€â”€ Customer Rejection: WhatsApp first, email fallback â”€â”€
                                let rejectionWaSent = false;
                                if (process.env.ENABLE_WHATSAPP === 'true' && warrantyData.customer_phone) {
                                    try {
                                        const purchaseDate = (warrantyData.purchase_date || warrantyData.created_at)
                                            ? new Date(warrantyData.purchase_date || warrantyData.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                                            : 'N/A';
                                        const productName = (productDetails as any)?.product || (productDetails as any)?.productName || warrantyData.product_type || 'Autoform Product';
                                        rejectionWaSent = await runWithRetry(
                                            () => WhatsAppService.sendWarrantyRejectedCustomer(
                                                warrantyData.customer_phone,
                                                warrantyData.customer_name,
                                                productName,
                                                warrantyData.registration_number || 'N/A',
                                                warrantyData.uid,
                                                warrantyData.store_name || warrantyData.installer_name || 'Autoform Store',
                                                'Not Approved',
                                                purchaseDate,
                                                warrantyData.warranty_type || 'Standard',
                                                rejectionReason
                                            ),
                                            3,
                                            5000,
                                            `WhatsApp Customer Rejection (${warrantyData.uid})`
                                        );
                                        console.log(`[WhatsApp] Warranty rejection sent to customer: ${warrantyData.customer_phone}`);
                                    } catch (waErr) {
                                        console.error('[WhatsApp] Failed to send rejection to customer:', waErr);
                                    }
                                }
                                // Send Email (always live alongside WhatsApp)
                                await runWithRetry(
                                    () => EmailService.sendWarrantyRejectionToCustomer(
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
                                    ),
                                    3,
                                    5000,
                                    `Email Customer Rejection (${warrantyData.uid})`
                                );
                                console.log(`âœ“ Warranty rejection email sent to customer: ${warrantyData.customer_email}`);
                            }
                        } catch (emailError: any) {
                            console.error('Customer email sending error:', emailError);
                        }
                    } else {
                        console.log(`â„¹ï¸ No customer email provided, skipping email notification for warranty ${warrantyData.uid}`);
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

                        // 3. Send vendor notification if we found one
                        if (vendorEmail && vendorName) {
                            if (status === 'validated') {
                                // Vendor approval: no WhatsApp template, email stays primary
                                await runWithRetry(
                                    () => EmailService.sendWarrantyApprovalToVendor(
                                        vendorEmail!,
                                        vendorName!,
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
                                    ),
                                    3,
                                    5000,
                                    `Email Vendor Approval (${warrantyData.uid})`
                                );
                                console.log(`âœ“ Warranty approval email sent to vendor: ${vendorEmail}`);
                            } else if (status === 'rejected') {
                                // â”€â”€ Vendor Rejection: WhatsApp first, email fallback â”€â”€
                                let vendorRejWaSent = false;
                                if (process.env.ENABLE_WHATSAPP === 'true') {
                                    try {
                                        const [vendorPhone]: any = await db.execute(
                                            `SELECT p.phone_number FROM profiles p
                                             JOIN vendor_details vd ON vd.user_id = p.id
                                             WHERE p.email = ? LIMIT 1`,
                                            [vendorEmail]
                                        );
                                        if (vendorPhone.length > 0 && vendorPhone[0].phone_number) {
                                            const purchaseDate = warrantyData.created_at
                                                ? new Date(warrantyData.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                                                : 'N/A';
                                            const productName = (productDetails as any)?.product || (productDetails as any)?.productName || warrantyData.product_type || 'Autoform Product';
                                            vendorRejWaSent = await runWithRetry(
                                                () => WhatsAppService.sendVendorRejected(
                                                    vendorPhone[0].phone_number,
                                                    vendorName ?? 'Franchise Partner',
                                                    productName,
                                                    warrantyData.registration_number || 'N/A',
                                                    warrantyData.uid,
                                                    'Not Approved',
                                                    purchaseDate,
                                                    warrantyData.warranty_type || 'Standard',
                                                    rejectionReason
                                                ),
                                                3,
                                                5000,
                                                `WhatsApp Vendor Rejection (${warrantyData.uid})`
                                            );
                                            console.log(`[WhatsApp] Vendor rejection notice sent to: ${vendorPhone[0].phone_number}`);
                                        }
                                    } catch (waErr) {
                                        console.error('[WhatsApp] Failed to send vendor rejection notice:', waErr);
                                    }
                                }
                                // Send Email (always live alongside WhatsApp)
                                await runWithRetry(
                                    () => EmailService.sendWarrantyRejectionToVendor(
                                        vendorEmail!,
                                        vendorName!,
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
                                    ),
                                    3,
                                    5000,
                                    `Email Vendor Rejection (${warrantyData.uid})`
                                );
                                console.log(`âœ“ Warranty rejection email sent to vendor: ${vendorEmail}`);
                            }
                        } else {
                            console.log(`â„¹ï¸ No vendor email found for warranty ${warrantyData.uid}, skipping vendor email`);
                        }

                        // 4. Send real-time notification to vendor
                        if (vendorUserId) {
                            let title = 'Warranty Pending â³';
                            let message = `The warranty for ${warrantyData.customer_name} (${warrantyData.uid}) is pending review.`;

                            if (status === 'validated') {
                                title = 'Warranty Approved! âœ“';
                                message = `The warranty for ${warrantyData.customer_name} (${warrantyData.uid}) has been approved.`;
                            } else if (status === 'rejected') {
                                message = `The warranty for ${warrantyData.customer_name} (${warrantyData.uid}) has been rejected. Reason: ${rejectionReason}`;
                            }

                            await NotificationService.notify(vendorUserId, {
                                title,
                                message,
                                type: 'warranty',
                                link: `/dashboard/vendor`
                            });
                        }

                        // 5. Notify Customer
                        if (warrantyData.user_id) {
                            let title = 'Warranty Pending â³';
                            let message = `Your warranty for ${warrantyData.uid} is now under review by AutoForm.`;

                            if (status === 'validated') {
                                title = 'Warranty Validated! âœ“';
                                message = `Your warranty for ${warrantyData.uid} has been validated by AutoForm.`;
                            } else if (status === 'rejected') {
                                message = `Your warranty for ${warrantyData.uid} has been rejected. Reason: ${rejectionReason}`;
                            }

                            await NotificationService.notify(warrantyData.user_id, {
                                title,
                                message,
                                type: 'warranty',
                                link: `/dashboard/customer`
                            });
                        }
                    } catch (notifError: any) {
                        console.error('Failed to send vendor/customer notifications:', notifError);
                    }

                    // Log the activity
                    const admin = (req as any).user;
                    await ActivityLogService.log({
                        adminId: admin.id,
                        adminName: admin.name,
                        adminEmail: admin.email,
                        actionType: status === 'validated' ? 'WARRANTY_APPROVED' :
                            status === 'pending' ? 'WARRANTY_OVERRIDDEN' : 'WARRANTY_REJECTED',
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
                } catch (bgError) {
                    console.error('[Background] Failed to process background warranty notifications:', bgError);
                }
            })();
        } catch (error: any) {
            console.error('Update warranty status error:', error);
            res.status(500).json({ error: 'Failed to update warranty status' });
        }
    }

    static async updateWarrantyDetails(req: Request, res: Response) {
        try {
            const { uid } = req.params;
            const { 
                customer_name, customer_email, customer_phone, 
                car_make, car_model, 
                registration_number, product_name, warranty_type,
                purchase_date
            } = req.body;

            const [existingRows]: any = await db.execute(
                'SELECT * FROM warranty_registrations WHERE uid = ?',
                [uid]
            );

            if (existingRows.length === 0) {
                return res.status(404).json({ error: 'Warranty not found' });
            }

            const existing = existingRows[0];

            if (existing.status === 'validated') {
                return res.status(403).json({ error: 'Approved warranties cannot be edited.' });
            }
            
            // Update the JSON product_details to keep the frontend in sync
            let productDetails: any = {};
            try {
                productDetails = typeof existing.product_details === 'string' 
                    ? JSON.parse(existing.product_details) 
                    : (existing.product_details || {});
            } catch (e) {
                console.error('Failed to parse product_details', e);
            }

            if (customer_name !== undefined) productDetails.customerName = customer_name;
            if (customer_email !== undefined) productDetails.customerEmail = customer_email;
            if (customer_phone !== undefined) productDetails.customerPhone = customer_phone;
            if (registration_number !== undefined) productDetails.carRegistration = registration_number;
            if (product_name !== undefined) productDetails.productName = product_name;

            await db.execute(
                `UPDATE warranty_registrations SET
                    customer_name = ?,
                    customer_email = ?,
                    customer_phone = ?,
                    car_make = ?,
                    car_model = ?,
                    registration_number = ?,
                    warranty_type = ?,
                    purchase_date = ?,
                    product_details = ?
                 WHERE uid = ?`,
                [
                    customer_name !== undefined ? customer_name : existing.customer_name,
                    customer_email !== undefined ? customer_email : existing.customer_email,
                    customer_phone !== undefined ? customer_phone : existing.customer_phone,
                    car_make !== undefined ? car_make : existing.car_make,
                    car_model !== undefined ? car_model : existing.car_model,
                    registration_number !== undefined ? registration_number : existing.registration_number,
                    warranty_type !== undefined ? warranty_type : existing.warranty_type,
                    purchase_date !== undefined ? purchase_date : existing.purchase_date,
                    JSON.stringify(productDetails),
                    uid
                ]
            );

            const admin = (req as any).user;

            // Build a before/after diff for the audit trail
            const changes: Record<string, { before: any, after: any }> = {};
            const fieldMap: Record<string, string> = {
                customer_name: 'Customer Name',
                customer_email: 'Customer Email',
                customer_phone: 'Customer Phone',
                car_make: 'Car Make',
                car_model: 'Car Model',
                registration_number: 'Registration Number',
                warranty_type: 'Warranty Type',
                purchase_date: 'Purchase Date',
            };
            for (const [key, label] of Object.entries(fieldMap)) {
                const bodyVal = req.body[key];
                if (bodyVal !== undefined && String(bodyVal) !== String(existing[key] ?? '')) {
                    changes[label] = { before: existing[key] ?? null, after: bodyVal };
                }
            }
            if (product_name !== undefined && product_name !== productDetails.productName) {
                changes['Product Name'] = { before: productDetails.productName ?? null, after: product_name };
            }

            await ActivityLogService.log({
                adminId: admin.id,
                adminName: admin.name,
                adminEmail: admin.email,
                actionType: 'WARRANTY_UPDATED',
                targetType: 'WARRANTY',
                targetId: uid,
                targetName: `${existing.customer_name} (${uid})`,
                details: {
                    summary: `Admin edited warranty details for ${existing.customer_name}`,
                    changes
                },
                ipAddress: req.ip || req.socket?.remoteAddress
            });

            res.json({
                success: true,
                message: 'Warranty details updated successfully'
            });

        } catch (error: any) {
            console.error('Update warranty details error:', error);
            res.status(500).json({ error: 'Failed to update warranty details' });
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
            const [warrantyList]: any = await db.query(mainQuery, mainParams);

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

    static async getCustomers(req: Request, res: Response) {
        try {
            const exportAll = req.query.export === 'true';
            const requestedPage = Number(req.query.page || 1);
            const requestedPageSize = Number(req.query.pageSize || 10);
            const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
            const pageSize = Number.isInteger(requestedPageSize)
                ? Math.min(Math.max(requestedPageSize, 1), 100)
                : 10;
            const offset = (page - 1) * pageSize;
            const search = typeof req.query.search === 'string' ? req.query.search.trim().slice(0, 100) : '';
            const searchPattern = `%${search}%`;

            const sortColumns: Record<string, string> = {
                created_at: 'registered_at',
                first_warranty_date: 'registered_at',
                registered_at: 'registered_at',
                customer_name: 'customer_name',
                total_warranties: 'total_warranties',
                warranty_count: 'total_warranties'
            };
            const requestedSort = typeof req.query.sortField === 'string' ? req.query.sortField : 'registered_at';
            const sortColumn = sortColumns[requestedSort] || 'registered_at';
            const sortOrder = req.query.sortOrder === 'asc' ? 'ASC' : 'DESC';

            const paginationSql = exportAll ? '' : 'LIMIT ? OFFSET ?';
            const customerParams: any[] = [search, searchPattern, searchPattern, searchPattern];
            if (!exportAll) {
                customerParams.push(pageSize, offset);
            }

            const customersSql = `
                WITH customer_profiles AS (
                    SELECT p.id, p.name, p.email, p.phone_number, p.created_at
                    FROM profiles p
                    WHERE EXISTS (
                        SELECT 1
                        FROM user_roles ur
                        WHERE ur.user_id = p.id AND ur.role = 'customer'
                    )
                ),
                vendor_profiles AS (
                    SELECT p.id, p.name, p.email
                    FROM profiles p
                    WHERE EXISTS (
                        SELECT 1
                        FROM user_roles ur
                        WHERE ur.user_id = p.id AND ur.role = 'vendor'
                    )
                ),
                registered_customers AS (
                    SELECT
                        p.name AS customer_name,
                        p.email AS customer_email,
                        p.phone_number AS customer_phone,
                        NULL AS customer_address,
                        COUNT(wr.uid) AS total_warranties,
                        COALESCE(SUM(CASE WHEN wr.status = 'validated' THEN 1 ELSE 0 END), 0) AS validated_warranties,
                        COALESCE(SUM(CASE WHEN wr.status IN ('pending', 'pending_vendor') THEN 1 ELSE 0 END), 0) AS pending_warranties,
                        COALESCE(SUM(CASE WHEN wr.status = 'rejected' THEN 1 ELSE 0 END), 0) AS rejected_warranties,
                        MIN(wr.created_at) AS first_warranty_date,
                        MAX(wr.created_at) AS last_warranty_date,
                        p.created_at AS registered_at
                    FROM customer_profiles p
                    LEFT JOIN warranty_registrations wr ON wr.user_id = p.id
                    WHERE NOT EXISTS (
                        SELECT 1
                        FROM vendor_profiles vp
                        WHERE vp.id = p.id
                    )
                    GROUP BY p.id, p.name, p.email, p.phone_number, p.created_at
                ),
                guest_aggregates AS (
                    SELECT
                        customer_name,
                        customer_email,
                        customer_phone,
                        COUNT(uid) AS total_warranties,
                        SUM(CASE WHEN status = 'validated' THEN 1 ELSE 0 END) AS validated_warranties,
                        SUM(CASE WHEN status IN ('pending', 'pending_vendor') THEN 1 ELSE 0 END) AS pending_warranties,
                        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) AS rejected_warranties,
                        MIN(created_at) AS first_warranty_date,
                        MAX(created_at) AS last_warranty_date
                    FROM warranty_registrations
                    WHERE (customer_email IS NOT NULL AND customer_email != '' AND customer_email != 'N/A')
                       OR (customer_phone IS NOT NULL AND customer_phone != '' AND customer_phone != 'N/A')
                    GROUP BY customer_name, customer_email, customer_phone
                ),
                guest_customers AS (
                    SELECT
                        guest.customer_name,
                        guest.customer_email,
                        guest.customer_phone,
                        NULL AS customer_address,
                        guest.total_warranties,
                        guest.validated_warranties,
                        guest.pending_warranties,
                        guest.rejected_warranties,
                        guest.first_warranty_date,
                        guest.last_warranty_date,
                        guest.first_warranty_date AS registered_at
                    FROM guest_aggregates guest
                    WHERE NOT EXISTS (
                        SELECT 1
                        FROM customer_profiles customer
                        WHERE guest.customer_email IS NOT NULL
                          AND guest.customer_email != ''
                          AND guest.customer_email != 'N/A'
                          AND customer.email = guest.customer_email
                    )
                    AND NOT EXISTS (
                        SELECT 1
                        FROM customer_profiles customer
                        WHERE guest.customer_phone IS NOT NULL
                          AND guest.customer_phone != ''
                          AND guest.customer_phone != 'N/A'
                          AND customer.phone_number = guest.customer_phone
                    )
                    AND NOT EXISTS (
                        SELECT 1
                        FROM vendor_profiles vendor
                        WHERE vendor.email = guest.customer_email
                          AND vendor.name = guest.customer_name
                    )
                ),
                combined AS (
                    SELECT * FROM registered_customers
                    UNION ALL
                    SELECT * FROM guest_customers
                )
                SELECT combined.*, COUNT(*) OVER() AS total_count
                FROM combined
                WHERE ? = ''
                   OR customer_name LIKE ?
                   OR customer_email LIKE ?
                   OR customer_phone LIKE ?
                ORDER BY ${sortColumn} ${sortOrder}, customer_email ASC, customer_phone ASC
                ${paginationSql}
            `;

            const timedQuery = async (label: string, operation: () => Promise<any>) => {
                const startedAt = Date.now();
                const result = await operation();
                const duration = Date.now() - startedAt;
                if (duration >= 250) {
                    console.info(`[Customers] ${label}: ${duration}ms`);
                }
                return result;
            };

            const [customerResult, phoneUsageResult, limitResult] = await Promise.all([
                timedQuery('main query', () => db.execute(customersSql, customerParams)),
                timedQuery('phone usage query', () => db.execute(`
                    SELECT customer_phone, COUNT(*) AS used_count
                    FROM warranty_registrations
                    WHERE customer_phone IS NOT NULL
                      AND customer_phone != ''
                      AND customer_phone != 'N/A'
                      AND status != 'rejected'
                    GROUP BY customer_phone
                `)),
                timedQuery('mobile limits query', () => db.execute(
                    'SELECT mobile_number, allowed_registrations FROM customer_mobile_limits'
                ))
            ]);

            const customerRows: any[] = customerResult[0];
            const phoneUsageRows: any[] = phoneUsageResult[0];
            const limitRows: any[] = limitResult[0];
            const total = Number(customerRows[0]?.total_count || 0);

            const mobileUsageMap = new Map<string, number>();
            phoneUsageRows.forEach((row: any) => {
                const mobileNumber = normalizeCustomerMobile(row.customer_phone);
                if (!mobileNumber) return;
                mobileUsageMap.set(mobileNumber, (mobileUsageMap.get(mobileNumber) || 0) + Number(row.used_count || 0));
            });

            const mobileLimitMap = new Map<string, number>();
            limitRows.forEach((row: any) => {
                const mobileNumber = normalizeCustomerMobile(row.mobile_number);
                if (!mobileNumber) return;
                mobileLimitMap.set(mobileNumber, Math.max(1, Number(row.allowed_registrations || 1)));
            });

            const customersWithLimits = customerRows.map((row: any) => {
                const { total_count: _totalCount, ...customer } = row;
                const mobileNumber = normalizeCustomerMobile(customer.customer_phone);
                const usedCount = mobileNumber ? (mobileUsageMap.get(mobileNumber) || 0) : 0;
                const hasOverride = mobileNumber ? mobileLimitMap.has(mobileNumber) : false;
                const allowedCount = hasOverride ? (mobileLimitMap.get(mobileNumber) || 1) : 1;

                return {
                    ...customer,
                    mobile_allowed_registrations: allowedCount,
                    mobile_used_registrations: usedCount,
                    mobile_remaining_registrations: Math.max(allowedCount - usedCount, 0),
                    mobile_limit_override: hasOverride
                };
            });

            res.json({
                success: true,
                customers: customersWithLimits,
                pagination: exportAll ? null : {
                    page,
                    pageSize,
                    total,
                    totalPages: Math.ceil(total / pageSize)
                }
            });
        } catch (error: any) {
            console.error('Get customers error:', error);
            res.status(500).json({ error: 'Failed to fetch customers' });
        }
    }

    static async getCustomerDetails(req: Request, res: Response) {
        try {
            // The route param is historically named "email" but customers without
            // an email (e.g. fallback-UID submissions) are looked up by phone instead.
            const identifier = req.params.email;
            const isPhoneLookup = /^\d{10,15}$/.test(identifier);

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
                    WHERE (? = TRUE AND p.phone_number = ?) OR (? = FALSE AND p.email = ?) AND ur.role = 'customer'

                    UNION ALL

                    -- Fallback to guests from registrations
                    SELECT
                        wr.customer_name as customer_name,
                        wr.customer_email as customer_email,
                        wr.customer_phone as customer_phone
                    FROM warranty_registrations wr
                    LEFT JOIN profiles p INNER JOIN user_roles ur ON p.id = ur.user_id AND ur.role = 'customer' ON wr.customer_email = p.email
                    WHERE ((? = TRUE AND wr.customer_phone = ?) OR (? = FALSE AND wr.customer_email = ?)) AND ur.id IS NULL
                    LIMIT 1
                ) combined
                LIMIT 1
            `, [isPhoneLookup, identifier, isPhoneLookup, identifier, isPhoneLookup, identifier, isPhoneLookup, identifier]);

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
                    COALESCE(vd_m.store_name, vd_i.store_name, vd_owner.store_name) as vendor_store_name,
                    COALESCE(vd_m.store_email, vd_i.store_email, vd_owner.store_email) as vendor_store_email,
                    vp.phone_number as vendor_phone_number,
                    COALESCE(vd_m.latitude, vd_i.latitude, vd_owner.latitude) as store_lat,
                    COALESCE(vd_m.longitude, vd_i.longitude, vd_owner.longitude) as store_lng
                FROM warranty_registrations wr
                LEFT JOIN profiles p ON wr.user_id = p.id
                LEFT JOIN manpower m ON wr.manpower_id = m.id
                LEFT JOIN vendor_details vd_m ON (wr.manpower_id IS NOT NULL AND wr.manpower_id NOT LIKE 'owner-%' AND m.vendor_id = vd_m.id)
                LEFT JOIN vendor_details vd_i ON (
                    (wr.installer_name = vd_i.store_name OR wr.installer_name = CONCAT(vd_i.store_name, ' - ', vd_i.city)) 
                    AND wr.installer_contact = vd_i.store_email
                )
                LEFT JOIN vendor_details vd_owner ON (
                    wr.manpower_id LIKE 'owner-%' AND
                    vd_owner.id = REPLACE(wr.manpower_id, 'owner-', '')
                )
                LEFT JOIN profiles vp ON COALESCE(vd_m.user_id, vd_i.user_id, vd_owner.user_id) = vp.id
                WHERE (? = TRUE AND wr.customer_phone = ?) OR (? = FALSE AND wr.customer_email = ?)
                ORDER BY wr.created_at DESC
            `, [isPhoneLookup, identifier, isPhoneLookup, identifier]);

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

    static async getCustomerMobileLimit(req: Request, res: Response) {
        try {
            const { phone } = req.params;
            const mobileNumber = normalizeCustomerMobile(phone);

            if (!/^[6-9]\d{9}$/.test(mobileNumber)) {
                return res.status(400).json({ error: 'Please enter a valid 10-digit Indian mobile number.' });
            }

            const usage = await getMobileRegistrationUsage(mobileNumber);
            res.json({
                success: true,
                limit: usage
            });
        } catch (error: any) {
            console.error('Get customer mobile limit error:', error);
            res.status(500).json({ error: 'Failed to fetch mobile limit' });
        }
    }

    static async updateCustomerMobileLimit(req: Request, res: Response) {
        try {
            const { phone } = req.params;
            const { allowedRegistrations, reason } = req.body;
            const mobileNumber = normalizeCustomerMobile(phone);
            const allowedCount = Number(allowedRegistrations);

            if (!/^[6-9]\d{9}$/.test(mobileNumber)) {
                return res.status(400).json({ error: 'Please enter a valid 10-digit Indian mobile number.' });
            }

            if (!Number.isInteger(allowedCount) || allowedCount < 1 || allowedCount > 50) {
                return res.status(400).json({ error: 'Allowed registrations must be a whole number between 1 and 50.' });
            }

            const admin = (req as any).user;
            await db.execute(
                `INSERT INTO customer_mobile_limits
                 (mobile_number, allowed_registrations, reason, created_by, updated_by)
                 VALUES (?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE
                    allowed_registrations = VALUES(allowed_registrations),
                    reason = VALUES(reason),
                    updated_by = VALUES(updated_by),
                    updated_at = CURRENT_TIMESTAMP`,
                [
                    mobileNumber,
                    allowedCount,
                    reason || null,
                    admin?.email || admin?.id || null,
                    admin?.email || admin?.id || null
                ]
            );

            const usage = await getMobileRegistrationUsage(mobileNumber);

            await ActivityLogService.log({
                adminId: admin.id,
                adminName: admin.name,
                adminEmail: admin.email,
                actionType: 'CUSTOMER_MOBILE_LIMIT_UPDATED',
                targetType: 'CUSTOMER',
                targetId: mobileNumber,
                targetName: mobileNumber,
                details: { allowed_registrations: allowedCount, used_registrations: usage.usedCount, reason },
                ipAddress: req.ip || req.socket?.remoteAddress
            });

            res.json({
                success: true,
                message: 'Mobile submission limit updated successfully',
                limit: usage
            });
        } catch (error: any) {
            console.error('Update customer mobile limit error:', error);
            res.status(500).json({ error: 'Failed to update mobile limit' });
        }
    }

    static async deleteCustomer(req: Request, res: Response) {
        try {
            // The route param is historically named "email" but customers without
            // an email (e.g. fallback-UID submissions) are looked up by phone instead.
            const identifier = req.params.email;
            const isPhoneLookup = /^\d{10,15}$/.test(identifier);

            // Check if customer exists in profiles
            const [customer]: any = await db.execute(
                `SELECT p.id, p.email FROM profiles p
                 JOIN user_roles ur ON p.id = ur.user_id
                 WHERE ((? = TRUE AND p.phone_number = ?) OR (? = FALSE AND p.email = ?)) AND ur.role = 'customer'
                 LIMIT 1`,
                [isPhoneLookup, identifier, isPhoneLookup, identifier]
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
                targetId: identifier,
                targetName: identifier,
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

            // Normalize permissions â€” default all to false if not provided
            const defaultPermissions = {
                overview: { read: false, write: false },
                warranties: { read: false, write: false },
                warranty_products: { read: false, write: false },
                uid_management: { read: false, write: false },
                warranty_form: { read: false, write: false },
                vendors: { read: false, write: false },
                customers: { read: false, write: false },
                products: { read: false, write: false },
                announcements: { read: false, write: false },
                grievances: { read: false, write: false },
                posm: { read: false, write: false },
                ecatalogue: { read: false, write: false },
                terms: { read: false, write: false },
                old_warranties: { read: false, write: false },
                activity_logs: { read: false, write: false },
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
                console.log(`âœ“ Admin invitation email sent to: ${email}`);
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

            // Delete â€” CASCADE handles admin_permissions row
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

    // â”€â”€ Resubmissions Staging Handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    static async getResubmissions(req: Request, res: Response) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 50;
            const offset = (page - 1) * limit;

            const [countResult]: any = await db.execute('SELECT COUNT(*) as total FROM warranty_resubmissions WHERE status = "pending_review"');
            const totalCount = countResult[0].total;
            const totalPages = Math.ceil(totalCount / limit);

            const [resubmissions]: any = await db.query(`
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
                    status = 'validated', seat_cover_photo_url = ?, car_outer_photo_url = ?,
                    validated_at = NOW()
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

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    //  GET ALL DISTRIBUTORS
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    static async getAllDistributors(_req: Request, res: Response) {
        try {
            // Franchise counts and order aggregates computed once via GROUP BY,
            // then joined in, instead of 5 correlated subqueries evaluated per distributor row.
            const query = `
                SELECT d.*,
                       COALESCE(fc.franchise_count, 0) as franchise_count,
                       COALESCE(oa.order_pending_count, 0) as order_pending_count,
                       COALESCE(oa.order_confirmed_count, 0) as order_confirmed_count,
                       COALESCE(oa.order_declined_count, 0) as order_declined_count,
                       COALESCE(oa.order_total_count, 0) as order_total_count
                FROM distributors d
                JOIN vendor_details vd ON vd.user_id = d.profile_id
                LEFT JOIN (
                    SELECT distributor_id, COUNT(*) as franchise_count
                    FROM vendor_details
                    WHERE is_franchise = TRUE
                    GROUP BY distributor_id
                ) fc ON fc.distributor_id = d.id
                LEFT JOIN (
                    SELECT distributor_id,
                           SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as order_pending_count,
                           SUM(CASE WHEN status IN ('processing', 'shipped', 'delivered') THEN 1 ELSE 0 END) as order_confirmed_count,
                           SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as order_declined_count,
                           COUNT(*) as order_total_count
                    FROM store_orders
                    GROUP BY distributor_id
                ) oa ON oa.distributor_id = d.id
                WHERE d.profile_id IS NOT NULL
                  AND vd.is_distributor = TRUE
                ORDER BY d.name ASC
            `;
            const [distributors]: any = await db.execute(query);
            res.json({ success: true, distributors });
        } catch (error: any) {
            console.error('Get all distributors error:', error);
            res.status(500).json({ error: 'Failed to fetch distributors' });
        }
    }

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    //  CREATE DISTRIBUTOR
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    static async createDistributor(req: Request, res: Response) {
        const connection = await db.getConnection();
        try {
            const { name, email, phone_number, address, city, state, pincode, contact_name, gst_number, area_head_name, allowed_brands } = req.body;
            const brandValue = ['AF', 'AC', 'AFAC'].includes(allowed_brands) ? allowed_brands : 'AF';

            if (!name || !email || !phone_number) {
                return res.status(400).json({ error: 'Name, email, and phone number are required.' });
            }

            // Clean phone number
            let cleanedPhone = phone_number.replace(/[\s\-+]/g, '');
            if (cleanedPhone.length === 12 && cleanedPhone.startsWith('91')) {
                cleanedPhone = cleanedPhone.substring(2);
            } else if (cleanedPhone.length === 11 && cleanedPhone.startsWith('0')) {
                cleanedPhone = cleanedPhone.substring(1);
            }

            // Validate phone and email
            const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/;
            if (!INDIAN_MOBILE_REGEX.test(cleanedPhone)) {
                return res.status(400).json({ error: 'Please enter a valid 10-digit Indian mobile number.' });
            }

            const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            if (!EMAIL_REGEX.test(email)) {
                return res.status(400).json({ error: 'Please enter a valid email address.' });
            }

            await connection.beginTransaction();

            // Check if profile already exists for this email
            const [existingEmail]: any = await connection.execute(
                'SELECT id FROM profiles WHERE email = ?',
                [email]
            );
            if (existingEmail.length > 0) {
                await connection.rollback();
                return res.status(400).json({ error: 'Email is already registered.' });
            }

            // Check if profile already exists for this phone number
            const [existingPhone]: any = await connection.execute(
                'SELECT id FROM profiles WHERE phone_number = ?',
                [cleanedPhone]
            );
            if (existingPhone.length > 0) {
                await connection.rollback();
                return res.status(400).json({ error: 'Phone number is already registered.' });
            }

            const profileId = uuidv4();
            const contactPersonName = contact_name || name;

            // 1. Create Profile
            await connection.execute(
                'INSERT INTO profiles (id, name, email, phone_number) VALUES (?, ?, ?, ?)',
                [profileId, contactPersonName, email, cleanedPhone]
            );

            // 2. Create User Role (vendor)
            await connection.execute(
                'INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, ?)',
                [uuidv4(), profileId, 'vendor']
            );

            // 3. Create Vendor Verification (is_verified = true, is_active = true)
            await connection.execute(
                'INSERT INTO vendor_verification (id, user_id, is_verified, is_active, verified_at) VALUES (?, ?, ?, ?, NOW())',
                [uuidv4(), profileId, true, true]
            );

            // 4. Create Vendor Details (is_distributor = true, is_franchise = false)
            const vendorDetailsId = uuidv4();
            await connection.execute(
                `INSERT INTO vendor_details 
                 (id, user_id, store_name, store_email, address, city, state, pincode, is_distributor, is_franchise) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    vendorDetailsId,
                    profileId,
                    name,
                    email,
                    address || '',
                    city || '',
                    state || '',
                    pincode || '',
                    true,
                    false
                ]
            );

            // 5. Create Distributor record
            const distId = uuidv4();
            await connection.execute(
                `INSERT INTO distributors (id, name, email, phone_number, address, city, state, pincode, gst_number, area_head_name, profile_id, allowed_brands)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    distId,
                    name,
                    email,
                    cleanedPhone,
                    address || '',
                    city || '',
                    state || '',
                    pincode || '',
                    gst_number || null,
                    area_head_name || null,
                    profileId,
                    brandValue
                ]
            );

            await connection.commit();

            // Log activity
            const admin = (req as any).user;
            await ActivityLogService.log({
                adminId: admin.id,
                adminName: admin.name,
                adminEmail: admin.email,
                actionType: 'DISTRIBUTOR_CREATED',
                targetType: 'DISTRIBUTOR',
                targetId: distId,
                targetName: name,
                ipAddress: req.ip || req.socket?.remoteAddress
            });

            res.status(201).json({
                success: true,
                message: 'Distributor created successfully',
                distributorId: distId
            });
        } catch (error: any) {
            await connection.rollback();
            console.error('Create distributor error:', error);
            res.status(500).json({ error: 'Failed to create distributor' });
        } finally {
            connection.release();
        }
    }

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    //  GET DISTRIBUTOR FRANCHISES
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    static async getDistributorFranchises(req: Request, res: Response) {
        try {
            const { id } = req.params; // Distributor ID

            // Order aggregates computed once per vendor via GROUP BY, then joined in,
            // instead of 4 correlated subqueries evaluated per franchise row.
            const query = `
                SELECT p.id as user_id,
                       vd.id as vendor_details_id,
                       vd.store_name,
                       vd.store_email,
                       vd.city,
                       vd.state,
                       p.phone_number,
                       COALESCE(vv.is_verified, false) as is_verified,
                       COALESCE(vv.is_active, true) as is_active,
                       vv.verified_at,
                       COALESCE(oa.order_pending_count, 0) as order_pending_count,
                       COALESCE(oa.order_confirmed_count, 0) as order_confirmed_count,
                       COALESCE(oa.order_declined_count, 0) as order_declined_count,
                       COALESCE(oa.order_total_count, 0) as order_total_count,
                       COALESCE(vd.allowed_brands, 'AF') as allowed_brands
                FROM vendor_details vd
                JOIN profiles p ON vd.user_id = p.id
                LEFT JOIN vendor_verification vv ON p.id = vv.user_id
                LEFT JOIN (
                    SELECT vendor_id,
                           SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as order_pending_count,
                           SUM(CASE WHEN status IN ('processing', 'shipped', 'delivered') THEN 1 ELSE 0 END) as order_confirmed_count,
                           SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as order_declined_count,
                           COUNT(*) as order_total_count
                    FROM store_orders
                    WHERE distributor_id = ?
                    GROUP BY vendor_id
                ) oa ON oa.vendor_id = p.id
                WHERE vd.distributor_id = ? AND vd.is_franchise = TRUE
                ORDER BY vd.store_name ASC
            `;
            const [franchises]: any = await db.execute(query, [id, id]);
            res.json({ success: true, franchises });
        } catch (error: any) {
            console.error('Get distributor franchises error:', error);
            res.status(500).json({ error: 'Failed to fetch franchises' });
        }
    }

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    //  MAP FRANCHISE TO DISTRIBUTOR
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    static async getFranchiseOrders(req: Request, res: Response) {
        try {
            const { vendorId } = req.params;

            const [orders]: any = await db.execute(
                `SELECT o.*,
                        d.name as distributor_name,
                        vd.store_name as franchise_name
                 FROM store_orders o
                 LEFT JOIN distributors d ON o.distributor_id = d.id
                 LEFT JOIN vendor_details vd ON o.vendor_id = vd.user_id
                 WHERE o.vendor_id = ?
                 ORDER BY o.created_at DESC`,
                [vendorId]
            );

            for (const order of orders) {
                const [items]: any = await db.execute(
                    `SELECT id, product_name, variation_name, quantity, price, needs_customization, customization_remarks
                     FROM store_order_items
                     WHERE order_id = ?
                     ORDER BY created_at ASC`,
                    [order.id]
                );
                order.items = items;
            }

            res.json({ success: true, orders });
        } catch (error: any) {
            console.error('Get franchise orders error:', error);
            res.status(500).json({ error: 'Failed to fetch franchise orders' });
        }
    }

    static async mapFranchiseToDistributor(req: Request, res: Response) {
        try {
            const { id } = req.params; // Distributor ID
            const { vendorId } = req.body; // Vendor's User Profile ID

            if (!vendorId) {
                return res.status(400).json({ error: 'Franchise vendorId is required' });
            }

            // Verify distributor exists
            const [dists]: any = await db.execute('SELECT name FROM distributors WHERE id = ?', [id]);
            if (dists.length === 0) {
                return res.status(404).json({ error: 'Distributor not found' });
            }

            // Verify vendor is a franchise
            const [vendors]: any = await db.execute('SELECT store_name, is_franchise FROM vendor_details WHERE user_id = ?', [vendorId]);
            if (vendors.length === 0) {
                return res.status(404).json({ error: 'Franchise store not found' });
            }
            if (!vendors[0].is_franchise) {
                return res.status(400).json({ error: 'Only franchise stores can be mapped to a distributor.' });
            }

            // Guard: brand compatibility â€” franchise and distributor must share at least one brand.
            // AF franchise â†’ needs AF or AFAC distributor
            // AC franchise â†’ needs AC or AFAC distributor
            // AFAC franchise â†’ any distributor is fine
            const [brandRows]: any = await db.execute(
                `SELECT d.allowed_brands as dist_brands, vd.allowed_brands as franchise_brands
                 FROM distributors d, vendor_details vd
                 WHERE d.id = ? AND vd.user_id = ?`,
                [id, vendorId]
            );
            if (brandRows.length > 0) {
                const distBrands: string = brandRows[0].dist_brands || 'AF';
                const franchiseBrands: string = brandRows[0].franchise_brands || 'AF';
                const compatible =
                    distBrands === 'AFAC' ||
                    franchiseBrands === 'AFAC' ||
                    distBrands === franchiseBrands;
                if (!compatible) {
                    return res.status(400).json({
                        error: `Brand mismatch: this franchise is assigned to "${franchiseBrands}" products but the distributor only carries "${distBrands}" products. Update one of them to be compatible before assigning.`
                    });
                }
            }

            // Guard: the categories this distributor sells must not overlap with categories
            // already covered by another distributor assigned to this franchise â€” checking
            // both the legacy single-FK mapping and the many-to-many franchise_distributors table.
            const [overlaps]: any = await db.execute(
                `SELECT DISTINCT sc.name as category_name, d.name as distributor_name
                 FROM distributor_allowed_categories dac
                 JOIN store_categories sc ON sc.id = dac.category_id
                 JOIN distributors d ON d.id = dac.distributor_id
                 WHERE dac.distributor_id != ?
                   AND dac.category_id IN (
                       SELECT category_id FROM distributor_allowed_categories WHERE distributor_id = ?
                   )
                   AND (
                       dac.distributor_id IN (
                           SELECT distributor_id FROM franchise_distributors WHERE franchise_user_id = ?
                       )
                       OR dac.distributor_id = (
                           SELECT distributor_id FROM vendor_details WHERE user_id = ?
                       )
                   )`,
                [id, id, vendorId, vendorId]
            );

            if (overlaps.length > 0) {
                const conflictList = overlaps.map((o: any) => `${o.category_name} (already via ${o.distributor_name})`).join(', ');
                return res.status(400).json({
                    error: `Cannot assign: category overlap with an existing distributor for this franchise â€” ${conflictList}`
                });
            }

            // Update mapping
            await db.execute(
                'UPDATE vendor_details SET distributor_id = ? WHERE user_id = ?',
                [id, vendorId]
            );

            // Log activity
            const admin = (req as any).user;
            const [vendor]: any = await db.execute('SELECT store_name FROM vendor_details WHERE user_id = ?', [vendorId]);

            await ActivityLogService.log({
                adminId: admin.id,
                adminName: admin.name,
                adminEmail: admin.email,
                actionType: 'FRANCHISE_MAPPED_DISTRIBUTOR',
                targetType: 'VENDOR',
                targetId: vendorId,
                targetName: vendor[0]?.store_name,
                details: { distributor_id: id, distributor_name: dists[0].name },
                ipAddress: req.ip || req.socket?.remoteAddress
            });

            res.json({
                success: true,
                message: `Successfully assigned ${vendor[0]?.store_name || 'franchise'} to ${dists[0].name}`
            });
        } catch (error: any) {
            console.error('Map franchise to distributor error:', error);
            res.status(500).json({ error: 'Failed to map franchise' });
        }
    }

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    //  UNMAP FRANCHISE FROM DISTRIBUTOR
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    static async unmapFranchiseFromDistributor(req: Request, res: Response) {
        try {
            const { id, vendorId } = req.params; // Distributor ID and Vendor ID

            // Verify distributor exists
            const [dists]: any = await db.execute('SELECT name FROM distributors WHERE id = ?', [id]);
            if (dists.length === 0) {
                return res.status(404).json({ error: 'Distributor not found' });
            }

            // Update mapping to NULL
            await db.execute(
                'UPDATE vendor_details SET distributor_id = NULL WHERE user_id = ? AND distributor_id = ?',
                [vendorId, id]
            );

            // Log activity
            const admin = (req as any).user;
            const [vendor]: any = await db.execute('SELECT store_name FROM vendor_details WHERE user_id = ?', [vendorId]);

            await ActivityLogService.log({
                adminId: admin.id,
                adminName: admin.name,
                adminEmail: admin.email,
                actionType: 'FRANCHISE_UNMAPPED_DISTRIBUTOR',
                targetType: 'VENDOR',
                targetId: vendorId,
                targetName: vendor[0]?.store_name,
                details: { distributor_id: id, distributor_name: dists[0].name },
                ipAddress: req.ip || req.socket?.remoteAddress
            });

            res.json({
                success: true,
                message: `Successfully unassigned ${vendor[0]?.store_name || 'franchise'} from ${dists[0].name}`
            });
        } catch (error: any) {
            console.error('Unmap franchise from distributor error:', error);
            res.status(500).json({ error: 'Failed to unmap franchise' });
        }
    }

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    //  GET ELIGIBLE FRANCHISES
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    static async getEligibleFranchises(_req: Request, res: Response) {
        try {
            const query = `
                SELECT p.id as user_id, 
                       vd.id as vendor_details_id, 
                       vd.store_name, 
                       vd.city, 
                       vd.state,
                       vd.distributor_id,
                       d.name as distributor_name
                FROM vendor_details vd
                JOIN profiles p ON vd.user_id = p.id
                JOIN vendor_verification vv ON p.id = vv.user_id
                LEFT JOIN distributors d ON vd.distributor_id = d.id
                WHERE vv.is_verified = TRUE AND vd.is_franchise = TRUE
                ORDER BY vd.store_name ASC
            `;
            const [franchises]: any = await db.execute(query);
            res.json({ success: true, franchises });
        } catch (error: any) {
            console.error('Get eligible franchises error:', error);
            res.status(500).json({ error: 'Failed to fetch eligible franchises' });
        }
    }

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    //  GET DISTRIBUTOR ALLOWED CATEGORIES
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    static async getDistributorAllowedCategories(req: Request, res: Response) {
        try {
            const { id } = req.params; // Distributor ID

            const [categories]: any = await db.execute(
                `SELECT dac.category_id, sc.name as category_name
                 FROM distributor_allowed_categories dac
                 JOIN store_categories sc ON dac.category_id = sc.id
                 WHERE dac.distributor_id = ?
                 ORDER BY sc.name ASC`,
                [id]
            );
            res.json({ success: true, categories });
        } catch (error: any) {
            console.error('Get distributor allowed categories error:', error);
            res.status(500).json({ error: 'Failed to fetch allowed categories' });
        }
    }

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    //  SET DISTRIBUTOR ALLOWED CATEGORIES (replaces full set)
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    static async setDistributorAllowedCategories(req: Request, res: Response) {
        const connection = await db.getConnection();
        try {
            const { id } = req.params; // Distributor ID
            const { categoryIds } = req.body; // string[]

            if (!Array.isArray(categoryIds)) {
                return res.status(400).json({ error: 'categoryIds must be an array' });
            }

            const [dists]: any = await connection.execute('SELECT name FROM distributors WHERE id = ?', [id]);
            if (dists.length === 0) {
                return res.status(404).json({ error: 'Distributor not found' });
            }

            await connection.beginTransaction();

            await connection.execute('DELETE FROM distributor_allowed_categories WHERE distributor_id = ?', [id]);

            for (const categoryId of categoryIds) {
                await connection.execute(
                    `INSERT INTO distributor_allowed_categories (id, distributor_id, category_id) VALUES (?, ?, ?)`,
                    [uuidv4(), id, categoryId]
                );
            }

            await connection.commit();

            const admin = (req as any).user;
            await ActivityLogService.log({
                adminId: admin.id,
                adminName: admin.name,
                adminEmail: admin.email,
                actionType: 'DISTRIBUTOR_CATEGORIES_UPDATED',
                targetType: 'DISTRIBUTOR',
                targetId: id,
                targetName: dists[0].name,
                details: { category_count: categoryIds.length },
                ipAddress: req.ip || req.socket?.remoteAddress
            });

            res.json({ success: true, message: `Updated allowed categories for ${dists[0].name}` });
        } catch (error: any) {
            await connection.rollback();
            console.error('Set distributor allowed categories error:', error);
            res.status(500).json({ error: 'Failed to update allowed categories' });
        } finally {
            connection.release();
        }
    }

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    //  GET FRANCHISE'S ASSIGNED DISTRIBUTORS (many-to-many)
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    static async getFranchiseDistributors(req: Request, res: Response) {
        try {
            const { vendorId } = req.params; // Franchise user_id

            const [distributors]: any = await db.execute(
                `SELECT d.id, d.name, d.city, d.state,
                        GROUP_CONCAT(sc.name ORDER BY sc.name SEPARATOR ', ') as allowed_category_names
                 FROM franchise_distributors fd
                 JOIN distributors d ON fd.distributor_id = d.id
                 LEFT JOIN distributor_allowed_categories dac ON dac.distributor_id = d.id
                 LEFT JOIN store_categories sc ON sc.id = dac.category_id
                 WHERE fd.franchise_user_id = ?
                 GROUP BY d.id, d.name, d.city, d.state
                 ORDER BY d.name ASC`,
                [vendorId]
            );
            res.json({ success: true, distributors });
        } catch (error: any) {
            console.error('Get franchise distributors error:', error);
            res.status(500).json({ error: 'Failed to fetch franchise distributors' });
        }
    }

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    //  ASSIGN DISTRIBUTOR TO FRANCHISE (many-to-many, with category-overlap guard)
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    static async assignDistributorToFranchise(req: Request, res: Response) {
        try {
            const { id } = req.params; // Distributor ID
            const { vendorId } = req.body; // Franchise user_id

            if (!vendorId) {
                return res.status(400).json({ error: 'Franchise vendorId is required' });
            }

            const [dists]: any = await db.execute('SELECT name FROM distributors WHERE id = ?', [id]);
            if (dists.length === 0) {
                return res.status(404).json({ error: 'Distributor not found' });
            }

            const [vendors]: any = await db.execute('SELECT store_name, is_franchise FROM vendor_details WHERE user_id = ?', [vendorId]);
            if (vendors.length === 0) {
                return res.status(404).json({ error: 'Franchise store not found' });
            }
            if (!vendors[0].is_franchise) {
                return res.status(400).json({ error: 'Only franchise stores can be assigned to a distributor.' });
            }

            // Guard: the categories this distributor sells must not overlap with categories
            // already covered by another distributor assigned to this franchise â€” checking
            // both the many-to-many franchise_distributors table and the legacy single-FK mapping.
            const [overlaps]: any = await db.execute(
                `SELECT DISTINCT sc.name as category_name, d.name as distributor_name
                 FROM distributor_allowed_categories dac
                 JOIN store_categories sc ON sc.id = dac.category_id
                 JOIN distributors d ON d.id = dac.distributor_id
                 WHERE dac.distributor_id != ?
                   AND dac.category_id IN (
                       SELECT category_id FROM distributor_allowed_categories WHERE distributor_id = ?
                   )
                   AND (
                       dac.distributor_id IN (
                           SELECT distributor_id FROM franchise_distributors WHERE franchise_user_id = ?
                       )
                       OR dac.distributor_id = (
                           SELECT distributor_id FROM vendor_details WHERE user_id = ?
                       )
                   )`,
                [id, id, vendorId, vendorId]
            );

            if (overlaps.length > 0) {
                const conflictList = overlaps.map((o: any) => `${o.category_name} (already via ${o.distributor_name})`).join(', ');
                return res.status(400).json({
                    error: `Cannot assign: category overlap with an existing distributor for this franchise â€” ${conflictList}`
                });
            }

            await db.execute(
                `INSERT INTO franchise_distributors (id, franchise_user_id, distributor_id)
                 VALUES (?, ?, ?)
                 ON DUPLICATE KEY UPDATE id = id`,
                [uuidv4(), vendorId, id]
            );

            const admin = (req as any).user;
            await ActivityLogService.log({
                adminId: admin.id,
                adminName: admin.name,
                adminEmail: admin.email,
                actionType: 'FRANCHISE_ASSIGNED_DISTRIBUTOR',
                targetType: 'VENDOR',
                targetId: vendorId,
                targetName: vendors[0].store_name,
                details: { distributor_id: id, distributor_name: dists[0].name },
                ipAddress: req.ip || req.socket?.remoteAddress
            });

            res.json({
                success: true,
                message: `Successfully assigned ${vendors[0].store_name} to ${dists[0].name}`
            });
        } catch (error: any) {
            console.error('Assign distributor to franchise error:', error);
            res.status(500).json({ error: 'Failed to assign distributor' });
        }
    }

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    //  UNASSIGN DISTRIBUTOR FROM FRANCHISE (many-to-many)
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    static async unassignDistributorFromFranchise(req: Request, res: Response) {
        try {
            const { id, vendorId } = req.params; // Distributor ID, Franchise user_id

            const [dists]: any = await db.execute('SELECT name FROM distributors WHERE id = ?', [id]);
            if (dists.length === 0) {
                return res.status(404).json({ error: 'Distributor not found' });
            }

            await db.execute(
                'DELETE FROM franchise_distributors WHERE franchise_user_id = ? AND distributor_id = ?',
                [vendorId, id]
            );

            const admin = (req as any).user;
            const [vendor]: any = await db.execute('SELECT store_name FROM vendor_details WHERE user_id = ?', [vendorId]);

            await ActivityLogService.log({
                adminId: admin.id,
                adminName: admin.name,
                adminEmail: admin.email,
                actionType: 'FRANCHISE_UNASSIGNED_DISTRIBUTOR',
                targetType: 'VENDOR',
                targetId: vendorId,
                targetName: vendor[0]?.store_name,
                details: { distributor_id: id, distributor_name: dists[0].name },
                ipAddress: req.ip || req.socket?.remoteAddress
            });

            res.json({
                success: true,
                message: `Successfully unassigned ${vendor[0]?.store_name || 'franchise'} from ${dists[0].name}`
            });
        } catch (error: any) {
            console.error('Unassign distributor from franchise error:', error);
            res.status(500).json({ error: 'Failed to unassign distributor' });
        }
    }
}

