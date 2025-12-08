import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });
async function createActivityLogTable() {
    console.log('🔧 Connecting to database...');
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: Number(process.env.DB_PORT) || 3306
    });
    console.log('✅ Connected to database');
    try {
        // Create admin_activity_log table
        console.log('Creating admin_activity_log table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS admin_activity_log (
                id VARCHAR(36) PRIMARY KEY,
                admin_id VARCHAR(36) NOT NULL,
                admin_name VARCHAR(255),
                admin_email VARCHAR(255),
                action_type VARCHAR(50) NOT NULL,
                target_type VARCHAR(50),
                target_id VARCHAR(255),
                target_name VARCHAR(255),
                details JSON,
                ip_address VARCHAR(45),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (admin_id) REFERENCES profiles(id) ON DELETE CASCADE
            )
        `);
        console.log('✅ admin_activity_log table created');
        // Create indexes
        console.log('Creating indexes...');
        try {
            await connection.query('CREATE INDEX idx_admin_log_admin_id ON admin_activity_log(admin_id)');
            console.log('✅ Index on admin_id created');
        }
        catch (e) {
            console.log('⚠️  Index on admin_id may already exist');
        }
        try {
            await connection.query('CREATE INDEX idx_admin_log_action ON admin_activity_log(action_type)');
            console.log('✅ Index on action_type created');
        }
        catch (e) {
            console.log('⚠️  Index on action_type may already exist');
        }
        try {
            await connection.query('CREATE INDEX idx_admin_log_created ON admin_activity_log(created_at)');
            console.log('✅ Index on created_at created');
        }
        catch (e) {
            console.log('⚠️  Index on created_at may already exist');
        }
        console.log('');
        console.log('🎉 Migration completed successfully!');
    }
    catch (error) {
        console.error('❌ Migration failed:', error.message);
    }
    finally {
        await connection.end();
    }
}
createActivityLogTable();
