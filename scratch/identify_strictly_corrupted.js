import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function identifyStrictlyCorrupted() {
    try {
        const dump = JSON.parse(fs.readFileSync(path.join(__dirname, 'exhaustive_email_audit.json'), 'utf8'));
        const dbData = JSON.parse(fs.readFileSync(path.join(__dirname, 'deep_audit_full_report.json'), 'utf8')).report;
        
        const strictlyCorrupted = [];

        dbData.forEach(r => {
            if (dump[r.uid] && r.purchase_date) { // Using the purchase_date collected during my audit
                const emails = dump[r.uid].found_emails;
                const emailDate = new Date(emails.reduce((a, b) => new Date(a.date) < new Date(b.date) ? a : b).date);
                const dbDate = new Date(r.db_date);

                // We are looking for: Registration on April 21 (or earlier), Purchase showed on April 22
                const emailDay = emailDate.getUTCDate();
                const dbDay = dbDate.getUTCDate();

                if (emailDay === 21 && dbDay === 22) {
                    strictlyCorrupted.push({
                        uid: r.uid,
                        customer: r.customer,
                        emailDate: emailDate.toISOString(),
                        dbDate: dbDate.toISOString()
                    });
                }
            }
        });

        console.log('STRICTLY CORRUPTED UIDs:');
        console.log(JSON.stringify(strictlyCorrupted, null, 2));

    } catch (err) {
        console.error('Failed to identify corrupted records:', err);
    }
}

identifyStrictlyCorrupted();
