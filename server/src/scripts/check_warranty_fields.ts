import db from '../config/database.js';

async function checkWarrantyFields() {
    console.log('--- Check Warranty Registration Fields ---');
    try {
        // Get latest warranty with all fields
        const [warranty]: any = await db.execute(`
            SELECT * FROM warranty_registrations ORDER BY created_at DESC LIMIT 1
        `);
        if (warranty.length > 0) {
            const w = warranty[0];
            console.log('Latest Warranty Registration:');
            console.log(`  UID: ${w.uid}`);
            console.log(`  Customer: ${w.customer_name}`);
            console.log(`  Installer Name: ${w.installer_name}`);
            console.log(`  Installer Contact: ${w.installer_contact}`);
            console.log(`  Manpower ID: ${w.manpower_id}`);
            console.log(`  User ID: ${w.user_id}`);
            console.log(`  Status: ${w.status}`);

            // If installer_name is a store name, try to find the vendor
            if (w.installer_name) {
                console.log(`\n--- Looking up vendor by installer_name: ${w.installer_name} ---`);
                const [vendor]: any = await db.execute(`
                    SELECT vd.id, vd.store_name, vd.user_id, p.name as owner_name
                    FROM vendor_details vd
                    JOIN profiles p ON vd.user_id = p.id
                    WHERE vd.store_name LIKE ?
                `, [`%${w.installer_name}%`]);
                if (vendor.length > 0) {
                    console.log(`Found vendor: ${vendor[0].store_name} (User: ${vendor[0].owner_name}, ID: ${vendor[0].user_id})`);
                } else {
                    console.log('No vendor found matching installer_name.');
                }
            }
        }
    } catch (e) {
        console.error('Error:', e);
    } finally {
        process.exit(0);
    }
}

checkWarrantyFields();
