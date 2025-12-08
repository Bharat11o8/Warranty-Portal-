import db from '../config/database';
async function migrate() {
    try {
        console.log('Starting migration: Add manpower_id to warranty_registrations...');
        // Check if column exists
        const [columns] = await db.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = '${process.env.DB_NAME}' 
      AND TABLE_NAME = 'warranty_registrations' 
      AND COLUMN_NAME = 'manpower_id'
    `);
        if (columns.length === 0) {
            await db.execute(`
        ALTER TABLE warranty_registrations
        ADD COLUMN manpower_id VARCHAR(36) NULL AFTER user_id
      `);
            console.log('Added manpower_id column to warranty_registrations table.');
        }
        else {
            console.log('manpower_id column already exists.');
        }
        console.log('Migration completed successfully.');
        process.exit(0);
    }
    catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}
migrate();
