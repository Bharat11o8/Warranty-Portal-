import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function migrate() {
    console.log('--- Adding Product Flags (Featured/New Arrival) ---');

    const config = {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: Number(process.env.DB_PORT) || 3306
    };

    console.log(`Connecting to ${config.database} on ${config.host}...`);

    const connection = await mysql.createConnection(config);

    try {
        // 1. Check if columns exist
        const [columns]: any = await connection.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'store_products'
        `, [process.env.DB_NAME]);

        const columnNames = columns.map((c: any) => c.COLUMN_NAME);

        // 2. Add is_featured if missing
        if (!columnNames.includes('is_featured')) {
            console.log('Adding is_featured column...');
            await connection.query('ALTER TABLE store_products ADD COLUMN is_featured TINYINT(1) DEFAULT 0');
            console.log('✅ Added is_featured');
        } else {
            console.log('is_featured already exists');
        }

        // 3. Add is_new_arrival if missing
        if (!columnNames.includes('is_new_arrival')) {
            console.log('Adding is_new_arrival column...');
            await connection.query('ALTER TABLE store_products ADD COLUMN is_new_arrival TINYINT(1) DEFAULT 0');
            console.log('✅ Added is_new_arrival');
        } else {
            console.log('is_new_arrival already exists');
        }

    } catch (error: any) {
        console.error('❌ Migration failed:', error.message);
    } finally {
        await connection.end();
        console.log('Migration finished.');
        process.exit();
    }
}

migrate();
