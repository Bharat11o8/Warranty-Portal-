import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function auditPhotos() {
    try {
        const dump = JSON.parse(fs.readFileSync(path.join(__dirname, 'exhaustive_email_audit.json'), 'utf8'));
        const photoResults = {};

        for (const uid in dump) {
            const emails = dump[uid].found_emails;
            const urls = new Set();

            emails.forEach(e => {
                const content = (e.text || e.html || '');
                // Find all Cloudinary URLs
                const matches = content.match(/https:\/\/res\.cloudinary\.com\/[^\s\"\'\<\>]+/g);
                if (matches) {
                    matches.forEach(m => {
                        // Clean URL from any trailing punctuation
                        const cleanUrl = m.split(')')[0].split(']')[0].replace(/[.,]$/, '');
                        urls.add(cleanUrl);
                    });
                }
            });

            if (urls.size > 0) {
                photoResults[uid] = Array.from(urls);
            }
        }

        fs.writeFileSync(path.join(__dirname, 'photo_recovery_map.json'), JSON.stringify(photoResults, null, 2));
        
        console.log('=== PHOTO RECOVERY AUDIT ===');
        console.log(`Audited ${Object.keys(photoResults).length} UIDs with photos.`);
        
        // Find UIDs with fewer than 4 photos
        let lowPhotoCount = 0;
        for (const uid in photoResults) {
            if (photoResults[uid].length < 4) {
                // console.log(`UID ${uid}: Only ${photoResults[uid].length} photos found.`);
                lowPhotoCount++;
            }
        }
        console.log(`${lowPhotoCount} UIDs have fewer than 4 photos found.`);

    } catch (err) {
        console.error('Audit failed:', err);
    }
}

auditPhotos();
