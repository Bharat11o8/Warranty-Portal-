import { Request, Response } from 'express';
import db, { getISTTimestamp } from '../config/database.js';

export class UIDController {
    /**
     * External API: Batch sync UIDs from the UID generation system.
     * Requires API key in the x-api-key header.
     */
    static async syncUIDs(req: Request, res: Response) {
        try {
            const { uids } = req.body;

            if (!uids || !Array.isArray(uids) || uids.length === 0) {
                return res.status(400).json({ error: 'uids must be a non-empty array of strings' });
            }

            // Validate each UID format (13-16 digit numbers)
            const invalidUIDs = uids.filter((uid: string) => !/^\d{13,16}$/.test(uid));
            if (invalidUIDs.length > 0) {
                return res.status(400).json({
                    error: 'Some UIDs have invalid format. UIDs must be 13-16 digit numbers.',
                    invalidUIDs: invalidUIDs.slice(0, 10) // Show first 10 invalid ones
                });
            }

            const timestamp = getISTTimestamp();
            let inserted = 0;
            let duplicates = 0;

            // Batch insert with INSERT IGNORE to skip duplicates
            // Process in chunks of 100 to avoid query size limits
            const chunkSize = 100;
            for (let i = 0; i < uids.length; i += chunkSize) {
                const chunk = uids.slice(i, i + chunkSize);
                const placeholders = chunk.map(() => '(?, FALSE, NULL, ?)').join(', ');
                const values = chunk.flatMap((uid: string) => [uid, timestamp]);

                const [result]: any = await db.execute(
                    `INSERT IGNORE INTO pre_generated_uids (uid, is_used, used_at, created_at) VALUES ${placeholders}`,
                    values
                );

                inserted += result.affectedRows;
            }

            duplicates = uids.length - inserted;

            console.log(`✓ UID Sync: ${inserted} inserted, ${duplicates} duplicates skipped`);

            res.json({
                success: true,
                message: `${inserted} UIDs synced successfully`,
                stats: {
                    total_received: uids.length,
                    inserted,
                    duplicates_skipped: duplicates
                }
            });
        } catch (error: any) {
            console.error('Sync UIDs error:', error);
            res.status(500).json({ error: 'Failed to sync UIDs' });
        }
    }

    /**
     * Frontend API: Validate a single UID.
     * Returns whether the UID exists and is available (not used).
     */
    static async validateUID(req: Request, res: Response) {
        try {
            const { uid } = req.params;

            if (!uid || !/^\d{13,16}$/.test(uid)) {
                return res.json({
                    valid: false,
                    available: false,
                    message: 'Invalid UID format'
                });
            }

            const [rows]: any = await db.execute(
                'SELECT uid, is_used FROM pre_generated_uids WHERE uid = ?',
                [uid]
            );

            if (rows.length === 0) {
                return res.json({
                    valid: false,
                    available: false,
                    message: 'UID not found in the system'
                });
            }

            const uidRecord = rows[0];
            if (uidRecord.is_used) {
                return res.json({
                    valid: true,
                    available: false,
                    message: 'UID has already been used'
                });
            }

            return res.json({
                valid: true,
                available: true,
                message: 'UID is valid and available'
            });
        } catch (error: any) {
            console.error('Validate UID error:', error);
            res.status(500).json({ error: 'Failed to validate UID' });
        }
    }

    /**
     * Admin API: Get all UIDs with pagination, filtering, and search.
     */
    static async getAllUIDs(req: Request, res: Response) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 30;
            const offset = (page - 1) * limit;
            const status = req.query.status as string; // 'available', 'used', 'all'
            const search = req.query.search as string;

            let conditions: string[] = [];
            let params: any[] = [];

            if (status === 'available') {
                conditions.push('is_used = FALSE');
            } else if (status === 'used') {
                conditions.push('is_used = TRUE');
            }

            if (search) {
                conditions.push('uid LIKE ?');
                params.push(`%${search}%`);
            }

            const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

            // Get total count
            const [countResult]: any = await db.execute(
                `SELECT COUNT(*) as total FROM pre_generated_uids ${whereClause}`,
                params
            );
            const totalCount = countResult[0].total;
            const totalPages = Math.ceil(totalCount / limit);

            // Get stats
            const [statsResult]: any = await db.execute(
                `SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN is_used = FALSE THEN 1 ELSE 0 END) as available,
          SUM(CASE WHEN is_used = TRUE THEN 1 ELSE 0 END) as used
        FROM pre_generated_uids`
            );

            // Get paginated results
            const [uids]: any = await db.execute(
                `SELECT uid, is_used, used_at, created_at FROM pre_generated_uids ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
                [...params, limit, offset]
            );

            res.json({
                success: true,
                uids,
                stats: {
                    total: Number(statsResult[0].total),
                    available: Number(statsResult[0].available),
                    used: Number(statsResult[0].used)
                },
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
            console.error('Get all UIDs error:', error);
            res.status(500).json({ error: 'Failed to fetch UIDs' });
        }
    }

    /**
     * Admin API: Manually add a single UID.
     */
    static async addUID(req: Request, res: Response) {
        try {
            const { uid } = req.body;

            if (!uid || !/^\d{13,16}$/.test(uid)) {
                return res.status(400).json({ error: 'UID must be a 13-16 digit number' });
            }

            // Check if already exists
            const [existing]: any = await db.execute(
                'SELECT uid FROM pre_generated_uids WHERE uid = ?',
                [uid]
            );

            if (existing.length > 0) {
                return res.status(409).json({ error: 'This UID already exists in the system' });
            }

            const timestamp = getISTTimestamp();
            await db.execute(
                'INSERT INTO pre_generated_uids (uid, is_used, used_at, created_at) VALUES (?, FALSE, NULL, ?)',
                [uid, timestamp]
            );

            const admin = (req as any).user;
            console.log(`✓ UID ${uid} manually added by admin ${admin?.email}`);

            res.status(201).json({
                success: true,
                message: 'UID added successfully',
                uid: { uid, is_used: false, created_at: timestamp }
            });
        } catch (error: any) {
            console.error('Add UID error:', error);
            res.status(500).json({ error: 'Failed to add UID' });
        }
    }

    /**
     * Admin API: Delete an unused UID.
     */
    static async deleteUID(req: Request, res: Response) {
        try {
            const { uid } = req.params;

            // Prevent deleting used UIDs
            const [existing]: any = await db.execute(
                'SELECT uid, is_used FROM pre_generated_uids WHERE uid = ?',
                [uid]
            );

            if (existing.length === 0) {
                return res.status(404).json({ error: 'UID not found' });
            }

            if (existing[0].is_used) {
                return res.status(400).json({ error: 'Cannot delete a UID that has already been used in a warranty' });
            }

            await db.execute('DELETE FROM pre_generated_uids WHERE uid = ?', [uid]);

            const admin = (req as any).user;
            console.log(`✓ UID ${uid} deleted by admin ${admin?.email}`);

            res.json({
                success: true,
                message: 'UID deleted successfully'
            });
        } catch (error: any) {
            console.error('Delete UID error:', error);
            res.status(500).json({ error: 'Failed to delete UID' });
        }
    }
}
