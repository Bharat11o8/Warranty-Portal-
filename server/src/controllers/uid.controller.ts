import { Request, Response } from 'express';
import db, { getISTTimestamp } from '../config/database.js';
import { matchFallbackUidSequence, resolveFallbackUid } from '../utils/customerMobileLimits.js';
import { v4 as uuidv4 } from 'uuid';
import { NotificationService } from '../services/notification.service.js';

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
                return res.status(400).json({ error: 'uids must be a non-empty array of strings or objects' });
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
            const validUidsInRequest: { uid: string; productName: string | null }[] = [];

            // Step 1: Basic validation and intra-batch duplicate check
            for (const entry of uids) {
                let uid: string;
                let productName: string | null = null;

                if (typeof entry === 'string') {
                    uid = entry;
                } else if (entry && typeof entry === 'object') {
                    uid = entry.uid;
                    productName = entry.product_name || entry.productName || null;
                } else {
                    results.push({ uid: String(entry), status: 'invalid_format', message: 'UID must be a string or an object with uid property' });
                    stats.invalid_format++;
                    continue;
                }

                // Updated validation: Strictly 13-16 digits to match frontend and guide
                if (typeof uid !== 'string' || !/^\d{13,16}$/.test(uid)) {
                    results.push({ uid, status: 'invalid_format', message: 'UID must be a 13-16 digit number string' });
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
                validUidsInRequest.push({ uid, productName: productName ? productName.trim() : null });
            }

            if (validUidsInRequest.length === 0) {
                return res.json({ success: true, message: 'No valid UIDs to process', stats, details: results });
            }

            // Step 1b: Auto-register unknown products
            const uniqueProductNames = Array.from(new Set(
                validUidsInRequest
                    .map(v => v.productName)
                    .filter((name): name is string => typeof name === 'string' && name.trim().length > 0)
            ));

            for (const name of uniqueProductNames) {
                const [existingProduct]: any = await db.execute(
                    'SELECT id FROM products WHERE LOWER(TRIM(name)) = LOWER(TRIM(?))',
                    [name]
                );
                if (existingProduct.length === 0) {
                    const newId = uuidv4();
                    await db.execute(
                        "INSERT INTO products (id, name, type, warranty_years) VALUES (?, ?, 'seat_cover', '1 Year')",
                        [newId, name]
                    );
                    // Broadcast notification to admins
                    try {
                        await NotificationService.broadcast({
                            title: 'New Product Registered',
                            message: `Product "${name}" was automatically added to catalog (Source: API Sync).`,
                            type: 'product',
                            targetRole: 'admin'
                        });
                    } catch (notifError) {
                        console.error('Failed to broadcast auto-registration notification:', notifError);
                    }
                }
            }

            // Step 2: Check database for existing UIDs and their usage status
            const placeholders = validUidsInRequest.map(() => '?').join(',');
            const uidsQuery = validUidsInRequest.map(v => v.uid);
            const [existingRows]: any = await db.execute(
                `SELECT uid, is_used, used_at, product_name FROM pre_generated_uids WHERE uid IN (${placeholders})`,
                uidsQuery
            );

            const existingMap = new Map();
            existingRows.forEach((row: any) => existingMap.set(row.uid, row));

            const uidsToInsert: { uid: string; productName: string | null }[] = [];
            const uidsToUpdate: { uid: string; productName: string | null }[] = [];

            // Step 3: Categorize UIDs
            for (const item of validUidsInRequest) {
                const existing = existingMap.get(item.uid);

                if (existing) {
                    if (existing.is_used) {
                        // Case 3: Already Exists (Used)
                        results.push({
                            uid: item.uid,
                            status: 'already_exists_used',
                            message: 'UID is already registered to a warranty',
                            used_at: existing.used_at
                        });
                        stats.already_exists_used++;
                    } else {
                        // Case 2: Already Exists (Available)
                        results.push({
                            uid: item.uid,
                            status: 'already_exists_available',
                            message: 'UID already exists in the system and is available'
                        });
                        stats.already_exists_available++;
                        // If product name is provided and is different, update it
                        if (item.productName !== existing.product_name) {
                            uidsToUpdate.push(item);
                        }
                    }
                } else {
                    uidsToInsert.push(item);
                }
            }

            // Step 4: Batch insert new UIDs
            if (uidsToInsert.length > 0) {
                connection = await db.getConnection();
                await connection.beginTransaction();

                // Insert in batches of 100 to avoid query size limits
                const batchSize = 100;
                let totalInserted = 0;
                for (let i = 0; i < uidsToInsert.length; i += batchSize) {
                    const batch = uidsToInsert.slice(i, i + batchSize);
                    const insertPlaceholders = batch.map(() => '(?, FALSE, NULL, ?, \'api_sync\', ?)').join(', ');
                    const insertValues = batch.flatMap(item => [item.uid, timestamp, item.productName]);

                    const [result]: any = await connection.execute(
                        `INSERT INTO pre_generated_uids (uid, is_used, used_at, created_at, source, product_name) VALUES ${insertPlaceholders}`,
                        insertValues
                    );
                    totalInserted += result.affectedRows;
                }

                await connection.commit();
                connection.release();
                connection = null;

                // Case 1: New (Inserted)
                uidsToInsert.forEach(item => {
                    results.push({
                        uid: item.uid,
                        status: 'inserted',
                        message: 'UID successfully synced'
                    });
                });
                stats.inserted = totalInserted;
            }

            // Step 5: Update product names of existing, unused UIDs
            if (uidsToUpdate.length > 0) {
                connection = await db.getConnection();
                await connection.beginTransaction();

                for (const item of uidsToUpdate) {
                    await connection.execute(
                        'UPDATE pre_generated_uids SET product_name = ? WHERE uid = ? AND is_used = FALSE',
                        [item.productName, item.uid]
                    );
                }

                await connection.commit();
                connection.release();
                connection = null;
            }

            console.log(`âœ“ UID Sync Complete: ${stats.inserted} new, ${stats.already_exists_available} existing, ${stats.already_exists_used} used`);

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
            const { phone } = req.query;

            if (!uid || !/^\d{13,16}$/.test(uid)) {
                return res.json({
                    valid: false,
                    available: false,
                    message: 'Invalid UID'
                });
            }

            // If the UID matches the fallback pattern (customer mobile + current
            // year), resolve it to the next unused sequence for this mobile â€”
            // this also covers repeat submissions where the customer keeps
            // typing the same base value and the system silently advances it.
            if (phone && typeof phone === 'string') {
                const currentYear = new Date().getFullYear();
                const resolved = await resolveFallbackUid(uid, phone, currentYear);
                if (resolved) {
                    return res.json({
                        valid: true,
                        available: true,
                        message: 'Customer-added UID accepted (mobile + year)',
                        resolvedUid: resolved.uid
                    });
                }

                if (matchFallbackUidSequence(uid, phone, currentYear) !== null) {
                    return res.json({
                        valid: false,
                        available: false,
                        message: 'This mobile number has no remaining warranty submissions allowed.'
                    });
                }
            }

            const [rows]: any = await db.execute(
                'SELECT uid, is_used, product_name FROM pre_generated_uids WHERE uid = ?',
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
                    productName: uidRecord.product_name || null,
                    message: 'UID already used'
                });
            }

            return res.json({
                valid: true,
                available: true,
                productName: uidRecord.product_name || null,
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
                    SUM(CASE WHEN source = 'legacy_migration' THEN 1 ELSE 0 END) as legacy_count,
                    SUM(CASE WHEN source = 'customer_added' THEN 1 ELSE 0 END) as customer_added_count
                FROM pre_generated_uids`
            );

            // Get paginated results with expanded warranty data
            const [uids]: any = await db.query(
                `SELECT 
                    p.uid, 
                    p.is_used, 
                    p.used_at, 
                    p.created_at,
                    p.source,
                    p.product_name,
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
                    legacy_count: Number(statsResult[0].legacy_count),
                    customer_added_count: Number(statsResult[0].customer_added_count)
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
     * Admin API: Export all filtered UIDs to CSV.
     */
    static async exportUIDs(req: Request, res: Response) {
        try {
            const status = req.query.status as string;
            const source = req.query.source as string;
            const search = req.query.search as string;
            const sort = req.query.sort as string || 'created_at';
            const order = req.query.order as string || 'desc';

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

            const allowedSorts: Record<string, string> = {
                'created_at': 'p.created_at',
                'used_at': 'p.used_at',
                'source': 'p.source'
            };
            const sortColumn = allowedSorts[sort] || 'p.created_at';
            const sortOrder = order === 'asc' ? 'ASC' : 'DESC';

            const [uids]: any = await db.execute(
                `SELECT 
                    p.uid, 
                    CASE WHEN p.is_used THEN 'Used' ELSE 'Available' END as status, 
                    p.source,
                    p.created_at,
                    p.used_at,
                    p.product_name,
                    w.customer_name,
                    w.customer_email,
                    w.customer_phone,
                    w.registration_number,
                    w.product_type,
                    w.warranty_type,
                    w.status as warranty_status,
                    w.purchase_date,
                    w.installer_name,
                    w.installer_contact,
                    w.car_year
                 FROM pre_generated_uids p
                 LEFT JOIN warranty_registrations w ON p.uid = w.uid
                 ${whereClause} 
                 ORDER BY ${sortColumn} ${sortOrder}`,
                params
            );

            // Generate CSV
            const headers = [
                'UID', 'Status', 'Source', 'Created At', 'Used At', 'Product Name',
                'Customer Name', 'Customer Email', 'Customer Phone',
                'Reg Number', 'Product Type', 'Warranty Type',
                'Warranty Status', 'Purchase Date', 'Installer Name', 'Installer Contact', 'Car Year'
            ];

            let csvContent = headers.join(',') + '\n';

            uids.forEach((row: any) => {
                const values = [
                    row.uid,
                    row.status,
                    row.source,
                    row.created_at ? new Date(row.created_at).toISOString() : '',
                    row.used_at ? new Date(row.used_at).toISOString() : '',
                    row.product_name || '',
                    row.customer_name || '',
                    row.customer_email || '',
                    row.customer_phone || '',
                    row.registration_number || '',
                    row.product_type || '',
                    row.warranty_type || '',
                    row.warranty_status || '',
                    row.purchase_date ? new Date(row.purchase_date).toISOString() : '',
                    row.installer_name || '',
                    row.installer_contact || '',
                    row.car_year || ''
                ].map(val => `"${String(val || '').replace(/"/g, '""')}"`);

                csvContent += values.join(',') + '\n';
            });

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=uids_export_${new Date().toISOString().split('T')[0]}.csv`);
            res.send(csvContent);

        } catch (error: any) {
            console.error('Export UID error:', error);
            res.status(500).json({ error: 'Failed to export UIDs' });
        }
    }

    /**
     * Admin API: Manually add a single UID.
     */
    static async addUID(req: Request, res: Response) {
        try {
            const { uid, productName } = req.body;

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

            let finalProductName = productName ? String(productName).trim() : null;
            if (finalProductName) {
                const [existingProduct]: any = await db.execute(
                    'SELECT id FROM products WHERE LOWER(TRIM(name)) = LOWER(TRIM(?))',
                    [finalProductName]
                );
                if (existingProduct.length === 0) {
                    const newId = uuidv4();
                    await db.execute(
                        "INSERT INTO products (id, name, type, warranty_years) VALUES (?, ?, 'seat_cover', '1 Year')",
                        [newId, finalProductName]
                    );
                    // Broadcast notification to admins
                    try {
                        await NotificationService.broadcast({
                            title: 'New Product Registered',
                            message: `Product "${finalProductName}" was automatically added to catalog (Source: Manual Entry).`,
                            type: 'product',
                            targetRole: 'admin'
                        });
                    } catch (notifError) {
                        console.error('Failed to broadcast auto-registration notification:', notifError);
                    }
                }
            }

            const timestamp = getISTTimestamp();
            await db.execute(
                'INSERT INTO pre_generated_uids (uid, is_used, used_at, created_at, source, product_name) VALUES (?, FALSE, NULL, ?, \'manual\', ?)',
                [uid, timestamp, finalProductName]
            );

            const admin = (req as any).user;
            console.log(`âœ“ UID ${uid} manually added by admin ${admin?.email}`);

            res.status(201).json({
                success: true,
                message: 'UID added successfully',
                uid: { uid, is_used: false, created_at: timestamp, product_name: finalProductName }
            });
        } catch (error: any) {
            console.error('Add UID error:', error);
            res.status(500).json({ error: 'Failed to add UID' });
        }
    }

    /**
     * Admin API: Bulk-add UIDs from a CSV/Excel upload.
     * Same categorisation logic as syncUIDs (validate format, dedupe in-batch,
     * skip already-existing), but JWT+admin authenticated and tagged
     * source = 'manual'. The frontend parses the file and posts a { uids: [...] }
     * array of plain UID strings.
     */
    static async bulkAddUIDs(req: Request, res: Response) {
        let connection;
        try {
            const { uids } = req.body;

            const MAX_BATCH_SIZE = 5000;
            if (!uids || !Array.isArray(uids) || uids.length === 0) {
                return res.status(400).json({ error: 'uids must be a non-empty array' });
            }
            if (uids.length > MAX_BATCH_SIZE) {
                return res.status(400).json({ error: `File contains too many UIDs. Maximum ${MAX_BATCH_SIZE} per upload.` });
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
            const validUids: string[] = [];

            // Step 1: validate format + intra-batch duplicate check
            for (const entry of uids) {
                const uid = typeof entry === 'string' ? entry.trim()
                    : (entry && typeof entry === 'object' ? String(entry.uid || '').trim() : '');

                if (!uid || !/^\d{13,16}$/.test(uid)) {
                    results.push({ uid: String(entry), status: 'invalid_format', message: 'UID must be a 13-16 digit number' });
                    stats.invalid_format++;
                    continue;
                }
                if (processedInBatch.has(uid)) {
                    results.push({ uid, status: 'duplicate_in_request', message: 'UID appears multiple times in the file' });
                    stats.duplicate_in_request++;
                    continue;
                }
                processedInBatch.add(uid);
                validUids.push(uid);
            }

            if (validUids.length === 0) {
                return res.json({ success: true, message: 'No valid UIDs to process', stats, details: results });
            }

            // Step 2: find which already exist (and their used status)
            const placeholders = validUids.map(() => '?').join(',');
            const [existingRows]: any = await db.execute(
                `SELECT uid, is_used, used_at FROM pre_generated_uids WHERE uid IN (${placeholders})`,
                validUids
            );
            const existingMap = new Map<string, any>();
            existingRows.forEach((row: any) => existingMap.set(row.uid, row));

            const uidsToInsert: string[] = [];
            for (const uid of validUids) {
                const existing = existingMap.get(uid);
                if (existing) {
                    if (existing.is_used) {
                        results.push({ uid, status: 'already_exists_used', message: 'UID is already registered to a warranty', used_at: existing.used_at });
                        stats.already_exists_used++;
                    } else {
                        results.push({ uid, status: 'already_exists_available', message: 'UID already exists and is available' });
                        stats.already_exists_available++;
                    }
                } else {
                    uidsToInsert.push(uid);
                }
            }

            // Step 3: batch insert new UIDs (source = manual)
            if (uidsToInsert.length > 0) {
                connection = await db.getConnection();
                await connection.beginTransaction();

                const batchSize = 100;
                let totalInserted = 0;
                for (let i = 0; i < uidsToInsert.length; i += batchSize) {
                    const batch = uidsToInsert.slice(i, i + batchSize);
                    const insertPlaceholders = batch.map(() => '(?, FALSE, NULL, ?, \'manual\', NULL)').join(', ');
                    const insertValues = batch.flatMap(uid => [uid, timestamp]);
                    const [result]: any = await connection.execute(
                        `INSERT INTO pre_generated_uids (uid, is_used, used_at, created_at, source, product_name) VALUES ${insertPlaceholders}`,
                        insertValues
                    );
                    totalInserted += result.affectedRows;
                }

                await connection.commit();
                connection.release();
                connection = null;

                uidsToInsert.forEach(uid => results.push({ uid, status: 'inserted', message: 'UID added successfully' }));
                stats.inserted = totalInserted;
            }

            const admin = (req as any).user;
            console.log(`UID Bulk Add by ${admin?.email}: ${stats.inserted} new, ${stats.already_exists_available} existing, ${stats.already_exists_used} used, ${stats.invalid_format} invalid, ${stats.duplicate_in_request} dupes`);

            res.json({
                success: true,
                message: `Processed ${uids.length} UIDs`,
                stats,
                details: results
            });
        } catch (error: any) {
            if (connection) await connection.rollback();
            console.error('Bulk add UIDs error:', error);
            res.status(500).json({ error: 'Failed to bulk add UIDs' });
        } finally {
            if (connection) connection.release();
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
            console.log(`âœ“ UID ${uid} deleted by admin ${admin?.email}`);

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
                    p.uid, p.is_used, p.used_at, p.created_at, p.source, p.product_name,
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

