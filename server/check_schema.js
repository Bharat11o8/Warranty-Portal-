const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '.env') });

async function checkSchema() {
    try {
        console.log('Connecting to database...');
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'warranty_db'
        });

        console.log('Connected!');

        const [columns] = await connection.execute('SHOW COLUMNS FROM warranty_registrations');
        console.log('Columns in warranty_registrations:');
        columns.forEach(col => {
            console.log(`${col.Field} (${col.Type})`);
        });

        await connection.end();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkSchema();
