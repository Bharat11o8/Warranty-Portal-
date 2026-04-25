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
        
        const searchCriteria = [
            ['HEADER', 'SUBJECT', 'Warranty Registration Confirmation'],
            ['BODY', '25082902371655'],
            ['SINCE', sinceDate]
        ];

        const fetchOptions = {
            bodies: ['HEADER', 'TEXT', ''],
            struct: true
        };

        const messages = await connection.search(searchCriteria, fetchOptions);
        if (messages.length > 0) {
            const message = messages[messages.length - 1]; // get latest
            const all = message.parts.find(part => part.which === '');
            const id = message.attributes.uid;
            const idHeader = "Imap-Id: " + id + "\r\n";
            const parser = await simpleParser(idHeader + all.body);
            
            const html = parser.html || '';
            const testFilePath = path.join(__dirname, '../scratch/raw_email_1.html');
            fs.writeFileSync(testFilePath, html);
            console.log(`Saved raw HTML for 25082902371655`);
        } else {
            console.log('Not found paragraph. Trying Subhash...');
            const searchCriteria2 = [
                ['HEADER', 'SUBJECT', 'Action Required: Confirm Customer Warranty Registration'],
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
                const testFilePath = path.join(__dirname, '../scratch/raw_email_2.html');
                fs.writeFileSync(testFilePath, html);
                console.log(`Saved raw HTML for 25100402380610`);
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
