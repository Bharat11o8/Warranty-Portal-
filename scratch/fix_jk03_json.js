import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../server/.env') });

const config = {
    host: 'srv839.hstgr.io',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'u823909847_warranty'
};

async function checkAndFixJSON() {
    try {
        const db = await mysql.createConnection(config);

        // Get the registration row again
        const [rows] = await db.query(
            `SELECT id, product_details 
             FROM warranty_registrations 
             WHERE registration_number LIKE '%JK-03%'`
        );

        if(rows.length > 0) {
            let pDetails = JSON.parse(rows[0].product_details);
            console.log("Current nested storeName:", pDetails.storeName);
            
            // If the JSON contains mismatched storeName/applicator details, let's fix them to match target
            if(pDetails.storeName) {
                pDetails.storeName = 'NU LOOK CAR ACCESSORIES - CHANNI';
                pDetails.manpowerName = 'Rajan'; // if it exists
                
                await db.query(
                    `UPDATE warranty_registrations 
                     SET product_details = ? 
                     WHERE id = ?`,
                    [JSON.stringify(pDetails), rows[0].id]
                );
                
                console.log("Nested JSON updated successfully to NU LOOK / Rajan!");
            }
        }
        await db.end();
    } catch(e) {
        console.error(e);
    }
}
checkAndFixJSON();
