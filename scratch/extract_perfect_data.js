import fs from 'fs';
import path from 'path';

const dumpFile = path.resolve(process.cwd(), '../scratch/exhaustive_email_audit.json');
const dump = JSON.parse(fs.readFileSync(dumpFile, 'utf8'));

const results = [];

for (const uid in dump) {
    const emails = dump[uid].found_emails;
    // Sort by content length to find the most detailed email (likely Action Required or Approval)
    const sorted = emails.sort((a,b) => (b.html || b.text || '').length - (a.html || a.text || '').length);
    
    let recovered = {
        uid: uid,
        name: 'N/A',
        phone: 'N/A',
        email: 'N/A',
        address: 'N/A',
        installer_name: 'N/A',
        installer_contact: 'N/A'
    };

    for (const e of sorted) {
        const h = (e.html || e.text || '').replace(/\s+/g, ' ');
        
        // Extracting from structured fields
        const name = h.match(/Customer Name:?\s*<\/strong>\s*([^<]+)/i) || h.match(/Customer Name:?\s*([^\r\n\|\-<]+)/i);
        if (name && recovered.name === 'N/A') recovered.name = name[1].trim();

        const phone = h.match(/Customer Phone:?\s*<\/strong>\s*([^<]+)/i) || h.match(/Customer Phone:?\s*(\d{10})/i) || h.match(/Phone:?\s*(\d{10})/i);
        if (phone && recovered.phone === 'N/A') recovered.phone = phone[1].trim();

        const address = h.match(/Customer Address:?\s*<\/strong>\s*([^<]+)/i) || h.match(/Address:?\s*([^<\r\n\|]+)/i);
        if (address && recovered.address === 'N/A' && !address[1].includes('N/A')) recovered.address = address[1].trim();

        const email = h.match(/Customer Email:?\s*<\/strong>\s*([^<]+)/i) || h.match(/([a-zA-Z0-9._%+-]+@icloud\.com|[a-zA-Z0-9._%+-]+@gmail\.com)/i);
        if (email && recovered.email === 'N/A') {
             const m = email[0].match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
             if (m) recovered.email = m[1].trim();
        }

        // Installer
        if (e.subject.includes('Action Required') || e.subject.includes('Approved')) {
            const sn = h.match(/Hello\s+([^,!<]+)/i);
            if (sn && !sn[1].includes('Autoform') && !sn[1].includes(recovered.name)) {
                if (recovered.installer_name === 'N/A') recovered.installer_name = sn[1].trim();
            }
            if (recovered.installer_contact === 'N/A') recovered.installer_contact = e.to;
        }
    }
    
    // Manual refinement for known complex ones
    if (uid === "26010302405294") recovered.email = "lakhi_sran7@icloud.com";
    if (uid === "25102302384412") recovered.phone = "9979731420";
    if (uid === "25100402380610") recovered.phone = "8140456551";

    results.push(recovered);
}

console.log(JSON.stringify(results, null, 2));
