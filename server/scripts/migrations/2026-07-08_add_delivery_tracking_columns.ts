import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

/**
 * Migration: Add delivery-status tracking columns to message_logs.
 *
 * New columns:
 *   interakt_message_id — Interakt's API response ID, used to correlate webhook status events
 *   error_code          — WhatsApp/Meta error code (e.g. "131049")
 *   updated_at          — Auto-updated timestamp when status changes via webhook
 *   campaign_id         — Groups messages belonging to the same broadcast run
 */
async function migrate() {
    console.log('🔧 Connecting to database...');

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: Number(process.env.DB_PORT) || 3306
    });

    console.log('✅ Connected to database');

    const addColumnIfMissing = async (column: string, definition: string) => {
        try {
            const [rows]: any = await connection.query(
                `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
                 WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'message_logs' AND COLUMN_NAME = ?`,
                [process.env.DB_NAME, column]
            );
            if (rows.length > 0) {
                console.log(`⚠️  Column '${column}' already exists — skipping`);
                return;
            }
            await connection.query(`ALTER TABLE message_logs ADD COLUMN ${column} ${definition}`);
            console.log(`✅ Added column '${column}'`);
        } catch (err: any) {
            console.error(`❌ Failed to add column '${column}':`, err.message);
        }
    };

    const addIndexIfMissing = async (indexName: string, definition: string) => {
        try {
            const [rows]: any = await connection.query(
                `SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS 
                 WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'message_logs' AND INDEX_NAME = ?`,
                [process.env.DB_NAME, indexName]
            );
            if (rows.length > 0) {
                console.log(`⚠️  Index '${indexName}' already exists — skipping`);
                return;
            }
            await connection.query(`CREATE INDEX ${indexName} ON message_logs(${definition})`);
            console.log(`✅ Created index '${indexName}'`);
        } catch (err: any) {
            console.error(`❌ Failed to create index '${indexName}':`, err.message);
        }
    };

    try {
        // 1. interakt_message_id — correlate webhook events back to our log row
        await addColumnIfMissing('interakt_message_id', 'VARCHAR(100) NULL AFTER error_message');

        // 2. error_code — store WhatsApp/Meta numeric error codes (e.g. 131049)
        await addColumnIfMissing('error_code', 'VARCHAR(20) NULL AFTER interakt_message_id');

        // 3. updated_at — tracks when status was last changed by a webhook
        await addColumnIfMissing('updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at');

        // 4. campaign_id — groups all messages of a single broadcast run
        await addColumnIfMissing('campaign_id', 'VARCHAR(36) NULL AFTER error_code');

        // Indexes for webhook lookups
        await addIndexIfMissing('idx_msg_logs_interakt_id', 'interakt_message_id');
        await addIndexIfMissing('idx_msg_logs_campaign_id', 'campaign_id');

        console.log('\n🎉 Migration completed successfully!');
    } catch (error: any) {
        console.error('❌ Migration failed:', error.message);
    } finally {
        await connection.end();
    }
}

migrate();
