import mysql from 'mysql2/promise';

async function checkIds() {
    try {
        const db = await mysql.createConnection({
            host: 'srv839.hstgr.io',
            user: 'u823909847_warr',
            password: '@V+S&7Fc?f3V',
            database: 'u823909847_warranty'
        });

        const [rows] = await db.execute('SELECT id FROM warranty_registrations WHERE id != "" LIMIT 10');
        console.log('Sample non-blank IDs:', rows);
        
        const [counts] = await db.execute('SELECT COUNT(*) as total, SUM(CASE WHEN id = "" THEN 1 ELSE 0 END) as blank FROM warranty_registrations');
        console.log('Stats:', counts[0]);

        await db.end();
    } catch (err) {
        console.error(err);
    }
}

checkIds();
