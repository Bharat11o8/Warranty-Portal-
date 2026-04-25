import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../server/.env') });

const config = {
    host: 'srv839.hstgr.io',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'u823909847_warranty'
};

async function fixStoreDetails() {
    try {
        const db = await mysql.createConnection(config);
        console.log('--- Fixing Store Details for JK-03-P-2612 ---');

        // 1. Locate the correct manpower internally
        const [manpowerParams] = await db.query(
            `SELECT m.id as manpower_id, m.name as applicator, vd.store_name, vd.phone_number 
             FROM manpower m 
             JOIN vendor_details vd ON m.vendor_id = vd.id 
             WHERE m.name = 'Rajan' AND vd.store_name LIKE '%NU LOOK%' LIMIT 1`
        );

        if (manpowerParams.length === 0) {
            console.log("Could not find the target manpower id for Rajan at NU LOOK");
            return;
        }

        const targetStore = manpowerParams[0];
        console.log("Found correct store mapping:", targetStore);

        // 2. Locate the warranty registration by vehicle reg
        const [rows] = await db.query(
            `SELECT uid, id, installer_name, manpower_id, registration_number 
             FROM warranty_registrations 
             WHERE registration_number LIKE '%JK-03%'`
        );

        if (rows.length === 0) {
            console.log("Could not find registration JK-03-P-2612");
            return;
        }

        const targetWarranty = rows[0];
        console.log("Found Target Warranty:", targetWarranty);

        // 3. Apply the fix
        await db.query(
            `UPDATE warranty_registrations 
             SET installer_name = ?, 
                 manpower_id = ? 
             WHERE id = ?`,
            [targetStore.store_name, targetStore.manpower_id, targetWarranty.id]
        );

        console.log(`Successfully updated Installer to ${targetStore.store_name} and Applicator to ${targetStore.applicator}!`);

        await db.end();
    } catch (e) {
        console.error(e);
    }
}
fixStoreDetails();
