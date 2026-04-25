import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../server/.env') });

const config = {
    host: 'srv839.hstgr.io',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'u823909847_warranty'
};

const mappingFile = path.resolve(__dirname, '../scratch/final_perfect_mapping_manual.json');
const manualData = JSON.parse(fs.readFileSync(mappingFile, 'utf8'));

async function applyPerfectMapping() {
    try {
        const db = await mysql.createConnection(config);
        console.log('--- Applying Perfect Manual Mapping ---');

        for (const data of manualData) {
            const uid = data.uid;
            
            // 1. Fetch existing product_details
            const [rows] = await db.query('SELECT product_details FROM warranty_registrations WHERE uid = ?', [uid]);
            
            if (rows.length === 0) {
                console.log(`❌ UID ${uid} not found in database! Skipping.`);
                continue;
            }

            let pd = rows[0].product_details;
            if (typeof pd === 'string') {
                try { pd = JSON.parse(pd); } catch (e) { pd = {}; }
            }

            // 2. Overwrite the top-level invoiceFileName and nested photos object
            pd.invoiceFileName = data.invoiceFileName;
            pd.photos = {
                vehicle: data.photos.vehicle,
                seatCover: data.photos.seatCover,
                carOuter: data.photos.carOuter
            };

            // 3. Update the registry
            await db.query(
                `UPDATE warranty_registrations 
                 SET product_details = ?, 
                     seat_cover_photo_url = ?, 
                     car_outer_photo_url = ? 
                 WHERE uid = ?`,
                [
                    JSON.stringify(pd),
                    data.photos.seatCover,
                    data.photos.carOuter,
                    uid
                ]
            );

            console.log(`✅ Successfully updated UID: ${uid}`);
        }

        console.log('--- Database Mapping Application Complete ---');
        await db.end();

    } catch (err) {
        console.error('Error applying mapping:', err);
    }
}

applyPerfectMapping();
