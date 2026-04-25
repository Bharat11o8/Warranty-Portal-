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

async function check() {
    let db;
    try {
        db = await mysql.createConnection(config);
        const [vd] = await db.query('SELECT user_id, store_name, store_email FROM vendor_details WHERE store_email = "neelkanthcaraccessories2007@gmail.com"');
        console.log('VENDOR DETAILS:', JSON.stringify(vd, null, 2));
        if (vd.length > 0) {
            const [prof] = await db.query('SELECT id, email, name FROM profiles WHERE id = ?', [vd[0].user_id]);
            console.log('PROFILE DETAILS (Linked to Store):', JSON.stringify(prof, null, 2));
        }

        const [w] = await db.query('SELECT uid, installer_contact, user_id, installer_name FROM warranty_registrations WHERE uid = "26031202423733"');
        console.log('WARRANTY DETAILS (Dr Manvendra):', JSON.stringify(w, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        if (db) await db.end();
    }
}
check();
