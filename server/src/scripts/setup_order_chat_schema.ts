import db from '../config/database.js';

async function migrate() {
    const connection = await db.getConnection();
    try {
        console.log('🏁 Starting migration for B2B Order Chat...');

        // 1. Add docket_id column to store_orders if not exists
        const [ordersColumns]: any = await connection.query(`
            SHOW COLUMNS FROM store_orders LIKE 'docket_id'
        `);
        if (ordersColumns.length === 0) {
            console.log('➕ Adding docket_id column to store_orders...');
            await connection.query(`
                ALTER TABLE store_orders ADD COLUMN docket_id VARCHAR(100) DEFAULT NULL;
            `);
            console.log('✅ Added docket_id column successfully.');
        } else {
            console.log('ℹ️ docket_id column already exists in store_orders.');
        }

        // 2. Create store_order_messages table
        console.log('➕ Creating store_order_messages table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS store_order_messages (
                id VARCHAR(36) PRIMARY KEY,
                order_id VARCHAR(36) NOT NULL,
                sender_id VARCHAR(36) NOT NULL,
                sender_role VARCHAR(50) NOT NULL,
                message_text TEXT NULL,
                attachment_url VARCHAR(255) DEFAULT NULL,
                attachment_name VARCHAR(255) DEFAULT NULL,
                is_system BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_message_order FOREIGN KEY (order_id) REFERENCES store_orders(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log('✅ Created store_order_messages table successfully.');

        console.log('🎉 Migration completed successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        connection.release();
        process.exit(0);
    }
}

migrate();
