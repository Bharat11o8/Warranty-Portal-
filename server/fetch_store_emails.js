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

async function fetchVendorEmails() {
    try {
        console.log('--- Connecting to Gmail Sent Folder for Store Recovery ---');
        const connection = await imapsync.connect(config);
        await connection.openBox('[Gmail]/Sent Mail');

        // Search for vendor confirmation emails (these go TO the store email)
        const delay = 24 * 3600 * 1000 * 5; // 5 days to be safe
        const since = new Date(Date.now() - delay).toISOString();
        const searchCriteria = [
            ['HEADER', 'SUBJECT', 'Action Required: Confirm Customer Warranty Registration'],
            ['SINCE', since]
        ];

        const fetchOptions = {
            bodies: ['HEADER', 'TEXT', ''],
            struct: true
        };

        const messages = await connection.search(searchCriteria, fetchOptions);
        console.log(`Found ${messages.length} vendor confirmation emails.`);

        const storeData = [];

        for (const message of messages) {
            const all = message.parts.find(part => part.which === '');
            const id = message.attributes.uid;
            const idHeader = "Imap-Id: " + id + "\r\n";
            const parser = await simpleParser(idHeader + all.body);
            
            const html = parser.html || '';
            const text = parser.text || '';
            const toAddress = parser.to?.value?.[0]?.address || 'N/A';
            const toName = parser.to?.value?.[0]?.name || 'N/A';

            // Extract UID from email body
            const uidMatch = html.match(/UID:<\/strong>\s*(\d+)/i) || text.match(/UID:\s*(\d+)/i);
            
            // Extract Customer Name  
            const customerMatch = html.match(/Customer Name:<\/strong>\s*([^<]+)/i) || text.match(/Customer Name:\s*([^\n]+)/i);
            
            // Extract Vehicle Registration
            const regMatch = html.match(/Vehicle Registration:<\/strong>\s*([^<]+)/i) || text.match(/Vehicle Registration:\s*([^\n]+)/i);
            
            // Extract Make
            const makeMatch = html.match(/Make:<\/strong>\s*([^<]+)/i) || text.match(/Make:\s*([^\n]+)/i);
            
            // Extract Model
            const modelMatch = html.match(/Model:<\/strong>\s*([^<]+)/i) || text.match(/Model:\s*([^\n]+)/i);
            
            // Extract Product
            const productMatch = html.match(/Product:<\/strong>\s*([^<]+)/i) || text.match(/Product:\s*([^\n]+)/i);

            // The "Hello STORE_NAME," greeting tells us the store name
            const storeNameMatch = html.match(/Hello\s+([^,<]+),/i) || text.match(/Hello\s+([^,\n]+),/i);

            if (uidMatch) {
                storeData.push({
                    uid: uidMatch[1].trim(),
                    storeName: storeNameMatch ? storeNameMatch[1].trim() : 'N/A',
                    storeEmail: toAddress,
                    customerName: customerMatch ? customerMatch[1].trim() : 'N/A',
                    registrationNumber: regMatch ? regMatch[1].trim() : 'N/A',
                    carMake: makeMatch ? makeMatch[1].trim() : 'N/A',
                    carModel: modelMatch ? modelMatch[1].trim() : 'N/A',
                    product: productMatch ? productMatch[1].trim() : 'N/A',
                    date: parser.date
                });
            }
        }

        console.log(`\nExtracted store data for ${storeData.length} warranties:\n`);
        console.table(storeData.map(s => ({
            uid: s.uid,
            storeName: s.storeName,
            storeEmail: s.storeEmail,
            customer: s.customerName,
            reg: s.registrationNumber
        })));

        fs.writeFileSync('../scratch/recovered_store_data.json', JSON.stringify(storeData, null, 2));
        console.log('\nSaved to scratch/recovered_store_data.json');

        connection.end();
    } catch (err) {
        console.error('IMAP Error:', err);
    }
}

fetchVendorEmails();
