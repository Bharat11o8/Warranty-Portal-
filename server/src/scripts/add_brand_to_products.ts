import db from '../config/database.js';

async function run() {
    const connection = await db.getConnection();
    try {
        console.log('Adding brand and product_code columns to store_products...');

        // 1. Add brand column (check first for idempotency)
        const [brandCols]: any = await connection.execute(
            `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'store_products' AND COLUMN_NAME = 'brand'`
        );
        if (brandCols.length === 0) {
            await connection.execute(`ALTER TABLE store_products ADD COLUMN brand ENUM('AF', 'AC') NOT NULL DEFAULT 'AF'`);
            console.log('✓ brand column added');
        } else {
            console.log('  brand column already exists, skipping');
        }

        // 2. Add product_code column
        const [codeCols]: any = await connection.execute(
            `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'store_products' AND COLUMN_NAME = 'product_code'`
        );
        if (codeCols.length === 0) {
            await connection.execute(`ALTER TABLE store_products ADD COLUMN product_code VARCHAR(20) NULL`);
            console.log('✓ product_code column added');
        } else {
            console.log('  product_code column already exists, skipping');
        }

        // 3. Backfill product_code for existing AF products that don't have one
        const [existing]: any = await connection.execute(
            `SELECT id FROM store_products WHERE product_code IS NULL ORDER BY created_at ASC`
        );

        console.log(`Backfilling product_code for ${existing.length} existing products...`);
        for (let i = 0; i < existing.length; i++) {
            const code = `AF-${String(i + 1).padStart(4, '0')}`;
            await connection.execute(
                `UPDATE store_products SET product_code = ? WHERE id = ?`,
                [code, existing[i].id]
            );
        }
        console.log('✓ product_code backfilled for existing products');

        // 4. Add unique index on product_code
        try {
            await connection.execute(`
                ALTER TABLE store_products ADD UNIQUE INDEX idx_product_code (product_code)
            `);
            console.log('✓ unique index on product_code added');
        } catch (e: any) {
            if (e.code === 'ER_DUP_KEYNAME') {
                console.log('  index already exists, skipping');
            } else {
                throw e;
            }
        }

        console.log('\n✅ Migration complete.');
    } catch (err) {
        console.error('Migration failed:', err);
        throw err;
    } finally {
        connection.release();
        process.exit(0);
    }
}

run();
