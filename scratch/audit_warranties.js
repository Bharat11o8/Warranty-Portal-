import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function audit() {
    const db = await mysql.createConnection({
        host: process.env.DB_HOST || 'srv839.hstgr.io',
        user: process.env.DB_USER || 'u823909847_warranty',
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'u823909847_warranty'
    });

    try {
        console.log('--- Recent Warranties Audit ---');
        // Get the latest 20 warranties to see if there's data duplication
        const [rows] = await db.execute(`
            SELECT id, uid, user_id, customer_name, customer_email, customer_phone, registration_number, status, created_at, updated_at
            FROM warranty_registrations 
            ORDER BY updated_at DESC 
            LIMIT 20
        `);

        console.table(rows);

        // Check for duplicate data across different IDs
        console.log('\n--- Checking for suspicious data duplication (same phone & reg across different IDs) ---');
        const [duplicates] = await db.execute(`
            SELECT customer_phone, registration_number, COUNT(*) as count, GROUP_CONCAT(uid) as uids
            FROM warranty_registrations
            WHERE status != 'rejected'
            GROUP BY customer_phone, registration_number
            HAVING count > 1
        `);

        if (duplicates.length > 0) {
            console.log('SUSPICIOUS: Found multiple warranties with same phone and registration!');
            console.table(duplicates);
            
            for (const dup of duplicates) {
                console.log(`\nDetail for Phone: ${dup.customer_phone}, Reg: ${dup.registration_number}`);
                const [details] = await db.execute(
                    'SELECT id, uid, customer_name, status, created_at, updated_at FROM warranty_registrations WHERE customer_phone = ? AND registration_number = ?',
                    [dup.customer_phone, dup.registration_number]
                );
                console.table(details);
            }
        } else {
            console.log('No obvious duplicates found by phone/reg.');
        }

    } catch (err) {
        console.error(err);
    } finally {
        await db.end();
    }
}

audit();
