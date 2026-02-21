import db from '../config/database.js';

/**
 * One-time cleanup script: Clear all dummy warranty & UID data.
 * Keeps: users, vendors, admins, product catalogue, activity logs, notifications.
 * Clears: warranty_registrations, pre_generated_uids, grievances, grievance_remarks, grievance_assignments.
 */
async function clearDummyData() {
    try {
        console.log('=== Clearing Dummy Warranty & UID Data ===\n');

        // Order matters — clear child tables first (foreign key constraints)
        const tables = [
            'grievance_assignments',
            'grievance_remarks',
            'grievances',
            'warranty_registrations',
            'pre_generated_uids',
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

        console.log('\n✅ Cleanup complete. System is ready for real UIDs.');
    } catch (error) {
        console.error('❌ Cleanup failed:', error);
    } finally {
        process.exit(0);
    }
}

clearDummyData();
