import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../server/.env') });

const config = {
    host: 'srv839.hstgr.io',
    user: process.env.DB_USER || 'u823909847_warr',
    password: process.env.DB_PASSWORD || '@V+S&7Fc?f3V',
    database: 'u823909847_warranty'
};

async function revert() {
    let db;
    try {
        const backupFile = path.resolve(__dirname, '../scratch/pre_patch_backup.json');
        if (!fs.existsSync(backupFile)) {
            console.error('No backup file found!');
            return;
        }

        const records = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
        db = await mysql.createConnection(config);
        
        console.log(`--- REVERTING ${records.length} RECORDS TO BACKUP STATE ---`);
        
        for (const record of records) {
            await db.execute(
                `UPDATE warranty_registrations 
                 SET customer_name = ?, customer_phone = ?, customer_email = ?, customer_address = ?, 
                     installer_name = ?, installer_contact = ?, status = ?, product_details = ?
                 WHERE uid = ?`,
                [
                    record.customer_name, record.customer_phone, record.customer_email, record.customer_address,
                    record.installer_name, record.installer_contact, record.status, record.product_details,
                    record.uid
                ]
            );
        }

        console.log('✅ Revert successful! Database restored to the pre-patch state.');
        
    } catch (err) {
        console.error('Revert failed:', err);
    } finally {
        if (db) await db.end();
    }
}

revert();
