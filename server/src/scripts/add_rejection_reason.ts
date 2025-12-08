import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from server .env
dotenv.config({ path: path.join(__dirname, '../server/.env') });

async function migrate() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: Number(process.env.DB_PORT) || 3306
    });

    console.log('Connected to database...');

    try {
        console.log('Checking for rejection_reason column in warranty_registrations...');

        // Check if column exists
        const [columns]: any = await connection.query(`
            SHOW COLUMNS FROM warranty_registrations LIKE 'rejection_reason'
        `);

        if (columns.length === 0) {
            console.log('Adding rejection_reason column...');
            await connection.query(`
                ALTER TABLE warranty_registrations 
                ADD COLUMN rejection_reason TEXT DEFAULT NULL AFTER status
            `);
            console.log('✅ rejection_reason column added');
        } else {
            console.log('ℹ️ rejection_reason column already exists');
        }

    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await connection.end();
    }
}

migrate();
