
import db from '../config/database.js';

async function migrate() {
    try {
        console.log('Adding admin_notes column to grievances table...');

        await db.execute(`
            ALTER TABLE grievances 
            ADD COLUMN admin_notes TEXT DEFAULT NULL AFTER admin_remarks
        `);

        console.log('Migration successful: admin_notes column added.');
        process.exit(0);
    } catch (error: any) {
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('Column admin_notes already exists. Skipping.');
            process.exit(0);
        }
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
