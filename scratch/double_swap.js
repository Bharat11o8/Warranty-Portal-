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

async function doubleSwap() {
    const db = await mysql.createConnection(config);
    const uid = '26041002431893';

    const [rows] = await db.query(
        'SELECT id, product_details FROM warranty_registrations WHERE uid = ?',
        [uid]
    );

    if (rows.length === 0) { console.log('Not found!'); await db.end(); return; }

    const details = JSON.parse(rows[0].product_details);

    console.log('BEFORE:');
    console.log('  invoice:', details.invoiceFileName);
    console.log('  vehicle:', details.photos.vehicle);
    console.log('  seatCover:', details.photos.seatCover);
    console.log('  carOuter:', details.photos.carOuter);

    // Swap: vehicle <-> carOuter
    const tempVehicle = details.photos.vehicle;
    details.photos.vehicle = details.photos.carOuter;
    details.photos.carOuter = tempVehicle;

    console.log('\nAFTER:');
    console.log('  invoice:', details.invoiceFileName);
    console.log('  vehicle:', details.photos.vehicle);
    console.log('  seatCover:', details.photos.seatCover);
    console.log('  carOuter:', details.photos.carOuter);

    await db.query(
        'UPDATE warranty_registrations SET product_details = ? WHERE id = ?',
        [JSON.stringify(details), rows[0].id]
    );

    console.log('\n✅ Both swaps done!');
    await db.end();
}
doubleSwap();
