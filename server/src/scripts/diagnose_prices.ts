
import db from '../config/database.js';

async function diagnose() {
    try {
        console.log('--- Product Price Diagnosis ---');

        const [products]: any = await db.execute('SELECT id, name, price FROM store_products');
        console.log(`Total Products: ${products.length}`);

        const zeroPriceProducts = products.filter((p: any) => Number(p.price) === 0);
        console.log(`Products with 0 price in store_products table: ${zeroPriceProducts.length}`);
        zeroPriceProducts.forEach((p: any) => console.log(` - ${p.name} (${p.id})`));

        const [variations]: any = await db.execute('SELECT product_id, name, price FROM store_product_variations');
        console.log(`\nTotal Variations: ${variations.length}`);

        const zeroPriceVariations = variations.filter((v: any) => Number(v.price) === 0);
        console.log(`Variations with 0 price: ${zeroPriceVariations.length}`);
        zeroPriceVariations.forEach((v: any) => console.log(` - [Product ${v.product_id}] Variation: ${v.name}`));

        process.exit(0);
    } catch (error) {
        console.error('Diagnosis failed:', error);
        process.exit(1);
    }
}

diagnose();
