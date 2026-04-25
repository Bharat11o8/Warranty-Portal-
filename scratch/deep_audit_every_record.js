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

async function deepAudit() {
    let db;
    try {
        db = await mysql.createConnection(config);
        console.log('=== DEEP AUDIT: EVERY RECORD vs FRANCHISE TABLE ===\n');

        // 1. Get ALL warranty records
        const [warranties] = await db.query('SELECT uid, customer_name, installer_name, installer_contact, product_details, status, purchase_date FROM warranty_registrations');

        // 2. Get ALL vendor details
        const [vendors] = await db.query('SELECT id, user_id, store_name, store_email FROM vendor_details');
        const vendorByEmail = new Map(vendors.map(v => [v.store_email, v]));
        const vendorById = new Map(vendors.map(v => [v.id, v]));

        // 3. Get ALL profiles
        const [profiles] = await db.query('SELECT id, name, email FROM profiles');
        const profileById = new Map(profiles.map(p => [p.id, p]));
        const profileByEmail = new Map(profiles.map(p => [p.email, p]));

        const mismatches = [];
        const report = [];

        for (const w of warranties) {
            let pd = {};
            try { pd = JSON.parse(w.product_details || '{}'); } catch(e) {}

            const jsonStoreName = pd.storeName || 'N/A';
            const jsonStoreEmail = pd.storeEmail || 'N/A';
            const jsonManpowerName = pd.manpowerName || 'N/A';
            const jsonManpowerId = pd.manpowerId || 'N/A';
            
            // Find the TRUE store by looking up the storeEmail in vendor_details
            const trueVendor = vendorByEmail.get(jsonStoreEmail);
            let trueStoreName = 'UNKNOWN';
            let trueOwnerName = 'UNKNOWN';
            
            if (trueVendor) {
                trueStoreName = trueVendor.store_name;
                const owner = profileById.get(trueVendor.user_id);
                if (owner) trueOwnerName = owner.name;
            }

            // Check: does the DB installer_name match the franchise table?
            const dbInstallerMatchesFranchise = w.installer_name === trueOwnerName;
            const dbStoreMatchesJson = w.installer_contact === jsonStoreEmail;

            const entry = {
                uid: w.uid,
                customer: w.customer_name,
                status: w.status,
                db_installer: w.installer_name,
                db_contact: w.installer_contact,
                json_store: jsonStoreName,
                json_email: jsonStoreEmail,
                json_manpower: jsonManpowerName,
                franchise_store: trueStoreName,
                franchise_owner: trueOwnerName,
                purchase_date: w.purchase_date,
                installer_correct: dbInstallerMatchesFranchise,
                contact_correct: dbStoreMatchesJson
            };
            
            report.push(entry);

            if (!dbInstallerMatchesFranchise || !dbStoreMatchesJson) {
                mismatches.push(entry);
            }
        }

        // Print results
        console.log('TOTAL RECORDS:', report.length);
        console.log('MISMATCHES:', mismatches.length);
        console.log('\n=== MISMATCHED RECORDS ===');
        mismatches.forEach(m => {
            console.log(`\nUID: ${m.uid} | Customer: ${m.customer}`);
            console.log(`  DB:        installer="${m.db_installer}" contact="${m.db_contact}"`);
            console.log(`  JSON:      store="${m.json_store}" email="${m.json_email}" manpower="${m.json_manpower}"`);
            console.log(`  FRANCHISE: store="${m.franchise_store}" owner="${m.franchise_owner}"`);
            console.log(`  Installer OK: ${m.installer_correct} | Contact OK: ${m.contact_correct}`);
        });

        // Count per store
        console.log('\n=== RECORDS PER STORE (from JSON storeEmail) ===');
        const storeCount = {};
        report.forEach(r => {
            const key = r.franchise_store || r.json_store;
            storeCount[key] = (storeCount[key] || 0) + 1;
        });
        Object.entries(storeCount).sort((a,b) => b[1]-a[1]).forEach(([store, count]) => {
            console.log(`  ${store}: ${count} records`);
        });

        fs.writeFileSync('../scratch/deep_audit_full_report.json', JSON.stringify({ report, mismatches, storeCount }, null, 2));
        console.log('\nFull report saved to scratch/deep_audit_full_report.json');

    } catch (err) {
        console.error('Audit failed:', err);
    } finally {
        if (db) await db.end();
    }
}

deepAudit();
