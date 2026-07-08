import db from './config/database.js';

async function checkNoImages() {
    try {
        const [noImageProducts]: any = await db.query(`
            SELECT sp.id, sp.name 
            FROM store_products sp 
            LEFT JOIN store_product_images spi ON sp.id = spi.product_id 
            WHERE spi.id IS NULL
        `);
        console.log('Products with NO images:', noImageProducts.length);
        if (noImageProducts.length > 0) {
            console.log(noImageProducts.slice(0, 10));
        }
    } catch (e: any) {
        console.error('Error:', e.message);
    } finally {
        process.exit();
    }
}

checkNoImages();
