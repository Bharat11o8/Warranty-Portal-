import db from '../config/database.js';
async function checkLatestWarranty() {
    try {
        const [rows] = await db.execute('SELECT * FROM warranty_registrations ORDER BY created_at DESC LIMIT 1');
        if (rows.length > 0) {
            console.log('Latest Warranty:', JSON.stringify(rows[0], null, 2));
            console.log('Product Details:', JSON.parse(rows[0].product_details));
        }
        else {
            console.log('No warranties found.');
        }
        process.exit(0);
    }
    catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}
checkLatestWarranty();
