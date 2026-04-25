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

async function extractPreciseData() {
    try {
        console.log('--- Connecting to Gmail ---');
        const connection = await imapsync.connect(config);
        await connection.openBox('[Gmail]/Sent Mail');

        const delay = 14 * 24 * 3600 * 1000; // Search last 14 days
        const sinceDate = new Date(Date.now() - delay).toISOString();
        const searchCriteria = [['SINCE', sinceDate]];

        const fetchOptions = {
            bodies: [''],
            struct: true
        };

        const messages = await connection.search(searchCriteria, fetchOptions);
        console.log(`Found ${messages.length} sent emails in search range.`);

        const extractedData = {};

        for (const message of messages) {
            const all = message.parts.find(part => part.which === '');
            const parser = await simpleParser(all.body);
            const html = parser.html || '';
            const text = parser.text || '';

            // Check if this email mentions any of our targets
            const foundUid = TARGET_UIDS.find(uid => html.includes(uid) || text.includes(uid));
            
            if (foundUid) {
                console.log(`Extracting data for UID: ${foundUid}`);
                
                // Customer Name: Mr Amit
                // Use multiple regex patterns to follow different templates
                const name = html.match(/Customer Name:<\/strong>\s*([^<]+)/i)?.[1].trim() || 
                             text.match(/Customer Name:\s*([^\r\n]+)/i)?.[1].trim();

                const reg = html.match(/Vehicle Registration:<\/strong>\s*([^<]+)/i)?.[1].trim() ||
                            text.match(/Vehicle Registration:\s*([^\r\n]+)/i)?.[1].trim();

                const phone = html.match(/Phone:<\/strong>\s*([^<]+)/i)?.[1].trim() ||
                              text.match(/Phone:\s*([^\r\n]+)/i)?.[1].trim();

                const address = html.match(/Address:<\/strong>\s*([^<]+)/i)?.[1].trim() ||
                                text.match(/Address:\s*([^\r\n]+)/i)?.[1].trim();

                // Get all Cloudinary links
                const photoLinks = [...new Set(html.match(/https:\/\/res\.cloudinary\.com\/[^\s\"'>]+/g) || [])]
                                    .filter(link => !link.includes('autoform-logo'));

                // We only save if we haven't found info for this UID yet, or if this info is "better" (e.g. has a name that isn't 'Amit' or store name)
                const isCorruptedName = name && (name.toLowerCase().includes('amit') || name.toLowerCase().includes('partner'));
                
                if (!extractedData[foundUid] || (!isCorruptedName && extractedData[foundUid].isCorrupted)) {
                    extractedData[foundUid] = {
                        uid: foundUid,
                        name,
                        reg,
                        phone,
                        address,
                        photos: photoPhotos(photoLinks), // helper to categorize if possible
                        allPhotos: photoLinks,
                        isCorrupted: isCorruptedName,
                        date: parser.date,
                        subject: parser.subject
                    };
                }
            }
        }

        function photoPhotos(links) {
            // Organize links into the structure needed for product_details.photos
            // We'll just provide the array for now
            return links;
        }

        const finalResults = Object.values(extractedData);
        console.log(`Recovered data for ${finalResults.length} UIDs.`);
        fs.writeFileSync('../scratch/precise_recovery_results.json', JSON.stringify(finalResults, null, 2));
        console.log('Results saved to scratch/precise_recovery_results.json');

        connection.end();
    } catch (err) {
        console.error('Precise Recovery Error:', err);
    }
}

extractPreciseData();
