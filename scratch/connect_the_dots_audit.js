import fs from 'fs';
import path from 'path';

const dumpFile = path.resolve(process.cwd(), '../scratch/exhaustive_email_audit.json');
const dump = JSON.parse(fs.readFileSync(dumpFile, 'utf8'));

const finalMetadata = {};

for (const uid in dump) {
    const emails = dump[uid].found_emails;
    
    let customerEmail = 'NOT FOUND';
    let vendorEmail = 'NOT FOUND';
    let lastState = 'PENDING';
    
    for (const e of emails) {
        const subject = e.subject.toLowerCase();
        const to = e.to.toLowerCase();
        
        // Logical Split
        if (subject.includes('welcome') || subject.includes('registration confirmation') || (subject.includes('approved') && !subject.includes('application'))) {
             // These are usually sent to customers
             if (!to.includes('autoformindia.com')) {
                 customerEmail = to.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/)?.[1] || to;
             }
        }
        
        if (subject.includes('action required') || subject.includes('customer application')) {
             // These are sent to vendors
             vendorEmail = to.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/)?.[1] || to;
        }

        if (subject.includes('approved')) lastState = 'APPROVED';
        if (subject.includes('rejected') || subject.includes('action required')) lastState = 'REJECTED/ACTION REQUIRED';
    }

    finalMetadata[uid] = { uid, customerEmail, vendorEmail, lastState };
}

console.log(JSON.stringify(finalMetadata, null, 2));
