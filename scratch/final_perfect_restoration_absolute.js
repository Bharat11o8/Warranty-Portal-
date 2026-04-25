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

const finalMapping = [
    {
        uid: "26031602424705",
        customer_name: "Rohit Patil",
        customer_phone: "8888991243",
        customer_email: "N/A",
        installer_name: "CAR DYNAMIC PVT LTD",
        installer_contact: "cardynamic@outlook.com",
        status: "pending"
    },
    {
        uid: "26041302432606",
        customer_name: "Mr Amit",
        customer_phone: "9811124443",
        customer_email: "N/A",
        installer_name: "CAR DYNAMIC PVT LTD",
        installer_contact: "cardynamic@outlook.com",
        status: "pending"
    },
    {
        uid: "25102302384412",
        customer_name: "Jalubhai",
        customer_phone: "9979731420",
        customer_email: "jalumanek3@gmail.com",
        installer_name: "CAR WORLD",
        installer_contact: "satishvekariya888@gmail.com",
        status: "approved"
    },
    {
        uid: "25100402380610",
        customer_name: "Shubhas bhai",
        customer_phone: "8140456551",
        customer_email: "subh.goswami555@gmail.com",
        installer_name: "MANTHAN AUTO CARE",
        installer_contact: "subh.goswami555@gmail.com", // This was store registration
        status: "pending"
    },
    {
        uid: "25081602368091",
        customer_name: "Huzfa sir",
        customer_phone: "7225907253",
        customer_email: "huzefajawad67@gmail.com",
        installer_name: "Avs Motors ",
        installer_contact: "avsmotorsindoreautoform@gmail.com",
        status: "approved"
    },
    {
        uid: "26010302405294",
        customer_name: "Lakhwinder singh",
        customer_phone: "N/A",
        customer_email: "lakhi_sran7@icloud.com",
        installer_name: "UNITED AUTO LUDHIANA",
        installer_contact: "unitedauto06@gmail.com",
        status: "pending"
    },
    {
        uid: "261480004540587",
        customer_name: "Mukesh bhai",
        customer_phone: "9812403197",
        customer_email: "N/A",
        installer_name: "BHAGWATI AUTO ACCESSORIES (RAJKOT)",
        installer_contact: "shubham_3197@yahoo.com",
        status: "approved"
    },
    {
        uid: "26032502427391",
        customer_name: "Mayur more",
        customer_phone: "9881844243",
        customer_email: "N/A",
        installer_name: "POONA MOTORS PVT. LTD.",
        installer_contact: "accounts@poonamotors.co.in",
        status: "pending"
    },
    {
        uid: "26030202421275",
        customer_name: "Jignesh Rathwa",
        customer_phone: "9825616064",
        customer_email: "N/A",
        installer_name: "AUTOCRAFT CAR ACCESSORIES",
        installer_contact: "ishanpanchal4545@gmail.com",
        status: "approved"
    },
    {
        uid: "25122302402392",
        customer_name: "Mittal trading co",
        customer_phone: "7016550792",
        customer_email: "arun.mittal547@gmail.com",
        installer_name: "SSD CAR ACCESSORIES",
        installer_contact: "pamnani007@gmail.com",
        status: "pending"
    }
];

async function applyPerfectPatch() {
    let db;
    try {
        db = await mysql.createConnection(config);
        console.log('--- APPLYING PERFECT RESTORATION PATCH ---');

        for (const map of finalMapping) {
            console.log(`Updating ${map.uid} (${map.customer_name})...`);
            await db.execute(
                `UPDATE warranty_registrations 
                 SET customer_name = ?, customer_phone = ?, customer_email = ?, 
                     installer_name = ?, installer_contact = ?, status = ?
                 WHERE uid = ?`,
                [
                    map.customer_name, map.customer_phone, map.customer_email,
                    map.installer_name, map.installer_contact, map.status,
                    map.uid
                ]
            );
        }

        console.log('✅ Final Perfect Restoration completed successfully.');
        
    } catch (err) {
        console.error('Patch failed:', err);
    } finally {
        if (db) await db.end();
    }
}

applyPerfectPatch();
