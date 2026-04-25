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

async function checkOldDB() {
    let db;
    try {
        db = await mysql.createConnection(config);
        
        console.log('--- SEARCHING FOR PARAG AGARWAL IN OLD_WARRANTIES ---');
        const [wData] = await db.query('SELECT * FROM old_warranties_seatcovers WHERE customer_name LIKE "%Parag%" OR id = 24194');
        console.log(JSON.stringify(wData, null, 2));
        
    } catch (e) {
        console.error('Error:', e);
    } finally {
        if (db) await db.end();
    }
}
checkOldDB();
