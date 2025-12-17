import db from '../config/database.js';

async function migrate() {
    try {
        console.log('Starting migration: Update warranty status ENUM...');

        // Check if pending_vendor already exists in the enum
        const [columns]: any = await db.execute("SHOW COLUMNS FROM warranty_registrations LIKE 'status'");
        const type = columns[0].Type;

        if (type.includes("'pending_vendor'")) {
            console.log('Status ENUM already contains pending_vendor. Skipping.');
            process.exit(0);
        }

        // Modify the column
        await db.execute(`
      ALTER TABLE warranty_registrations 
      MODIFY COLUMN status ENUM('pending', 'pending_vendor', 'validated', 'rejected') DEFAULT 'pending'
    `);

        console.log('Successfully updated status ENUM.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
