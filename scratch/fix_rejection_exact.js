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

async function fixRejection() {
    let db;
    try {
        db = await mysql.createConnection(config);
        console.log('--- FIXING SHUBHAS BHAI REJECTION DETAILS ---');

        // Exact rejection reason from the email
        const exactReason = "Require Picture through Camera/Gallery. Please Submit Again.";
        const correctPhone = "9016556551"; // From the email, NOT the wrong number
        const correctStoreEmail = "satishvekariya888@gmail.com"; // CAR WORLD
        const uid = "25100402380610";

        // 1. Update columns
        await db.execute(
            `UPDATE warranty_registrations SET 
             rejection_reason = ?, customer_phone = ?,
             installer_name = ?, installer_contact = ?
             WHERE uid = ?`,
            [exactReason, correctPhone, "CAR WORLD", correctStoreEmail, uid]
        );

        // 2. Also fix the product_details JSON
        const [rows] = await db.execute('SELECT product_details FROM warranty_registrations WHERE uid = ?', [uid]);
        if (rows.length > 0) {
            let pd = JSON.parse(rows[0].product_details || '{}');
            pd.storeName = "CAR WORLD";
            pd.storeEmail = correctStoreEmail;
            pd.customerPhone = correctPhone;
            await db.execute('UPDATE warranty_registrations SET product_details = ? WHERE uid = ?', [JSON.stringify(pd), uid]);
        }

        console.log('✅ Fixed Shubhas bhai (25100402380610):');
        console.log('   Rejection Reason: "' + exactReason + '"');
        console.log('   Phone: ' + correctPhone);
        console.log('   Store: CAR WORLD / satishvekariya888@gmail.com');

    } catch (err) {
        console.error('Failed:', err);
    } finally {
        if (db) await db.end();
    }
}

fixRejection();
