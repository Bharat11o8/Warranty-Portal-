import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../server/.env') });

const config = {
    host: 'srv839.hstgr.io',
    user: process.env.DB_USER || 'u823909847_warr',
    password: process.env.DB_PASSWORD || '@V+S&7Fc?f3V',
    database: 'u823909847_warranty'
};

async function syncUIDStatus() {
    let db;
    try {
        db = await mysql.createConnection(config);
        console.log('--- SYNCING PRODUCT UID STATUS ---');

        // 1. Reset all UIDs to available (0)
        await db.execute('UPDATE pre_generated_uids SET is_used = 0, used_at = NULL');
        console.log('Reset all UIDs to available.');

        // 2. Fetch the UIDs that actually exist in the warranty_registrations table
        const [warranties] = await db.query('SELECT uid, created_at FROM warranty_registrations');
        console.log(`Found ${warranties.length} total actual warranty registrations.`);

        // 3. Mark those specific UIDs as 'used'
        let usedCount = 0;
        for (const w of warranties) {
            if (w.uid) {
                const [result] = await db.execute(
                    'UPDATE pre_generated_uids SET is_used = 1, used_at = ? WHERE uid = ?',
                    [w.created_at || new Date(), w.uid]
                );
                if (result.affectedRows > 0) {
                    usedCount++;
                }
            }
        }

        console.log(`Successfully synced! Marked ${usedCount} UIDs as USED to match the actual warranty entries.`);

    } catch (e) {
        console.error('Error:', e);
    } finally {
        if (db) await db.end();
    }
}
syncUIDStatus();
