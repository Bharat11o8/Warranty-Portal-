/**
 * Internal remarks on a warranty — admin-only notes, never shown to the
 * customer or the franchise.
 *
 * A separate table rather than a column on warranty_registrations so each
 * remark keeps who wrote it and when, and several admins can add to the same
 * warranty without overwriting one another. Keyed by the warranty uid, which
 * a resubmission keeps, so notes carry across rejection cycles.
 *
 * Additive only: CREATE TABLE IF NOT EXISTS, no existing table is touched.
 * Safe to re-run.
 *
 *   npx tsx scripts/migrations/2026-09-28_create_warranty_remarks.ts
 */
import db from '../../src/config/database.js';

async function main() {
    await db.query(
        `CREATE TABLE IF NOT EXISTS warranty_remarks (
            id            INT AUTO_INCREMENT PRIMARY KEY,
            warranty_uid  VARCHAR(255) NOT NULL,
            admin_id      VARCHAR(36)  NOT NULL,
            admin_name    VARCHAR(255) NULL,
            remark        TEXT         NOT NULL,
            created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

            INDEX idx_warranty_uid (warranty_uid)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
          COMMENT='Internal admin-only remarks on warranties'`
    );

    const [cols]: any = await db.query('SHOW COLUMNS FROM warranty_remarks');
    console.log('warranty_remarks columns:', cols.map((c: any) => c.Field).join(', '));
}

main()
    .then(() => process.exit(0))
    .catch(err => { console.error(err); process.exit(1); });
