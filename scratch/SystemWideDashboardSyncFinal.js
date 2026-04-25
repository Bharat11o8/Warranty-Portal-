import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../server/.env') });

const config = {
    host: 'srv839.hstgr.io',
    user: process.env.DB_USER || 'u823909847_warr',
    password: process.env.DB_PASSWORD || '@V+S&7Fc?f3V',
    database: 'u823909847_warranty'
};

async function syncDashboards() {
    let db;
    try {
        db = await mysql.createConnection(config);
        console.log('--- STARTING GLOBAL DASHBOARD VISIBILITY SYNC ---');

        // 1. Get all vendor details
        const [vendors] = await db.query('SELECT id as vendor_id, user_id, store_name, store_email FROM vendor_details');
        console.log(`Auditing ${vendors.length} stores...`);

        for (const vendor of vendors) {
            console.log(`\nSyncing Store: ${vendor.store_name} (${vendor.store_email})`);

            // 2. Ensure at least one Manpower entry exists for this store
            const [manpower] = await db.query('SELECT id, name FROM manpower WHERE vendor_id = ?', [vendor.vendor_id]);
            let targetManpowerId;

            if (manpower.length === 0) {
                // Get owner name from profile
                const [prof] = await db.query('SELECT name FROM profiles WHERE id = ?', [vendor.user_id]);
                const ownerName = prof.length > 0 ? prof[0].name : 'Owner';
                
                targetManpowerId = uuidv4();
                await db.execute(
                    'INSERT INTO manpower (id, vendor_id, name, contact) VALUES (?, ?, ?, ?)',
                    [targetManpowerId, vendor.vendor_id, ownerName, vendor.store_email]
                );
                console.log(`+ Created default Manpower for ${ownerName} (ID: ${targetManpowerId})`);
            } else {
                targetManpowerId = manpower[0].id;
                console.log(`- Using existing Manpower: ${manpower[0].name} (ID: ${targetManpowerId})`);
            }

            // 3. Update ALL warranties that match this store's email
            // We match by installer_contact = store_email
            const [updateResult] = await db.execute(
                'UPDATE warranty_registrations SET manpower_id = ? WHERE installer_contact = ? AND (manpower_id IS NULL OR manpower_id = 0 OR manpower_id = "" OR manpower_id = "0")',
                [targetManpowerId, vendor.store_email]
            );
            
            if (updateResult.affectedRows > 0) {
                console.log(`✅ Linked ${updateResult.affectedRows} warranties to this dashboard.`);
            } else {
                console.log(`ℹ️ No unlinked warranties found for this store email.`);
            }
        }

        console.log('\n🏆 SYSTEM-WIDE DASHBOARD VISIBILITY RESTORED.');

    } catch (err) {
        console.error('Sync failed:', err);
    } finally {
        if (db) await db.end();
    }
}

syncDashboards();
