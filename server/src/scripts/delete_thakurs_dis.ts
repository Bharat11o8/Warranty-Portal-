import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function deleteThakur() {
    console.log("🧹 Deleting distributor 'thakur\'s Dis'...");

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: Number(process.env.DB_PORT) || 3306
    });

    try {
        // Find distributor by name
        const [dists]: any = await connection.query("SELECT id, name FROM distributors WHERE name LIKE '%thakur%'");
        if (dists.length === 0) {
            console.log("❌ No distributor found matching 'thakur'.");
            return;
        }

        for (const dist of dists) {
            console.log(`Found: ${dist.name} (id: ${dist.id})`);

            // Clear any mappings in vendor_details
            const [clearResult]: any = await connection.query(
                'UPDATE vendor_details SET distributor_id = NULL WHERE distributor_id = ?',
                [dist.id]
            );
            console.log(`✅ Cleared ${clearResult.affectedRows} mappings.`);

            // Delete inventory
            const [invResult]: any = await connection.query(
                'DELETE FROM distributor_inventory WHERE distributor_id = ?',
                [dist.id]
            );
            console.log(`✅ Deleted ${invResult.affectedRows} inventory records.`);

            // Delete distributor
            const [delResult]: any = await connection.query(
                'DELETE FROM distributors WHERE id = ?',
                [dist.id]
            );
            console.log(`✅ Deleted distributor record for ${dist.name}.`);
        }

        console.log('🎉 Done!');

    } catch (error: any) {
        console.error('❌ Error:', error.message);
        throw error;
    } finally {
        await connection.end();
    }
}

deleteThakur().catch(console.error);
