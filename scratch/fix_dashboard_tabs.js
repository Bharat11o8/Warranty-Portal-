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

async function fixTabs() {
    let db;
    try {
        db = await mysql.createConnection(config);
        console.log('--- CORRECTING DASHBOARD TAB STATUSES ---');

        // UIDs confirmed as APPROVED from email logs
        const approvedUids = [
            '25102302384412', // Jalubhai
            '261480004540587', // Mukesh bhai
            '26030202421275', // Jignesh Rathwa
            '25081602368091'  // Huzfa sir
        ];

        for (const uid of approvedUids) {
            console.log(`Setting ${uid} to 'validated'...`);
            await db.execute('UPDATE warranty_registrations SET status = "validated" WHERE uid = ?', [uid]);
        }

        console.log('✅ Dashboard tabs should now show entries in "Approved".');
    } catch (err) {
        console.error('Failed to fix tabs:', err);
    } finally {
        if (db) await db.end();
    }
}

fixTabs();
