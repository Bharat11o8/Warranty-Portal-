import db from '../config/database.js';

async function migrate() {
    try {
        console.log('Adding is_cleared column to notifications table...');
        await db.execute('ALTER TABLE notifications ADD COLUMN is_cleared BOOLEAN DEFAULT FALSE');
        console.log('Successfully added is_cleared column.');
    } catch (error: any) {
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('Column is_cleared already exists.');
        } else {
            console.error('Migration failed:', error);
        }
    } finally {
        process.exit(0);
    }
}

migrate();
