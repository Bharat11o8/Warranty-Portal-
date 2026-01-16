import db from './config/database.js';

async function diagnose() {
    console.log('--- Database Diagnosis ---');
    try {
        const [catsCount]: any = await db.execute('SELECT COUNT(*) as count FROM catalog_categories');
        const [prodsCount]: any = await db.execute('SELECT COUNT(*) as count FROM catalog_products');
        console.log(`Categories count: ${catsCount[0].count}`);
        console.log(`Products count: ${prodsCount[0].count}`);

        if (catsCount[0].count > 0) {
            const [cats]: any = await db.execute('SELECT id, name FROM catalog_categories LIMIT 5');
            console.log('Sample Categories:', cats);
        }

        if (prodsCount[0].count > 0) {
            const [prods]: any = await db.execute('SELECT id, name, category_id FROM catalog_products LIMIT 5');
            console.log('Sample Products:', prods);
        }

        const [catSchema]: any = await db.execute('DESCRIBE catalog_categories');
        const [prodSchema]: any = await db.execute('DESCRIBE catalog_products');
        console.log('--- Categories Schema ---');
        catSchema.forEach((col: any) => console.log(`${col.Field}: ${col.Type} (${col.Null === 'YES' ? 'NULL' : 'NOT NULL'})`));
        console.log('--- Products Schema ---');
        prodSchema.forEach((col: any) => console.log(`${col.Field}: ${col.Type} (${col.Null === 'YES' ? 'NULL' : 'NOT NULL'})`));

        // Test a single insert to see why it fails
        console.log('--- Test Product Insert ---');
        try {
            await db.execute(
                'INSERT INTO catalog_products (id, name, price, description, images, category_id, additional_info, in_stock) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                ['test-id', 'Test Product', '{}', '[]', '[]', 'seat-cover', '{}', true]
            );
            console.log('Test product inserted successfully');
        } catch (err: any) {
            console.error('Test insert failed:', err.message, err.code);
        }

    } catch (error) {
        console.error('Diagnosis failed:', error);
    } finally {
        process.exit();
    }
}

diagnose();
