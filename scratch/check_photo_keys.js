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

async function checkKeys() {
    let db;
    try {
        db = await mysql.createConnection(config);
        const [rows] = await db.query('SELECT uid, customer_name, product_details FROM warranty_registrations WHERE uid = "25100402380610"');
        const pd = JSON.parse(rows[0].product_details || '{}');
        console.log('--- PHOTO KEYS FOR SHUBHAS BHAI ---');
        console.log(JSON.stringify(pd.photos, null, 2));
        console.log('invoiceFileName:', pd.invoiceFileName);
    } catch (e) {
        console.error(e);
    } finally {
        if (db) await db.end();
    }
}
checkKeys();
