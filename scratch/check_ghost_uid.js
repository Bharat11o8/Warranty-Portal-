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
        const [uidData] = await db.query('SELECT * FROM product_uids WHERE uid = "25082902371655"');
        console.log('--- PRODUCT UID STATUS ---');
        console.log(JSON.stringify(uidData, null, 2));

        const [wData] = await db.query('SELECT * FROM warranty_registrations WHERE uid = "25082902371655"');
        console.log('--- WARRANTY REGISTRATION DATA ---');
        console.log(JSON.stringify(wData, null, 2));

    } catch (e) {
        console.error(e);
    } finally {
        if (db) await db.end();
    }
}
check();
