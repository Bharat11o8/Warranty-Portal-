import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../server/.env') });

const config = {
    host: 'srv839.hstgr.io',
    user: process.env.DB_USER || 'u823909847_warr',
    password: process.env.DB_PASSWORD || '@V+S&7Fc?f3V',
    database: 'u823909847_warranty'
};

// Correct installer names from franchise table (profiles -> vendor_details)
const installerFixes = [
    // CAR WORLD -> Satish Bhai
    { uid: "25100402380610", correctInstaller: "Satish Bhai" },   // Shubhas bhai
    { uid: "25102302384412", correctInstaller: "Satish Bhai" },   // Jalubhai

    // Avs Motors -> Nitin Dwivedi (already correct)
    // { uid: "25081602368091", correctInstaller: "Nitin Dwivedi" },

    // CAR DYNAMIC -> Aniruddha Gawade (already correct)
    // { uid: "26031602424705", correctInstaller: "Aniruddha Gawade" },

    // UNITED AUTO LUDHIANA -> Manoj Jerath
    { uid: "26010302405294", correctInstaller: "Manoj Jerath" },

    // SSD CAR ACCESSORIES -> Dinesh
    { uid: "25122302402392", correctInstaller: "Dinesh" },

    // POONA MOTORS -> Vinit Chauhan
    { uid: "26032502427391", correctInstaller: "Vinit Chauhan" },

    // BHAGWATI AUTO / THE DETAILING CAFE -> Shubham Chopra
    { uid: "261480004540587", correctInstaller: "Shubham Chopra" },
];

async function fixInstallerNames() {
    let db;
    try {
        db = await mysql.createConnection(config);
        console.log('--- FIXING ALL INSTALLER NAMES FROM FRANCHISE TABLE ---');

        for (const fix of installerFixes) {
            // Update the column
            await db.execute(
                'UPDATE warranty_registrations SET installer_name = ? WHERE uid = ?',
                [fix.correctInstaller, fix.uid]
            );

            // Also update the product_details JSON
            const [rows] = await db.execute('SELECT product_details FROM warranty_registrations WHERE uid = ?', [fix.uid]);
            if (rows.length > 0) {
                let pd = JSON.parse(rows[0].product_details || '{}');
                pd.manpowerName = fix.correctInstaller;
                pd.installerName = fix.correctInstaller;
                await db.execute('UPDATE warranty_registrations SET product_details = ? WHERE uid = ?', [JSON.stringify(pd), fix.uid]);
            }

            console.log(`✅ ${fix.uid} -> Installer: ${fix.correctInstaller}`);
        }

        console.log('--- ALL INSTALLER NAMES NOW MATCH FRANCHISE TABLE ---');

    } catch (err) {
        console.error('Failed:', err);
    } finally {
        if (db) await db.end();
    }
}

fixInstallerNames();
