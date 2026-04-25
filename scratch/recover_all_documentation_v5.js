import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../server/.env') });

const config = {
    host: 'srv839.hstgr.io',
    user: process.env.DB_USER || 'u823909847_warr',
    password: process.env.DB_PASSWORD || '@V+S&7Fc?f3V',
    database: 'u823909847_warranty'
};

async function recoverAllImages() {
    let db;
    try {
        const dump = JSON.parse(fs.readFileSync(path.join(__dirname, 'exhaustive_email_audit.json'), 'utf8'));
        db = await mysql.createConnection(config);
        
        console.log('=== STARTING 4-IMAGE DOCUMENTATION RECOVERY ===');

        for (const uid in dump) {
            const emails = dump[uid].found_emails;
            const urls = [];

            emails.forEach(e => {
                const content = (e.text || e.html || '');
                const matches = content.match(/https:\/\/res\.cloudinary\.com\/[^\s\"\'\<\>]+/g);
                if (matches) {
                    matches.forEach(m => {
                        const cleanUrl = m.split(')')[0].split(']')[0].replace(/[.,]$/, '');
                        if (!urls.includes(cleanUrl) && !cleanUrl.includes('autoform-logo')) {
                            urls.push(cleanUrl);
                        }
                    });
                }
            });

            if (urls.length > 0) {
                console.log(`UID ${uid}: Found ${urls.length} unique images in emails.`);
                
                // Get current record info
                const [rows] = await db.query('SELECT product_details, product_type FROM warranty_registrations WHERE uid = ?', [uid]);
                if (rows.length > 0) {
                    const r = rows[0];
                    let pd = JSON.parse(r.product_details || '{}');
                    const type = r.product_type;

                    if (!pd.photos) pd.photos = {};

                    // ORDER MATTERS: Usually Invoice is first, then installation images
                    if (type === 'seat-cover') {
                        // Logic for 4 images
                        if (urls[0]) pd.photos.warranty = urls[0];
                        if (urls[1]) pd.photos.vehicle = urls[1];
                        if (urls[2]) pd.photos.seatCover = urls[2];
                        if (urls[3]) pd.photos.carOuter = urls[3];
                    } else {
                        // Logic for 5 images (EV/PPF)
                        if (urls[0]) pd.photos.warranty = urls[0];
                        if (urls[1]) pd.photos.frontReg = urls[1];
                        if (urls[2]) pd.photos.backReg = urls[2];
                        if (urls[3]) pd.photos.lhs = urls[3];
                        if (urls[4]) pd.photos.rhs = urls[4];
                    }

                    // Update Database
                    await db.execute('UPDATE warranty_registrations SET product_details = ? WHERE uid = ?', [JSON.stringify(pd), uid]);
                    console.log(`✅ UID ${uid}: Restored to ${Object.keys(pd.photos).length} images.`);
                }
            }
        }

        console.log('\n🏆 ALL AVAILABLE DOCUMENTATION RESTORED.');

    } catch (err) {
        console.error('Image recovery failed:', err);
    } finally {
        if (db) await db.end();
    }
}

recoverAllImages();
