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

async function swapImages() {
    const db = await mysql.createConnection(config);
    const uid = '2203210281154';

    const [rows] = await db.query(
        'SELECT id, product_details FROM warranty_registrations WHERE uid = ?',
        [uid]
    );

    const details = JSON.parse(rows[0].product_details);

    // Current values
    const oldInvoice = details.invoiceFileName;
    const oldVehicle = details.photos.vehicle;

    console.log('BEFORE swap:');
    console.log('  invoiceFileName:', oldInvoice);
    console.log('  vehicle:', oldVehicle);

    // Swap them
    details.invoiceFileName = oldVehicle;
    details.photos.vehicle = oldInvoice;

    console.log('\nAFTER swap:');
    console.log('  invoiceFileName:', details.invoiceFileName);
    console.log('  vehicle:', details.photos.vehicle);

    await db.query(
        'UPDATE warranty_registrations SET product_details = ? WHERE id = ?',
        [JSON.stringify(details), rows[0].id]
    );

    console.log('\n✅ Swapped invoice and number plate successfully!');
    await db.end();
}
swapImages();
