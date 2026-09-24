/**
 * Add 'pending' to posm_requests.status.
 *
 * Pending = a request that is partly done with the rest outstanding, or not
 * started at all. It counts in the admin sidebar badge alongside 'open'.
 *
 * Additive only: the value is appended to the end of the ENUM, which MySQL 8
 * applies as an INSTANT metadata change — no table rebuild, existing rows
 * untouched. Safe to re-run; it does nothing if 'pending' is already there.
 *
 *   npx tsx scripts/migrations/2026-09-24_add_posm_pending_status.ts
 */
import db from '../../src/config/database.js';

const TARGET =
    "ENUM('open','under_review','approved','in_production','dispatched','delivered','closed','rejected','pending')";

async function main() {
    const [cols]: any = await db.query("SHOW COLUMNS FROM posm_requests WHERE Field = 'status'");
    const current: string = cols[0]?.Type || '';
    console.log('Before:', current);

    if (current.includes("'pending'")) {
        console.log("'pending' is already allowed — nothing to do.");
        return;
    }

    const expected = "enum('open','under_review','approved','in_production','dispatched','delivered','closed','rejected')";
    if (current !== expected) {
        // The live column has drifted from what this script was written
        // against; appending blindly could drop a value someone added.
        throw new Error(`Unexpected column definition, refusing to alter: ${current}`);
    }

    // Nullability, charset and collation restated exactly as they are live
    // (checked 24 Sept 2026) so the only change is the new value. Anything
    // else would force a rebuild, which ALGORITHM=INSTANT refuses rather than
    // silently doing.
    await db.query(
        `ALTER TABLE posm_requests MODIFY status ${TARGET}
           CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'open',
         ALGORITHM=INSTANT`
    );

    const [after]: any = await db.query("SHOW COLUMNS FROM posm_requests WHERE Field = 'status'");
    console.log('After: ', after[0]?.Type, 'default=', after[0]?.Default, 'null=', after[0]?.Null);
}

main()
    .then(() => process.exit(0))
    .catch(err => { console.error(err); process.exit(1); });
