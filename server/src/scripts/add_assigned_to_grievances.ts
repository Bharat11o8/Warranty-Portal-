import db from '../config/database.js';

const migrate = async () => {
    try {
        console.log('Adding assigned_to column to grievances table...');
        await db.execute(`
            ALTER TABLE grievances
            ADD COLUMN assigned_to VARCHAR(100) DEFAULT NULL
        `);
        console.log('Migration completed successfully.');
    } catch (error: any) {
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('Column assigned_to already exists.');
        } else {
            console.error('Migration failed:', error);
        }
    } finally {
        process.exit();
    }
};

migrate();
