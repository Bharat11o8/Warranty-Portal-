import { Request, Response } from 'express';
import db, { getISTDate } from '../config/database.js';

export class AnalyticsController {
    /**
     * Get high-level summary statistics
     */
    static async getSummaryStats(req: Request, res: Response) {
        try {
            const period = (req.query.period as string) || 'all';
            const year = req.query.year as string || new Date().getFullYear().toString();
            const month = req.query.month as string;
            const startDate = req.query.startDate as string;
            const endDate = req.query.endDate as string;

            let whereClause = '1=1';
            const params: any[] = [];

            if (period === 'year') {
                whereClause = 'YEAR(created_at) = ?';
                params.push(year);
            } else if (period === 'month') {
                whereClause = 'YEAR(created_at) = ? AND MONTH(created_at) = ?';
                params.push(year, month || (new Date().getMonth() + 1).toString());
            } else if (period === 'week') {
                whereClause = 'DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)';
            } else if (period === 'custom' && startDate && endDate) {
                whereClause = 'DATE(created_at) >= ? AND DATE(created_at) <= ?';
                params.push(startDate, endDate);
            }

            // Use Promise.all to run independent queries in parallel
            const [
                [franchiseDetails],
                [participation],
                [warrantyStates],
                [periodActions],
                [grievanceStats],
                [posmStats]
            ]: any = await Promise.all([
                // 1. Detailed Franchise breakdown (Lifetime/Overall)
                db.execute(`
                    SELECT 
                        COUNT(*) as total,
                        SUM(CASE WHEN is_verified = true THEN 1 ELSE 0 END) as approved,
                        SUM(CASE WHEN is_verified = false AND (rejection_reason IS NULL OR rejection_reason = '') THEN 1 ELSE 0 END) as pending,
                        SUM(CASE WHEN is_verified = false AND rejection_reason IS NOT NULL AND rejection_reason != '' THEN 1 ELSE 0 END) as disapproved
                    FROM vendor_verification
                `),
                // 2. Module participation counts
                db.execute(`
                    SELECT 
                        (
                            SELECT COUNT(DISTINCT vd.id)
                            FROM vendor_details vd
                            WHERE EXISTS (
                                SELECT 1 FROM warranty_registrations wr WHERE wr.user_id = vd.user_id
                            ) OR EXISTS (
                                SELECT 1 FROM manpower m
                                JOIN warranty_registrations wr ON wr.manpower_id = m.id
                                WHERE m.vendor_id = vd.id
                            )
                        ) as warranty_participation,
                        (SELECT COUNT(DISTINCT customer_id) FROM grievances WHERE source_type = 'franchise') as grievance_participation,
                        (SELECT COUNT(DISTINCT franchise_id) FROM posm_requests) as posm_participation
                `),
                // 3. Warranty states breakdown (Overall Lifetime)
                db.execute(`
                    SELECT 
                        COUNT(*) as total,
                        SUM(CASE WHEN status = 'validated' THEN 1 ELSE 0 END) as validated,
                        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_admin,
                        SUM(CASE WHEN status = 'pending_vendor' THEN 1 ELSE 0 END) as pending_vendor,
                        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
                    FROM warranty_registrations
                `),
                // 4. Period Specific Actions (Dynamic Progress view)
                db.execute(`
                    SELECT 
                        (SELECT COUNT(*) FROM warranty_registrations WHERE ${whereClause}) as registrations,
                        (SELECT COUNT(*) FROM warranty_registrations WHERE ${whereClause.replace(/created_at/g, 'validated_at')}) as approvals,
                        (SELECT COUNT(*) FROM warranty_registrations WHERE ${whereClause.replace(/created_at/g, 'rejected_at')}) as rejections,
                        (SELECT COUNT(*) FROM warranty_registrations WHERE ${whereClause.replace(/created_at/g, 'vendor_approved_at')}) as vendor_approvals
                `, [...params, ...params, ...params, ...params]),
                // 5. Overall Totals for other modules
                db.execute(`
                    SELECT 
                        COUNT(*) as total,
                        SUM(CASE WHEN status = 'submitted' THEN 1 ELSE 0 END) as submitted,
                        SUM(CASE WHEN status = 'assigned' OR status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
                        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved,
                        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
                    FROM grievances
                `),
                db.execute(`
                    SELECT 
                        COUNT(*) as total,
                        SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open,
                        SUM(CASE WHEN status = 'under_review' OR status = 'approved' OR status = 'in_production' THEN 1 ELSE 0 END) as processing,
                        SUM(CASE WHEN status = 'dispatched' OR status = 'delivered' THEN 1 ELSE 0 END) as shipped,
                        SUM(CASE WHEN status = 'closed' OR status = 'rejected' THEN 1 ELSE 0 END) as closed
                    FROM posm_requests
                `)
            ]);

            return res.json({
                success: true,
                data: {
                    franchise: franchiseDetails[0],
                    participation: participation[0],
                    warranty: warrantyStates[0],
                    today: periodActions[0], // Keep key "today" for frontend compatibility, but it's now "period"
                    grievance: grievanceStats[0],
                    posm: posmStats[0]
                }
            });
        } catch (error: any) {
            console.error('Analytics summary error:', error);
            return res.status(500).json({ success: false, error: 'Failed to fetch analytics summary' });
        }
    }

    /**
     * Get time-series data for charts (Custom Period & Hierarchical Filtering)
     */
    static async getTimeSeriesData(req: Request, res: Response) {
        try {
            const period = (req.query.period as string) || 'year';
            const year = req.query.year as string || new Date().getFullYear().toString();
            const month = req.query.month as string; // 1-12
            const startDate = req.query.startDate as string;
            const endDate = req.query.endDate as string;

            let dateFormat = '%Y-%m';
            let whereClause = '1=1';
            const params: any[] = [];

            if (period === 'all') {
                // All time — group by year
                dateFormat = '%Y';
            } else if (period === 'year') {
                // Specific year — group by date but label with day + month
                dateFormat = '%e %b';
                whereClause = 'YEAR(created_at) = ?';
                params.push(year);
            } else if (period === 'month') {
                // Specific month — group by date but label with day + month
                dateFormat = '%e %b';
                whereClause = 'YEAR(created_at) = ? AND MONTH(created_at) = ?';
                params.push(year, month || (new Date().getMonth() + 1).toString());
            } else if (period === 'week') {
                // Last 7 days (including today) — group by day name + date
                dateFormat = '%a %e';
                whereClause = 'DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)';
            } else if (period === 'custom' && startDate && endDate) {
                // Custom range — auto-detect grain
                const start = new Date(startDate);
                const end = new Date(endDate);
                const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                
                if (diffDays <= 90) {
                    dateFormat = '%Y-%m-%d'; // Daily grain for short ranges
                } else {
                    dateFormat = '%Y-%m'; // Monthly grain for long ranges
                }
                whereClause = 'DATE(created_at) >= ? AND DATE(created_at) <= ?';
                params.push(startDate, endDate);
            }

            // We need a clever query to show registrations by creation date 
            // BUT show approvals/rejections by their actual action date on the same timeline.
            // This ensures Admin "Daily Work" is visible on the chart for the day they did it.
            const [results]: any = await db.execute(`
                SELECT 
                    DATE_FORMAT(ae.created_at, ?) as label,
                    MIN(ae.created_at) as sort_date,
                    SUM(CASE WHEN ae.action_type = 'registered' THEN 1 ELSE 0 END) as total,
                    SUM(CASE WHEN ae.action_type = 'validated' THEN 1 ELSE 0 END) as approved,
                    SUM(CASE WHEN ae.action_type = 'vendor_approved' THEN 1 ELSE 0 END) as pending_admin,
                    SUM(CASE WHEN ae.action_type = 'registered' AND (wr.status = 'pending_vendor' OR wr.vendor_approved_at IS NOT NULL) THEN 1 ELSE 0 END) as pending_vendor,
                    SUM(CASE WHEN ae.action_type = 'rejected' THEN 1 ELSE 0 END) as rejected
                FROM analytics_events ae
                LEFT JOIN warranty_registrations wr ON ae.warranty_id = wr.id
                WHERE ${whereClause.replace(/created_at/g, 'ae.created_at')}
                GROUP BY label, DATE(ae.created_at)
                ORDER BY MIN(ae.created_at) ASC
            `, [dateFormat, ...params]);

            return res.json({
                success: true,
                data: {
                    warranties: results
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
    static async getProductDistribution(req: Request, res: Response) {
        try {
            const period = (req.query.period as string) || 'month';
            const year = req.query.year as string;
            const month = req.query.month as string;
            const startDate = req.query.startDate as string;
            const endDate = req.query.endDate as string;

            let whereClause = '1=1';
            const params: any[] = [];

            if (period === 'all') {
                // No date filter — show everything
            } else if (period === 'year') {
                whereClause = 'YEAR(created_at) = ?';
                params.push(year || new Date().getFullYear().toString());
            } else if (period === 'month') {
                whereClause = 'YEAR(created_at) = ? AND MONTH(created_at) = ?';
                params.push(year || new Date().getFullYear().toString(), month || (new Date().getMonth() + 1).toString());
            } else if (period === 'week') {
                whereClause = 'DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)';
            } else if (period === 'custom' && startDate && endDate) {
                whereClause = 'DATE(created_at) >= ? AND DATE(created_at) <= ?';
                params.push(startDate, endDate);
            }

            // Use Action Date for validated items, Registration Date for others
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
                WHERE (
                    -- Items approved in this period
                    (status = 'validated' AND ${whereClause.replace(/created_at/g, 'validated_at')})
                    OR
                    -- OR Items registered in this period (that aren't approved yet)
                    (status != 'validated' AND ${whereClause})
                )
                GROUP BY product_type, product_name
                ORDER BY count DESC
            `, [...params, ...params]);

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
     * Get detailed franchise participation stats (with Date Filtering)
     */
    static async getFranchiseStats(req: Request, res: Response) {
        try {
            const period = (req.query.period as string) || 'month';
            const year = req.query.year as string;
            const month = req.query.month as string;
            const startDate = req.query.startDate as string;
            const endDate = req.query.endDate as string;

            let whereClause = '1=1';
            const params: any[] = [];

            if (period === 'all') {
                // No date filter
            } else if (period === 'year') {
                whereClause = 'YEAR(w.created_at) = ?';
                params.push(year || new Date().getFullYear().toString());
            } else if (period === 'month') {
                whereClause = 'YEAR(w.created_at) = ? AND MONTH(w.created_at) = ?';
                params.push(year || new Date().getFullYear().toString(), month || (new Date().getMonth() + 1).toString());
            } else if (period === 'week') {
                whereClause = 'DATE(w.created_at) >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)';
            } else if (period === 'custom' && startDate && endDate) {
                whereClause = 'DATE(w.created_at) >= ? AND DATE(w.created_at) <= ?';
                params.push(startDate, endDate);
            }

            // Also need to filter by action date for approvals
            const actionWhereClause = whereClause.replace(/w.created_at/g, 'w.validated_at');

            // Optimized query using LEFT JOIN and GROUP BY instead of O(N) subqueries
            const [franchises]: any = await db.execute(`
                SELECT 
                    vd.id,
                    vd.store_name,
                    vd.store_email,
                    vd.city,
                    vd.state,
                    p.id as profile_id,
                    COUNT(DISTINCT wr.uid) as total_registrations,
                    COUNT(DISTINCT CASE WHEN wr.status = 'validated' THEN wr.uid END) as warranty_count,
                    (
                        SELECT COUNT(*) 
                        FROM grievances g 
                        WHERE g.customer_id = p.id 
                        AND g.source_type = 'franchise'
                    ) as grievance_count,
                    (
                        SELECT COUNT(*) 
                        FROM posm_requests pr 
                        WHERE pr.franchise_id = vd.id
                    ) as posm_count,
                    COALESCE(vv.is_verified, false) as is_verified,
                    vv.verified_at
                FROM profiles p
                JOIN user_roles ur ON p.id = ur.user_id
                LEFT JOIN vendor_details vd ON p.id = vd.user_id
                LEFT JOIN vendor_verification vv ON p.id = vv.user_id
                LEFT JOIN manpower m ON vd.id = m.vendor_id
                LEFT JOIN warranty_registrations wr ON (
                    wr.manpower_id = m.id
                    OR (wr.installer_name = vd.store_name AND wr.installer_contact = vd.store_email)
                    OR wr.user_id = p.id
                )
                WHERE ur.role = 'vendor'
                AND (wr.uid IS NULL OR ${whereClause.replace(/w\.created_at/g, 'wr.created_at')})
                GROUP BY p.id, vd.id, vv.is_verified, vv.verified_at
                ORDER BY total_registrations DESC
            `, [...params]);

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
    static async getFraudAnalytics(req: Request, res: Response) {
        try {
            const period = (req.query.period as string) || 'month';
            const year = req.query.year as string;
            const month = req.query.month as string;
            const startDate = req.query.startDate as string;
            const endDate = req.query.endDate as string;
            const flagFilter = req.query.flag as string; // new filter

            let whereClause = '1=1';
            const params: any[] = [];

            if (period === 'all') {
                // No date filter
            } else if (period === 'year') {
                whereClause = 'YEAR(created_at) = ?';
                params.push(year || new Date().getFullYear().toString());
            } else if (period === 'month') {
                whereClause = 'YEAR(created_at) = ? AND MONTH(created_at) = ?';
                params.push(year || new Date().getFullYear().toString(), month || (new Date().getMonth() + 1).toString());
            } else if (period === 'week') {
                whereClause = 'DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)';
            } else if (period === 'custom' && startDate && endDate) {
                whereClause = 'DATE(created_at) >= ? AND DATE(created_at) <= ?';
                params.push(startDate, endDate);
            }

            // Flag-specific filtering logic
            let flagCondition = '1=1';
            if (flagFilter && flagFilter !== 'all') {
                const flagMap: Record<string, string> = {
                    'ip': "JSON_EXTRACT(fraud_flags, '$.ip_penalty') > 0",
                    'distance': "JSON_EXTRACT(fraud_flags, '$.distance_penalty') > 0",
                    'time': "JSON_EXTRACT(fraud_flags, '$.time_penalty') > 0",
                    'consistency': "JSON_EXTRACT(fraud_flags, '$.consistency_penalty') > 0"
                };
                if (flagMap[flagFilter]) {
                    flagCondition = flagMap[flagFilter];
                }
            }

            // 1. Trust Score Distribution (filtered by flag if provided)
            const [distribution]: any = await db.execute(`
                SELECT 
                    SUM(CASE WHEN fraud_score >= 80 THEN 1 ELSE 0 END) as high_trust,
                    SUM(CASE WHEN fraud_score >= 40 AND fraud_score < 80 THEN 1 ELSE 0 END) as medium_trust,
                    SUM(CASE WHEN fraud_score < 40 THEN 1 ELSE 0 END) as low_trust,
                    COUNT(*) as total,
                    ROUND(AVG(fraud_score), 1) as network_avg
                FROM warranty_registrations
                WHERE fraud_score IS NOT NULL AND ${whereClause} AND ${flagCondition}
            `, params);

            // 2. Riskiest Franchises (avg score ASC, min 5 submissions, filtered by flag)
            const [riskyFranchises]: any = await db.execute(`
                SELECT 
                    installer_name,
                    COUNT(*) as total_submissions,
                    ROUND(AVG(fraud_score), 1) as avg_score,
                    SUM(CASE WHEN fraud_score < 40 THEN 1 ELSE 0 END) as flagged_count,
                    ROUND(SUM(CASE WHEN fraud_score < 40 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 0) as flagged_pct
                FROM warranty_registrations
                WHERE fraud_score IS NOT NULL 
                AND installer_name IS NOT NULL 
                AND installer_name != ''
                AND ${whereClause}
                AND ${flagCondition}
                GROUP BY installer_name
                HAVING total_submissions >= 5
                ORDER BY avg_score ASC, flagged_count DESC
            `, params);

            // 3. Cleanest Franchises (avg score DESC, min 5 submissions, filtered by flag)
            const [cleanFranchises]: any = await db.execute(`
                SELECT 
                    installer_name,
                    COUNT(*) as total_submissions,
                    ROUND(AVG(fraud_score), 1) as avg_score,
                    SUM(CASE WHEN fraud_score >= 80 THEN 1 ELSE 0 END) as clean_count,
                    ROUND(SUM(CASE WHEN fraud_score >= 80 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 0) as clean_pct
                FROM warranty_registrations
                WHERE fraud_score IS NOT NULL 
                AND installer_name IS NOT NULL 
                AND installer_name != ''
                AND ${whereClause}
                AND ${flagCondition}
                GROUP BY installer_name
                HAVING total_submissions >= 5
                ORDER BY avg_score DESC, clean_count DESC
            `, params);

            // 4. Primary fraud signal per risky franchise
            let enrichedRisky = riskyFranchises;
            if (riskyFranchises.length > 0) {
                const riskyNames = riskyFranchises.map((f: any) => f.installer_name);
                const placeholders = riskyNames.map(() => '?').join(',');
                const [flagRows]: any = await db.execute(`
                    SELECT installer_name, fraud_flags FROM warranty_registrations 
                    WHERE fraud_flags IS NOT NULL AND fraud_flags != '' AND fraud_flags != '{}'
                    AND installer_name IN (${placeholders})
                    AND ${whereClause}
                `, [...riskyNames, ...params]);

                const franchisePenalties: Record<string, Record<string, number>> = {};
                flagRows.forEach((row: any) => {
                    try {
                        const flags = typeof row.fraud_flags === 'string' ? JSON.parse(row.fraud_flags) : row.fraud_flags;
                        if (!franchisePenalties[row.installer_name]) {
                            franchisePenalties[row.installer_name] = { ip: 0, distance: 0, time: 0, consistency: 0 };
                        }
                        franchisePenalties[row.installer_name].ip += (flags.ip_penalty || 0);
                        franchisePenalties[row.installer_name].distance += (flags.distance_penalty || 0);
                        franchisePenalties[row.installer_name].time += (flags.time_penalty || 0);
                        franchisePenalties[row.installer_name].consistency += (flags.consistency_penalty || 0);
                    } catch (e) {}
                });

                enrichedRisky = riskyFranchises.map((f: any) => {
                    const penalties = franchisePenalties[f.installer_name] || {};
                    const primaryEntry = Object.entries(penalties).sort((a, b) => (b[1] as number) - (a[1] as number))[0];
                    const primaryFlag = primaryEntry ? primaryEntry[0] : 'unknown';
                    return { ...f, primary_flag: primaryFlag };
                });
            }

            return res.json({
                success: true,
                data: {
                    distribution: distribution[0],
                    riskiest_franchises: enrichedRisky,
                    cleanest_franchises: cleanFranchises,
                }
            });
        } catch (error: any) {
            console.error('Fraud analytics error:', error);
            return res.status(500).json({ success: false, error: 'Failed to fetch fraud analytics' });
        }
    }

    /**
     * Get per-franchise fraud drill-down
     */
    static async getFranchiseFraudDrilldown(req: Request, res: Response) {
        try {
            const franchiseName = req.params.franchiseName?.trim();
            if (!franchiseName) return res.status(400).json({ success: false, error: 'Franchise name required' });

            // 1. Overall stats
            const [stats]: any = await db.execute(`
                SELECT 
                    COUNT(*) as total,
                    ROUND(AVG(fraud_score), 1) as avg_score,
                    MIN(fraud_score) as min_score,
                    MAX(fraud_score) as max_score,
                    SUM(CASE WHEN fraud_score < 40 THEN 1 ELSE 0 END) as high_risk_count,
                    SUM(CASE WHEN fraud_score >= 40 AND fraud_score < 80 THEN 1 ELSE 0 END) as medium_risk_count,
                    SUM(CASE WHEN fraud_score >= 80 THEN 1 ELSE 0 END) as low_risk_count
                FROM warranty_registrations
                WHERE TRIM(installer_name) = ? AND fraud_score IS NOT NULL
            `, [franchiseName]);

            // If no data, return empty stats but success:true to avoid "No data" flash
            if (!stats[0] || stats[0].total === 0) {
                return res.json({
                    success: true,
                    data: {
                        stats: { total: 0, avg_score: 0, high_risk_count: 0, medium_risk_count: 0, low_risk_count: 0 },
                        penalty_totals: { ip: 0, distance: 0, time: 0, consistency: 0 },
                        histogram: [],
                        recent_submissions: []
                    }
                });
            }

            // 2. Penalty totals
            const [flagRows]: any = await db.execute(`
                SELECT fraud_flags FROM warranty_registrations
                WHERE TRIM(installer_name) = ? AND fraud_flags IS NOT NULL AND fraud_flags != '' AND fraud_flags != '{}'
            `, [franchiseName]);

            const penaltyTotals: Record<string, number> = { ip: 0, distance: 0, time: 0, consistency: 0 };
            let missingDataCount = 0;
            flagRows.forEach((row: any) => {
                try {
                    const f = typeof row.fraud_flags === 'string' ? JSON.parse(row.fraud_flags) : row.fraud_flags;
                    penaltyTotals.ip += (f.ip_penalty || 0);
                    penaltyTotals.distance += (f.distance_penalty || 0);
                    penaltyTotals.time += (f.time_penalty || 0);
                    penaltyTotals.consistency += (f.consistency_penalty || 0);
                    if (f.is_missing_data) missingDataCount++;
                } catch (e) {}
            });

            // 3. Score histogram
            const [histogram]: any = await db.execute(`
                SELECT 
                    FLOOR(fraud_score / 10) * 10 as bucket,
                    COUNT(*) as count
                FROM warranty_registrations
                WHERE TRIM(installer_name) = ? AND fraud_score IS NOT NULL
                GROUP BY bucket
                ORDER BY bucket ASC
            `, [franchiseName]);

            // 4. All submissions for full audit
            const [allSubmissions]: any = await db.execute(`
                SELECT 
                    id, customer_name, customer_email, status,
                    fraud_score, fraud_flags, created_at
                FROM warranty_registrations
                WHERE TRIM(installer_name) = ? AND fraud_score IS NOT NULL
                ORDER BY created_at DESC
            `, [franchiseName]);

            return res.json({
                success: true,
                data: {
                    stats: stats[0],
                    penalty_totals: penaltyTotals,
                    missing_data_count: missingDataCount,
                    histogram: histogram.map((h: any) => ({
                        range: `${h.bucket}–${Math.min(h.bucket + 9, 100)}`,
                        count: h.count,
                        bucket: h.bucket
                    })),
                    recent_submissions: allSubmissions.map((s: any) => ({
                        ...s,
                        fraud_flags: (() => { try { return typeof s.fraud_flags === 'string' ? JSON.parse(s.fraud_flags) : s.fraud_flags; } catch { return {}; } })()
                    }))
                }
            });
        } catch (error: any) {
            console.error('Franchise fraud drilldown error:', error);
            return res.status(500).json({ success: false, error: 'Failed to fetch franchise fraud details' });
        }
    }

    /**
     * Get geographic performance stats (State/City wise)
     */
    static async getGeographicStats(req: Request, res: Response) {
        try {
            const period = (req.query.period as string) || 'month';
            const year = req.query.year as string;
            const month = req.query.month as string;
            const startDate = req.query.startDate as string;
            const endDate = req.query.endDate as string;
            const selectedState = req.query.state as string;

            let whereClause = '1=1';
            const params: any[] = [];

            if (period === 'all') {
                // No date filter — show everything
            } else if (period === 'year') {
                whereClause = 'YEAR(w.created_at) = ?';
                params.push((year || new Date().getFullYear()).toString());
            } else if (period === 'month') {
                whereClause = 'YEAR(w.created_at) = ? AND MONTH(w.created_at) = ?';
                params.push((year || new Date().getFullYear()).toString(), (month || (new Date().getMonth() + 1)).toString());
            } else if (period === 'week') {
                whereClause = 'DATE(w.created_at) >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)';
            } else if (period === 'custom') {
                const s = startDate || '2000-01-01';
                const e = endDate || new Date().toISOString().split('T')[0];
                whereClause = 'DATE(w.created_at) >= ? AND DATE(w.created_at) <= ?';
                params.push(s.toString(), e.toString());
            }

            // Grouping by State or City
            const groupBy = selectedState ? 'v.city' : 'v.state';
            const geoFilter = selectedState ? 'AND v.state = ?' : '';
            
            // 1. Get Master List of All Regions (States or Cities) from vendor_details
            // This ensures we show regions even with 0 data
            const [allRegions]: any = await db.query(`
                SELECT DISTINCT LOWER(TRIM(${selectedState ? 'city' : 'state'})) as label 
                FROM vendor_details 
                WHERE ${selectedState ? 'LOWER(TRIM(state)) = LOWER(TRIM(?))' : 'state IS NOT NULL'}
                ORDER BY label ASC
            `, selectedState ? [selectedState] : []);

            const geoMap = new Map();
            allRegions.forEach((r: any) => {
                if (r.label) {
                    const key = r.label.toString().trim().toUpperCase();
                    geoMap.set(key, { 
                        label: r.label,
                        warranty: { total_warranties: 0, approved_warranties: 0, pending_admin_warranties: 0, rejected_warranties: 0 },
                        product: { total_products: 0, top_product: null, top_product_count: 0 },
                        grievance: { total_grievances: 0 },
                        posm: { total_posm: 0 }
                    });
                }
            });

            // Construct query parameters carefully:
            // queryParams: [...params, ...params] for the double-check queries (warranty, product)
            // singleQueryParams: [...params] for single-where-clause queries (grievance, posm)
            const queryParams = [...params, ...params];
            const singleQueryParams = [...params];
            if (selectedState) {
                queryParams.push(selectedState);
                singleQueryParams.push(selectedState);
            }

            // Define labels for grouping and filtering separately
            const groupLabel = selectedState ? 'COALESCE(vd_m.city, vd_i.city, vd_owner.city)' : 'COALESCE(vd_m.state, vd_i.state, vd_owner.state)';
            const stateFilterLabel = 'COALESCE(vd_m.state, vd_i.state, vd_owner.state)';
            
            const joinLogic = `
                LEFT JOIN manpower m ON w.manpower_id = m.id
                LEFT JOIN vendor_details vd_m ON (w.manpower_id IS NOT NULL AND w.manpower_id NOT LIKE 'owner-%' AND m.vendor_id = vd_m.id)
                LEFT JOIN vendor_details vd_i ON (
                    (LOWER(TRIM(w.installer_name)) = LOWER(TRIM(vd_i.store_name)) OR 
                     LOWER(TRIM(w.installer_name)) = LOWER(TRIM(CONCAT(vd_i.store_name, ' - ', vd_i.city)))) 
                    AND LOWER(TRIM(w.installer_contact)) = LOWER(TRIM(vd_i.store_email))
                )
                LEFT JOIN vendor_details vd_owner ON (
                    w.manpower_id LIKE 'owner-%' AND 
                    vd_owner.id = REPLACE(w.manpower_id, 'owner-', '')
                )
            `;

            const [warrantyStats]: any = await db.query(`
                SELECT 
                    LOWER(TRIM(${groupLabel})) as label,
                    COUNT(DISTINCT w.id) as total_warranties,
                    COUNT(DISTINCT CASE WHEN w.status = 'validated' THEN w.id END) as approved_warranties,
                    COUNT(DISTINCT CASE WHEN w.status = 'pending' THEN w.id END) as pending_admin_warranties,
                    COUNT(DISTINCT CASE WHEN w.status = 'rejected' THEN w.id END) as rejected_warranties
                FROM warranty_registrations w
                ${joinLogic}
                WHERE (
                    -- Items approved in this period
                    (w.status = 'validated' AND ${whereClause.replace(/w.created_at/g, 'w.validated_at')})
                    OR
                    -- OR Items registered in this period (that aren't approved yet)
                    (w.status != 'validated' AND ${whereClause})
                )
                ${selectedState ? `AND LOWER(TRIM(${stateFilterLabel})) = LOWER(TRIM(?))` : ''}
                AND ${groupLabel} IS NOT NULL
                GROUP BY label
                ORDER BY total_warranties DESC
            `, queryParams);

            // Fetch Product Mix per Geo — extracting actual product name from JSON for granular reporting
            const [productMix]: any = await db.query(`
                SELECT 
                    LOWER(TRIM(${groupLabel})) as label,
                    JSON_UNQUOTE(JSON_EXTRACT(w.product_details, '$.productName')) as product_name,
                    COUNT(DISTINCT w.id) as count
                FROM warranty_registrations w
                ${joinLogic}
                WHERE (
                    -- Items approved in this period
                    (w.status = 'validated' AND ${whereClause.replace(/w.created_at/g, 'w.validated_at')})
                    OR
                    -- OR Items registered in this period (that aren't approved yet)
                    (w.status != 'validated' AND ${whereClause})
                )
                ${selectedState ? `AND LOWER(TRIM(${stateFilterLabel})) = LOWER(TRIM(?))` : ''}
                AND ${groupLabel} IS NOT NULL
                GROUP BY label, product_name
                ORDER BY label, count DESC
            `, queryParams);

            const [grievanceStats]: any = await db.query(`
                SELECT 
                    LOWER(TRIM(${selectedState ? 'v.city' : 'v.state'})) as label,
                    COUNT(*) as total_grievances
                FROM grievances g
                JOIN vendor_details v ON (
                    (g.source_type = 'customer' AND g.franchise_id = v.id) OR
                    (g.source_type = 'franchise' AND g.customer_id = v.user_id)
                )
                WHERE (
                    -- Unified period filter
                    ${whereClause.replace(/w.created_at/g, 'g.created_at')}
                )
                ${selectedState ? `AND LOWER(TRIM(v.state)) = LOWER(TRIM(?))` : ''}
                GROUP BY label
            `, singleQueryParams);

            const [posmStats]: any = await db.query(`
                SELECT 
                    LOWER(TRIM(${selectedState ? 'v.city' : 'v.state'})) as label,
                    COUNT(*) as total_posm
                FROM posm_requests p
                JOIN vendor_details v ON p.franchise_id = v.id
                WHERE (
                    -- Unified period filter
                    ${whereClause.replace(/w.created_at/g, 'p.created_at')}
                )
                ${selectedState ? `AND LOWER(TRIM(v.state)) = LOWER(TRIM(?))` : ''}
                GROUP BY label
            `, singleQueryParams);

            // Merge everything into a unified geo response
            // Use case-insensitive mapping to handle inconsistent DB casing (e.g. "HARYANA" vs "Haryana")
            warrantyStats.forEach((w: any) => {
                const key = w.label?.toString().trim().toUpperCase();
                if (!key) return;

                let existing = geoMap.get(key);
                
                // If not in master list (e.g. region with warranties but no current active vendors), add it
                if (!existing) {
                    existing = {
                        label: w.label,
                        warranty: { total_warranties: 0, approved_warranties: 0, pending_admin_warranties: 0, rejected_warranties: 0 },
                        product: { total_products: 0, top_product: null, top_product_count: 0 },
                        grievance: { total_grievances: 0 },
                        posm: { total_posm: 0 }
                    };
                    geoMap.set(key, existing);
                }

                // Cast all warranty counts to Number to avoid BigInt serialization issues
                w.total_warranties = Number(w.total_warranties);
                w.approved_warranties = Number(w.approved_warranties);
                w.pending_admin_warranties = Number(w.pending_admin_warranties);
                w.rejected_warranties = Number(w.rejected_warranties);
                existing.warranty = w;
            });

            productMix.forEach((pm: any) => {
                const key = pm.label?.toString().trim().toUpperCase();
                if (!key) return;

                const existing = geoMap.get(key);
                if (existing && existing.product) {
                    // Initialize mix array if not exists
                    if (!existing.product.mix) {
                        existing.product.mix = [];
                    }

                    if (!existing.product.top_product) {
                        existing.product.top_product = pm.product_name;
                        existing.product.top_product_count = Number(pm.count);
                    }
                    
                    existing.product.mix.push({
                        name: pm.product_name,
                        count: Number(pm.count)
                    });

                    existing.product.total_products = (Number(existing.product.total_products) || 0) + Number(pm.count);
                }
            });

            grievanceStats.forEach((g: any) => {
                const key = g.label?.toString().trim().toUpperCase();
                if (!key) return;
                const existing = geoMap.get(key);
                if (existing) {
                    g.total_grievances = Number(g.total_grievances);
                    existing.grievance = g;
                }
            });

            posmStats.forEach((p: any) => {
                const key = p.label?.toString().trim().toUpperCase();
                if (!key) return;
                const existing = geoMap.get(key);
                if (existing) {
                    p.total_posm = Number(p.total_posm);
                    existing.posm = p;
                }
            });

            return res.json({
                success: true,
                data: Array.from(geoMap.values())
            });
        } catch (error: any) {
            console.error('Geographic stats error:', {
                message: error.message,
                code: error.code,
                sqlMessage: error.sqlMessage,
                stack: error.stack
            });
            return res.status(500).json({ success: false, error: 'Failed to fetch geographic stats' });
        }
    }
}
