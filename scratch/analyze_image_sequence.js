import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function analyzePerfectOrder() {
    const dump = JSON.parse(fs.readFileSync(path.join(__dirname, 'exhaustive_email_audit.json'), 'utf8'));
    const uid = '26031202423733'; // Dr Manvendra (Post-Corruption Correct Entry)
    
    if (!dump[uid]) {
        console.log('Post-corruption record not found in audit dump.');
        return;
    }

    const emails = dump[uid].found_emails;
    emails.forEach(e => {
        const content = (e.text || e.html || '');
        const matches = content.match(/https:\/\/res\.cloudinary\.com\/[^\s\"\'\<\>]+/g);
        if (matches) {
            const cleanUrls = matches.filter(m => !m.includes('logo')).map(m => m.split(')')[0].split(']')[0].replace(/[.,]$/, ''));
            console.log('=== PEFECT ENTRY EMAIL ANALYSIS ===');
            cleanUrls.forEach((url, i) => {
                console.log(`${i}: ${url}`);
            });
        }
    });

    // Cross-reference with DB JSON
    // From my previous view:
    // 0 index: peyp7lnr4kmfxeqovgvi.jpg -> mapped to invoiceFileName
    // 1 index: ttvhyouxmakox8pagrgg.jpg -> mapped to photos.vehicle
    // 2 index: tp7esj5k8ynfry3icvxu.jpg -> mapped to photos.seatCover
    // 3 index: gjsdpdvsghuctruhnzea.jpg -> mapped to photos.carOuter
}

analyzePerfectOrder();
