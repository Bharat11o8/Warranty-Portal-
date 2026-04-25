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

async function fixStore() {
    const db = await mysql.createConnection(config);
    const uid = '25122302402392';

    // 1. Find the correct manpower for Vibhor at GUPTA CAR ACCESSORIES
    const [manpower] = await db.query(
        `SELECT m.id as manpower_id, m.name as applicator, vd.store_name 
         FROM manpower m 
         JOIN vendor_details vd ON m.vendor_id = vd.id 
         WHERE m.name = 'Vibhor' AND vd.store_name LIKE '%GUPTA%' LIMIT 1`
    );

    let manpowerId = null;
    if (manpower.length > 0) {
        manpowerId = manpower[0].manpower_id;
        console.log('Found manpower:', manpower[0]);
    } else {
        console.log('Manpower not found by name, searching store only...');
        const [storeOnly] = await db.query(
            `SELECT vd.id, vd.store_name, vd.user_id FROM vendor_details WHERE store_name LIKE '%GUPTA%'`
        );
        console.log('Store search:', storeOnly);
    }

    // 2. Get current record
    const [rows] = await db.query(
        'SELECT id, installer_name, manpower_id, product_details FROM warranty_registrations WHERE uid = ?',
        [uid]
    );

    if (rows.length === 0) { console.log('Record not found!'); await db.end(); return; }

    console.log('\nBEFORE:');
    console.log('  installer_name:', rows[0].installer_name);
    console.log('  manpower_id:', rows[0].manpower_id);

    // 3. Update top-level columns
    await db.query(
        `UPDATE warranty_registrations SET installer_name = ?, manpower_id = ? WHERE id = ?`,
        ['GUPTA CAR ACCESSORIES', manpowerId, rows[0].id]
    );

    // 4. Update nested JSON
    const details = JSON.parse(rows[0].product_details);
    details.storeName = 'GUPTA CAR ACCESSORIES';
    details.storeEmail = 'guptacaraccessories2825@gmail.com';
    details.manpowerName = 'Vibhor';

    await db.query(
        'UPDATE warranty_registrations SET product_details = ? WHERE id = ?',
        [JSON.stringify(details), rows[0].id]
    );

    console.log('\nAFTER:');
    console.log('  installer_name: GUPTA CAR ACCESSORIES');
    console.log('  manpower: Vibhor');
    console.log('  storeEmail: guptacaraccessories2825@gmail.com');
    console.log('\n✅ Store details updated!');

    await db.end();
}
fixStore();
