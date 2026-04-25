const fs = require('fs');
const path = require('path');

const auditFile = path.resolve(__dirname, '../scratch/exhaustive_email_audit.json');
const auditData = JSON.parse(fs.readFileSync(auditFile, 'utf8'));

const results = [];

for (const uid in auditData) {
    const entry = auditData[uid];
    const emails = entry.found_emails;
    
    let recovered = {
        uid: uid,
        customer_name: 'N/A',
        customer_phone: 'N/A',
        customer_email: 'N/A',
        installer_name: 'N/A',
        installer_phone: 'N/A',
        installer_email: 'N/A'
    };

    // Priorities: Action Required emails or Approval emails have more detailed store/customer splits
    const sortedEmails = emails.sort((a,b) => b.html.length - a.html.length); // Longer emails usually have more structured tables

    for (const email of sortedEmails) {
        const html = email.html || '';
        const text = email.text || '';
        const content = (html + text).replace(/\s+/g, ' ');

        // Customer Name
        const cn = content.match(/Customer Name:?\s*<\/strong>\s*([^<]+)/i) || 
                   content.match(/Customer Name:?\s*([^\r\n\|\-<]+)/i);
        if (cn) recovered.customer_name = cn[1].trim();

        // Customer Phone
        const cp = content.match(/Customer Phone:?\s*<\/strong>\s*([^<]+)/i) || 
                   content.match(/Customer Phone:?\s*(\d{10})/i) ||
                   content.match(/Phone:?\s*(\d{10})/i);
        if (cp) recovered.customer_phone = cp[1].trim();

        // Customer Email (if found in body)
        const ce = content.match(/Customer Email:?\s*<\/strong>\s*([^<]+)/i) ||
                   content.match(/Customer Email:?\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
        if (ce) recovered.customer_email = ce[1].trim();

        // Installer / Store Info
        // Usually found in "Hello [Store Name]" or "Forwarded to [Store Name]" or lists
        const sn = content.match(/Hello\s+([^,!<]+)/i); // In approval emails: "Hello STORE NAME,"
        if (sn && !sn[1].includes('Autoform') && !sn[1].includes('Parag') && !sn[1].includes('Huzfa')) {
            if (recovered.installer_name === 'N/A') recovered.installer_name = sn[1].trim();
        }

        // Alternative store match
        const sn2 = content.match(/Store:?\s*<\/strong>\s*([^<]+)/i) || content.match(/Shop Name:?\s*([^<]+)/i);
        if (sn2) recovered.installer_name = sn2[1].trim();

        // Recipient check
        if (email.subject.toLowerCase().includes('action required') || email.subject.toLowerCase().includes('approved')) {
             if (email.to.includes('@')) {
                 const toEmail = email.to.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
                 if (toEmail && !toEmail[1].includes(recovered.customer_email)) {
                     recovered.installer_email = toEmail[1].trim();
                 }
             }
        }
    }

    results.push(recovered);
}

console.log(JSON.stringify(results, null, 2));
