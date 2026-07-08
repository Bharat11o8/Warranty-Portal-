import db from './config/database.js';
import fs from 'fs';
import path from 'path';

async function listProducts() {
    try {
        const [products]: any = await db.query(`
            SELECT sp.id, sp.name, sp.price, sc.name as category_name, sp.in_stock, sp.is_active
            FROM store_products sp
            LEFT JOIN store_categories sc ON sp.category_id = sc.id
            ORDER BY sc.name, sp.name
        `);
        console.log(`Total products fetched: ${products.length}\n`);
        fs.writeFileSync(
            path.join(process.cwd(), 'products-list.json'),
            JSON.stringify(products, null, 2),
            'utf-8'
        );
        console.log('Successfully saved full product list to server/products-list.json');
    } catch (e: any) {
        console.error('Error listing products:', e.message);
    } finally {
        process.exit();
    }
}

listProducts();
