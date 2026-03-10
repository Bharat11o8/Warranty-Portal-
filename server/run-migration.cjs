require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');

async function runMigration() {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        multipleStatements: true
    });

    const sql = fs.readFileSync('migrations/add_fraud_detection_columns.sql', 'utf8');

    const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);

    for (const statement of statements) {
        if (statement.startsWith('--')) continue;
        try {
            console.log(`Executing: ${statement}`);
            await conn.query(statement);
            console.log('Success');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('Skipped (column already exists)');
            } else {
                console.error(`Error: ${err.message}`);
            }
        }
    }

    await conn.end();
    console.log('Migration completed.');
}

runMigration().catch(console.error);
