import db from '../config/database';
import { v4 as uuidv4 } from 'uuid';
export class ActivityLogService {
    /**
     * Log an admin action to the database
     */
    static async log(entry) {
        try {
            const id = uuidv4();
            await db.execute(`INSERT INTO admin_activity_log 
                 (id, admin_id, admin_name, admin_email, action_type, target_type, target_id, target_name, details, ip_address)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
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
            ]);
            console.log(`[ActivityLog] ${entry.actionType} by ${entry.adminEmail} on ${entry.targetType || 'N/A'}`);
        }
        catch (error) {
            // Don't throw - we don't want logging failures to break the main operation
            console.error('[ActivityLog] Failed to log activity:', error.message);
        }
    }
    /**
     * Get activity logs with pagination
     */
    static async getLogs(options = {}) {
        const limit = options.limit || 50;
        const offset = options.offset || 0;
        let whereClause = '';
        const params = [];
        if (options.adminId) {
            whereClause = 'WHERE al.admin_id = ?';
            params.push(options.adminId);
        }
        if (options.actionType) {
            whereClause = whereClause ? `${whereClause} AND al.action_type = ?` : 'WHERE al.action_type = ?';
            params.push(options.actionType);
        }
        // Get total count
        const [countResult] = await db.execute(`SELECT COUNT(*) as total FROM admin_activity_log al ${whereClause}`, params);
        const total = countResult[0].total;
        // Get logs with current admin details from profiles table
        const [logs] = await db.execute(`SELECT 
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
                al.created_at
             FROM admin_activity_log al
             LEFT JOIN profiles p ON al.admin_id = p.id
             ${whereClause} 
             ORDER BY al.created_at DESC 
             LIMIT ? OFFSET ?`, [...params, limit, offset]);
        return { logs, total };
    }
}
