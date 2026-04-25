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

const strictlyCorruptedUids = [
    "25100402380610", // Shubhas bhai
    "25102302384412", // Jalubhai
    "26030202421275", // Jignesh Rathwa
    "25081602368091"  // Huzfa sir
];

// Reverting to April 21st IST (Midnight)
const correctPurchaseDate = "2026-04-20T18:30:00Z";

async function executeSurgicalFix() {
    let db;
    try {
        db = await mysql.createConnection(config);
        console.log('--- EXECUTING STRICT TIMELINE FIX ---');

        for (const uid of strictlyCorruptedUids) {
            console.log(`Reverting purchase_date for UID ${uid} to April 21st IST...`);
            
            // 1. Update purchase_date in the column
            await db.execute(
                'UPDATE warranty_registrations SET purchase_date = ? WHERE uid = ?',
                [correctPurchaseDate, uid]
            );

            // 2. Sync with internal product_details JSON if present
            const [rows] = await db.execute('SELECT product_details FROM warranty_registrations WHERE uid = ?', [uid]);
            if (rows.length > 0) {
                let pd = JSON.parse(rows[0].product_details || '{}');
                pd.purchaseDate = correctPurchaseDate;
                await db.execute('UPDATE warranty_registrations SET product_details = ? WHERE uid = ?', [JSON.stringify(pd), uid]);
            }
        }

        console.log('✅ STRICT TIMELINE RESTORATION COMPLETED.');
        console.log('Only 4 specific records were updated. No statuses were changed.');

    } catch (err) {
        console.error('Surgical fix failed:', err);
    } finally {
        if (db) await db.end();
    }
}

executeSurgicalFix();
