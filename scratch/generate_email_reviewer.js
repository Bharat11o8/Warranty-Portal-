import fs from 'fs';
import path from 'path';

const dumpFile = path.resolve(process.cwd(), '../scratch/exhaustive_email_audit.json');
const dump = JSON.parse(fs.readFileSync(dumpFile, 'utf8'));

let html = `
<!DOCTYPE html>
<html>
<head>
    <title>Manual Email Audit Helper</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; background: #f4f6f8; color: #333; }
        .container { max-width: 1200px; margin: 0 auto; }
        .uid-section { background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); padding: 25px; margin-bottom: 40px; }
        h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
        h2 { color: #e67e22; margin-top: 0; }
        .email { border-top: 1px solid #eee; padding: 20px 0; }
        .subject { font-weight: bold; color: #2980b9; font-size: 1.1em; }
        .meta { font-size: 13px; color: #7f8c8d; margin-bottom: 10px; }
        .body-preview { 
            background: #2c3e50; 
            color: #ecf0f1; 
            padding: 15px; 
            border-radius: 5px; 
            white-space: pre-wrap; 
            font-family: 'Courier New', Courier, monospace; 
            font-size: 14px;
            max-height: 500px;
            overflow-y: auto;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Manual Email Audit Helper</h1>
        <p>Please review the emails below for the 15 corrupted UIDs. Look for "Customer Name", "Phone", and "Email" fields to identify the correct data for restoration.</p>
`;

for (const uid in dump) {
    html += `<div class="uid-section"><h2>UID: ${uid}</h2>`;
    dump[uid].found_emails.forEach(e => {
        const bodyContent = (e.text || e.html || 'No content found').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        html += `
            <div class="email">
                <div class="subject">SUBJECT: ${e.subject}</div>
                <div class="meta">TO: ${e.to} | DATE: ${e.date}</div>
                <div class="body-preview">${bodyContent}</div>
            </div>
        `;
    });
    html += `</div>`;
}

html += `
    </div>
</body>
</html>
`;

fs.writeFileSync('../scratch/email_reviewer.html', html);
console.log('Successfully generated scratch/email_reviewer.html');
