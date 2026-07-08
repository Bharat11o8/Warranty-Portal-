import db from '../config/database.js';

async function run() {
    const connection = await db.getConnection();
    try {
        console.log('Adding allowed_brands to distributors and vendor_details...');

        // 1. distributors table
        const [distCols]: any = await connection.execute(
            `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'distributors' AND COLUMN_NAME = 'allowed_brands'`
        );
        if (distCols.length === 0) {
            await connection.execute(
                `ALTER TABLE distributors ADD COLUMN allowed_brands ENUM('AF','AC','AFAC') NOT NULL DEFAULT 'AF'`
            );
            console.log('✓ distributors.allowed_brands added (default AF)');
        } else {
            console.log('  distributors.allowed_brands already exists, skipping');
        }

        // 2. vendor_details table
        const [vendCols]: any = await connection.execute(
            `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vendor_details' AND COLUMN_NAME = 'allowed_brands'`
        );
        if (vendCols.length === 0) {
            await connection.execute(
                `ALTER TABLE vendor_details ADD COLUMN allowed_brands ENUM('AF','AC','AFAC') NOT NULL DEFAULT 'AF'`
            );
            console.log('✓ vendor_details.allowed_brands added (default AF)');
        } else {
            console.log('  vendor_details.allowed_brands already exists, skipping');
        }

        console.log('\n✅ Migration complete. All existing distributors/franchises default to AF.');
    } catch (err) {
        console.error('Migration failed:', err);
        throw err;
    } finally {
        connection.release();
        process.exit(0);
    }
}

run();
