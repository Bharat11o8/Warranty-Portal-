import db from '../config/database.js';

async function migrate() {
    console.log('--- Phase 1: Harmonizing Notifications Schema ---');
    try {
        // 1. Add is_cleared if missing
        const [isClearedCol]: any = await db.execute(`
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications' AND COLUMN_NAME = 'is_cleared'
        `);
        if (isClearedCol.length === 0) {
            console.log('Adding is_cleared column...');
            await db.execute('ALTER TABLE notifications ADD COLUMN is_cleared BOOLEAN DEFAULT FALSE');
        }

        // 2. Add metadata if missing
        const [metadataCol]: any = await db.execute(`
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications' AND COLUMN_NAME = 'metadata'
        `);
        if (metadataCol.length === 0) {
            console.log('Adding metadata column...');
            await db.execute('ALTER TABLE notifications ADD COLUMN metadata JSON DEFAULT NULL AFTER link');
        }

        // 3. Update ENUM types
        console.log('Updating notification type enum...');
        // We use a safe approach: change to VARCHAR first or just MODIFY if supported
        await db.execute(`
            ALTER TABLE notifications MODIFY COLUMN type 
            ENUM('product', 'alert', 'system', 'posm', 'order', 'scheme', 'warranty') 
            DEFAULT 'system'
        `);

        // 4. Ensure Indexes
        console.log('Checking indexes...');
        const [indexes]: any = await db.execute('SHOW INDEX FROM notifications');
        const hasUserClearedIndex = indexes.some((idx: any) => idx.Key_name === 'idx_user_cleared_read');

        if (!hasUserClearedIndex) {
            console.log('Adding performance index for user notifications...');
            await db.execute('CREATE INDEX idx_user_cleared_read ON notifications (user_id, is_cleared, is_read)');
        }

        console.log('✅ Phase 1 Schema Harmonization Complete!');
    } catch (e) {
        console.error('❌ Migration failed:', e);
    } finally {
        process.exit(0);
    }
}

migrate();
