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

const CORRUPTED_UIDS = [
    '26041302432606', '26031902425824', '26041302432620', // Smeared 1, 2, 3
    '25100402380610', '25102302384412', '26030202421275', '25081602368091', // Patient Zeroes
    '26010302405294', '25122302402392', '26032502427391', '26041002431893',
    '26032302426664', '25101502383419', '2203210281154', '261490004540588',
    '26031602424663'
]; 

async function restoreDocumentation() {
    let db;
    try {
        db = await mysql.createConnection(config);
        console.log('--- STARTING 16-RECORD DOCUMENTATION ALIGNMENT ---');

        const dump = JSON.parse(fs.readFileSync(path.join(__dirname, 'exhaustive_email_audit.json'), 'utf8'));

        for (const uid of CORRUPTED_UIDS) {
            const [rows] = await db.query('SELECT product_details, product_type FROM warranty_registrations WHERE uid = ?', [uid]);
            if (rows.length === 0) continue;

            const r = rows[0];
            let pd = JSON.parse(r.product_details || '{}');
            const type = r.product_type;
            const photos = pd.photos || {};

            console.log(`Processing UID ${uid}...`);

            // 1. RECOVER ALL UNIQUE URLS FROM EMAIL TRUTH
            const urls = [];
            if (dump[uid]) {
                const emails = dump[uid].found_emails;
                emails.forEach(e => {
                    const content = (e.text || e.html || '');
                    const matches = content.match(/https:\/\/res\.cloudinary\.com\/[^\s\"\'\<\>]+/g);
                    if (matches) {
                        matches.forEach(m => {
                            const cleanUrl = m.split(')')[0].split(']')[0].replace(/[.,]$/, '');
                            if (!urls.includes(cleanUrl) && !cleanUrl.includes('logo')) {
                                urls.push(cleanUrl);
                            }
                        });
                    }
                });
            }

            // Fallback: If URLs not in emails, check if they are in the "Old Keys" in DB
            const existingUrls = [
                photos.frontReg, photos.backReg, photos.seatCoverFront, photos.carOuter, pd.invoiceFileName
            ].filter(Boolean);
            
            const masterUrls = [...new Set([...urls, ...existingUrls])];

            if (masterUrls.length > 0) {
                // 2. APPLY GOLD STANDARD MAPPING
                if (type === 'seat-cover' || type === 'seatcover') {
                    // Mapping for Seat Covers
                    pd.invoiceFileName = masterUrls[0] || pd.invoiceFileName;
                    pd.photos = {
                        vehicle: masterUrls[1] || photos.vehicle || photos.frontReg,
                        seatCover: masterUrls[2] || photos.seatCover || photos.seatCoverFront,
                        carOuter: masterUrls[3] || photos.carOuter
                    };
                } else {
                    // Mapping for EV/PPF
                    pd.invoiceFileName = masterUrls[0] || pd.invoiceFileName;
                    pd.photos = {
                        frontReg: masterUrls[1] || photos.frontReg,
                        backReg: masterUrls[2] || photos.backReg,
                        lhs: masterUrls[3] || photos.lhs,
                        rhs: masterUrls[4] || photos.rhs
                    };
                }

                // 3. PERSIST
                await db.execute('UPDATE warranty_registrations SET product_details = ? WHERE uid = ?', [JSON.stringify(pd), uid]);
                console.log(`✅ UID ${uid}: Documentation Aligned (${Object.keys(pd.photos).length} installation images + Invoice).`);
            } else {
                console.log(`⚠️ UID ${uid}: No documentation found in emails or DB!`);
            }
        }

        console.log('\n🏆 DOCUMENTATION RESTORATION COMPLETE FOR THE 16 CORRUPTED RECORDS.');

    } catch (err) {
        console.error('Restoration failed:', err);
    } finally {
        if (db) await db.end();
    }
}

restoreDocumentation();
