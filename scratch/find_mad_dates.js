import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function findMadDates() {
    try {
        const dump = JSON.parse(fs.readFileSync(path.join(__dirname, 'exhaustive_email_audit.json'), 'utf8'));
        const dbData = JSON.parse(fs.readFileSync(path.join(__dirname, 'deep_audit_full_report.json'), 'utf8')).report;
        
        const madEntries = [];

        dbData.forEach(r => {
            if (dump[r.uid] && r.purchase_date) {
                const emails = dump[r.uid].found_emails;
                const emailTimestamp = new Date(emails.reduce((a, b) => new Date(a.date) < new Date(b.date) ? a : b).date);
                const dbTimestamp = new Date(r.purchase_date);

                // Convert to IST (UTC + 5:30)
                const istEmail = new Date(emailTimestamp.getTime() + (5.5 * 60 * 60 * 1000));
                const istDb = new Date(dbTimestamp.getTime() + (5.5 * 60 * 60 * 1000));

                const istEmailStr = istEmail.toISOString().split('T')[0];
                const istDbStr = istDb.toISOString().split('T')[0];

                // IF Purchase Day (approx 22nd) is AFTER Registration Day (approx 21st)
                if (istDbStr > istEmailStr) {
                    madEntries.push({
                        uid: r.uid,
                        customer: r.customer,
                        trueRegistrationIST: istEmailStr,
                        corruptedPurchaseIST: istDbStr
                    });
                }
            }
        });

        console.log('=== STRICTLY CORRUPTED ENTRIES (MAD TIMELINE) ===');
        console.log(JSON.stringify(madEntries, null, 2));

    } catch (err) {
        console.error('Failed to analyze dates:', err);
    }
}

findMadDates();
