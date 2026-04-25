import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../server/.env') });

const config = {
    host: 'srv839.hstgr.io',
    user: process.env.DB_USER || 'u823909847_warr',
    password: process.env.DB_PASSWORD || '@V+S&7Fc?f3V',
    database: 'u823909847_warranty'
};

async function checkSpecficUid() {
    let db;
    try {
        db = await mysql.createConnection(config);
        const [rows] = await db.query('SELECT uid, customer_name, registration_number, installer_name FROM warranty_registrations WHERE uid = "26030202421275"');
        console.log(JSON.stringify(rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        if (db) await db.end();
    }
}

checkSpecficUid();
