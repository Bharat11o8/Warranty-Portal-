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

async function inspect() {
    const db = await mysql.createConnection(config);
    const uid = '26021602417718';
    console.log(`--- Inspecting UID: ${uid} ---`);

    const [rows] = await db.query(
        'SELECT uid, customer_name, registration_number, installer_name, product_details FROM warranty_registrations WHERE uid = ?',
        [uid]
    );

    if (rows.length === 0) {
        console.log('Record not found!');
        await db.end();
        return;
    }

    const row = rows[0];
    console.log('Customer:', row.customer_name);
    console.log('Reg:', row.registration_number);
    console.log('Installer:', row.installer_name);

    const details = JSON.parse(row.product_details);
    console.log('\n--- product_details JSON ---');
    console.log(JSON.stringify(details, null, 2));

    // Count how many image fields have values
    let imageCount = 0;
    if (details.invoiceFileName) { imageCount++; console.log('✅ invoiceFileName:', details.invoiceFileName); }
    else console.log('❌ invoiceFileName: MISSING');

    if (details.photos?.vehicle) { imageCount++; console.log('✅ vehicle:', details.photos.vehicle); }
    else console.log('❌ vehicle: MISSING');

    if (details.photos?.seatCover) { imageCount++; console.log('✅ seatCover:', details.photos.seatCover); }
    else console.log('❌ seatCover: MISSING');

    if (details.photos?.carOuter) { imageCount++; console.log('✅ carOuter:', details.photos.carOuter); }
    else console.log('❌ carOuter: MISSING');

    console.log(`\nTotal images found: ${imageCount}/4`);

    await db.end();
}
inspect();
