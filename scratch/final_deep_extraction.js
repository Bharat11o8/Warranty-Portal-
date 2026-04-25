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
        authTimeout: 20000
    }
};

const TARGET_UIDS = [
    '26041302432606', '26041302432620', '26032502427391', '26032302426664',
    '26031902425824', '26031602424705', '26031602424404', '25122902403812',
    '261480004540587', '26030202421275', '25122302402392', '25102302384412',
    '25100402380610', '25082902371655', '25081602368091', '26010302405294'
];

async function finalDeepExtraction() {
    try {
        console.log('--- Starting Final Deep Audit ---');
        const connection = await imapsync.connect(config);
        await connection.openBox('[Gmail]/Sent Mail');

        const searchCriteria = [['SINCE', new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString()]];
        const messages = await connection.search(searchCriteria, { bodies: [''], struct: true });
        
        const masterMap = {};

        for (const message of messages) {
            const all = message.parts.find(part => part.which === '');
            const parser = await simpleParser(all.body);
            const html = parser.html || '';
            const text = parser.text || '';

            const content = html + text;
            const foundUid = TARGET_UIDS.find(uid => content.includes(uid));
            
            if (foundUid) {
                // Extract Customer Metadata
                const customerName = html.match(/Customer Name:<\/strong>\s*([^<]+)/i)?.[1].trim() || 
                                     text.match(/Customer Name:\s*([^\r\n]+)/i)?.[1].trim();
                
                const reg = html.match(/Vehicle Registration:<\/strong>\s*([^<]+)/i)?.[1].trim() ||
                            text.match(/Vehicle Registration:\s*([^\r\n]+)/i)?.[1].trim();

                // Look for Phone and Address (broad search)
                const phone = content.match(/Phone:?\s*(\d{10})/i)?.[1];
                const address = content.match(/Address:?\s*([^<\r\n]+)/i)?.[1]?.trim();

                // Get ALL Cloudinary links
                const allLinks = [...new Set(content.match(/https:\/\/res\.cloudinary\.com\/[^\s\"'>]+/g) || [])]
                                    .filter(l => !l.includes('logo') && !l.includes('favicon'));

                // Determine if this email seems "original" (not Mr Amit unless UID 26041302432606 is actually him)
                const isDubious = customerName && (customerName.toLowerCase().includes('amit') && foundUid !== '26041302432606');

                if (!masterMap[foundUid] || (!isDubious && masterMap[foundUid].isDubious)) {
                    masterMap[foundUid] = {
                        uid: foundUid,
                        customer_name: customerName,
                        registration_number: reg,
                        phone: phone || masterMap[foundUid]?.phone,
                        address: address || masterMap[foundUid]?.address,
                        photos: allLinks,
                        isDubious,
                        date: parser.date
                    };
                }
            }
        }

        const results = Object.values(masterMap);
        fs.writeFileSync('../scratch/final_deep_recovery.json', JSON.stringify(results, null, 2));
        console.log(`Saved recovery data for ${results.length} UIDs.`);

        connection.end();
    } catch (err) {
        console.error('Final Extraction Error:', err);
    }
}

finalDeepExtraction();
