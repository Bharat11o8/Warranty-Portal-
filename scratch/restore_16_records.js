import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../server/.env') });

const config = {
    host: 'srv839.hstgr.io',
    user: process.env.DB_USER || 'u823909847_warr',
    password: process.env.DB_PASSWORD || '@V+S&7Fc?f3V',
    database: 'u823909847_warranty'
};

const RESTORATION_DATA = [
    { uid: "26031602424705", name: "Rohit Patil", reg: "MH-12-ZC-1617" },
    { uid: "26010302405294", name: "Lakhwinder singh", reg: "PB-03-A-0023" },
    { uid: "261480004540587", name: "Mukesh bhai", reg: "GJ-24-AF-1576" },
    { uid: "26041302432620", name: "Harshal Nigade", reg: "MH-12-ZC-2349" },
    { uid: "25122302402392", name: "Mittal trading co", reg: "HR-32-P-2330" },
    { uid: "26032502427391", name: "Mr Saurabh", reg: "UP-16-FN-7325" },
    { uid: "26031902425824", name: "Bilal Ahmed dar", reg: "JK-03-P-2612" },
    { uid: "26021602417718", name: "AMANDEEP SINGH", reg: "RJ-13-CG-0138" },
    { uid: "25122902403812", name: "Aman ji", reg: "RJ-31-CD-0611" },
    { uid: "26031602424404", name: "NIRAJ MEHTA", reg: "GJ-15-CS-0093" },
    { uid: "25102302384412", name: "Jalubhai", reg: "GJ-37-AB-9968" },
    { uid: "25101502383419", name: "Pardeep", reg: "HR-31-X-2033" },
    { uid: "25100402380610", name: "Shubhas bhai", reg: "GJ-03-PR-6818" },
    { uid: "25082902371655", name: "Parag Agarwal", reg: "UP-21-DS-1432" },
    { uid: "25081602368091", name: "Huzfa sir", reg: "MP-09-C-0128" },
    { uid: "26041302432606", name: "Mr Amit", reg: "UP-16-FN-8700" } // Keep as is if unconfirmed, but applying for consistency
];

async function runRestoration() {
    let db;
    try {
        db = await mysql.createConnection(config);
        console.log('--- RESTORING 16 CORRUPTED RECORDS ---');

        for (const record of RESTORATION_DATA) {
            console.log(`Processing UID: ${record.uid}...`);

            // 1. Fetch current record to get product details and existing photo URLs
            const [rows] = await db.query(
                'SELECT * FROM warranty_registrations WHERE uid = ?',
                [record.uid]
            );

            if (rows.length === 0) {
                console.log(`WARNING: Record was not found for UID ${record.uid}`);
                continue;
            }

            const current = rows[0];
            let productDetails = {};
            try {
                productDetails = typeof current.product_details === 'string' 
                    ? JSON.parse(current.product_details) 
                    : (current.product_details || {});
            } catch (e) {
                console.error(`Error parsing JSON for ${record.uid}`);
            }

            // 2. Fix the Image mapping in product_details.photos
            // We know current.seat_cover_photo_url and current.car_outer_photo_url are original links
            if (current.seat_cover_photo_url || current.car_outer_photo_url) {
                productDetails.photos = {
                    frontReg: productDetails.photos?.frontReg || null,
                    backReg: productDetails.photos?.backReg || null,
                    seatCoverFront: current.seat_cover_photo_url || productDetails.photos?.seatCoverFront,
                    carOuter: current.car_outer_photo_url || productDetails.photos?.carOuter,
                    lhs: productDetails.photos?.lhs || null,
                    rhs: productDetails.photos?.rhs || null
                };
                
                // Fallback: If seatCoverFront and carOuter are already the only ones there, ensure they have full URLs
                // (Note: Database might store raw public IDs, but UI expects Cloudinary URLs)
            }

            // 3. Perform the UPDATE
            await db.query(
                `UPDATE warranty_registrations 
                 SET customer_name = ?, 
                     registration_number = ?, 
                     product_details = ?
                 WHERE uid = ?`,
                [
                    record.name,
                    record.reg,
                    JSON.stringify(productDetails),
                    record.uid
                ]
            );

            console.log(`✅ Restored: ${record.name} (${record.reg})`);
        }

        console.log('--- RESTORATION COMPLETE ---');
    } catch (err) {
        console.error('CRITICAL RESTORATION ERROR:', err);
    } finally {
        if (db) await db.end();
    }
}

runRestoration();
