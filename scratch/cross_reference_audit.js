const fs = require('fs');
const path = require('path');

const FILE_PATH = path.resolve(__dirname, '../scratch/full_email_dump.json');
const emailDump = JSON.parse(fs.readFileSync(FILE_PATH, 'utf8'));

const results = [];
const uids = [...new Set(emailDump.map(e => e.uid))];

for (const uid of uids) {
    const emails = emailDump.filter(e => e.uid === uid);
    
    // Combine text and html for searching
    const combinedContent = emails.map(e => (e.text || '') + (e.html || '')).join(' ').replace(/\s+/g, ' ');

    // regex for details
    const nameMatch = combinedContent.match(/Customer Name:\s*<\/strong>\s*([^<]+)/i) || 
                      combinedContent.match(/Customer Name:\s*([^\r\n\|<]+)/i);
    
    const phoneMatch = combinedContent.match(/Customer Phone:?\s*(\d{10})/i) || 
                       combinedContent.match(/Phone:?\s*(\d{10})/i) ||
                       combinedContent.match(/(\d{10})/);

    const regMatch = combinedContent.match(/Vehicle Registration:\s*<\/strong>\s*([^<]+)/i) ||
                     combinedContent.match(/Vehicle Registration:\s*([^\r\n\|<]+)/i);

    const addressMatch = combinedContent.match(/Customer Address:?\s*([^<\r\n\|]+)/i) ||
                         combinedContent.match(/Address:?\s*([^<\r\n\|]+)/i);

    results.push({
        uid,
        recovered_name: nameMatch ? nameMatch[1].trim() : 'N/A',
        recovered_phone: phoneMatch ? phoneMatch[1].trim() : 'N/A',
        recovered_reg: regMatch ? regMatch[1].trim() : 'N/A',
        recovered_address: addressMatch ? addressMatch[1].trim() : 'N/A'
    });
}

console.log(JSON.stringify(results, null, 2));
