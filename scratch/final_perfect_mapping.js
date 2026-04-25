const fs = require('fs');
const path = require('path');

const auditFile = path.resolve(__dirname, '../scratch/exhaustive_email_audit.json');
const auditData = JSON.parse(fs.readFileSync(auditFile, 'utf8'));

// Official Vendor List (from my last DB check)
const vendorDir = {
    "satishvekariya888@gmail.com": "CAR WORLD",
    "subh.goswami555@gmail.com": "MANTHAN AUTO CARE", // Wait! Let me check if this email matches this store accurately
    "avsmotorsindoreautoform@gmail.com": "Avs Motors ",
    "unitedauto06@gmail.com": "UNITED AUTO LUDHIANA",
    "cardynamic@outlook.com": "CAR DYNAMIC PVT LTD",
    "parascardecor6792@gmail.com": "PARAS CAR DECOR",
    "shubham_3197@yahoo.com": "BHAGWATI AUTO ACCESSORIES (RAJKOT)",
    "ashishnalge06@gmail.com": "KALYAN MOTOR CAR ACCESSORIES",
    "proauto.solutionspune@gmail.com": "PRO AUTO SOLUTIONS",
    "pamnani007@gmail.com": "SSD CAR ACCESSORIES",
    "accounts@poonamotors.co.in": "POONA MOTORS PVT. LTD."
};

const finalMapping = {};

for (const uid in auditData) {
    const emails = auditData[uid].found_emails;
    const sorted = emails.sort((a,b) => b.html.length - a.html.length);
    
    let entry = { uid, customer_name: 'N/A', customer_phone: 'N/A', installer_name: 'N/A', installer_contact: 'N/A' };
    
    for (const email of sorted) {
        const content = (email.html || email.text || '').replace(/\s+/g, ' ');
        
        // Extract Customer
        const cn = content.match(/Customer Name:?\s*<\/strong>\s*([^<]+)/i) || content.match(/Customer Name:?\s*([^\r\n\|\-<]+)/i);
        if (cn) entry.customer_name = cn[1].trim();

        const cp = content.match(/Customer Phone:?\s*<\/strong>\s*([^<]+)/i) || content.match(/Customer Phone:?\s*(\d{10})/i) || content.match(/Phone:?\s*(\d{10})/i);
        if (cp) entry.customer_phone = cp[1].trim();

        // Extract Installer Email
        if (email.subject.includes('Action Required') || email.subject.includes('Approved')) {
            const toEmail = email.to.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
            if (toEmail) {
                const mail = toEmail[1].trim();
                if (vendorDir[mail]) {
                    entry.installer_name = vendorDir[mail];
                    entry.installer_contact = mail;
                } else {
                    entry.installer_contact = mail;
                }
            }
        }
    }
    
    // Fallback for names already fixed manually
    if (uid === "26030202421275") entry.customer_name = "Jignesh Rathwa";
    if (uid === "25081602368091") entry.customer_name = "Huzfa sir";
    
    finalMapping[uid] = entry;
}

console.log(JSON.stringify(finalMapping, null, 2));
