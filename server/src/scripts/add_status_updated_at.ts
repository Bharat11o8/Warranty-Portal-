import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env') });

async function migrate() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        console.log('🚀 Adding status_updated_at column...');

        // Check if column exists first
        const [columns] = await connection.execute(
            `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
             WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'grievances' AND COLUMN_NAME = 'status_updated_at'`,
            [process.env.DB_NAME]
        ) as any;

        if (columns.length === 0) {
            await connection.execute(
                `ALTER TABLE grievances 
                 ADD COLUMN status_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
            );
            console.log('✅ status_updated_at column added!');

            // Initialize with created_at values
            await connection.execute(
                `UPDATE grievances SET status_updated_at = created_at WHERE status_updated_at IS NULL`
            );
            console.log('✅ Initialized existing records!');
        } else {
            console.log('ℹ️ Column already exists, skipping...');
        }

    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await connection.end();
    }
}

migrate();
