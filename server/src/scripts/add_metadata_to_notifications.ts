
import db from '../config/database.js';

async function migrate() {
    try {
        console.log('Running migration: Add metadata to notifications table...');

        // check if column exists
        const [columns]: any = await db.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'notifications' 
            AND COLUMN_NAME = 'metadata';
        `);

        if (columns.length === 0) {
            await db.execute(`
                ALTER TABLE notifications 
                ADD COLUMN metadata JSON DEFAULT NULL AFTER link;
            `);
            console.log('Successfully added metadata column.');
        } else {
            console.log('Metadata column already exists.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
