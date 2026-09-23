import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function addGstAreaHeadColumns() {
    console.log('🚀 Starting migration: Add GST Number & Area Head Name to distributors...');

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: Number(process.env.DB_PORT) || 3306
    });

    try {
        // 1. Add gst_number column to distributors table
        console.log('⚙️ Adding gst_number column to distributors...');
        const [gstCols]: any = await connection.query(`
            SHOW COLUMNS FROM distributors LIKE 'gst_number'
        `);
        if (gstCols.length === 0) {
            await connection.query(`
                ALTER TABLE distributors 
                ADD COLUMN gst_number VARCHAR(20) NULL AFTER pincode
            `);
            console.log('✅ Added gst_number to distributors.');
        } else {
            console.log('ℹ️ gst_number already exists in distributors.');
        }

        // 2. Add area_head_name column to distributors table
        console.log('⚙️ Adding area_head_name column to distributors...');
        const [areaCols]: any = await connection.query(`
            SHOW COLUMNS FROM distributors LIKE 'area_head_name'
        `);
        if (areaCols.length === 0) {
            await connection.query(`
                ALTER TABLE distributors 
                ADD COLUMN area_head_name VARCHAR(255) NULL AFTER gst_number
            `);
            console.log('✅ Added area_head_name to distributors.');
        } else {
            console.log('ℹ️ area_head_name already exists in distributors.');
        }

        console.log('🎉 Migration completed successfully!');
    } catch (error: any) {
        console.error('❌ Error executing migration:', error.message);
        throw error;
    } finally {
        await connection.end();
    }
}

addGstAreaHeadColumns().catch(console.error);
