import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function upgradeDistributorsSchema() {
    console.log('🚀 Starting Distributors schema upgrade...');

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: Number(process.env.DB_PORT) || 3306
    });

    try {
        // 1. Add is_distributor column to vendor_details table
        console.log('⚙️ Altering vendor_details to add is_distributor...');
        const [vdColumns]: any = await connection.query(`
            SHOW COLUMNS FROM vendor_details LIKE 'is_distributor'
        `);
        if (vdColumns.length === 0) {
            await connection.query(`
                ALTER TABLE vendor_details 
                ADD COLUMN is_distributor BOOLEAN NOT NULL DEFAULT FALSE
            `);
            console.log('✅ Added is_distributor to vendor_details.');
        } else {
            console.log('ℹ️ is_distributor already exists in vendor_details.');
        }

        // 2. Add profile_id column to distributors table
        console.log('⚙️ Altering distributors to add profile_id...');
        const [distColumns]: any = await connection.query(`
            SHOW COLUMNS FROM distributors LIKE 'profile_id'
        `);
        if (distColumns.length === 0) {
            await connection.query(`
                ALTER TABLE distributors 
                ADD COLUMN profile_id VARCHAR(36) NULL,
                ADD CONSTRAINT fk_distributor_profile 
                FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE SET NULL,
                ADD UNIQUE KEY uq_distributor_profile (profile_id)
            `);
            console.log('✅ Added profile_id to distributors.');
        } else {
            console.log('ℹ️ profile_id already exists in distributors.');
        }

        console.log('🎉 Database migration completed successfully!');
    } catch (error: any) {
        console.error('❌ Error executing database migration:', error.message);
        throw error;
    } finally {
        await connection.end();
    }
}

upgradeDistributorsSchema().catch(console.error);
