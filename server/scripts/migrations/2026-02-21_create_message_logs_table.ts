import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function createMessageLogsTable() {
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
        console.log('Creating message_logs table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS message_logs (
                id VARCHAR(36) PRIMARY KEY,
                recipient_phone VARCHAR(15),
                recipient_email VARCHAR(255),
                channel ENUM('email', 'whatsapp', 'both') NOT NULL,
                template_name VARCHAR(100),
                status ENUM('sent', 'delivered', 'read', 'failed') DEFAULT 'sent',
                context VARCHAR(100),
                reference_id VARCHAR(36),
                error_message TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ message_logs table created');

        console.log('Creating indexes...');
        try {
            await connection.query('CREATE INDEX idx_msg_logs_phone ON message_logs(recipient_phone)');
            console.log('✅ Index on recipient_phone created');
        } catch (e: any) {
            console.log('⚠️  Index on recipient_phone may already exist');
        }

        try {
            await connection.query('CREATE INDEX idx_msg_logs_email ON message_logs(recipient_email)');
            console.log('✅ Index on recipient_email created');
        } catch (e: any) {
            console.log('⚠️  Index on recipient_email may already exist');
        }

        try {
            await connection.query('CREATE INDEX idx_msg_logs_ref_id ON message_logs(reference_id)');
            console.log('✅ Index on reference_id created');
        } catch (e: any) {
            console.log('⚠️  Index on reference_id may already exist');
        }

        console.log('\n🎉 Migration completed successfully!');

    } catch (error: any) {
        console.error('❌ Migration failed:', error.message);
    } finally {
        await connection.end();
    }
}

createMessageLogsTable();
