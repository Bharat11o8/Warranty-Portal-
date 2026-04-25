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
        authTimeout: 20000, // Long timeout for stability
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
        console.log('--- GLOBAL RECONCILIATION: FINDING ALL CORRUPTED RECORDS ---');
        db = await mysql.createConnection(CONFIG.db);
        const [dbRows] = await db.query('SELECT uid, customer_name, customer_phone, installer_name, installer_contact FROM warranty_registrations');
        const dbMap = new Map(dbRows.map(r => [r.uid, r]));

        console.log('Connecting to Email IMAP...');
        const connection = await imaps.connect({ imap: CONFIG.imap });
        await connection.openBox('INBOX');

        // Search only for April 2026 emails to find the corruption scope
        const searchCriteria = [['SINCE', '01-Apr-2026']];
        const fetchOptions = { bodies: ['HEADER', 'TEXT'], struct: true };
        const messages = await connection.search(searchCriteria, fetchOptions);
        console.log(`Analyzing ${messages.length} emails from April 2026...`);

        const reconciliationData = new Map();

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
                        if (!reconciliationData.has(uid)) {
                            reconciliationData.set(uid, { 
                                uid, 
                                emailRecipients: new Set(), 
                                subjects: new Set(),
                                logPhone: null,
                                logName: null,
                                finalizedStatus: 'pending' // Default
                            });
                        }
                        
                        const entry = reconciliationData.get(uid);
                        entry.subjects.add(subject);
                        if (to.includes('@') && !to.includes('marketing')) entry.emailRecipients.add(to.toLowerCase());

                        if (subject.includes('Approved')) entry.finalizedStatus = 'validated';
                        if (subject.includes('Rejected') || subject.includes('Disapproved')) entry.finalizedStatus = 'rejected';

                        const phoneMatch = content.match(/Phone:?\s*(\d{10})/i);
                        if (phoneMatch) entry.logPhone = phoneMatch[1].trim();
                        
                        const nameMatch = content.match(/Customer Name:?\s*([^<\|\n]+)/i);
                        if (nameMatch) entry.logName = nameMatch[1].trim();
                    }
                }
            }
        }
        connection.end();

        const reports = { mismatches: [], missingInDb: [], counts: { totalEmails: messages.length, totalDbRecords: dbRows.length } };

        for (const [uid, log] of reconciliationData) {
            const dbRec = dbMap.get(uid);
            if (!dbRec) {
                reports.missingInDb.push(log);
            } else {
                // Check if Store Email matches
                const vendors = Array.from(log.emailRecipients).filter(v => !v.includes('gmail') && !v.includes('icloud'));
                const originalVendorEmail = vendors[0];
                const isSwapped = originalVendorEmail && !dbRec.installer_contact.toLowerCase().includes(originalVendorEmail);
                
                if (isSwapped || (log.logPhone && dbRec.customer_phone !== log.logPhone)) {
                    reports.mismatches.push({
                        uid,
                        dbState: { name: dbRec.customer_name, phone: dbRec.customer_phone, vendor: dbRec.installer_contact },
                        logTruth: { name: log.logName, phone: log.logPhone, vendor: originalVendorEmail, status: log.finalizedStatus }
                    });
                }
            }
        }

        fs.writeFileSync('../scratch/comprehensive_restoration_report.json', JSON.stringify(reports, null, 2));
        console.log('✅ Comprehensive Audit Finished.');
        console.log(`Detected Mismatches (Corrupted): ${reports.mismatches.length}`);
        console.log(`Detected Missing Records: ${reports.missingInDb.length}`);

    } catch (e) {
        console.error('Audit failed:', e);
    } finally {
        if (db) await db.end();
    }
}
audit();
