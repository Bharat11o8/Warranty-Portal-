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

async function revert() {
    let db;
    try {
        db = await mysql.createConnection(config);
        await db.query('DELETE FROM warranty_registrations WHERE uid = "25082902371655"');
        await db.query('UPDATE pre_generated_uids SET is_used = 0, used_at = NULL WHERE uid = "25082902371655"');
        console.log('Reverted Parag. UID reset to available.');
    } finally {
        if (db) await db.end();
    }
}
revert();
