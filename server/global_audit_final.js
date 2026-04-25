import 'dotenv/config';
import mysql from 'mysql2/promise';
import imaps from 'imap-simple';
import { simpleParser } from 'mailparser';
import fs from 'fs';

const CONFIG = {
    imap: {
        user: 'marketing@autoformindia.com',
        password: 'shubham@3197',
        host: 'imap.hostinger.com',
        port: 993,
        tls: true,
        authTimeout: 10000,
        tlsOptions: { rejectUnauthorized: false }
    },
    db: {
        host: 'srv839.hstgr.io',
        user: process.env.DB_USER || 'u823909847_warr',
        password: process.env.DB_PASSWORD || '@V+S&7Fc?f3V',
        database: 'u823909847_warranty'
    }
};

async function audit() {
    let db;
    try {
        console.log('--- GLOBAL RECONCILIATION (APRIL 2026) ---');
        db = await mysql.createConnection(CONFIG.db);
        const [dbRows] = await db.query('SELECT uid, customer_name, customer_phone, installer_name, installer_contact FROM warranty_registrations');
        const dbMap = new Map(dbRows.map(r => [r.uid, r]));

        console.log('Connecting to IMAP...');
        const connection = await imaps.connect({ imap: CONFIG.imap });
        await connection.openBox('INBOX');

        const searchCriteria = [['SINCE', '01-Apr-2026']];
        const fetchOptions = { bodies: ['HEADER', 'TEXT'], struct: true };
        const messages = await connection.search(searchCriteria, fetchOptions);
        console.log(`Analyzing ${messages.length} emails from April 2026...`);

        const emailAuditMap = new Map();

        for (const msg of messages) {
            const subject = msg.parts.find(p => p.which === 'HEADER')?.body?.subject?.[0] || '';
            const to = msg.parts.find(p => p.which === 'HEADER')?.body?.to?.[0] || '';
            
            if (subject.includes('Warranty') || subject.includes('Action Required')) {
                const textPart = msg.parts.find(p => p.which === 'TEXT');
                if (textPart) {
                    const parsed = await simpleParser(textPart.body);
                    const content = (parsed.text || '').replace(/\s+/g, ' ');
                    
                    const uidMatch = content.match(/UID:?\s*(\d{13,30})/i) || content.match(/Warranty ID:?\s*(\d{13,30})/i);
                    if (uidMatch) {
                        const uid = uidMatch[1].trim();
                        if (!emailAuditMap.has(uid)) emailAuditMap.set(uid, { uid, emailStates: [], foundVendors: new Set(), logDetails: {} });
                        
                        const entry = emailAuditMap.get(uid);
                        entry.emailStates.push(subject);
                        if (to.includes('@') && !to.includes('marketing')) entry.foundVendors.add(to.toLowerCase());

                        const phoneMatch = content.match(/Phone:?\s*(\d{10})/i);
                        if (phoneMatch) entry.logDetails.phone = phoneMatch[1].trim();
                        
                        const nameMatch = content.match(/Customer Name:?\s*([^<\|\n]+)/i);
                        if (nameMatch) entry.logDetails.name = nameMatch[1].trim();
                    }
                }
            }
        }
        connection.end();

        const results = { mismatches: [], missing: [], healthyCount: 0 };

        for (const [uid, auditData] of emailAuditMap) {
            const dbRec = dbMap.get(uid);
            if (!dbRec) {
                results.missing.push({ uid, details: auditData.logDetails, states: auditData.emailStates });
            } else {
                const vendors = Array.from(auditData.foundVendors).filter(v => !v.includes('gmail') && !v.includes('icloud'));
                const primaryVendor = vendors[0];
                
                const isSwapped = primaryVendor && !dbRec.installer_contact.toLowerCase().includes(primaryVendor);
                if (isSwapped) {
                    results.mismatches.push({
                        uid,
                        db: { name: dbRec.customer_name, vendor: dbRec.installer_contact },
                        log: { name: auditData.logDetails.name, vendorMatch: primaryVendor }
                    });
                } else {
                    results.healthyCount++;
                }
            }
        }

        fs.writeFileSync('global_audit_results.json', JSON.stringify(results, null, 2));
        console.log('✅ Global Audit Finished.');
        console.log(`Mismatches: ${results.mismatches.length}`);
        console.log(`Missing: ${results.missing.length}`);

    } catch (e) { console.error(e); }
    finally { if (db) await db.end(); }
}
audit();
