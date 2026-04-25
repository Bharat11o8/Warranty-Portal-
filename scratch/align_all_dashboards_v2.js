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

async function alignDashboards() {
    let db;
    try {
        db = await mysql.createConnection(config);
        console.log('--- STARTING GLOBAL DASHBOARD RE-ALIGNMENT ---');

        // 1. Fetch Vendor/Profile Map (Email -> {StoreName, OwnerName})
        console.log('Fetching vendor and profile truth...');
        const [vendors] = await db.query(`
            SELECT v.store_email, v.store_name, p.name as owner_name, v.id as vendor_id
            FROM vendor_details v
            JOIN profiles p ON v.user_id = p.id
        `);
        const vendorMap = {};
        vendors.forEach(v => {
            vendorMap[v.store_email.toLowerCase().trim()] = v;
        });

        // 2. Load Mapping Truth (from email audit & JSON)
        const dump = JSON.parse(fs.readFileSync(path.join(__dirname, 'exhaustive_email_audit.json'), 'utf8'));
        const report = JSON.parse(fs.readFileSync(path.join(__dirname, 'deep_audit_full_report.json'), 'utf8')).report;

        console.log(`Processing ${report.length} records...`);
        let movedCount = 0;

        for (const r of report) {
            const uid = r.uid;
            
            // Determine True Email
            let trueEmail = r.json_email;
            if (!trueEmail && dump[uid]) {
                const emails = dump[uid].found_emails;
                const registrationEmail = emails.find(e => e.subject.toLowerCase().includes('application') || e.subject.toLowerCase().includes('confirmation'));
                if (registrationEmail) trueEmail = registrationEmail.to;
            }

            if (!trueEmail) {
                console.log(`[SKIP] UID ${uid}: No true email found, keeping current.`);
                continue;
            }

            trueEmail = trueEmail.toLowerCase().trim();
            const correctVendor = vendorMap[trueEmail];

            if (correctVendor) {
                const newInstallerName = correctVendor.owner_name || correctVendor.store_name;
                const newContact = correctVendor.store_email;

                // Only move if there is a mismatch
                if (r.db_contact !== newContact || r.db_installer !== newInstallerName) {
                    console.log(`[MOVE] UID ${uid} (${r.customer}): ${r.db_contact} -> ${newContact}`);
                    
                    // Update DB Columns
                    await db.execute(
                        'UPDATE warranty_registrations SET installer_name = ?, installer_contact = ? WHERE uid = ?',
                        [newInstallerName, newContact, uid]
                    );

                    // Update JSON Blob
                    const [rows] = await db.execute('SELECT product_details FROM warranty_registrations WHERE uid = ?', [uid]);
                    if (rows.length > 0) {
                        let pd = JSON.parse(rows[0].product_details || '{}');
                        pd.manpowerName = newInstallerName;
                        pd.manpowerId = correctVendor.vendor_id;
                        pd.storeEmail = newContact;
                        pd.storeName = correctVendor.store_name;
                        await db.execute('UPDATE warranty_registrations SET product_details = ? WHERE uid = ?', [JSON.stringify(pd), uid]);
                    }
                    movedCount++;
                }
            } else {
                console.log(`[WARNING] UID ${uid}: True email ${trueEmail} not found in vendor_details table!`);
            }
        }

        console.log(`\n✅ DASHBOARD RE-ALIGNMENT COMPLETE.`);
        console.log(`${movedCount} records were returned to their rightful stores.`);

    } catch (err) {
        console.error('Alignment failed:', err);
    } finally {
        if (db) await db.end();
    }
}

alignDashboards();
