/**
 * QR Code Generator for Store Warranty Registration
 * 
 * This script generates QR codes for all verified stores.
 * Each QR code links to /connect/:storeCode for public warranty registration.
 * 
 * Usage:
 *   npx ts-node src/scripts/generate_store_qr.ts
 * 
 * Output:
 *   QR codes are saved to: server/generated-qr-codes/
 */

import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import db from '../config/database.js';

// ESM compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const BASE_URL = process.env.FRONTEND_URL || 'https://autoformwarranty.com';
const OUTPUT_DIR = path.join(__dirname, '../../../generated-qr-codes');

interface Store {
    vendor_details_id: number;
    store_name: string;
    store_code: string;
    store_email: string;
    city: string;
    state: string;
}

async function generateQRCodes() {
    console.log('🔧 QR Code Generator for Store Warranty Registration');
    console.log('=====================================================\n');

    // Create output directory if it doesn't exist
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
        console.log(`📁 Created output directory: ${OUTPUT_DIR}\n`);
    }

    try {
        // Fetch all verified stores with store codes
        const [stores]: any = await db.execute(`
      SELECT 
        vd.id as vendor_details_id,
        vd.store_name,
        vd.store_code,
        vd.store_email,
        vd.city,
        vd.state
      FROM vendor_details vd
      JOIN vendor_verification vv ON vd.user_id = vv.user_id
      WHERE vv.is_verified = 1 
        AND vd.store_code IS NOT NULL 
        AND vd.store_code != ''
      ORDER BY vd.store_name
    `);

        if (!stores || stores.length === 0) {
            console.log('❌ No verified stores found with store codes.');
            process.exit(1);
        }

        console.log(`📋 Found ${stores.length} verified stores with store codes.\n`);

        let successCount = 0;
        let errorCount = 0;

        for (const store of stores) {
            try {
                const storeCode = store.store_code;
                const url = `${BASE_URL}/connect/${storeCode}`;

                // Sanitize store name for filename
                const safeStoreName = store.store_name
                    .replace(/[^a-zA-Z0-9_-]/g, '_')
                    .replace(/_+/g, '_')
                    .substring(0, 50);

                const filename = `${storeCode}_${safeStoreName}.png`;
                const filepath = path.join(OUTPUT_DIR, filename);

                // Generate QR code with logo-friendly options
                await QRCode.toFile(filepath, url, {
                    errorCorrectionLevel: 'H', // High correction level for logo overlay
                    margin: 2,
                    width: 400,
                    color: {
                        dark: '#000000',
                        light: '#FFFFFF'
                    }
                });

                console.log(`✅ ${store.store_name}`);
                console.log(`   Code: ${storeCode} | URL: ${url}`);
                console.log(`   File: ${filename}\n`);

                successCount++;
            } catch (err: any) {
                console.log(`❌ Failed: ${store.store_name} - ${err.message}\n`);
                errorCount++;
            }
        }

        // Create an index file with all store info
        const indexData = {
            generatedAt: new Date().toISOString(),
            baseUrl: BASE_URL,
            totalStores: stores.length,
            stores: stores.map((store: Store) => ({
                storeCode: store.store_code,
                storeName: store.store_name,
                email: store.store_email,
                location: `${store.city}, ${store.state}`,
                qrUrl: `${BASE_URL}/connect/${store.store_code}`,
                qrFile: `${store.store_code}_${store.store_name.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+/g, '_').substring(0, 50)}.png`
            }))
        };

        fs.writeFileSync(
            path.join(OUTPUT_DIR, 'index.json'),
            JSON.stringify(indexData, null, 2)
        );

        console.log('=====================================================');
        console.log(`✅ Successfully generated: ${successCount} QR codes`);
        if (errorCount > 0) {
            console.log(`❌ Failed: ${errorCount} QR codes`);
        }
        console.log(`📁 Output directory: ${OUTPUT_DIR}`);
        console.log('📋 Index file: index.json');
        console.log('=====================================================\n');

    } catch (error: any) {
        console.error('❌ Database error:', error.message);
        process.exit(1);
    } finally {
        await db.end();
    }
}

// Run the script
generateQRCodes();
