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

async function fixFinalRecord() {
    let db;
    try {
        db = await mysql.createConnection(config);
        console.log('--- CORRECTING FINAL MISSED RECORD: 26030202421275 ---');
        
        const [rows] = await db.query('SELECT * FROM warranty_registrations WHERE uid = "26030202421275"');
        
        if (rows.length > 0) {
            const curr = rows[0];
            let pd = {};
            try {
                pd = typeof curr.product_details === 'string' ? JSON.parse(curr.product_details) : (curr.product_details || {});
            } catch (e) {}

            // Update to uncorrupted name from email logs
            const correctName = "Jignesh Rathwa";
            
            // Rebuild photos JSON using flat column URLs
            pd.photos = {
                frontReg: pd.photos?.frontReg || null,
                backReg: pd.photos?.backReg || null,
                seatCoverFront: curr.seat_cover_photo_url || pd.photos?.seatCoverFront,
                carOuter: curr.car_outer_photo_url || pd.photos?.carOuter,
                lhs: pd.photos?.lhs || null,
                rhs: pd.photos?.rhs || null
            };

            await db.query(
                'UPDATE warranty_registrations SET customer_name = ?, product_details = ? WHERE uid = ?',
                [correctName, JSON.stringify(pd), "26030202421275"]
            );
            
            console.log(`✅ Successfully restored UID 26030202421275 to ${correctName}`);
        } else {
            console.log('❌ Record not found for UID 26030202421275');
        }

    } catch (err) {
        console.error('Fix Error:', err);
    } finally {
        if (db) await db.end();
    }
}

fixFinalRecord();
