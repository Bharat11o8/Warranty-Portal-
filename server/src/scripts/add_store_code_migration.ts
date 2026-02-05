import db from '../config/database.js';

async function addStoreCode() {
    try {
        console.log('--- Adding store_code column to vendor_details ---');

        // 1. Add the column
        await db.execute(`
            ALTER TABLE vendor_details 
            ADD COLUMN IF NOT EXISTS store_code VARCHAR(20) UNIQUE DEFAULT NULL AFTER id
        `);
        console.log('✅ Column store_code added (or already exists)');

        // 2. Populate it for existing verified vendors if null
        const [vendors]: any = await db.execute('SELECT id FROM vendor_details WHERE store_code IS NULL OR store_code = ""');

        if (vendors.length > 0) {
            console.log(`\n--- Populating store_code for ${vendors.length} vendors ---`);
            for (const vendor of vendors) {
                const code = `FRG${vendor.id.toString().padStart(3, '0')}`;
                await db.execute('UPDATE vendor_details SET store_code = ? WHERE id = ?', [code, vendor.id]);
                console.log(`  Set ID ${vendor.id} -> ${code}`);
            }
            console.log('✅ Population complete');
        } else {
            console.log('\n✅ No vendors need population');
        }

    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

addStoreCode();
