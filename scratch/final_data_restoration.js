import fs from 'fs';
import mysql from 'mysql2/promise';

const finalRestoration = JSON.parse(fs.readFileSync('../scratch/final_restoration_mapping.json', 'utf8'));

async function restoreDatabase() {
    console.log('--- Starting Final Database Restoration ---');
    const db = await mysql.createConnection({
        host: 'srv839.hstgr.io',
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: 'u823909847_warranty'
    });

    try {
        for (const data of finalRestoration) {
            console.log(`\nRestoring data for UID: ${data.uid}...`);

            // Fetch current record
            const [rows] = await db.execute('SELECT id, product_details FROM warranty_registrations WHERE uid = ?', [data.uid]);
            
            if (rows.length === 0) {
                console.log(`No record found for UID ${data.uid}. Skipping.`);
                continue;
            }

            const record = rows[0];
            let productDetails = {};
            try {
                productDetails = typeof record.product_details === 'string' ? JSON.parse(record.product_details) : record.product_details;
            } catch (e) {
                console.error(`Failed to parse product_details for UID ${data.uid}`);
            }

            // Update registration number and car make/model
            const carParts = data.carDetails ? data.carDetails.split(' ') : ['N/A', 'N/A'];
            const carMake = carParts.shift();
            const carModel = carParts.join(' ');

            // Prepare updated product_details
            const updatedProductDetails = {
                ...productDetails,
                carRegistration: data.registrationNumber || productDetails.carRegistration,
                carMake: carMake || productDetails.carMake,
                carModel: carModel || productDetails.carModel,
                productName: data.product !== 'N/A' ? data.product : productDetails.productName,
                invoiceFileName: data.invoiceFileName !== 'N/A' ? data.invoiceFileName : productDetails.invoiceFileName,
            };

            // Merge photos if we have them
            if (Object.keys(data.photos).length > 0) {
                 updatedProductDetails.photos = { ...updatedProductDetails.photos, ...data.photos };
                 // Some photos had specific keys like seatCover, carOuter etc. 
                 // It's hard to know exactly which was which without EXIF, but we'll store them.
                 // For now, let's keep the existing ones unchanged unless they were the corrupted ones.
                 // Actually they are corrupted, so replacing/adding is good.
                 let i = 0;
                 const expectedKeys = ['frontReg', 'backReg', 'seatCover', 'carOuter', 'vehicle', 'warranty'];
                 for (const [key, url] of Object.entries(data.photos)) {
                      const newKey = expectedKeys[i] || `photo_${i}`;
                      updatedProductDetails.photos[newKey] = url;
                      i++;
                 }
            }

            // Execute Update Query
            const updateResult = await db.execute(
                `UPDATE warranty_registrations 
                 SET registration_number = ?, 
                     car_year = ?, 
                     status = 'pending', 
                     product_details = ? 
                 WHERE uid = ?`,
                [
                    data.registrationNumber, 
                    '2024', // Defaulting as emails don't contain year
                    JSON.stringify(updatedProductDetails), 
                    data.uid
                ]
            );

            console.log(`✅ Updated UID: ${data.uid} -> ${data.registrationNumber}`);
        }

        console.log('\n--- Restoration Complete ---');
        console.log('Please verify the dashboard to ensure the records are correct.');

    } catch (error) {
        console.error('Database Error:', error);
    } finally {
        await db.end();
    }
}

restoreDatabase();
