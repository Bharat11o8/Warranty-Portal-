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

    if (rows.length === 0) { console.log('Not found!'); await db.end(); return; }

    const details = JSON.parse(rows[0].product_details);

    const oldSeatCover = details.photos.seatCover;
    const oldCarOuter = details.photos.carOuter;

    console.log('BEFORE swap:');
    console.log('  seatCover:', oldSeatCover);
    console.log('  carOuter:', oldCarOuter);

    details.photos.seatCover = oldCarOuter;
    details.photos.carOuter = oldSeatCover;

    console.log('\nAFTER swap:');
    console.log('  seatCover:', details.photos.seatCover);
    console.log('  carOuter:', details.photos.carOuter);

    await db.query(
        'UPDATE warranty_registrations SET product_details = ? WHERE id = ?',
        [JSON.stringify(details), rows[0].id]
    );

    console.log('\n✅ Swapped seat cover and exterior successfully!');
    await db.end();
}
swapImages();
