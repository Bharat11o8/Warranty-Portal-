import db, { getISTTimestamp } from '../config/database.js';

async function syncExistingUIDs() {
    try {
        console.log('--- Syncing Existing UIDs from warranty_registrations to pre_generated_uids ---');

        // 1. Get all UIDs from warranty_registrations for seat-cover products
        const [registrations]: any = await db.execute(
            'SELECT uid, created_at, customer_name FROM warranty_registrations WHERE product_type = "seat-cover"'
        );

        if (registrations.length === 0) {
            console.log('✅ No seat-cover registrations found to sync.');
            process.exit(0);
        }

        console.log(`Found ${registrations.length} seat-cover registrations.`);

        let synced = 0;
        let alreadyExisted = 0;

        for (const reg of registrations) {
            // Check if UID exists in pre_generated_uids
            const [existing]: any = await db.execute(
                'SELECT uid FROM pre_generated_uids WHERE uid = ?',
                [reg.uid]
            );

            if (existing.length === 0) {
                // Insert as used
                await db.execute(
                    `INSERT INTO pre_generated_uids (uid, is_used, used_at, created_at, source) VALUES (?, TRUE, ?, ?, 'legacy_migration')`,
                    [reg.uid, reg.created_at, reg.created_at]
                );
                console.log(`  + Synced legacy UID: ${reg.uid} (${reg.customer_name})`);
                synced++;
            } else {
                // Ensure it's marked as used if it exists but is marked as available
                const [result]: any = await db.execute(
                    'UPDATE pre_generated_uids SET is_used = TRUE, used_at = ? WHERE uid = ? AND is_used = FALSE',
                    [reg.created_at, reg.uid]
                );
                if (result.affectedRows > 0) {
                    console.log(`  ✓ Marked existing UID as used: ${reg.uid}`);
                    synced++;
                } else {
                    alreadyExisted++;
                }
            }
        }

        console.log(`\n✅ Sync complete: ${synced} updated/added, ${alreadyExisted} already correct.`);

    } catch (e) {
        console.error('❌ Sync failed:', e);
    } finally {
        process.exit(0);
    }
}

syncExistingUIDs();
