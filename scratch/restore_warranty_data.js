import mysql from 'mysql2/promise';

async function restore() {
    const db = await mysql.createConnection({
        host: 'srv839.hstgr.io',
        user: 'u823909847_warr',
        password: '@V+S&7Fc?f3V',
        database: 'u823909847_warranty'
    });

    try {
        console.log('--- Starting Data Restoration ---');
        
        // Update names and emails from profiles based on user_id
        // We only target the 16 records that were found to be corrupted
        const [result] = await db.execute(`
            UPDATE warranty_registrations wr
            JOIN profiles p ON wr.user_id = p.id
            SET 
                wr.customer_name = p.name,
                wr.customer_email = p.email,
                wr.customer_phone = p.phone_number
            WHERE wr.id BETWEEN 1 AND 16
        `);

        console.log(`Success! Updated ${result.affectedRows} records with data from profiles.`);

        // Final sanity check
        const [rows] = await db.execute(`
            SELECT id, uid, customer_name, customer_email 
            FROM warranty_registrations 
            WHERE id BETWEEN 1 AND 16
        `);
        console.table(rows);

        console.log('--- Restoration Complete ---');

    } catch (err) {
        console.error('Restoration failed:', err);
    } finally {
        await db.end();
    }
}

restore();
