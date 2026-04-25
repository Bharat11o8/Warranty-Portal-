import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../server/.env') });

const config = {
    host: 'srv839.hstgr.io',
    user: process.env.DB_USER || 'u823909847_warr',
    password: process.env.DB_PASSWORD || '@V+S&7Fc?f3V',
    database: 'u823909847_warranty'
};

async function simulateDashboard() {
    let db;
    try {
        db = await mysql.createConnection(config);
        
        // 1. Identify User (Neelkanth)
        const vendorUserEmail = 'neelkanthcaraccessories2007@gmail.com';
        const [user] = await db.query('SELECT id FROM profiles WHERE email = ?', [vendorUserEmail]);
        if (user.length === 0) { console.log('User not found'); return; }
        const userId = user[0].id;
        console.log('Simulating Dashboard for User:', vendorUserEmail, 'ID:', userId);

        // 2. Fetch Vendor Details
        const [vd] = await db.query('SELECT id, store_name FROM vendor_details WHERE user_id = ?', [userId]);
        const vendorId = vd[0].id;
        const storeName = vd[0].store_name;
        console.log('Store:', storeName, 'VendorDetailsID:', vendorId);

        // 3. Fetch Manpower
        const [manpower] = await db.query('SELECT id FROM manpower WHERE vendor_id = ?', [vendorId]);
        const manpowerIds = manpower.map(m => m.id);
        console.log('Manpower IDs:', manpowerIds);

        // 4. Run the EXACT Visibility Query from controller
        // (w.manpower_id IN (...) OR w.user_id = ? OR w.installer_name = ?)
        const inClause = manpowerIds.length > 0 ? `manpower_id IN (${manpowerIds.map(() => '?').join(',')})` : '1=0';
        const query = `
            SELECT uid, installer_name, manpower_id, user_id, status 
            FROM warranty_registrations 
            WHERE (${inClause} OR user_id = ? OR installer_name = ?)
        `;
        const params = [...manpowerIds, userId, storeName];
        
        const [warranties] = await db.execute(query, params);
        console.log(`--- RESULTS FOUND: ${warranties.length} ---`);
        warranties.forEach(w => {
            console.log(`UID: ${w.uid} | Installer: ${w.installer_name} | Status: ${w.status}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        if (db) await db.end();
    }
}
simulateDashboard();
