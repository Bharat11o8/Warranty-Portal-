import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../server/.env') });

const config = {
    host: 'srv839.hstgr.io',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'u823909847_warranty'
};

async function structureFix() {
    try {
        const db = await mysql.createConnection(config);
        
        // 1. Fetch a perfect, recent healthy record to understand the exact structure
        const [healthy] = await db.query('SELECT uid, product_details, created_at FROM warranty_registrations ORDER BY created_at DESC LIMIT 1');
        console.log("=== HEALTHY RECORD EXAMPLE ===");
        console.log(JSON.stringify(JSON.parse(healthy[0].product_details), null, 2));

        // 2. Fetch the 16 corrupted records specifically to get their EXACT creation times
        const TARGET_UIDS = [
            '26041302432606', '26041302432620', '26032502427391', '26032302426664',
            '26031902425824', '26031602424705', '26031602424404', '25122902403812',
            '261480004540587', '26030202421275', '25122302402392', '25102302384412',
            '25100402380610', '25082902371655', '25081602368091', '26010302405294'
        ];
        
        let q = `SELECT uid, created_at, customer_name, product_type FROM warranty_registrations WHERE uid IN (${TARGET_UIDS.map(u=>`'${u}'`).join(',')})`;
        const [corruptedRows] = await db.query(q);
        
        // 3. Load Cloudinary resources
        const cloudinaryData = JSON.parse(fs.readFileSync('../scratch/cloudinary_resources.json', 'utf8'));
        
        // Sort cloudinary by created_at asc
        cloudinaryData.sort((a,b) => new Date(a.created_at) - new Date(b.created_at));

        let pristineMapping = [];

        for (const row of corruptedRows) {
            const rowTime = new Date(row.created_at).getTime();
            
            // Find cloudinary images uploaded within 5 minutes before or 1 min after the DB row creation
            const matchingImages = cloudinaryData.filter(img => {
                const imgTime = new Date(img.created_at).getTime();
                const diffSec = (rowTime - imgTime) / 1000;
                return diffSec >= -120 && diffSec <= 3600; // Allow a wider window, see what matches!
            });

            pristineMapping.push({
                uid: row.uid,
                customer: row.customer_name,
                db_created: row.created_at,
                found_images: matchingImages.map(m => m.secure_url)
            });
        }

        fs.writeFileSync('../scratch/pristine_cluster_mapping.json', JSON.stringify(pristineMapping, null, 2));
        console.log("=== WRITTEN TO pristine_cluster_mapping.json ===");
        
        await db.end();
    } catch(err) {
        console.error(err);
    }
}
structureFix();
