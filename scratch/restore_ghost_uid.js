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
    database: 'u823909847_warranty',
    charset: 'utf8mb4'
};

async function restoreParag() {
    let db;
    try {
        db = await mysql.createConnection(config);
        console.log('--- RESTORING GHOST UID (25082902371655) FOR PARAG AGARWAL ---');

        const uid = '25082902371655';
        const name = 'Parag Agarwal';
        const email = 'parag.agarwal@recovered.local'; // Dummy to satisfy DB constraints if any
        const phone = '0000000000';
        
        // Ensure profile exists for FK constraint
        console.log('Checking customer profile...');
        let userId;
        const [profs] = await db.query('SELECT id FROM profiles WHERE phone_number = ?', [phone]);
        if (profs.length > 0) {
            userId = profs[0].id;
            console.log('Found profile:', userId);
        } else {
            userId = uuidv4();
            await db.execute('INSERT INTO profiles (id, name, email, phone_number) VALUES (?, ?, ?, ?)', [userId, name, email, phone]);
            console.log('Created profile:', userId);
        }

        const productDetails = {
            productName: "U FOCUS",
            product: "U FOCUS",
            uid: uid,
            carRegistration: "UP-21-DS-1432",
            photos: {
                vehicle: "https://res.cloudinary.com/dmwt4rg4m/image/upload/v1776764989/warranty-portal/laswtsh3n4rodx2urvul.jpg",
                seatCover: "https://res.cloudinary.com/dmwt4rg4m/image/upload/v1776764990/warranty-portal/tjvdslpclqziit8omplf.jpg",
                lhs: "https://res.cloudinary.com/dmwt4rg4m/image/upload/v1776764987/warranty-portal/uyeotpptfubc8vhruw5b.jpg"
            },
            invoiceFileName: "https://res.cloudinary.com/dmwt4rg4m/image/upload/v1776764987/warranty-portal/fosnpnpbikksxfdd0rtq.jpg"
        };
        
        // Remove if it exists corrupted
        await db.query('DELETE FROM warranty_registrations WHERE uid = ?', [uid]);

        console.log('Inserting into warranty_registrations...');
        await db.execute(
            `INSERT INTO warranty_registrations 
            (uid, user_id, product_type, customer_name, customer_email, customer_phone, registration_number, 
             purchase_date, product_details, status, created_at, seat_cover_photo_url) 
            VALUES (?, ?, 'seat-cover', ?, ?, ?, ?, ?, ?, 'validated', ?, ?)`,
            [
                uid,
                userId,
                name,
                email,
                phone,
                'UP-21-DS-1432',
                '2026-04-21',
                JSON.stringify(productDetails),
                new Date(),
                productDetails.photos.seatCover
            ]
        );
        
        console.log('Ensure UID is marked as used...');
        await db.execute('UPDATE pre_generated_uids SET is_used = 1, used_at = ? WHERE uid = ?', [new Date(), uid]);

        console.log('✅ GHOST UID SUCCESSFULLY RESTORED TO APPROVED TAB.');
    } catch (e) {
        console.error(e);
    } finally {
        if (db) await db.end();
    }
}
restoreParag();
