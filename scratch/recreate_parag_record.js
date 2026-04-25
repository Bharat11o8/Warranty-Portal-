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

async function recreateMissingRecord() {
    let db;
    try {
        db = await mysql.createConnection(config);
        console.log('--- RE-CREATING MISSING RECORD: 25082902371655 ---');

        const uid = '25082902371655';
        const customerName = 'Parag Agarwal';
        const customerEmail = 'parag06062015@gmail.com';
        const registrationNumber = 'UP-21-DS-1432';
        const productName = 'U FOCUS';
        const productType = 'seat-cover';
        const purchaseDate = '2026-04-21';
        const status = 'pending_vendor';

        const productDetails = {
            productName: productName,
            product: productName,
            uid: uid,
            carRegistration: registrationNumber,
            photos: {
                frontReg: null,
                backReg: null,
                seatCoverFront: null,
                seatCoverRear: null,
                lhs: null,
                rhs: null
            }
        };

        // 1. Mark UID as used in pre_generated_uids
        await db.execute(
            'UPDATE pre_generated_uids SET is_used = 1, used_at = ? WHERE uid = ?',
            [new Date(), uid]
        );
        console.log('✅ Marked UID as used in pre_generated_uids');

        // 2. Insert into warranty_registrations
        // Using a basic set of columns based on what was found in the email
        await db.execute(
            `INSERT INTO warranty_registrations 
            (uid, product_type, customer_name, customer_email, registration_number, purchase_date, product_details, status, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                uid,
                productType,
                customerName,
                customerEmail,
                registrationNumber,
                purchaseDate,
                JSON.stringify(productDetails),
                status,
                new Date(),
                new Date()
            ]
        );
        console.log(`✅ Successfully re-created record for ${customerName} as ${status}`);

    } catch (err) {
        console.error('Re-creation Error:', err);
    } finally {
        if (db) await db.end();
    }
}

recreateMissingRecord();
