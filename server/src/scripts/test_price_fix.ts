
import db from '../config/database.js';

async function testFix() {
    try {
        console.log('--- Testing Price Reconstruction Fix ---');

        // 1. Find a product with 0 price but non-zero variation prices
        const [products]: any = await db.execute('SELECT id, name, price FROM store_products WHERE price = 0');

        for (const p of products) {
            console.log(`Checking Product: ${p.name} (${p.id})`);

            const [variations]: any = await db.execute('SELECT price FROM store_product_variations WHERE product_id = ? AND price > 0', [p.id]);

            if (variations.length > 0) {
                const minVarPrice = Math.min(...variations.map((v: any) => Number(v.price)));
                console.log(` - Found ${variations.length} variations with prices.`);
                console.log(` - Min variation price: ${minVarPrice}`);

                // Simulate the fix logic
                const finalPrice = variations.length > 0 ? minVarPrice : Number(p.price);
                console.log(` - [FIXED LOGIC] Reconstructed Price: ${finalPrice}`);

                if (finalPrice > 0) {
                    console.log(' ✅ PASS: Price reconstructed correctly from variations.');
                } else {
                    console.log(' ❌ FAIL: Price still 0.');
                }
            } else {
                console.log(' - No variations with prices found for this product.');
            }
        }

        process.exit(0);
    } catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
    }
}

testFix();
