import db from '../config/database.js';

/**
 * One-time cleanup: delete all B2B store orders and related data.
 * Keeps: users, vendors, distributors, product catalogue, inventory, categories.
 * Clears: order_messages, store_order_items, store_orders.
 *
 * DESTRUCTIVE — no undo. Requires --confirm.
 */
async function clearTestOrders() {
    if (!process.argv.includes('--confirm')) {
        console.error('❌ Refusing to run without --confirm flag.');
        console.error('   Run: npx tsx src/scripts/clear_test_orders.ts --confirm');
        process.exit(1);
    }

    try {
        console.log('=== Clearing Test B2B Orders ===\n');

        const tables = [
            'order_messages',
            'store_order_items',
            'store_orders',
        ];

        for (const table of tables) {
            try {
                const [result]: any = await db.execute(`SELECT COUNT(*) as count FROM ${table}`);
                const count = result[0].count;
                await db.execute(`DELETE FROM ${table}`);
                console.log(`  ✓ ${table}: ${count} rows deleted`);
            } catch (err: any) {
                if (err.code === 'ER_NO_SUCH_TABLE') {
                    console.log(`  - ${table}: table does not exist, skipping`);
                } else {
                    console.error(`  ✗ ${table}: ${err.message}`);
                }
            }
        }

        console.log('\n✅ Done. All test orders cleared.');
    } catch (error) {
        console.error('❌ Failed:', error);
    } finally {
        process.exit(0);
    }
}

clearTestOrders();
