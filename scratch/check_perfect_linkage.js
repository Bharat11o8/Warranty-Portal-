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

async function checkLinkage() {
    let db;
    try {
        db = await mysql.createConnection(config);
        const [rows] = await db.query('SELECT uid, installer_name, installer_contact, manpower_id, user_id FROM warranty_registrations WHERE uid = "26031202423733"');
        console.log('--- PERFECT RECORD LINKAGE ---');
        console.log(JSON.stringify(rows[0], null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        if (db) await db.end();
    }
}
checkLinkage();
