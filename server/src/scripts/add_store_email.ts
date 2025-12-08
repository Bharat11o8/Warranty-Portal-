import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function addStoreEmail() {
    console.log('Starting vendor_details table update...');

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: Number(process.env.DB_PORT) || 3306
    });

    try {
        // Check if store_email column exists
        const [columns]: any = await connection.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? 
            AND TABLE_NAME = 'vendor_details' 
            AND COLUMN_NAME = 'store_email'
        `, [process.env.DB_NAME]);

        if (columns.length === 0) {
            console.log('Adding store_email column to vendor_details...');
            await connection.query(`
                ALTER TABLE vendor_details 
                ADD COLUMN store_email VARCHAR(255) AFTER store_name
            `);
            console.log('✅ Added store_email column');
        } else {
            console.log('ℹ️  store_email column already exists');
        }

    } catch (error: any) {
        console.error('❌ Error:', error.message);
        throw error;
    } finally {
        await connection.end();
        console.log('✅ Migration completed');
    }
}

addStoreEmail().catch(console.error);
