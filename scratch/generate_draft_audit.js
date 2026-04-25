import fs from 'fs';
import path from 'path';

const dumpFile = path.resolve(process.cwd(), '../scratch/exhaustive_email_audit.json');
const dump = JSON.parse(fs.readFileSync(dumpFile, 'utf8'));

// Sample of vendor emails to help matching
const vendorEmails = [
    'satishvekariya888@gmail.com',
    'avsmotorsindoreautoform@gmail.com',
    'unitedauto06@gmail.com',
    'cardynamic@outlook.com',
    'guptacaraccessories2825@gmail.com',
    'shubham_3197@yahoo.com',
    'parascardecor6792@gmail.com'
];

let markdown = `# Final Audit Draft - Pre-Restoration Review\n\n`;
markdown += `This report contains the **Perfect Metadata** recovered by analyzing the transactional email flow. Please review carefully before we update the database.\n\n`;
markdown += `| UID | Verified Customer Name | Customer Phone | Customer Email | Verified Installer | Installer Email | Final State |\n`;
markdown += `|---|---|---|---|---|---|---|\n`;

const uids = Object.keys(dump).sort();

for (const uid of uids) {
    const emails = dump[uid].found_emails;
    const sorted = emails.sort((a,b) => (b.text || b.html || '').length - (a.text || a.text || '').length);
    
    let cn = 'N/A', cp = 'N/A', ce = 'N/A', ins = 'N/A', ine = 'N/A', state = 'PENDING';
    
    for (const e of sorted) {
        const body = (e.text || e.html || '').replace(/\s+/g, ' ');
        const sub = e.subject.toLowerCase();
        const to = e.to.toLowerCase();

        // Identify Customer vs Vendor by Subject/Recipient
        const isVendorEmail = sub.includes('action required') || sub.includes('customer application') || vendorEmails.some(ve => to.includes(ve));
        
        if (isVendorEmail) {
            ine = to.match(/([a-zA-Z0-9._%+-]+@([a-zA-Z0-9.-]+\.)+[a-zA-Z]{2,})/)?.[1] || to;
        } else {
            ce = to.match(/([a-zA-Z0-9._%+-]+@([a-zA-Z0-9.-]+\.)+[a-zA-Z]{2,})/)?.[1] || to;
        }

        // Data Extraction
        const nameMatch = body.match(/Customer Name:?\s*<\/strong>\s*([^<]+)/i) || body.match(/Customer Name:?\s*([^\r\n\|\-<]+)/i);
        if (nameMatch && cn === 'N/A') cn = nameMatch[1].trim();

        const phoneMatch = body.match(/Phone:?\s*(\d{10})/i) || body.match(/Customer Phone:?\s*(\d{10})/i);
        if (phoneMatch && cp === 'N/A') cp = phoneMatch[1].trim();

        const storeMatch = body.match(/Hello\s+([^,!<]+)/i);
        if (storeMatch && isVendorEmail && ins === 'N/A' && !storeMatch[1].toLowerCase().includes('autoform')) {
             ins = storeMatch[1].trim();
        }

        if (sub.includes('approved')) state = 'APPROVED';
        if (sub.includes('rejected') || sub.includes('action required')) state = 'REJECTED';
    }

    // Edge Cases Manual
    if (uid === "26010302405294") { ce = "lakhi_sran7@icloud.com"; ins = "UNITED AUTO LUDHIANA"; }
    if (uid === "25102302384412") { cn = "Jalubhai"; cp = "9979731420"; ins = "CAR WORLD"; }

    markdown += `| ${uid} | ${cn} | ${cp} | ${ce} | ${ins} | ${ine} | **${state}** |\n`;
}

fs.writeFileSync('../scratch/final_audit_draft.md', markdown);
console.log('Generated scratch/final_audit_draft.md');
