import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function clearDummyDistributors() {
    if (!process.argv.includes('--confirm')) {
        console.error('❌ Refusing to run: this clears ALL franchise→distributor mappings and deletes distributors without a profile_id.');
        console.error('   Re-run with --confirm if you are certain this is what you want: npx tsx clear_dummy_distributors.ts --confirm');
        process.exit(1);
    }

    console.log('🧹 Clearing seeded/test distributor data...');

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: Number(process.env.DB_PORT) || 3306
    });

    try {
        // 1. Show current state
        const [dists]: any = await connection.query('SELECT id, name, profile_id FROM distributors');
        console.log(`Found ${dists.length} distributors in DB:`);
        dists.forEach((d: any) => console.log(`  - ${d.name} (profile_id: ${d.profile_id || 'NULL — seeded/test'})`));

        const [mappedVendors]: any = await connection.query(
            'SELECT store_name, distributor_id FROM vendor_details WHERE distributor_id IS NOT NULL'
        );
        console.log(`\nFound ${mappedVendors.length} vendors mapped to a distributor.`);

        // 2. Clear all vendor_details.distributor_id mappings
        console.log('\n⚙️ Clearing all franchise → distributor mappings...');
        const [clearResult]: any = await connection.query(
            'UPDATE vendor_details SET distributor_id = NULL WHERE distributor_id IS NOT NULL'
        );
        console.log(`✅ Cleared ${clearResult.affectedRows} franchise mappings.`);

        // 3. Delete distributor_inventory entries for seeded distributors (those without a profile_id)
        const seededIds = dists.filter((d: any) => !d.profile_id).map((d: any) => d.id);
        if (seededIds.length > 0) {
            console.log(`\n⚙️ Deleting inventory entries for ${seededIds.length} seeded distributors...`);
            const placeholders = seededIds.map(() => '?').join(',');
            const [invResult]: any = await connection.query(
                `DELETE FROM distributor_inventory WHERE distributor_id IN (${placeholders})`,
                seededIds
            );
            console.log(`✅ Deleted ${invResult.affectedRows} inventory entries.`);

            // 4. Delete the seeded distributor records themselves
            console.log(`⚙️ Deleting ${seededIds.length} seeded distributor records...`);
            const [delResult]: any = await connection.query(
                `DELETE FROM distributors WHERE id IN (${placeholders})`,
                seededIds
            );
            console.log(`✅ Deleted ${delResult.affectedRows} seeded distributors.`);
        } else {
            console.log('\nℹ️ No seeded (test) distributors found to delete.');
        }

        // 5. Final state
        const [remaining]: any = await connection.query('SELECT id, name FROM distributors');
        console.log(`\n📊 Final state: ${remaining.length} distributors remaining in DB.`);
        remaining.forEach((d: any) => console.log(`  - ${d.name}`));

        console.log('\n🎉 Cleanup complete! Admin can now manually create distributors and map franchises.');

    } catch (error: any) {
        console.error('❌ Error:', error.message);
        throw error;
    } finally {
        await connection.end();
    }
}

clearDummyDistributors().catch(console.error);
