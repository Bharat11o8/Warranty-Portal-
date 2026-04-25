import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function checkSchema() {
    const db = await mysql.createConnection({
        host: process.env.DB_HOST || 'srv839.hstgr.io',
        user: 'u823909847_warr',
        password: '@V+S&7Fc?f3V',
        database: process.env.DB_NAME || 'u823909847_warranty'
    });

    try {
        console.log('--- Columns in warranty_registrations ---');
        const [columns] = await db.execute('SHOW COLUMNS FROM warranty_registrations');
        console.table(columns);

        console.log('\n--- Indexes in warranty_registrations ---');
        const [indexes] = await db.execute('SHOW INDEX FROM warranty_registrations');
        console.table(indexes);

    } catch (err) {
        console.error(err);
    } finally {
        await db.end();
    }
}

checkSchema();
