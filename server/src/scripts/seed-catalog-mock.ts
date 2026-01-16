import fs from 'fs';
import db from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

async function migrateData() {
    console.log('--- Starting Catalog Data Migration ---');

    try {
        const filePath = 'd:/auto-style-e-shop-main/auto-style-e-shop-main/src/data/mockData.ts';
        const content = fs.readFileSync(filePath, 'utf8');

        // Extract Categories
        const catMatch = content.match(/export const categories: Category\[\] = (\[[\s\S]*?\]);/);
        // Extract Reviews
        const reviewMatch = content.match(/const reviews: \{ \[key: string\]: Review\[\] \} = (\{[\s\S]*?\});/);
        // Extract Products
        const prodMatch = content.match(/export const products: Product\[\] = (\[[\s\S]*?\]);/);

        if (!catMatch || !prodMatch) {
            throw new Error('Could not find categories or products in mockData.ts');
        }

        // Clean content for eval (remove type annotations and fix variable references)
        const categoriesStr = catMatch[1];
        const reviewsStr = reviewMatch ? reviewMatch[1] : '{}';
        const productsStr = prodMatch[1];

        const categories = eval(categoriesStr);
        const reviews = eval(`(${reviewsStr})`);
        // Products reference reviews, so we define reviews in the scope of eval
        const products = eval(`(function(reviews) { return ${productsStr}; })(reviews)`);

        console.log(`Parsed ${categories.length} categories and ${products.length} products.`);

        // Disable FK checks to allow random order of insertion for parent/child categories
        await db.execute('SET FOREIGN_KEY_CHECKS = 0');
        await db.execute('DELETE FROM catalog_products');
        await db.execute('DELETE FROM catalog_categories');

        // 2. Insert Categories
        console.log('Seeding categories...');
        for (const cat of categories) {
            try {
                await db.execute(
                    'INSERT INTO catalog_categories (id, name, description, image, parent_id) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description), image=VALUES(image), parent_id=VALUES(parent_id)',
                    [cat.id, cat.name, cat.description || null, cat.image || null, cat.parentId || null]
                );
            } catch (err: any) {
                console.error(`Failed to insert category ${cat.id}:`, err.message);
            }
        }

        // 3. Insert Products
        console.log('Seeding products...');
        let successCount = 0;
        let failCount = 0;
        for (const prod of products) {
            try {
                // Note: DB schema might use snakes_case, mockData uses camelCase
                await db.execute(
                    'INSERT INTO catalog_products (id, name, price, description, images, category_id, additional_info, in_stock, rating) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name), price=VALUES(price), description=VALUES(description), images=VALUES(images), category_id=VALUES(category_id), additional_info=VALUES(additional_info), in_stock=VALUES(in_stock), rating=VALUES(rating)',
                    [
                        prod.id,
                        prod.name,
                        JSON.stringify({ regular: typeof prod.price === 'number' ? prod.price : (prod.price.regular || 0), sale: prod.price.sale }),
                        JSON.stringify(Array.isArray(prod.description) ? { short: prod.description[0], long: prod.description.join('\n') } : prod.description),
                        JSON.stringify(prod.images || []),
                        prod.categoryId,
                        JSON.stringify(prod.additionalInfo || {}),
                        prod.inStock ?? true,
                        prod.rating || 4.5
                    ]
                );
                successCount++;
            } catch (err: any) {
                console.error(`Failed to insert product ${prod.id}:`, err.message);
                failCount++;
            }
        }

        // Re-enable FK checks
        await db.execute('SET FOREIGN_KEY_CHECKS = 1');

        console.log(`--- Migration Summary: ${successCount} successful, ${failCount} failed ---`);
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        process.exit();
    }
}

migrateData();
