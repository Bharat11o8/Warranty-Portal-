import { Request, Response } from 'express';
import db, { getISTTimestamp } from '../config/database.js';

export class UIDController {
    /**
     * External API: Batch sync UIDs from the UID generation system.
     * Requires API key in the x-api-key header.
     */
    static async syncUIDs(req: Request, res: Response) {
        let connection;
        try {
            const { uids } = req.body;

            // Case 6: Batch Size Limit
            const MAX_BATCH_SIZE = 1000;
            if (!uids || !Array.isArray(uids) || uids.length === 0) {
                return res.status(400).json({ error: 'uids must be a non-empty array of strings' });
            }
            if (uids.length > MAX_BATCH_SIZE) {
                return res.status(400).json({ error: `Batch size exceeds limit of ${MAX_BATCH_SIZE} UIDs` });
            }

            const timestamp = getISTTimestamp();
            const results: any[] = [];
            const stats = {
                total_received: uids.length,
                inserted: 0,
                already_exists_available: 0,
                already_exists_used: 0,
                invalid_format: 0,
                duplicate_in_request: 0
            };

            const processedInBatch = new Set<string>();
            const validUidsInRequest: string[] = [];

            // Step 1: Basic validation and intra-batch duplicate check
            for (const uid of uids) {
                // Case 4: Invalid Format
                if (typeof uid !== 'string' || !/^\d{13,16}$/.test(uid)) {
                    results.push({ uid, status: 'invalid_format', message: 'UID must be a 13-16 digit number' });
                    stats.invalid_format++;
                    continue;
                }

                // Case 5: Duplicate in Request
                if (processedInBatch.has(uid)) {
                    results.push({ uid, status: 'duplicate_in_request', message: 'UID appears multiple times in this request' });
                    stats.duplicate_in_request++;
                    continue;
                }

                processedInBatch.add(uid);
                validUidsInRequest.push(uid);
            }

            if (validUidsInRequest.length === 0) {
                return res.json({ success: true, message: 'No valid UIDs to process', stats, details: results });
            }

            // Step 2: Check database for existing UIDs and their usage status
            // We use a JOIN to get warranty info if it exists
            const placeholders = validUidsInRequest.map(() => '?').join(',');
            const [existingRows]: any = await db.execute(
                `SELECT p.uid, p.is_used, p.used_at, w.customer_name, w.registration_number 
                 FROM pre_generated_uids p 
                 LEFT JOIN warranty_registrations w ON p.uid = w.uid 
                 WHERE p.uid IN (${placeholders})`,
                validUidsInRequest
            );

            const existingMap = new Map();
            existingRows.forEach((row: any) => existingMap.set(row.uid, row));

            const uidsToInsert: string[] = [];

            // Step 3: Categorize UIDs
            for (const uid of validUidsInRequest) {
                const existing = existingMap.get(uid);

                if (existing) {
                    if (existing.is_used) {
                        // Case 3: Already Exists (Used)
                        results.push({
                            uid,
                            status: 'already_exists_used',
                            message: 'UID is already registered to a warranty',
                            info: {
                                customer_name: existing.customer_name,
                                registration_number: existing.registration_number,
                                used_at: existing.used_at
                            }
                        });
                        stats.already_exists_used++;
                    } else {
                        // Case 2: Already Exists (Available)
                        results.push({
                            uid,
                            status: 'already_exists_available',
                            message: 'UID already exists in the system and is available'
                        });
                        stats.already_exists_available++;
                    }
                } else {
                    uidsToInsert.push(uid);
                }
            }

            // Step 4: Batch insert new UIDs
            if (uidsToInsert.length > 0) {
                connection = await db.getConnection();
                await connection.beginTransaction();

                const insertPlaceholders = uidsToInsert.map(() => '(?, FALSE, NULL, ?)').join(', ');
                const insertValues = uidsToInsert.flatMap(uid => [uid, timestamp]);

                await connection.execute(
                    `INSERT INTO pre_generated_uids (uid, is_used, used_at, created_at) VALUES ${insertPlaceholders}`,
                    insertValues
                );

                await connection.commit();

                // Case 1: New (Inserted)
                uidsToInsert.forEach(uid => {
                    results.push({
                        uid,
                        status: 'inserted',
                        message: 'UID successfully synced'
                    });
                });
                stats.inserted += uidsToInsert.length;
            }

            console.log(`✓ UID Sync Complete: ${stats.inserted} new, ${stats.already_exists_available} existing, ${stats.already_exists_used} used`);

            res.json({
                success: true,
                message: `Processed ${uids.length} UIDs`,
                stats,
                details: results
            });
        } catch (error: any) {
            if (connection) await connection.rollback();
            console.error('Sync UIDs error:', error);
            res.status(500).json({ error: 'Failed to sync UIDs' });
        } finally {
            if (connection) connection.release();
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
                conditions.push('(p.uid LIKE ? OR w.customer_name LIKE ? OR w.registration_number LIKE ?)');
                const searchTerm = `%${search}%`;
                params.push(searchTerm, searchTerm, searchTerm);
            }

            const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

            // Get total count (using same JOIN for consistency)
            const [countResult]: any = await db.execute(
                `SELECT COUNT(*) as total FROM pre_generated_uids p 
                 LEFT JOIN warranty_registrations w ON p.uid = w.uid 
                 ${whereClause.replace('uid', 'p.uid').replace('is_used', 'p.is_used')}`,
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
                `SELECT 
                    p.uid, 
                    p.is_used, 
                    p.used_at, 
                    p.created_at,
                    w.customer_name,
                    w.registration_number
                 FROM pre_generated_uids p
                 LEFT JOIN warranty_registrations w ON p.uid = w.uid
                 ${whereClause.replace('uid', 'p.uid').replace('is_used', 'p.is_used')} 
                 ORDER BY p.created_at DESC 
                 LIMIT ? OFFSET ?`,
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
