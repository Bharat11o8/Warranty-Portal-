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

async function auditAllImages() {
    let db;
    try {
        db = await mysql.createConnection(config);
        const [rows] = await db.query('SELECT uid, customer_name, product_details FROM warranty_registrations');
        
        console.log('=== CURRENT DATABASE PHOTO AUDIT ===');
        rows.forEach(r => {
            let pd = {};
            try { pd = JSON.parse(r.product_details || '{}'); } catch(e) {}
            const photos = pd.photos || {};
            const count = Object.keys(photos).length;
            console.log(`UID: ${r.uid} | Customer: ${r.customer_name} | Photos Found: ${count} | Keys: ${Object.keys(photos).join(', ')}`);
        });

    } catch (err) {
        console.error('Audit failed:', err);
    } finally {
        if (db) await db.end();
    }
}

auditAllImages();
