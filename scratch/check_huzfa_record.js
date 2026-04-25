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

async function checkRecord() {
    let db;
    try {
        db = await mysql.createConnection(config);
        console.log('--- AUDITING UID: 25081602368091 ---');
        const [rows] = await db.query('SELECT * FROM warranty_registrations WHERE uid = "25081602368091"');
        console.log(JSON.stringify(rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        if (db) await db.end();
    }
}

checkRecord();
