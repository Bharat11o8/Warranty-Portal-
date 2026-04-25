import imapsync from 'imap-simple';
import { simpleParser } from 'mailparser';
import fs from 'fs';

const config = {
    imap: {
        user: 'marketing@autoformindia.com',
        password: 'lpzx kisj eeow zpkb',
        host: 'imap.gmail.com',
        port: 993,
        tls: true,
        tlsOptions: { rejectUnauthorized: false },
        authTimeout: 10000
    }
};

const AFFECTED_UIDS = [
    '26041302432606', '26041302432620', '26032502427391', '26032302426664',
    '26031902425824', '26031602424705', '26031602424404', '25122902403812',
    '261480004540587', '26030202421275', '25122302402392', '25102302384412',
    '25100402380610', '25082902371655', '25081602368091', '260000000000' // broad
];

async function recoverData() {
    try {
        console.log('--- Starting Deep Email Audit ---');
        const connection = await imapsync.connect(config);
        await connection.openBox('[Gmail]/Sent Mail');

        const delay = 48 * 3600 * 1000 * 7; // Last 7 days
        const yesterday = new Date(Date.now() - delay).toISOString();
        const searchCriteria = [
            ['SINCE', yesterday]
        ];

        const fetchOptions = {
            bodies: ['HEADER', 'TEXT', ''],
            struct: true
        };

        const messages = await connection.search(searchCriteria, fetchOptions);
        console.log(`Analyzing ${messages.length} sent emails...`);

        const recoveryMap = [];

        for (const message of messages) {
            const all = message.parts.find(part => part.which === '');
            const parser = await simpleParser(all.body);
            const html = parser.html || '';
            const text = parser.text || '';

            // Find UID in content
            const uidMatch = html.match(/UID:<\/strong>\s*(\d+)/i) || text.match(/UID:\s*(\d+)/i);
            if (!uidMatch) continue;

            const uid = uidMatch[1].trim();
            console.log(`Processing UID: ${uid}`);

            // Extract Precise Customer Data (Look for "Customer Name" strictly)
            const customerNameMatch = html.match(/Customer Name:<\/strong>\s*([^<]+)/i) || text.match(/Customer Name:\s*([^\n\r]+)/i);
            const regMatch = html.match(/Vehicle Registration:<\/strong>\s*([^<]+)/i) || text.match(/Vehicle Registration:\s*([^\n\r]+)/i);
            const phoneMatch = html.match(/Phone:<\/strong>\s*([^<]+)/i) || text.match(/Phone:\s*([^\n\r]+)/i);
            const vehicleMatch = html.match(/Vehicle:<\/strong>\s*([^<]+)/i) || text.match(/Vehicle:\s*([^\n\r]+)/i);
            const addressMatch = html.match(/Address:<\/strong>\s*([^<]+)/i) || text.match(/Address:\s*([^\n\r]+)/i);
            const productMatch = html.match(/Product:<\/strong>\s*([^<]+)/i) || text.match(/Product:\s*([^\n\r]+)/i);

            // Images
            const cloudinaryLinks = html.match(/https:\/\/res\.cloudinary\.com\/[^\s"'>]+/g) || [];
            const productPhotos = [...new Set(cloudinaryLinks)].filter(link => {
                return !link.includes('/logo') && !link.includes('/favicon') && !link.includes('autoform-logo');
            });

            // Distinguish between Vendor and Customer emails
            const isVendorEmail = parser.subject.toLowerCase().includes('action required') || parser.subject.toLowerCase().includes('confirm');

            recoveryMap.push({
                uid,
                customerName: customerNameMatch ? customerNameMatch[1].trim() : null,
                registration: regMatch ? regMatch[1].trim() : null,
                phone: phoneMatch ? phoneMatch[1].trim() : null,
                vehicle: vehicleMatch ? vehicleMatch[1].trim() : null,
                address: addressMatch ? addressMatch[1].trim() : null,
                product: productMatch ? productMatch[1].trim() : null,
                photos: productPhotos,
                emailType: isVendorEmail ? 'vendor' : 'customer',
                sentAt: parser.date
            });
        }

        // Deduplicate and group by UID (prefer customer emails for customer name if available)
        const finalMap = {};
        recoveryMap.forEach(entry => {
            if (!finalMap[entry.uid] || entry.emailType === 'customer') {
                finalMap[entry.uid] = entry;
            } else if (entry.emailType === 'vendor' && !finalMap[entry.uid].customerName) {
                // Merge if vendor has better data
                finalMap[entry.uid] = { ...finalMap[entry.uid], ...entry };
            }
        });

        const results = Object.values(finalMap);
        console.log(`Successfully recovered data for ${results.length} UIDs.`);
        fs.writeFileSync('../scratch/final_recovery_data.json', JSON.stringify(results, null, 2));
        console.log('Final data saved to scratch/final_recovery_data.json');

        connection.end();
    } catch (err) {
        console.error('Extraction Error:', err);
    }
}

recoverData();
