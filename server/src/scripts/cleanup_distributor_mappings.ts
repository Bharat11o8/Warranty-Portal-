import db from '../config/database.js';

async function run() {
    const connection = await db.getConnection();
    try {
        console.log('🏁 Starting cleanup of invalid distributor mappings...');

        // 1. Find invalid mappings
        const [rows]: any = await connection.query(`
            SELECT user_id, store_name, distributor_id 
            FROM vendor_details 
            WHERE is_franchise = FALSE AND distributor_id IS NOT NULL
        `);

        if (rows.length === 0) {
            console.log('ℹ️ No invalid mappings found (pure distributors mapped as franchises).');
        } else {
            console.log(`🔍 Found ${rows.length} invalid mapping(s):`);
            rows.forEach((row: any) => {
                console.log(`   - Store: "${row.store_name}" (User ID: ${row.user_id}) currently mapped to Distributor ID: ${row.distributor_id}`);
            });

            // 2. Perform cleanup
            console.log('🧹 Cleaning up mappings...');
            const [result]: any = await connection.query(`
                UPDATE vendor_details 
                SET distributor_id = NULL 
                WHERE is_franchise = FALSE AND distributor_id IS NOT NULL
            `);
            console.log(`✅ Successfully cleaned up ${result.affectedRows} invalid mapping(s).`);
        }
    } catch (error) {
        console.error('❌ Cleanup failed:', error);
        process.exit(1);
    } finally {
        connection.release();
        process.exit(0);
    }
}

run();
