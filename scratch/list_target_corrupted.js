import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function listCorrupted() {
    const reportPath = path.join(__dirname, 'deep_audit_full_report.json');
    if (!fs.existsSync(reportPath)) {
        console.log('Report not found.');
        return;
    }

    const report = JSON.parse(fs.readFileSync(reportPath, 'utf8')).report;
    console.log('=== DEFINITIVE LIST OF CORRUPTED RECORDS (34 TOTAL) ===');
    report.forEach((r, i) => {
        console.log(`${(i+1).toString().padStart(2, '0')}. UID: ${r.uid} | ${r.customer.padEnd(25)} | Created: ${r.purchase_date || 'N/A'}`);
    });
    console.log('=====================================================');
}

listCorrupted();
