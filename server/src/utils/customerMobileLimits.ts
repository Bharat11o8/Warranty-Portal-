import db from '../config/database.js';

const DEFAULT_ALLOWED_REGISTRATIONS = 1;

export function normalizeCustomerMobile(phone: string | null | undefined): string {
    if (!phone) return '';

    let cleaned = String(phone).replace(/[\s\-+()]/g, '');
    if (cleaned.length === 12 && cleaned.startsWith('91')) {
        cleaned = cleaned.substring(2);
    } else if (cleaned.length === 11 && cleaned.startsWith('0')) {
        cleaned = cleaned.substring(1);
    }

    return cleaned;
}

export async function ensureCustomerMobileLimitTable() {
    await db.execute(`
        CREATE TABLE IF NOT EXISTS customer_mobile_limits (
            mobile_number VARCHAR(20) NOT NULL PRIMARY KEY,
            allowed_registrations INT NOT NULL DEFAULT 1,
            reason TEXT NULL,
            created_by VARCHAR(255) NULL,
            updated_by VARCHAR(255) NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            CHECK (allowed_registrations >= 1)
        )
    `);
}

export async function getMobileRegistrationUsage(phone: string) {
    const mobileNumber = normalizeCustomerMobile(phone);

    if (!mobileNumber) {
        return {
            mobileNumber,
            usedCount: 0,
            allowedCount: DEFAULT_ALLOWED_REGISTRATIONS,
            remainingCount: DEFAULT_ALLOWED_REGISTRATIONS,
            hasOverride: false
        };
    }

    await ensureCustomerMobileLimitTable();

    const [existing]: any = await db.execute(
        `SELECT COUNT(*) as count
         FROM warranty_registrations
         WHERE REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(customer_phone, ' ', ''), '-', ''), '+', ''), '(', ''), ')', '') IN (?, ?, ?)
           AND status != 'rejected'`,
        [mobileNumber, `91${mobileNumber}`, `0${mobileNumber}`]
    );

    const [limitRows]: any = await db.execute(
        'SELECT allowed_registrations FROM customer_mobile_limits WHERE mobile_number = ? LIMIT 1',
        [mobileNumber]
    );

    const usedCount = Number(existing[0]?.count || 0);
    const hasOverride = limitRows.length > 0;
    const allowedCount = hasOverride
        ? Math.max(DEFAULT_ALLOWED_REGISTRATIONS, Number(limitRows[0].allowed_registrations || DEFAULT_ALLOWED_REGISTRATIONS))
        : DEFAULT_ALLOWED_REGISTRATIONS;

    return {
        mobileNumber,
        usedCount,
        allowedCount,
        remainingCount: Math.max(allowedCount - usedCount, 0),
        hasOverride
    };
}

/**
 * Fallback UID used when the real product UID is missing/unreadable.
 * Base form: <10-digit mobile><4-digit year>. If that base value is already
 * taken (repeat submission under a raised mobile limit), a zero-padded 2-digit
 * sequence is appended, e.g. base + "01" for the 2nd submission.
 */
export function buildFallbackUid(phone: string | null | undefined, year: number | string, sequence = 0): string {
    const mobileNumber = normalizeCustomerMobile(phone);
    const base = `${mobileNumber}${year}`;
    return sequence > 0 ? `${base}${String(sequence).padStart(2, '0')}` : base;
}

/**
 * Returns the sequence index (0, 1, 2, ...) if `uid` matches the fallback
 * pattern for this phone number in the given year, otherwise null.
 */
export function matchFallbackUidSequence(uid: string, phone: string | null | undefined, year: number | string, maxSequence = 9): number | null {
    if (!uid) return null;

    for (let sequence = 0; sequence <= maxSequence; sequence++) {
        if (uid === buildFallbackUid(phone, year, sequence)) {
            return sequence;
        }
    }

    return null;
}

/**
 * If `uid` matches the fallback pattern (any sequence) for this phone number,
 * resolves it to the next *unused* sequence for that mobile+year — so a
 * customer can keep typing the same base value (mobile+year) on repeat
 * submissions, and the system silently advances to ...01, ...02, etc.
 * Returns null if the UID doesn't match the fallback pattern at all, or if
 * the customer's mobile has no remaining allowed submissions.
 */
export async function resolveFallbackUid(uid: string, phone: string | null | undefined, year: number | string, maxSequence = 9): Promise<{ uid: string; sequence: number } | null> {
    if (matchFallbackUidSequence(uid, phone, year, maxSequence) === null) {
        return null;
    }

    const usage = await getMobileRegistrationUsage(phone || '');
    if (usage.remainingCount <= 0) {
        return null;
    }

    for (let sequence = 0; sequence <= maxSequence; sequence++) {
        const candidate = buildFallbackUid(phone, year, sequence);

        const [preGenRows]: any = await db.execute(
            'SELECT uid, is_used FROM pre_generated_uids WHERE uid = ?',
            [candidate]
        );
        if (preGenRows.length > 0 && preGenRows[0].is_used) continue;

        // A UID can be "not yet used" in pre_generated_uids (only flipped on
        // admin approval) but still tied to an active warranty_registrations
        // row — that candidate is still taken until that row is rejected.
        const [activeRegistrations]: any = await db.execute(
            "SELECT uid FROM warranty_registrations WHERE uid = ? AND status != 'rejected'",
            [candidate]
        );
        if (activeRegistrations.length > 0) continue;

        return { uid: candidate, sequence };
    }

    return null;
}
