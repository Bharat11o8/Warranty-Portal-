import db from '../config/database.js';

async function addIndexes() {
    console.log('Starting index creation...');

    const indexes = [
        {
            name: 'idx_created_at',
            query: 'CREATE INDEX idx_created_at ON warranty_registrations(created_at)'
        },
        {
            name: 'idx_user_id_created_at',
            query: 'CREATE INDEX idx_user_id_created_at ON warranty_registrations(user_id, created_at)'
        },
        {
            name: 'idx_status_created_at',
            query: 'CREATE INDEX idx_status_created_at ON warranty_registrations(status, created_at)'
        }
    ];

    for (const idx of indexes) {
        try {
            console.log(`Adding index: ${idx.name}...`);
            await db.execute(idx.query);
            console.log(`✅ Index ${idx.name} added successfully.`);
        } catch (error: any) {
            // Check for "Duplicate key" or "Index already exists" error codes
            // MySQL error code 1061 is "Duplicate key name" (index exists)
            if (error.code === 'ER_DUP_KEYNAME' || error.errno === 1061) {
                console.log(`ℹ️ Index ${idx.name} already exists.`);
            } else {
                console.error(`❌ Failed to add index ${idx.name}:`, error.message);
            }
        }
    }

    console.log('Index creation process completed.');
    process.exit(0);
}

addIndexes();
