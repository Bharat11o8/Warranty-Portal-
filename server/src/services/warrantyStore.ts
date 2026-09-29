import db from '../config/database.js';

/**
 * Which store a warranty belongs to.
 *
 * Warranties used to carry only the store's name and email as text, and every
 * screen worked out the store by matching that text. Two stores sharing a name
 * then shared each other's warranties (three franchises are "UMIYA CAR
 * ACCESSORIES & SPA"; four were "CAR SHRINGAR"), and renaming a store cut it off
 * from its own history. `warranty_registrations.vendor_details_id` now holds the
 * store's id, set when the warranty is written. Every read matches on that id,
 * so the name is a label only and may be anything.
 *
 * The store is resolved from the strongest signal available, never the name:
 *   1. the installer picked on the form (a manpower row belongs to one store)
 *   2. the `owner-<storeId>` sentinel, when the owner did the fitting
 *   3. the store the form names: its store email (unique per store), or the
 *      store code of the QR page it was opened from
 *   4. the submitting account, when a franchise submits from its own dashboard
 * The boot backfill in index.ts uses the same order.
 */

import { pickStoreId, storeEmailOf, ownerStoreIdOf, type StoreSignals, type StoreResolution } from './warrantyStoreRules.js';

export { pickStoreId, storeEmailOf, ownerStoreIdOf, type StoreSignals, type StoreResolution };

type Queryable = { execute: (sql: string, params?: any[]) => Promise<any> };

/**
 * Resolve the store for a warranty being written. `conn` may be a transaction
 * connection; defaults to the pool.
 */
export async function resolveWarrantyStore(
    input: { manpowerId?: unknown; installerContact?: unknown; storeCode?: unknown; submitterUserId?: string | null },
    conn: Queryable = db
): Promise<StoreResolution> {
    const signals: StoreSignals = {};

    const manpowerId = input.manpowerId ? String(input.manpowerId) : '';
    const ownerId = ownerStoreIdOf(manpowerId);
    if (ownerId) {
        const [rows]: any = await conn.execute('SELECT id FROM vendor_details WHERE id = ?', [ownerId]);
        signals.ownerStoreId = rows[0]?.id ?? null;
    } else if (manpowerId && manpowerId !== 'owner') {
        const [rows]: any = await conn.execute(
            'SELECT vd.id FROM manpower m JOIN vendor_details vd ON vd.id = m.vendor_id WHERE m.id = ?',
            [manpowerId]
        );
        signals.manpowerStoreId = rows[0]?.id ?? null;
    }

    const email = storeEmailOf(input.installerContact);
    if (email) {
        const [rows]: any = await conn.execute('SELECT id FROM vendor_details WHERE store_email = ? LIMIT 2', [email]);
        // Two stores on one email cannot be told apart; treat it as unknown
        // rather than pick one. The unique index added at boot prevents this.
        signals.emailStoreId = rows.length === 1 ? rows[0].id : null;
    }

    const code = input.storeCode ? String(input.storeCode).trim() : '';
    if (code) {
        const [rows]: any = await conn.execute('SELECT id FROM vendor_details WHERE store_code = ?', [code]);
        signals.codeStoreId = rows[0]?.id ?? null;
    }

    if (input.submitterUserId) {
        const [rows]: any = await conn.execute('SELECT id FROM vendor_details WHERE user_id = ?', [input.submitterUserId]);
        signals.submitterStoreId = rows[0]?.id ?? null;
    }

    return pickStoreId(signals);
}

/**
 * Fill `vendor_details_id` wherever it is empty, by the same order as
 * `pickStoreId`. Idempotent; run at every boot so a row written by a path that
 * missed the column heals on the next restart instead of staying invisible.
 * Rows whose installer and email disagree are filled from the installer, which
 * is what the franchise tab has always shown them under.
 */
export async function backfillWarrantyStores(table: 'warranty_registrations' | 'warranty_resubmissions'): Promise<number> {
    const [result]: any = await db.query(`
        UPDATE ${table} w
        LEFT JOIN manpower m ON m.id = w.manpower_id
        LEFT JOIN vendor_details vm ON vm.id = m.vendor_id
        LEFT JOIN vendor_details vo ON w.manpower_id LIKE 'owner-%' AND vo.id = SUBSTRING(w.manpower_id, 7)
        LEFT JOIN vendor_details ve ON ve.store_email = TRIM(SUBSTRING_INDEX(w.installer_contact, '|', 1))
        LEFT JOIN vendor_details vs ON vs.user_id = w.user_id
        SET w.vendor_details_id = COALESCE(vm.id, vo.id, ve.id, vs.id)
        WHERE w.vendor_details_id IS NULL
          AND COALESCE(vm.id, vo.id, ve.id, vs.id) IS NOT NULL
    `);
    return result.affectedRows ?? 0;
}

/**
 * WHERE fragment limiting warranties to one franchise's store: its own store id,
 * plus anything it submitted that has no store yet. `alias` is the warranty
 * table's alias in the caller's query ('' for none).
 */
export async function vendorWarrantyScope(userId: string, alias = ''): Promise<{ sql: string; params: any[] }> {
    const p = alias ? `${alias}.` : '';
    const [rows]: any = await db.execute('SELECT id FROM vendor_details WHERE user_id = ?', [userId]);
    if (rows.length === 0) return { sql: `${p}user_id = ?`, params: [userId] };
    return {
        sql: `(${p}vendor_details_id = ? OR (${p}vendor_details_id IS NULL AND ${p}user_id = ?))`,
        params: [rows[0].id, userId],
    };
}
