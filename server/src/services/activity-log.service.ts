import db from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

export interface ActivityLogEntry {
    adminId: string;
    adminName?: string;
    adminEmail?: string;
    actionType: string;
    targetType?: string;
    targetId?: string;
    targetName?: string;
    details?: Record<string, any>;
    ipAddress?: string;
}

export class ActivityLogService {
    /**
     * Log an admin action to the database
     */
    static async log(entry: ActivityLogEntry): Promise<void> {
        try {
            const id = uuidv4();
            await db.execute(
                `INSERT INTO admin_activity_log 
                 (id, admin_id, admin_name, admin_email, action_type, target_type, target_id, target_name, details, ip_address)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    id,
                    entry.adminId,
                    entry.adminName || null,
                    entry.adminEmail || null,
                    entry.actionType,
                    entry.targetType || null,
                    entry.targetId || null,
                    entry.targetName || null,
                    entry.details ? JSON.stringify(entry.details) : null,
                    entry.ipAddress || null
                ]
            );
            console.log(`[ActivityLog] ${entry.actionType} by ${entry.adminEmail} on ${entry.targetType || 'N/A'}`);
        } catch (error: any) {
            // Don't throw - we don't want logging failures to break the main operation
            console.error('[ActivityLog] Failed to log activity:', error.message);
        }
    }

    /**
     * Get activity logs with pagination
     */
    static async getLogs(options: {
        limit?: number;
        offset?: number;
        adminId?: string;
        actionType?: string;
        /** Free text over admin, action, target and store. */
        search?: string;
        /** Inclusive ISO dates, applied on created_at. */
        dateFrom?: string;
        dateTo?: string;
        sortField?: 'created_at' | 'action_type' | 'admin_name';
        sortOrder?: 'asc' | 'desc';
    } = {}): Promise<{ logs: any[]; total: number }> {
        const limit = options.limit || 50;
        const offset = options.offset || 0;

        /*
         * Searching, filtering and sorting all happen here rather than in the
         * browser.
         *
         * They used to be done on whatever the first page happened to contain,
         * which meant a log of twelve thousand entries answered every question
         * from its newest hundred — a date filter for April returned nothing at
         * all, because April was never fetched.
         */
        const conditions: string[] = [];
        const params: any[] = [];

        if (options.adminId) {
            conditions.push('al.admin_id = ?');
            params.push(options.adminId);
        }

        if (options.actionType) {
            conditions.push('al.action_type = ?');
            params.push(options.actionType);
        }

        if (options.dateFrom) {
            conditions.push('DATE(al.created_at) >= ?');
            params.push(options.dateFrom);
        }

        if (options.dateTo) {
            conditions.push('DATE(al.created_at) <= ?');
            params.push(options.dateTo);
        }

        if (options.search?.trim()) {
            // Store name is matched through the same derivation the SELECT
            // uses, so searching a store finds its warranties too.
            conditions.push(`(
                p.name LIKE ? OR p.email LIKE ? OR al.action_type LIKE ?
                OR al.target_type LIKE ? OR al.target_name LIKE ?
                OR COALESCE(
                    JSON_UNQUOTE(JSON_EXTRACT(al.details, '$.store_name')),
                    vd_v.store_name, vd_w.store_name, vd_m.store_name
                ) LIKE ?
            )`);
            const like = `%${options.search.trim()}%`;
            params.push(like, like, like, like, like, like);
        }

        const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

        // Whitelisted, because these are interpolated rather than bound.
        const sortColumn = ({
            created_at: 'al.created_at',
            action_type: 'al.action_type',
            admin_name: 'p.name',
        } as const)[options.sortField || 'created_at'] || 'al.created_at';
        const sortDir = options.sortOrder === 'asc' ? 'ASC' : 'DESC';

        // The count has to see the same joins as the SELECT: the search touches
        // store names, which only exist once those joins are in place.
        const joins = `
             LEFT JOIN profiles p ON al.admin_id = p.id
             LEFT JOIN vendor_details vd_v
                    ON al.target_type = 'VENDOR'
                   AND (vd_v.user_id = al.target_id OR vd_v.id = al.target_id)
             LEFT JOIN warranty_registrations wr
                    ON al.target_type = 'WARRANTY' AND wr.uid = al.target_id
             LEFT JOIN vendor_details vd_w ON vd_w.store_name = wr.installer_name
             LEFT JOIN manpower m
                    ON al.target_type = 'MANPOWER' AND m.id = al.target_id
             LEFT JOIN vendor_details vd_m ON vd_m.id = m.vendor_id`;

        // Get total count
        const [countResult]: any = await db.execute(
            `SELECT COUNT(*) as total FROM admin_activity_log al ${joins} ${whereClause}`,
            params
        );
        const total = countResult[0].total;

        // Get logs with current admin details from profiles table
        const [logs]: any = await db.execute(
            `SELECT 
                al.id,
                al.admin_id,
                p.name as admin_name,
                p.email as admin_email,
                al.action_type,
                al.target_type,
                al.target_id,
                al.target_name,
                al.details,
                al.ip_address,
                al.created_at,
                /*
                 * Which store the action touched.
                 *
                 * There is no store column on the log, and no single way back
                 * to one: an action is recorded against a vendor, a warranty or
                 * a staff member, and each reaches a store differently. Tried in
                 * order of reliability — an explicit store_name in the details,
                 * then the vendor, the warranty's installer, the staff member's
                 * employer. About one log in fourteen has no store at all
                 * (logins, settings, product edits), which is correct rather
                 * than missing.
                 */
                COALESCE(
                    JSON_UNQUOTE(JSON_EXTRACT(al.details, '$.store_name')),
                    vd_v.store_name,
                    vd_w.store_name,
                    vd_m.store_name
                ) AS store_name,
                COALESCE(vd_v.store_code, vd_w.store_code, vd_m.store_code) AS store_code
             FROM admin_activity_log al
             ${joins}
             ${whereClause}
             ORDER BY ${sortColumn} ${sortDir}
             LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );

        return { logs, total };
    }

    /**
     * One log entry, plus every other action taken on the same target.
     *
     * A single row says what changed; it rarely says whether that was the third
     * rejection this month or a one-off. Grouping by target is what turns the
     * log into a history — the same warranty approved, overridden and updated
     * reads as a story rather than three unrelated lines.
     *
     * Keyed on target_id rather than target_name: names are edited, ids are not.
     */
    static async getLogDetail(id: string): Promise<{ log: any; timeline: any[] } | null> {
        const [rows]: any = await db.execute(
            `SELECT al.*, p.name AS admin_name, p.email AS admin_email,
                    COALESCE(
                        JSON_UNQUOTE(JSON_EXTRACT(al.details, '$.store_name')),
                        vd_v.store_name, vd_w.store_name, vd_m.store_name
                    ) AS store_name,
                    COALESCE(vd_v.store_code, vd_w.store_code, vd_m.store_code) AS store_code
               FROM admin_activity_log al
               LEFT JOIN profiles p ON al.admin_id = p.id
               LEFT JOIN vendor_details vd_v
                      ON al.target_type = 'VENDOR'
                     AND (vd_v.user_id = al.target_id OR vd_v.id = al.target_id)
               LEFT JOIN warranty_registrations wr
                      ON al.target_type = 'WARRANTY' AND wr.uid = al.target_id
               LEFT JOIN vendor_details vd_w ON vd_w.store_name = wr.installer_name
               LEFT JOIN manpower m
                      ON al.target_type = 'MANPOWER' AND m.id = al.target_id
               LEFT JOIN vendor_details vd_m ON vd_m.id = m.vendor_id
              WHERE al.id = ?`,
            [id]
        );
        if (!rows.length) return null;
        const log = rows[0];

        /*
         * A log with no target — an admin login, a system setting — has no
         * history to gather, and matching on NULL would pull in every other
         * targetless entry. It stands alone.
         */
        if (!log.target_id) return { log, timeline: [log] };

        const [timeline]: any = await db.execute(
            `SELECT al.id, al.action_type, al.target_type, al.target_id, al.target_name,
                    al.details, al.ip_address, al.created_at,
                    p.name AS admin_name, p.email AS admin_email
               FROM admin_activity_log al
               LEFT JOIN profiles p ON al.admin_id = p.id
              WHERE al.target_id = ?
              ORDER BY al.created_at DESC
              LIMIT 100`,
            [log.target_id]
        );

        return { log, timeline };
    }
}
