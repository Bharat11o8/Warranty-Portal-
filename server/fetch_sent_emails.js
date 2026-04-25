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
        authTimeout: 3000
    }
};

async function fetchSentEmails() {
    try {
        console.log('--- Connecting to Gmail Sent Folder ---');
        const connection = await imapsync.connect(config);
        
        // Gmail stores sent emails in '[Gmail]/Sent Mail'
        await connection.openBox('[Gmail]/Sent Mail');

        // Search for emails with specific subjects in the last 3 days
        const delay = 24 * 3600 * 1000 * 3; 
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
        console.log(`Found ${messages.length} confirmation emails in Sent folder.`);

        const recoveredData = [];

        for (const message of messages) {
            const all = message.parts.find(part => part.which === '');
            const id = message.attributes.uid;
            const idHeader = "Imap-Id: " + id + "\r\n";
            const parser = await simpleParser(idHeader + all.body);
            
            const html = parser.html || '';
            const text = parser.text || '';

            // Extract data using Regex
            // UID Pattern: UID:</strong> 26031602424705
            const uidMatch = html.match(/UID:<\/strong>\s*(\d+)/i) || text.match(/UID:\s*(\d+)/i);
            // Registration Pattern: Vehicle Registration:</strong> HR26CR0001
            const regMatch = html.match(/Vehicle Registration:<\/strong>\s*([^<]+)/i) || text.match(/Vehicle Registration:\s*([^\n]+)/i);
            // Vehicle Pattern: Vehicle:</strong> Maruti Suzuki Swift
            const carMatch = html.match(/Vehicle:<\/strong>\s*([^<]+)/i) || text.match(/Vehicle:\s*([^\n]+)/i);
            // Product Pattern: Product:</strong> SEAT COVER
            const productMatch = html.match(/Product:<\/strong>\s*([^<]+)/i) || text.match(/Product:\s*([^\n]+)/i);
            
            // Image URL Recovery (Regex for Cloudinary URLs)
            // Example: <img src="https://res.cloudinary.com/..."
            const imgSrcs = html.match(/https:\/\/res\.cloudinary\.com\/[^\s"'>]+/g) || [];
            
            // The emails usually have the Logo first, then maybe product photos.
            // In the EmailService, there's no direct photo link in the generic confirmation email 
            // EXCEPT for approval emails. Let's check what the user's Sent folder has.
            
            if (uidMatch) {
                recoveredData.push({
                    uid: uidMatch[1].trim(),
                    registrationNumber: regMatch ? regMatch[1].trim() : 'N/A',
                    carDetails: carMatch ? carMatch[1].trim() : 'N/A',
                    product: productMatch ? productMatch[1].trim() : 'N/A',
                    images: imgSrcs,
                    date: parser.date
                });
            }
        }

        console.log(`Extracted data for ${recoveredData.length} warranties.`);
        console.table(recoveredData);

        fs.writeFileSync('../scratch/recovered_car_data.json', JSON.stringify(recoveredData, null, 2));
        console.log('Saved mapping to scratch/recovered_car_data.json');

        connection.end();
    } catch (err) {
        console.error('IMAP Error:', err);
    }
}

fetchSentEmails();
