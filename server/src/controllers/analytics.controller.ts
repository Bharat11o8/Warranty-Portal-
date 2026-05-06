import { Request, Response } from 'express';
import db from '../config/database.js';

export class AnalyticsController {
    /**
     * Get high-level summary statistics
     */
    static async getSummaryStats(_req: Request, res: Response) {
        try {
            // 1. Detailed Franchise breakdown
            const [franchiseDetails]: any = await db.execute(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN is_verified = true THEN 1 ELSE 0 END) as approved,
                    SUM(CASE WHEN is_verified = false AND (rejection_reason IS NULL OR rejection_reason = '') THEN 1 ELSE 0 END) as pending,
                    SUM(CASE WHEN is_verified = false AND rejection_reason IS NOT NULL AND rejection_reason != '' THEN 1 ELSE 0 END) as disapproved
                FROM vendor_verification
            `);

            // 2. Module participation counts
            // warranty_participation = unique franchises (vendor_details) that have at least one warranty,
            // either submitted directly by the vendor user, or via their manpower staff.
            const [participation]: any = await db.execute(`
                SELECT 
                    (
                        SELECT COUNT(DISTINCT vd.id)
                        FROM vendor_details vd
                        WHERE EXISTS (
                            -- Direct vendor submission (vendor's user_id matches warranty user_id)
                            SELECT 1 FROM warranty_registrations wr WHERE wr.user_id = vd.user_id
                        ) OR EXISTS (
                            -- Via manpower: manpower belongs to this vendor and is linked to a warranty
                            SELECT 1 FROM manpower m
                            JOIN warranty_registrations wr ON wr.manpower_id = m.id
                            WHERE m.vendor_id = vd.id
                        )
                    ) as warranty_participation,
                    (SELECT COUNT(DISTINCT customer_id) FROM grievances WHERE source_type = 'franchise') as grievance_participation,
                    (SELECT COUNT(DISTINCT franchise_id) FROM posm_requests) as posm_participation
            `);

            // 3. Warranty states breakdown
            const [warrantyStates]: any = await db.execute(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'validated' THEN 1 ELSE 0 END) as validated,
                    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_admin,
                    SUM(CASE WHEN status = 'pending_vendor' THEN 1 ELSE 0 END) as pending_vendor,
                    SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
                FROM warranty_registrations
            `);

            // 4. Overall Totals for other modules
            const [otherTotals]: any = await db.execute(`
                SELECT 
                    (SELECT COUNT(*) FROM grievances) as total_grievances,
                    (SELECT COUNT(*) FROM posm_requests) as total_posm
            `);

            return res.json({
                success: true,
                data: {
                    franchise: franchiseDetails[0],
                    participation: participation[0],
                    warranty: warrantyStates[0],
                    other: otherTotals[0]
                }
            });
        } catch (error: any) {
            console.error('Analytics summary error:', error);
            return res.status(500).json({ success: false, error: 'Failed to fetch analytics summary' });
        }
    }

    /**
     * Get time-series data for charts (Monthly)
     */
    static async getTimeSeriesData(req: Request, res: Response) {
        try {
            const months = parseInt(req.query.months as string) || 12;

            const [monthlyWarranties]: any = await db.execute(`
                SELECT 
                    DATE_FORMAT(created_at, '%Y-%m') as month,
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'validated' THEN 1 ELSE 0 END) as approved
                FROM warranty_registrations 
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? MONTH)
                GROUP BY month
                ORDER BY month ASC
            `, [months]);

            const [monthlyGrievances]: any = await db.execute(`
                SELECT 
                    DATE_FORMAT(created_at, '%Y-%m') as month,
                    COUNT(*) as total
                FROM grievances 
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? MONTH)
                GROUP BY month
                ORDER BY month ASC
            `, [months]);

            return res.json({
                success: true,
                data: {
                    warranties: monthlyWarranties,
                    grievances: monthlyGrievances
                }
            });
        } catch (error: any) {
            console.error('Analytics time-series error:', error);
            return res.status(500).json({ success: false, error: 'Failed to fetch time-series data' });
        }
    }

    /**
     * Get product and variation distribution
     */
    static async getProductDistribution(_req: Request, res: Response) {
        try {
            // Extract product names from JSON details
            // Handling the case where product_details might be a string (double encoded) or object
            const [products]: any = await db.execute(`
                SELECT 
                    product_type,
                    JSON_UNQUOTE(JSON_EXTRACT(
                        CASE 
                            WHEN JSON_VALID(product_details) THEN product_details 
                            ELSE JSON_OBJECT('productName', 'Other') 
                        END, 
                        '$.productName'
                    )) as product_name,
                    COUNT(*) as count
                FROM warranty_registrations
                GROUP BY product_type, product_name
                ORDER BY count DESC
            `);

            return res.json({
                success: true,
                data: products
            });
        } catch (error: any) {
            console.error('Analytics product distribution error:', error);
            return res.status(500).json({ success: false, error: 'Failed to fetch product distribution' });
        }
    }

    /**
     * Get detailed franchise participation stats
     */
    static async getFranchiseStats(_req: Request, res: Response) {
        try {
            const [franchises]: any = await db.execute(`
                SELECT 
                    v.id,
                    v.store_name,
                    v.city,
                    v.state,
                    (SELECT COUNT(*) FROM warranty_registrations w WHERE w.user_id = v.user_id) as warranty_count,
                    (SELECT COUNT(*) FROM grievances g WHERE g.customer_id = v.user_id AND g.source_type = 'franchise') as grievance_count,
                    (SELECT COUNT(*) FROM posm_requests p WHERE p.franchise_id = v.id) as posm_count
                FROM vendor_details v
                JOIN vendor_verification vv ON v.user_id = vv.user_id
                WHERE vv.is_verified = true
                ORDER BY warranty_count DESC
                LIMIT 50
            `);

            return res.json({
                success: true,
                data: franchises
            });
        } catch (error: any) {
            console.error('Analytics franchise stats error:', error);
            return res.status(500).json({ success: false, error: 'Failed to fetch franchise stats' });
        }
    }
}
