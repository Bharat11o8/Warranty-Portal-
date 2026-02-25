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
                // Case 4: Invalid Format (API Sync allows alphanumeric up to 30 chars for legacy support)
                if (typeof uid !== 'string' || !/^[a-zA-Z0-9]{13,30}$/.test(uid)) {
                    results.push({ uid, status: 'invalid_format', message: 'UID must be a 13-30 character alphanumeric string' });
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
            const placeholders = validUidsInRequest.map(() => '?').join(',');
            const [existingRows]: any = await db.execute(
                `SELECT uid, is_used, used_at FROM pre_generated_uids WHERE uid IN (${placeholders})`,
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
                            used_at: existing.used_at
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

            // Step 4: Batch insert new UIDs (using INSERT IGNORE to handle any edge-case duplicates)
            if (uidsToInsert.length > 0) {
                connection = await db.getConnection();
                await connection.beginTransaction();

                // Insert in batches of 100 to avoid query size limits
                const batchSize = 100;
                let totalInserted = 0;
                for (let i = 0; i < uidsToInsert.length; i += batchSize) {
                    const batch = uidsToInsert.slice(i, i + batchSize);
                    const insertPlaceholders = batch.map(() => '(?, FALSE, NULL, ?, \'api_sync\')').join(', ');
                    const insertValues = batch.flatMap(uid => [uid, timestamp]);

                    const [result]: any = await connection.execute(
                        `INSERT IGNORE INTO pre_generated_uids (uid, is_used, used_at, created_at, source) VALUES ${insertPlaceholders}`,
                        insertValues
                    );
                    totalInserted += result.affectedRows;
                }

                await connection.commit();

                // Case 1: New (Inserted)
                uidsToInsert.forEach(uid => {
                    results.push({
                        uid,
                        status: 'inserted',
                        message: 'UID successfully synced'
                    });
                });
                stats.inserted = totalInserted;
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
                    message: 'Invalid UID'
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
                    message: 'Invalid UID'
                });
            }

            const uidRecord = rows[0];
            if (uidRecord.is_used) {
                return res.json({
                    valid: true,
                    available: false,
                    message: 'UID already used'
                });
            }

            return res.json({
                valid: true,
                available: true,
                message: 'Valid UID'
            });
        } catch (error: any) {
            console.error('Validate UID error:', error);
            res.status(500).json({ error: 'Failed to validate UID' });
        }
    }

    /**
     * Admin API: Get all UIDs with pagination, filtering, search, and sorting.
     */
    static async getAllUIDs(req: Request, res: Response) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 30;
            const offset = (page - 1) * limit;
            const status = req.query.status as string; // 'available', 'used', 'all'
            const source = req.query.source as string; // 'api_sync', 'manual', 'legacy_migration', 'unknown', 'all'
            const search = req.query.search as string;
            const sort = req.query.sort as string || 'created_at'; // 'created_at', 'used_at', 'source'
            const order = req.query.order as string || 'desc'; // 'asc', 'desc'

            let conditions: string[] = [];
            let params: any[] = [];

            if (status === 'available') {
                conditions.push('p.is_used = FALSE');
            } else if (status === 'used') {
                conditions.push('p.is_used = TRUE');
            }

            if (source && source !== 'all') {
                conditions.push('p.source = ?');
                params.push(source);
            }

            if (search) {
                conditions.push('(p.uid LIKE ? OR w.customer_name LIKE ? OR w.registration_number LIKE ?)');
                const searchTerm = `%${search}%`;
                params.push(searchTerm, searchTerm, searchTerm);
            }

            const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

            // Validate sort column to prevent SQL injection
            const allowedSorts: Record<string, string> = {
                'created_at': 'p.created_at',
                'used_at': 'p.used_at',
                'source': 'p.source'
            };
            const sortColumn = allowedSorts[sort] || 'p.created_at';
            const sortOrder = order === 'asc' ? 'ASC' : 'DESC';

            // Get total count
            const [countResult]: any = await db.execute(
                `SELECT COUNT(*) as total FROM pre_generated_uids p 
                 LEFT JOIN warranty_registrations w ON p.uid = w.uid 
                 ${whereClause}`,
                params
            );
            const totalCount = countResult[0].total;
            const totalPages = Math.ceil(totalCount / limit);

            // Get stats (includes source breakdown)
            const [statsResult]: any = await db.execute(
                `SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN is_used = FALSE THEN 1 ELSE 0 END) as available,
                    SUM(CASE WHEN is_used = TRUE THEN 1 ELSE 0 END) as used,
                    SUM(CASE WHEN source = 'api_sync' THEN 1 ELSE 0 END) as synced,
                    SUM(CASE WHEN source = 'manual' THEN 1 ELSE 0 END) as manual_count,
                    SUM(CASE WHEN source = 'legacy_migration' THEN 1 ELSE 0 END) as legacy_count
                FROM pre_generated_uids`
            );

            // Get paginated results with expanded warranty data
            const [uids]: any = await db.execute(
                `SELECT 
                    p.uid, 
                    p.is_used, 
                    p.used_at, 
                    p.created_at,
                    p.source,
                    w.customer_name,
                    w.customer_email,
                    w.customer_phone,
                    w.registration_number,
                    w.product_type,
                    w.warranty_type,
                    w.status as warranty_status,
                    w.purchase_date,
                    w.product_details,
                    w.installer_name,
                    w.installer_contact,
                    w.car_year
                 FROM pre_generated_uids p
                 LEFT JOIN warranty_registrations w ON p.uid = w.uid
                 ${whereClause} 
                 ORDER BY ${sortColumn} ${sortOrder} 
                 LIMIT ? OFFSET ?`,
                [...params, limit, offset]
            );

            res.json({
                success: true,
                uids,
                stats: {
                    total: Number(statsResult[0].total),
                    available: Number(statsResult[0].available),
                    used: Number(statsResult[0].used),
                    synced: Number(statsResult[0].synced),
                    manual_count: Number(statsResult[0].manual_count),
                    legacy_count: Number(statsResult[0].legacy_count)
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
                'INSERT INTO pre_generated_uids (uid, is_used, used_at, created_at, source) VALUES (?, FALSE, NULL, ?, \'manual\')',
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

    /**
     * Admin API: Get detailed UID info with full warranty spec sheet.
     */
    static async getUIDDetails(req: Request, res: Response) {
        try {
            const { uid } = req.params;

            const [rows]: any = await db.execute(
                `SELECT 
                    p.uid, p.is_used, p.used_at, p.created_at, p.source,
                    w.customer_name, w.customer_email, w.customer_phone,
                    w.registration_number, w.product_type, w.warranty_type,
                    w.status as warranty_status, w.purchase_date,
                    w.product_details, w.installer_name, w.installer_contact,
                    w.car_year, w.car_make, w.car_model, w.created_at as warranty_created_at,
                    w.rejection_reason
                 FROM pre_generated_uids p
                 LEFT JOIN warranty_registrations w ON p.uid = w.uid
                 WHERE p.uid = ?`,
                [uid]
            );

            if (rows.length === 0) {
                return res.status(404).json({ error: 'UID not found' });
            }

            res.json({ success: true, data: rows[0] });
        } catch (error: any) {
            console.error('Get UID details error:', error);
            res.status(500).json({ error: 'Failed to fetch UID details' });
        }
    }
}
