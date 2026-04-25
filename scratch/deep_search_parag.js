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

async function deepSearchParag() {
    try {
        const db = await mysql.createConnection(config);
        console.log('--- Deep Searching for Parag Agarwal Data ---');

        const SEARCH_REG = 'UP-21-DS-1432';
        const SEARCH_NAME = 'Parag';
        const SEARCH_UID = '25082902371655';

        // 1. Check for registration number anywhere in warranty_registrations
        const [regRows] = await db.query('SELECT * FROM warranty_registrations WHERE registration_number LIKE ?', [`%${SEARCH_REG}%`]);
        console.log(`Found ${regRows.length} records with registration number ${SEARCH_REG}`);
        if (regRows.length > 0) {
            console.log(JSON.stringify(regRows, null, 2));
        }

        // 2. Check for Name anywhere in warranty_registrations
        const [nameRows] = await db.query('SELECT * FROM warranty_registrations WHERE customer_name LIKE ?', [`%${SEARCH_NAME}%`]);
        console.log(`Found ${nameRows.length} records with name like ${SEARCH_NAME}`);
        if (nameRows.length > 0) {
            nameRows.forEach(r => console.log(`UID: ${r.uid}, Name: ${r.customer_name}, Status: ${r.status}`));
        }

        // 3. Check profiles table for anyone with phone or name match
        const [profileRows] = await db.query('SELECT * FROM profiles WHERE name LIKE ? OR phone_number LIKE "%9016556551%"', [`%${SEARCH_NAME}%`]); // Using phone from audit
        console.log(`Found ${profileRows.length} matching profiles`);
        if (profileRows.length > 0) {
            console.log(JSON.stringify(profileRows, null, 2));
        }

        // 4. Check pre_generated_uids for metadata
        const [uidRows] = await db.query('SELECT * FROM pre_generated_uids WHERE uid = ?', [SEARCH_UID]);
        console.log(`UID state in pre_generated_uids:`, JSON.stringify(uidRows, null, 2));

        await db.end();
    } catch (err) {
        console.error('Search Error:', err);
    }
}

deepSearchParag();
