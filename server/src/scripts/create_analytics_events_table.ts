import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

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

    try {
        console.log('Creating analytics_events table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS analytics_events (
                id INT AUTO_INCREMENT PRIMARY KEY,
                warranty_id INT NOT NULL,
                action_type VARCHAR(50) NOT NULL,
                performed_by VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_analytics_action (action_type),
                INDEX idx_analytics_created (created_at),
                INDEX idx_analytics_warranty (warranty_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ analytics_events table created');

        console.log('Backfilling historical data from warranty_registrations...');
        
        // Backfill Registrations
        const [regResult]: any = await connection.query(`
            INSERT INTO analytics_events (warranty_id, action_type, performed_by, created_at)
            SELECT id, 'registered', customer_name, created_at 
            FROM warranty_registrations 
            WHERE created_at IS NOT NULL
        `);
        console.log(`✅ Backfilled ${regResult.affectedRows} 'registered' events`);

        // Backfill Vendor Approvals
        const [vendResult]: any = await connection.query(`
            INSERT INTO analytics_events (warranty_id, action_type, performed_by, created_at)
            SELECT id, 'vendor_approved', installer_name, vendor_approved_at 
            FROM warranty_registrations 
            WHERE vendor_approved_at IS NOT NULL
        `);
        console.log(`✅ Backfilled ${vendResult.affectedRows} 'vendor_approved' events`);

        // Backfill Admin Approvals
        const [appResult]: any = await connection.query(`
            INSERT INTO analytics_events (warranty_id, action_type, performed_by, created_at)
            SELECT id, 'validated', 'system_admin', validated_at 
            FROM warranty_registrations 
            WHERE validated_at IS NOT NULL
        `);
        console.log(`✅ Backfilled ${appResult.affectedRows} 'validated' events`);

        // Backfill Admin Rejections
        const [rejResult]: any = await connection.query(`
            INSERT INTO analytics_events (warranty_id, action_type, performed_by, created_at)
            SELECT id, 'rejected', 'system_admin', rejected_at 
            FROM warranty_registrations 
            WHERE rejected_at IS NOT NULL
        `);
        console.log(`✅ Backfilled ${rejResult.affectedRows} 'rejected' events`);

        console.log('');
        console.log('🎉 Migration & Backfill completed successfully!');

    } catch (error: any) {
        console.error('❌ Migration failed:', error.message);
    } finally {
        await connection.end();
    }
}

migrate();
