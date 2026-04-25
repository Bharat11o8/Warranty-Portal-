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

async function checkGhost() {
    let db;
    try {
        db = await mysql.createConnection(config);
        
        console.log('--- PRE_GENERATED_UIDS RECORD ---');
        const [uidData] = await db.query('SELECT * FROM pre_generated_uids WHERE uid = "25082902371655"');
        console.log(JSON.stringify(uidData, null, 2));

        console.log('\\n--- WARRANTY_REGISTRATIONS RECORD ---');
        const [wData] = await db.query('SELECT * FROM warranty_registrations WHERE uid = "25082902371655"');
        console.log(JSON.stringify(wData, null, 2));
        
        console.log('\\n--- SEARCHING ALL WARRANTY_REGISTRATIONS FOR THE UID ---');
        const [fuzzyData] = await db.query('SELECT uid, customer_name, status FROM warranty_registrations WHERE uid LIKE "%25082902371655%" OR product_details LIKE "%25082902371655%"');
        console.log(JSON.stringify(fuzzyData, null, 2));
        
    } catch (e) {
        console.error('Error:', e);
    } finally {
        if (db) await db.end();
    }
}
checkGhost();
