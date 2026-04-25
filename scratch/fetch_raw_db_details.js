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

async function checkDetails() {
    try {
        const db = await mysql.createConnection(config);
        
        // Fetch Parag Agarwal's original details BEFORE we corrupted it further, OR any corrupted
        const [rows] = await db.query('SELECT uid, product_details FROM warranty_registrations WHERE uid = "25082902371655" OR uid = "25100402380610"');
        
        console.log("Found records:", rows.length);
        rows.forEach(r => {
            console.log("---- UID:", r.uid, "----");
            const details = typeof r.product_details === 'string' ? JSON.parse(r.product_details) : r.product_details;
            console.log(JSON.stringify(details, null, 2));
        });
        
        // Let's also check if we backed up the original corrupted state in any of our json files.
        await db.end();
    } catch(err) {
        console.error(err);
    }
}
checkDetails();
