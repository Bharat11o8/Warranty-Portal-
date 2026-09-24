import db from '../../src/config/database.js';
import { getRollCapacitySqft } from '../../src/services/ppfRoll.service.js';

/**
 * Bring PPF warranties filed before roll tracking into the roll ledger.
 *
 * These were registered when the form asked for a serial number and nothing
 * else, so how much film each job actually used was never recorded. Without a
 * row in the ledger their serials read as untouched, and the PPF Rolls screen
 * cannot show them at all — a roll that has been fitted to a car would look
 * brand new and accept a further 250 sq.ft.
 *
 * Each such warranty is therefore recorded as having used the whole roll. That
 * is not a measurement, it is the safe reading of an unknown: the alternative
 * is a spent roll presenting itself as full. It also matches how these serials
 * are treated in practice — none will be registered again.
 *
 * A rejected warranty is deliberately skipped. Rejection returns a roll's area
 * everywhere else in the system, so one of these must leave its serial usable
 * rather than consume it.
 *
 * Safe to run more than once: a warranty that already has a ledger row is left
 * alone, so a second run reports zero to do.
 *
 *   npx tsx scripts/migrations/2026-09-18_backfill_ppf_rolls.ts          (dry run, writes nothing)
 *   npx tsx scripts/migrations/2026-09-18_backfill_ppf_rolls.ts --apply  (writes)
 */

const APPLY = process.argv.includes('--apply');

interface Candidate {
    uid: string;
    serial: string;
    status: string;
    customerName: string;
    createdAt: Date;
}

async function main() {
    const capacity = await getRollCapacitySqft();

    const [rows]: any = await db.execute(
        `SELECT w.uid, w.status, w.customer_name, w.created_at, w.product_details
           FROM warranty_registrations w
          WHERE w.product_type = 'ev-products'
            AND NOT EXISTS (
                SELECT 1 FROM ppf_roll_consumption c WHERE c.warranty_uid = w.uid
            )
          ORDER BY w.created_at ASC`
    );

    const candidates: Candidate[] = [];
    const skipped: { uid: string; why: string }[] = [];

    for (const row of rows) {
        let pd: any = {};
        try {
            pd = typeof row.product_details === 'string'
                ? JSON.parse(row.product_details || '{}')
                : (row.product_details || {});
        } catch {
            skipped.push({ uid: row.uid, why: 'product_details could not be read' });
            continue;
        }

        // A warranty filed after the change already carries its rolls, and its
        // ledger rows were written with it; if it reached here without them,
        // inventing a draw would be a guess on top of a bug.
        if (Array.isArray(pd.rolls) && pd.rolls.length > 0) {
            skipped.push({ uid: row.uid, why: 'already declares rolls — not a pre-launch record' });
            continue;
        }

        if (row.status === 'rejected') {
            skipped.push({ uid: row.uid, why: 'rejected — its roll stays available' });
            continue;
        }

        const serial = String(pd.serialNumber || '').trim().toUpperCase();
        if (!serial) {
            skipped.push({ uid: row.uid, why: 'no serial number recorded' });
            continue;
        }

        candidates.push({
            uid: row.uid,
            serial,
            status: row.status,
            customerName: row.customer_name,
            createdAt: row.created_at,
        });
    }

    console.log(`\nPPF warranties with no ledger row: ${rows.length}`);
    console.log(`  to record as fully used: ${candidates.length}`);
    console.log(`  skipped: ${skipped.length}\n`);

    for (const c of candidates) {
        console.log(`  ${c.serial.padEnd(14)} → ${capacity} sq.ft   (${c.uid}, ${c.status})`);
    }
    if (skipped.length > 0) {
        console.log('\nSkipped:');
        for (const s of skipped) console.log(`  ${s.uid.padEnd(16)} ${s.why}`);
    }

    /*
     * Two warranties could name the same serial — the old form never stopped
     * that. Charging a full roll twice would leave it reading 500 of 250, so
     * the first is recorded and the rest are reported for a person to look at.
     */
    const seen = new Set<string>();
    const duplicates: Candidate[] = [];
    const toWrite = candidates.filter((c) => {
        if (seen.has(c.serial)) { duplicates.push(c); return false; }
        seen.add(c.serial);
        return true;
    });

    if (duplicates.length > 0) {
        console.log('\nSerials claimed by more than one warranty — only the earliest is recorded:');
        for (const d of duplicates) console.log(`  ${d.serial.padEnd(14)} ${d.uid} (${d.customerName})`);
    }

    if (!APPLY) {
        console.log(`\nDry run. Nothing written. Re-run with --apply to write ${toWrite.length} row(s).\n`);
        await db.end();
        return;
    }

    let written = 0;
    for (const c of toWrite) {
        // INSERT IGNORE on both: a re-run, or a roll another warranty already
        // created, must not fail the whole pass.
        await db.execute(
            'INSERT IGNORE INTO ppf_rolls (serial_number) VALUES (?)',
            [c.serial]
        );
        const [result]: any = await db.execute(
            `INSERT IGNORE INTO ppf_roll_consumption (roll_serial, warranty_uid, sqft_used)
             VALUES (?, ?, ?)`,
            [c.serial, c.uid, capacity]
        );
        if (result.affectedRows > 0) written++;
    }

    console.log(`\nWrote ${written} ledger row(s).\n`);
    await db.end();
}

main().catch((error) => {
    console.error('Backfill failed:', error);
    process.exit(1);
});
