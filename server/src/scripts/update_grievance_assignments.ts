
import db, { getISTTimestamp } from '../config/database.js';

async function migrate() {
    console.log('🚀 Starting migration: Update grievance_assignments table...');

    try {
        // 1. Add estimated_completion_date
        console.log('Adding estimated_completion_date column...');
        await db.execute(`
            ALTER TABLE grievance_assignments 
            ADD COLUMN IF NOT EXISTS estimated_completion_date DATETIME NULL AFTER assignment_type;
        `);

        // 2. Add status column
        console.log('Adding status column...');
        await db.execute(`
            ALTER TABLE grievance_assignments 
            ADD COLUMN IF NOT EXISTS status ENUM('pending', 'in_progress', 'completed') DEFAULT 'pending' AFTER estimated_completion_date;
        `);

        // 3. Add update_token column
        console.log('Adding update_token column...');
        await db.execute(`
            ALTER TABLE grievance_assignments 
            ADD COLUMN IF NOT EXISTS update_token VARCHAR(255) NULL UNIQUE AFTER status;
        `);

        // 4. Add completion_remarks column
        console.log('Adding completion_remarks column...');
        await db.execute(`
            ALTER TABLE grievance_assignments 
            ADD COLUMN IF NOT EXISTS completion_remarks TEXT NULL AFTER update_token;
        `);

        // 5. Add updatedAt column if it doesn't exist
        console.log('Adding updated_at column...');
        await db.execute(`
            ALTER TABLE grievance_assignments 
            ADD COLUMN IF NOT EXISTS updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP;
        `);

        // 6. Add last_follow_up_at column
        console.log('Adding last_follow_up_at column...');
        await db.execute(`
            ALTER TABLE grievance_assignments 
            ADD COLUMN IF NOT EXISTS last_follow_up_at DATETIME NULL;
        `);

        console.log('✅ Migration completed successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        process.exit();
    }
}

migrate();
