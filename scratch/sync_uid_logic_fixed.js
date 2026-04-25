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

async function syncCorrectUIDLogic() {
    let db;
    try {
        db = await mysql.createConnection(config);
        console.log('--- REVERTING TO CORRECT UID STATUS LOGIC ---');

        // 1. Reset all UIDs to available (0)
        await db.execute('UPDATE pre_generated_uids SET is_used = 0, used_at = NULL');
        console.log('Reset all UIDs to 0.');

        // 2. FetchONLY the 4 UIDs that are APPROVED (status = "validated")
        const [warranties] = await db.query('SELECT uid, created_at FROM warranty_registrations WHERE status = "validated"');
        console.log(`Found ${warranties.length} APPROVED warranties.`);

        // 3. Mark ONLY those approved ones as 'used'
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

        console.log(`Successfully synced! Marked ONLY the ${usedCount} Approved warranties as USED.`);

    } catch (e) {
        console.error('Error:', e);
    } finally {
        if (db) await db.end();
    }
}
syncCorrectUIDLogic();
