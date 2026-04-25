import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../server/.env') });

const config = {
    host: 'srv839.hstgr.io',
    user: process.env.DB_USER || 'u823909847_warr',
    password: process.env.DB_PASSWORD || '@V+S&7Fc?f3V',
    database: 'u823909847_warranty'
};

async function fixHuzfaRecord() {
    let db;
    try {
        db = await mysql.createConnection(config);
        console.log('--- FIXING INCONSISTENT DETAILS FOR UID: 25081602368091 ---');

        const uid = '25081602368091';
        const correctCustomerPhone = '7225907253';
        const correctInstallerName = 'Avs Motors ';
        const correctInstallerContact = 'avsmotorsindoreautoform@gmail.com | 7024767054';

        await db.execute(
            `UPDATE warranty_registrations 
             SET customer_email = ?, customer_phone = ?, installer_name = ?, installer_contact = ? 
             WHERE uid = ?`,
            ['N/A', correctCustomerPhone, correctInstallerName, correctInstallerContact, uid]
        );

        console.log(`✅ Successfully fixed details for ${uid}.`);
        console.log(`   Customer Phone: ${correctCustomerPhone}`);
        console.log(`   Installer: ${correctInstallerName}`);
        console.log(`   Contact: ${correctInstallerContact}`);

    } catch (err) {
        console.error('Fix Error:', err);
    } finally {
        if (db) await db.end();
    }
}

fixHuzfaRecord();
