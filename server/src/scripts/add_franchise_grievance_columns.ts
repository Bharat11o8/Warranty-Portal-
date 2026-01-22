import db from '../config/database.js';

/**
 * Migration: Add franchise grievance columns
 * - source_type: 'customer' or 'franchise'
 * - department: Plant/Distributor/ASM
 * - department_details: Name/details for Distributor/ASM
 */
async function migrate() {
    console.log('Starting migration: Add franchise grievance columns...');

    try {
        // Check if source_type column exists
        const [columns]: any = await db.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'grievances' 
            AND COLUMN_NAME IN ('source_type', 'department', 'department_details')
        `);

        const existingColumns = columns.map((c: any) => c.COLUMN_NAME);

        // Add source_type column
        if (!existingColumns.includes('source_type')) {
            await db.execute(`
                ALTER TABLE grievances 
                ADD COLUMN source_type ENUM('customer', 'franchise') DEFAULT 'customer' 
                AFTER customer_id
            `);
            console.log('✓ Added source_type column');
        } else {
            console.log('→ source_type column already exists');
        }

        // Add department column
        if (!existingColumns.includes('department')) {
            await db.execute(`
                ALTER TABLE grievances 
                ADD COLUMN department VARCHAR(50) NULL 
                AFTER source_type
            `);
            console.log('✓ Added department column');
        } else {
            console.log('→ department column already exists');
        }

        // Add department_details column
        if (!existingColumns.includes('department_details')) {
            await db.execute(`
                ALTER TABLE grievances 
                ADD COLUMN department_details VARCHAR(255) NULL 
                AFTER department
            `);
            console.log('✓ Added department_details column');
        } else {
            console.log('→ department_details column already exists');
        }

        console.log('Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
