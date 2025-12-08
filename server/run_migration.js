const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

async function runMigration() {
    let connection;
    try {
        console.log('Connecting to database...');
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'warranty_db',
            multipleStatements: true // Enable multiple statements
        });

        console.log('Connected!');

        // Read migration file
        const migrationPath = path.join(__dirname, 'src', 'scripts', 'migrate_uid_primary_key.sql');
        console.log(`Reading migration file from: ${migrationPath}`);
        const migrationSql = fs.readFileSync(migrationPath, 'utf8');

        console.log('Executing migration...');
        // Execute the entire script
        await connection.query(migrationSql);

        console.log('Migration completed successfully!');

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        if (connection) {
            await connection.end();
            console.log('Connection closed.');
        }
    }
}

runMigration();
