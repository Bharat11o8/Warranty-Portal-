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
    '25100402380610', '25082902371655', '25081602368091', '26010302405294',
    '26010802406519', '25101502383419', '2203210281154' // Added a few more just in case
];

async function auditEmails() {
    try {
        console.log('--- Connecting to Gmail Sent Folder ---');
        const connection = await imapsync.connect(config);
        await connection.openBox('[Gmail]/Sent Mail');

        const delay = 48 * 3600 * 1000 * 10; // 10 days back to cover the incident
        const yesterday = new Date(Date.now() - delay).toISOString();
        const searchCriteria = [
            ['OR', 
                ['HEADER', 'SUBJECT', 'Warranty Registration Confirmation'],
                ['HEADER', 'SUBJECT', 'Action Required: Confirm Customer Warranty Registration']
            ],
            ['SINCE', yesterday]
        ];

        const fetchOptions = {
            bodies: ['HEADER', 'TEXT', ''],
            struct: true
        };

        const messages = await connection.search(searchCriteria, fetchOptions);
        console.log(`Found ${messages.length} confirmation emails.`);

        const results = [];

        for (const message of messages) {
            const all = message.parts.find(part => part.which === '');
            const id = message.attributes.uid;
            const idHeader = "Imap-Id: " + id + "\r\n";
            const parser = await simpleParser(idHeader + all.body);
            
            const html = parser.html || '';
            const text = parser.text || '';

            // Check if this email contains any of our affected UIDs
            const foundUid = AFFECTED_UIDS.find(uid => html.includes(uid) || text.includes(uid));
            
            if (foundUid) {
                console.log(`Found email for UID: ${foundUid}`);
                
                // Extract EVERYTHING
                // Name pattern: Customer Name:</strong> Mohd Rizwan
                const nameMatch = html.match(/Customer Name:<\/strong>\s*([^<]+)/i);
                // Reg: Vehicle Registration:</strong> UP15BW9080
                const regMatch = html.match(/Vehicle Registration:<\/strong>\s*([^<]+)/i);
                // Phone: Phone:</strong> 8077531776
                const phoneMatch = html.match(/Phone:<\/strong>\s*([^<]+)/i);
                // Address: Address:</strong> ...
                const addressMatch = html.match(/Address:<\/strong>\s*([^<]+)/i);
                // Vehicle: Vehicle:</strong> ...
                const carMatch = html.match(/Vehicle:<\/strong>\s*([^<]+)/i);
                
                // Cloudinary Photos
                const photoMatches = html.match(/https:\/\/res\.cloudinary\.com\/[^\s"'>]+/g) || [];
                const uniquePhotos = [...new Set(photoMatches)].filter(p => !p.includes('autoform-logo'));

                results.push({
                    uid: foundUid,
                    originalName: nameMatch ? nameMatch[1].trim() : 'N/A',
                    originalReg: regMatch ? regMatch[1].trim() : 'N/A',
                    originalPhone: phoneMatch ? phoneMatch[1].trim() : 'N/A',
                    originalAddress: addressMatch ? addressMatch[1].trim() : 'N/A',
                    originalCar: carMatch ? carMatch[1].trim() : 'N/A',
                    photos: uniquePhotos,
                    date: parser.date,
                    subject: parser.subject
                });
            }
        }

        console.log(`Audited ${results.length} relevant emails.`);
        fs.writeFileSync('scratch/audit_email_results.json', JSON.stringify(results, null, 2));
        console.log('Results saved to scratch/audit_email_results.json');

        connection.end();
    } catch (err) {
        console.error('Audit Error:', err);
    }
}

auditEmails();
