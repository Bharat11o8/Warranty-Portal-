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

    /**
     * Get fraud detection and trust score analytics
     */
    static async getFraudAnalytics(_req: Request, res: Response) {
        try {
            // 1. Trust Score Distribution
            const [distribution]: any = await db.execute(`
                SELECT 
                    SUM(CASE WHEN fraud_score >= 80 THEN 1 ELSE 0 END) as high_trust,
                    SUM(CASE WHEN fraud_score >= 40 AND fraud_score < 80 THEN 1 ELSE 0 END) as medium_trust,
                    SUM(CASE WHEN fraud_score < 40 THEN 1 ELSE 0 END) as low_trust,
                    COUNT(*) as total
                FROM warranty_registrations
                WHERE fraud_score IS NOT NULL
            `);

            // 2. Common Fraud Flags (Parsing JSON flags)
            const [allFlags]: any = await db.execute(`
                SELECT fraud_flags FROM warranty_registrations 
                WHERE fraud_flags IS NOT NULL AND fraud_flags != '' AND fraud_flags != '{}'
            `);

            const flagCounts: Record<string, number> = {
                distance_penalty: 0,
                time_penalty: 0,
                ip_penalty: 0,
                consistency_penalty: 0,
                multi_device: 0,
                location_mismatch: 0
            };

            allFlags.forEach((row: any) => {
                try {
                    const flags = typeof row.fraud_flags === 'string' ? JSON.parse(row.fraud_flags) : row.fraud_flags;
                    if (flags.distance_penalty > 0) flagCounts.distance_penalty++;
                    if (flags.time_penalty > 0) flagCounts.time_penalty++;
                    if (flags.ip_penalty > 0) flagCounts.ip_penalty++;
                    if (flags.consistency_penalty > 0) flagCounts.consistency_penalty++;
                    if (flags.multi_device_detected) flagCounts.multi_device++;
                    if (flags.location_mismatch) flagCounts.location_mismatch++;
                } catch (e) {}
            });

            const formattedFlags = Object.entries(flagCounts)
                .map(([name, count]) => ({ name: name.replace(/_/g, ' '), count }))
                .sort((a, b) => b.count - a.count);

            return res.json({
                success: true,
                data: {
                    distribution: distribution[0],
                    flags: formattedFlags,
                    impact: {
                        estimated_savings: (distribution[0]?.low_trust || 0) * 2500,
                        prevented_claims: distribution[0]?.low_trust || 0
                    }
                }
            });
        } catch (error: any) {
            console.error('Fraud analytics error:', error);
            return res.status(500).json({ success: false, error: 'Failed to fetch fraud analytics' });
        }
    }
}
