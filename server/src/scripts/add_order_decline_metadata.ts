import db from '../config/database.js';

async function migrate() {
    const connection = await db.getConnection();
    try {
        console.log('Starting migration for order decline metadata...');

        const [declinedByColumns]: any = await connection.query(`
            SHOW COLUMNS FROM store_orders LIKE 'declined_by_role'
        `);
        if (declinedByColumns.length === 0) {
            console.log('Adding declined_by_role column to store_orders...');
            await connection.query(`
                ALTER TABLE store_orders ADD COLUMN declined_by_role VARCHAR(20) DEFAULT NULL;
            `);
        }

        const [reasonColumns]: any = await connection.query(`
            SHOW COLUMNS FROM store_orders LIKE 'decline_reason'
        `);
        if (reasonColumns.length === 0) {
            console.log('Adding decline_reason column to store_orders...');
            await connection.query(`
                ALTER TABLE store_orders ADD COLUMN decline_reason TEXT DEFAULT NULL;
            `);
        }

        const [declinedAtColumns]: any = await connection.query(`
            SHOW COLUMNS FROM store_orders LIKE 'declined_at'
        `);
        if (declinedAtColumns.length === 0) {
            console.log('Adding declined_at column to store_orders...');
            await connection.query(`
                ALTER TABLE store_orders ADD COLUMN declined_at TIMESTAMP NULL DEFAULT NULL;
            `);
        }

        console.log('Order decline metadata migration completed successfully.');
    } catch (error) {
        console.error('Order decline metadata migration failed:', error);
        process.exit(1);
    } finally {
        connection.release();
        process.exit(0);
    }
}

migrate();
