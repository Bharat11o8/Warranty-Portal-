const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

async function checkSchema() {
    let connection;
    try {
        console.log('Connecting to database...');
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'warranty_db'
        });

        console.log('Connected!');

        const [columns] = await connection.execute('SHOW COLUMNS FROM vendor_details');
        console.log('\nColumns in vendor_details table:');
        console.log('='.repeat(50));
        columns.forEach(col => {
            console.log(`${col.Field.padEnd(25)} (${col.Type})`);
        });

        await connection.end();
    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkSchema();
