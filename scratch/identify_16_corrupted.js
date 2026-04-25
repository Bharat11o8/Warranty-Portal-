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

async function find16() {
    let db;
    try {
        db = await mysql.createConnection(config);
        const [rows] = await db.query('SELECT uid, customer_name, purchase_date FROM warranty_registrations WHERE DATE(purchase_date) = "2026-04-22"');
        console.log('=== THE 16 STRICTLY CORRUPTED RECORDS ===');
        rows.forEach((r, i) => console.log(`${i+1}. UID: ${r.uid} | ${r.customer_name}`));
    } catch (e) {
        console.error(e);
    } finally {
        if (db) await db.end();
    }
}
find16();
