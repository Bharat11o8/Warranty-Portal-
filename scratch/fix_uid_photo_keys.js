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

async function fixPhotos() {
    const db = await mysql.createConnection(config);
    const uid = '26021602417718';

    const [rows] = await db.query(
        'SELECT id, product_details FROM warranty_registrations WHERE uid = ?',
        [uid]
    );

    if (rows.length === 0) { console.log('Not found'); return; }

    const details = JSON.parse(rows[0].product_details);
    const photos = details.photos || {};

    // Map the misnamed keys to the correct ones
    // frontReg -> vehicle (number plate photo)
    // seatCoverFront -> seatCover
    // carOuter stays as-is
    const fixedPhotos = {
        vehicle: photos.frontReg || photos.vehicle || null,
        seatCover: photos.seatCoverFront || photos.seatCover || null,
        carOuter: photos.carOuter || null
    };

    details.photos = fixedPhotos;

    await db.query(
        'UPDATE warranty_registrations SET product_details = ? WHERE id = ?',
        [JSON.stringify(details), rows[0].id]
    );

    console.log('✅ Fixed photos for UID:', uid);
    console.log('New photos:', JSON.stringify(fixedPhotos, null, 2));

    await db.end();
}
fixPhotos();
