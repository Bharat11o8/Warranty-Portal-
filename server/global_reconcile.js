import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import imaps from 'imap-simple';
import { simpleParser } from 'mailparser';

const CONFIG = {
    imap: {
        user: process.env.EMAIL_USER || 'marketing@autoformindia.com',
        password: process.env.EMAIL_PASSWORD || 'shubham@3197',
        host: 'imap.hostinger.com',
        port: 993,
        tls: true,
        authTimeout: 3000,
        tlsOptions: { rejectUnauthorized: false }
    },
    db: {
        host: 'srv839.hstgr.io',
        user: process.env.DB_USER || 'u823909847_warr',
        password: process.env.DB_PASSWORD || '@V+S&7Fc?f3V',
        database: 'u823909847_warranty'
    }
};

async function runGlobalReconciliation() {
    let db;
    try {
        console.log('--- STARTING GLOBAL RECONCILIATION ---');
        db = await mysql.createConnection(CONFIG.db);

        // 1. Get ALL UIDs from Database
        const [dbRows] = await db.query('SELECT uid, customer_name, customer_phone, customer_email, installer_name, installer_contact FROM warranty_registrations');
        const dbMap = new Map(dbRows.map(r => [r.uid, r]));
        console.log(`Found ${dbRows.length} records in Database.`);

        // 2. Scan Email Inbox for ALL registrations (Last 2000 emails)
        console.log('Connecting to Email IMAP...');
        const connection = await imaps.connect(CONFIG.imap);
        await connection.openBox('INBOX');

        const searchCriteria = [
            ['OR', ['SUBJECT', 'Warranty Registration Confirmation'], ['OR', ['SUBJECT', 'Action Required'], ['SUBJECT', 'Warranty Approved']]]
        ];
        const fetchOptions = { bodies: ['HEADER', 'TEXT'], struct: true };
        const messages = await connection.search(searchCriteria, fetchOptions);
        console.log(`Auditing ${messages.length} Warranty-related emails...`);

        const emailAuditMap = new Map();

        for (const item of messages) {
            const all = item.parts.filter(part => part.which === 'TEXT');
            const id = item.attributes.uid;
            const idHeader = item.parts.filter(part => part.which === 'HEADER');
            const toRecip = idHeader[0].body.to?.[0] || '';
            const subject = idHeader[0].body.subject?.[0] || '';

            for (const part of all) {
                const parsed = await simpleParser(part.body);
                const content = (parsed.text || parsed.html || '').replace(/\s+/g, ' ');
                
                // Extract UID
                const uidMatch = content.match(/Warranty ID:?\s*(\d{13,30})/i) || content.match(/UID:?\s*(\d{13,30})/i);
                if (uidMatch) {
                    const uid = uidMatch[1].trim();
                    if (!emailAuditMap.has(uid)) emailAuditMap.set(uid, { uid, recipients: new Set(), states: new Set(), phone: 'N/A', name: 'N/A' });
                    
                    const audit = emailAuditMap.get(uid);
                    audit.recipients.add(toRecip.toLowerCase());
                    audit.states.add(subject);
                    
                    const phoneMatch = content.match(/Phone:?\s*(\d{10})/i) || content.match(/Customer Phone:?\s*(\d{10})/i);
                    if (phoneMatch) audit.phone = phoneMatch[1].trim();
                    
                    const nameMatch = content.match(/Customer Name:?\s*([^<\|\n]+)/i);
                    if (nameMatch) audit.name = nameMatch[1].trim();
                }
            }
        }

        connection.end();

        // 3. Reconcile
        const reports = {
            missing_from_db: [],
            mismatched_details: [],
            healthy: []
        };

        for (const [uid, audit] of emailAuditMap) {
            const dbRecord = dbMap.get(uid);
            if (!dbRecord) {
                reports.missing_from_db.push(audit);
            } else {
                // Check for mismatch (e.g. if DB has cardynamic@outlook.com but email log shows something else)
                const logVendors = Array.from(audit.recipients).filter(r => r.includes('@') && !r.includes('icloud') && !r.includes('gmail'));
                const isMismatch = logVendors.length > 0 && !dbRecord.installer_contact.toLowerCase().includes(logVendors[0]);
                
                if (isMismatch) {
                    reports.mismatched_details.push({
                        uid,
                        db_vendor: dbRecord.installer_contact,
                        log_vendors: logVendors,
                        customer_name: audit.name
                    });
                } else {
                    reports.healthy.push(uid);
                }
            }
        }

        fs.writeFileSync('../scratch/global_reconciliation_report.json', JSON.stringify(reports, null, 2));
        console.log(`✅ Global Reconciliation Complete!`);
        console.log(`Missing from DB: ${reports.missing_from_db.length}`);
        console.log(`Mismatched in DB: ${reports.mismatched_details.length}`);
        console.log(`Report saved to scratch/global_reconciliation_report.json`);

    } catch (err) {
        console.error('Reconciliation failed:', err);
    } finally {
        if (db) await db.end();
    }
}

runGlobalReconciliation();
