import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import ts from 'typescript'; // Use the installed typescript compiler

// Load env vars
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MOCK_DATA_PATH = path.resolve(__dirname, '../../../seal-guardian-58321-main/src/data/mockData.ts');

async function seedCatalog() {
    console.log('🌱 Starting Seed Process...');
    console.log(`📂 Reading mock data from: ${MOCK_DATA_PATH}`);

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: Number(process.env.DB_PORT) || 3306
    });

    try {
        let fileContent = fs.readFileSync(MOCK_DATA_PATH, 'utf-8');

        // 1. Remove the specific problematic import that has an alias alias
        // We know exactly what it is from inspecting the file.
        // We also generally remove all imports to be safe, but this one definitely.
        fileContent = fileContent.replace(/import\s+.*from\s+['"]@\/types\/catalog['"];?/g, '');
        fileContent = fileContent.replace(/^import\s+.*$/gm, ''); // Remove all other imports

        // 2. Use TypeScript Compiler to robustly strip types
        // This avoids all regex guessing games.
        console.log('🔄 Transpiling TypeScript to JavaScript...');
        const result = ts.transpileModule(fileContent, {
            compilerOptions: {
                module: ts.ModuleKind.CommonJS,
                target: ts.ScriptTarget.ES2020,
                removeComments: true,
            }
        });

        const cleanJs = result.outputText;

        // Debug: Write the transpiled JS
        const debugPath = path.resolve(__dirname, 'debug_transpiled_mock.js');
        fs.writeFileSync(debugPath, cleanJs);
        // console.log(`🐛 Debug: Transpiled JS written to ${debugPath}`);

        // 3. Evaluate in sandbox
        const sandbox: any = {};
        const context = new Function('sandbox', 'exports', 'require', `
            "use strict";
            ${cleanJs}
            // Manually map exports to sandbox if commonjs module.exports is used
            if (typeof exports !== 'undefined') {
                sandbox.categories = exports.categories;
                sandbox.products = exports.products;
                sandbox.reviews = exports.reviews;
            }
            // Also try to capture if they were defined globally by let/const in the scope
             if (!sandbox.categories && typeof categories !== 'undefined') sandbox.categories = categories;
             if (!sandbox.products && typeof products !== 'undefined') sandbox.products = products;
             if (!sandbox.reviews && typeof reviews !== 'undefined') sandbox.reviews = reviews;
        `);

        // Mock a minimal CommonJS environment
        const mockExports: any = {};
        context(sandbox, mockExports, () => { });

        // Extract data
        // If transpiled to CommonJS, it probably assigned to exports.categories or similar
        const categories = sandbox.categories || mockExports.categories;
        const products = sandbox.products || mockExports.products;
        const reviews = sandbox.reviews || mockExports.reviews;

        if (!categories || !products) {
            console.error('❌ Failed to extract data from sandbox. Check debug_transpiled_mock.js');
            console.log('Exports keys:', Object.keys(mockExports));
            console.log('Sandbox keys:', Object.keys(sandbox));
            throw new Error('Data extraction failed');
        }

        // Deduplicate products based on ID
        const uniqueProducts = Array.from(new Map(products.map((p: any) => [p.id, p])).values());

        console.log(`📊 Found ${categories.length} Categories, ${uniqueProducts.length} Products (after deduplication).`);

        // 4. Clear Existing Data
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');
        await connection.query('TRUNCATE TABLE store_reviews');
        await connection.query('TRUNCATE TABLE store_product_images');
        await connection.query('TRUNCATE TABLE store_product_variations');
        await connection.query('TRUNCATE TABLE store_products');
        await connection.query('TRUNCATE TABLE store_categories');
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log('🧹 Cleared existing tables.');

        // 5. Insert Categories
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');

        const categoryStmt = 'INSERT INTO store_categories (id, name, description, image, parent_id) VALUES ?';
        const categoryValues = categories.map((c: any) => [
            c.id,
            c.name,
            c.description || '',
            c.image || '',
            c.parentId || null
        ]);

        if (categoryValues.length > 0) {
            await connection.query(categoryStmt, [categoryValues]);
            console.log(`✅ Inserted ${categoryValues.length} categories.`);
        }

        // 6. Insert Products w/ Variations
        for (const p of uniqueProducts as any[]) {
            const hasVariations = typeof p.price === 'object';
            const basePrice = hasVariations ? Math.min(p.price.twoRow, p.price.threeRow) : p.price;

            await connection.execute(
                `INSERT INTO store_products (id, name, description, price, category_id, in_stock, additional_info, is_active) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    p.id,
                    p.name,
                    Array.isArray(p.description) ? p.description.join('\n') : p.description,
                    basePrice,
                    p.categoryId,
                    p.inStock ? 1 : 0,
                    JSON.stringify(p.additionalInfo || []),
                    1
                ]
            );

            if (hasVariations) {
                const variations = [
                    { name: '2 Row', price: p.price.twoRow, type: 'row_config' },
                    { name: '3 Row', price: p.price.threeRow, type: 'row_config' }
                ];

                for (const v of variations) {
                    await connection.execute(
                        `INSERT INTO store_product_variations (id, product_id, name, price, stock_quantity, attributes, meta) 
                         VALUES (?, ?, ?, ?, ?, ?, ?)`,
                        [
                            uuidv4(),
                            p.id,
                            v.name,
                            v.price,
                            10,
                            JSON.stringify({ "Row Type": v.name }),
                            JSON.stringify({})
                        ]
                    );
                }
            }

            if (p.images && p.images.length > 0) {
                const imageValues = p.images.map((url: string, index: number) => [
                    uuidv4(),
                    p.id,
                    null,
                    url,
                    index,
                    index === 0
                ]);

                await connection.query(
                    'INSERT INTO store_product_images (id, product_id, variation_id, url, display_order, is_primary) VALUES ?',
                    [imageValues]
                );
            }

            if (p.reviews && p.reviews.length > 0) {
                const reviewValues = p.reviews.map((r: any) => [
                    uuidv4(), // FORCE UNIQUE ID: Ignore r.id to prevent duplicate key errors
                    p.id,
                    r.userName,
                    r.rating,
                    r.comment
                ]);
                await connection.query(
                    'INSERT INTO store_reviews (id, product_id, user_name, rating, comment) VALUES ?',
                    [reviewValues]
                );
            }
        }
        console.log(`✅ Inserted ${uniqueProducts.length} products.`);
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    } catch (error: any) {
        console.error('❌ Error seeding catalog:', error);
    } finally {
        await connection.end();
        console.log('🏁 Seed process finished.');
    }
}

seedCatalog().catch(console.error);
