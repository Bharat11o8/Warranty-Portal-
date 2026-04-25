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

const totalRestorationMapping = [
    {
        uid: "25081602368091", // Huzfa sir
        customer_name: "Huzfa sir",
        customer_phone: "7225907253",
        customer_email: "huzefajawad67@gmail.com",
        installer_name: "Nitin Dwivedi",
        installer_contact: "avsmotorsindoreautoform@gmail.com",
        status: "validated",
        store_name: "Avs Motors"
    },
    {
        uid: "25102302384412", // Jalubhai
        customer_name: "Jalubhai",
        customer_phone: "9979731420",
        customer_email: "jalumanek3@gmail.com",
        installer_name: "Satish Vekariya",
        installer_contact: "satishvekariya888@gmail.com",
        status: "validated",
        store_name: "CAR WORLD"
    },
    {
        uid: "25100402380610", // Shubhas bhai (REJECTED)
        customer_name: "Shubhas bhai",
        customer_phone: "8140456551",
        customer_email: "subh.goswami555@gmail.com",
        installer_name: "Manthan Auto",
        installer_contact: "subh.goswami555@gmail.com", // Story: store reg
        status: "rejected",
        store_name: "MANTHAN AUTO CARE",
        rejection_reason: "require picture through cloud link or original invoice"
    },
    {
        uid: "261480004540587", // Mukesh bhai
        customer_name: "Mukesh bhai",
        customer_phone: "9812403197",
        customer_email: "shubham_3197@yahoo.com",
        installer_name: "CAR WORLD",
        installer_contact: "satishvekariya888@gmail.com",
        status: "validated",
        store_name: "BHAGWATI AUTO ACCESSORIES (RAJKOT)"
    },
    {
        uid: "26030202421275", // Jignesh Rathwa
        customer_name: "Jignesh Rathwa",
        customer_phone: "9825616064",
        customer_email: "N/A",
        installer_name: "Ishan Panchal",
        installer_contact: "ishanpanchal4545@gmail.com",
        status: "validated",
        store_name: "AUTOCRAFT CAR ACCESSORIES"
    },
    {
        uid: "26010302405294", // Lakhwinder singh
        customer_name: "Lakhwinder singh",
        customer_phone: "N/A",
        customer_email: "lakhi_sran7@icloud.com",
        installer_name: "UNITED AUTO LUDHIANA",
        installer_contact: "unitedauto06@gmail.com",
        status: "pending",
        store_name: "UNITED AUTO LUDHIANA"
    },
    {
        uid: "25122302402392", // Mittal trading co
        customer_name: "Mittal trading co",
        customer_phone: "7016550792",
        customer_email: "arun.mittal547@gmail.com",
        installer_name: "SSD CAR ACCESSORIES",
        installer_contact: "pamnani007@gmail.com",
        status: "pending",
        store_name: "SSD CAR ACCESSORIES"
    },
    {
        uid: "26032502427391", // Mayur more
        customer_name: "Mayur more",
        customer_phone: "9881844243",
        customer_email: "N/A",
        installer_name: "POONA MOTORS PVT. LTD.",
        installer_contact: "accounts@poonamotors.co.in",
        status: "pending",
        store_name: "POONA MOTORS PVT. LTD."
    },
    {
        uid: "26031602424705", // Rohit Patil (Genuine Car Dynamic)
        customer_name: "Rohit Patil",
        customer_phone: "8888991243",
        customer_email: "N/A",
        installer_name: "Aniruddha Gawade",
        installer_contact: "cardynamic@outlook.com",
        status: "pending",
        store_name: "CAR DYNAMIC PVT LTD"
    }
];

async function runTotalRestoration() {
    let db;
    try {
        db = await mysql.createConnection(config);
        console.log('--- EXECUTING TOTAL SYSTEM RESTORATION ---');

        for (const map of totalRestorationMapping) {
            console.log(`Deep Restoring ${map.uid} (${map.customer_name})...`);
            
            // 1. Fetch current record to get product_details
            const [rows] = await db.execute('SELECT product_details FROM warranty_registrations WHERE uid = ?', [map.uid]);
            if (rows.length > 0) {
                let pd = JSON.parse(rows[0].product_details || '{}');
                
                // 2. Patch nested JSON
                pd.customerName = map.customer_name;
                pd.customerPhone = map.customer_phone;
                pd.customerEmail = map.customer_email;
                pd.storeName = map.store_name;
                pd.storeEmail = map.installer_contact;
                pd.installerName = map.installer_name;
                pd.manpowerName = map.installer_name;

                // 3. Update DB columns including the correct system status strings
                await db.execute(
                    `UPDATE warranty_registrations SET 
                     customer_name = ?, customer_phone = ?, customer_email = ?, 
                     installer_name = ?, installer_contact = ?, status = ?, 
                     rejection_reason = ?, product_details = ?
                     WHERE uid = ?`,
                    [
                        map.customer_name, map.customer_phone, map.customer_email,
                        map.installer_name, map.installer_contact, map.status,
                        map.rejection_reason || null,
                        JSON.stringify(pd),
                        map.uid
                    ]
                );
            }
        }

        console.log('✅ TOTAL SYSTEM RESTORATION COMPLETED SUCCESSFULLY.');
        console.log('--- DASHBOARD TABS (APPROVED/REJECTED) ARE NOW POPULATED ---');

    } catch (err) {
        console.error('Restoration failed:', err);
    } finally {
        if (db) await db.end();
    }
}

runTotalRestoration();
