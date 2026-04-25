import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../server/.env') });

const config = {
    host: 'srv839.hstgr.io',
    user: process.env.DB_USER || 'u823909847_warr',
    password: process.env.DB_PASSWORD || '@V+S&7Fc?f3V',
    database: 'u823909847_warranty',
    charset: 'utf8mb4'
};

async function recreateWithProfile() {
    let db;
    try {
        db = await mysql.createConnection(config);
        console.log('--- RE-CREATING RECORD FOR PARAG AGARWAL (UID 25082902371655) ---');

        const email = 'parag06062015@gmail.com';
        const uid = '25082902371655';

        // 1. Check if profile exists
        console.log(`Checking profile for ${email}...`);
        const [profiles] = await db.query('SELECT id FROM profiles WHERE email = ?', [email]);
        
        let userId;
        if (profiles.length > 0) {
            userId = profiles[0].id;
            console.log(`✅ Existing profile found: ${userId}`);
        } else {
            console.log('No profile found. Creating new profile...');
            const [newProfile] = await db.execute(
                'INSERT INTO profiles (email, full_name, role, created_at) VALUES (?, ?, ?, ?)',
                [email, 'Parag Agarwal', 'customer', new Date()]
            );
            userId = newProfile.insertId;
            console.log(`✅ Created new profile: ${userId}`);
        }

        // 2. Perform the rest of the insertion
        console.log(`Inserting warranty registration for UID ${uid}...`);
        
        await db.execute(
            'UPDATE pre_generated_uids SET is_used = 1, used_at = ? WHERE uid = ?',
            [new Date(), uid]
        );

        const productDetails = {
            productName: 'U FOCUS',
            product: 'U FOCUS',
            uid: uid,
            carRegistration: 'UP-21-DS-1432',
            photos: {
                frontReg: null,
                backReg: null,
                seatCoverFront: null,
                seatCoverRear: null,
                lhs: null,
                rhs: null
            }
        };

        await db.execute(
            `INSERT INTO warranty_registrations 
            (uid, user_id, product_type, customer_name, customer_email, customer_phone, customer_address, registration_number, purchase_date, product_details, status, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                uid,
                userId,
                'seat-cover',
                'Parag Agarwal',
                email,
                'N/A',
                'N/A',
                'UP-21-DS-1432',
                '2026-04-21',
                JSON.stringify(productDetails),
                'pending_vendor',
                new Date()
            ]
        );

        console.log('✅ SUCCESS: Record re-created perfectly.');

    } catch (err) {
        console.error('CRITICAL ERROR:', err);
    } finally {
        if (db) await db.end();
    }
}

recreateWithProfile();
