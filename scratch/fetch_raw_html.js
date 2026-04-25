import imapsync from 'imap-simple';
import { simpleParser } from 'mailparser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

async function fetchRawEmail() {
    try {
        console.log('--- Connecting to Gmail Sent Folder ---');
        const connection = await imapsync.connect(config);
        await connection.openBox('[Gmail]/Sent Mail');

        const delay = 24 * 3600 * 1000 * 5; 
        const sinceDate = new Date(Date.now() - delay).toISOString();
        
        // Search for the specific email for Parag Agarwal / UID 25082902371655
        const searchCriteria = [
            ['HEADER', 'SUBJECT', 'Warranty Registration Confirmation'],
            ['BODY', '25082902371655'],
            ['SINCE', sinceDate]
        ];

        const fetchOptions = {
            bodies: ['HEADER', 'TEXT', ''],
            struct: true
        };

        console.log('Searching for target email...');
        const messages = await connection.search(searchCriteria, fetchOptions);
        console.log(`Found ${messages.length} matching emails.`);

        if (messages.length > 0) {
            const message = messages[messages.length - 1]; // get latest
            const all = message.parts.find(part => part.which === '');
            const id = message.attributes.uid;
            const idHeader = "Imap-Id: " + id + "\r\n";
            const parser = await simpleParser(idHeader + all.body);
            
            const html = parser.html || '';
            const testFilePath = path.join(__dirname, '../scratch/raw_email_25082902371655.html');
            fs.writeFileSync(testFilePath, html);
            console.log(`Saved raw HTML to ${testFilePath}`);
        } else {
            // If Parag isn't found, try another corrupted one like Shubhas bhai (uid: 25100402380610)
            const searchCriteria2 = [
                ['HEADER', 'SUBJECT', 'Warranty Registration Confirmation'],
                ['BODY', '25100402380610'],
                ['SINCE', sinceDate]
            ];
            const msgs2 = await connection.search(searchCriteria2, fetchOptions);
            if(msgs2.length > 0) {
                const message = msgs2[msgs2.length - 1];
                const all = message.parts.find(part => part.which === '');
                const id = message.attributes.uid;
                const idHeader = "Imap-Id: " + id + "\r\n";
                const parser = await simpleParser(idHeader + all.body);
                const html = parser.html || '';
                const testFilePath = path.join(__dirname, '../scratch/raw_email_25100402380610.html');
                fs.writeFileSync(testFilePath, html);
                console.log(`Saved raw HTML to ${testFilePath}`);
            } else {
                 console.log('No matching emails found.');
            }
        }
        connection.end();
    } catch (err) {
        console.error('IMAP Error:', err);
    }
}

fetchRawEmail();
