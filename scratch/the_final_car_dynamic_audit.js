import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../server/.env') });

const config = {
    host: 'srv839.hstgr.io',
    user: process.env.DB_USER || 'u823909847_warr',
    password: process.env.DB_PASSWORD || '@V+S&7Fc?f3V',
    database: 'u823909847_warranty'
};

async function auditCarDynamic() {
    let db;
    try {
        db = await mysql.createConnection(config);
        console.log('=== SEARCHING FOR ALL GENUINE CAR DYNAMIC ENTRIES ===');

        // 1. Get Car Dynamic's Vendor Details
        const [vendors] = await db.query('SELECT id, user_id, store_name, store_email FROM vendor_details WHERE store_name LIKE "%DYNAMIC%"');
        if (vendors.length === 0) {
            console.log('Car Dynamic store not found in vendor_details!');
            return;
        }
        const cdVendor = vendors[0];
        console.log(`Found Store: ${cdVendor.store_name} | ID: ${cdVendor.id} | Email: ${cdVendor.store_email}`);

        // 2. Scan and Verify All 34 Database Records
        const [warranties] = await db.query('SELECT uid, customer_name, product_details, installer_name, installer_contact FROM warranty_registrations');
        
        const confirmedEntries = [];

        for (const w of warranties) {
            let pd = {};
            try { pd = JSON.parse(w.product_details || '{}'); } catch(e) {}

            const islinkedByEmail = pd.storeEmail === cdVendor.store_email;
            const isLinkedById = pd.manpowerId === cdVendor.id;
            const isLinkedByOwner = pd.manpowerName === "Aniruddha Gawade";

            if (islinkedByEmail || isLinkedById || isLinkedByOwner) {
                confirmedEntries.push({
                    uid: w.uid,
                    customer: w.customer_name,
                    linkedBy: {
                        email: islinkedByEmail,
                        id: isLinkedById,
                        owner: isLinkedByOwner
                    }
                });
            }
        }

        console.log(`\nFOUND ${confirmedEntries.length} GENUINE ENTRIES IN DATABASE:`);
        confirmedEntries.forEach(e => {
            console.log(`- ${e.customer} (UID: ${e.uid}) | Links: ${JSON.stringify(e.linkedBy)}`);
        });

        // 3. Double Check Email Logs for any UID not in DB
        const dump = JSON.parse(fs.readFileSync(path.join(__dirname, 'exhaustive_email_audit.json'), 'utf8'));
        const dbUids = new Set(warranties.map(w => w.uid));
        
        console.log('\nSCANNING EMAIL LOGS FOR ORPHANED ENTRIES:');
        let orphanedCount = 0;
        for (const uid in dump) {
            if (!dbUids.has(uid)) {
                const emails = dump[uid].found_emails;
                const isCD = emails.some(e => {
                    const content = (e.text || e.html || '').toLowerCase();
                    return content.includes('car dynamic') || e.to === cdVendor.store_email;
                });
                if (isCD) {
                    console.log(`- MISSING FROM DB: UID ${uid} belongs to Car Dynamic (Confirmation sent)`);
                    orphanedCount++;
                }
            }
        }
        if (orphanedCount === 0) console.log('No orphaned Car Dynamic entries found in recent logs.');

    } catch (err) {
        console.error('Audit failed:', err);
    } finally {
        if (db) await db.end();
    }
}

auditCarDynamic();
