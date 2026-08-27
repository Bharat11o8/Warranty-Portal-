import db from '../config/database.js';

/**
 * How far back a purchase may be dated when registering a warranty.
 *
 * The form greys out older dates, but that is presentation only — a crafted
 * request could still post any date it liked, and the window is a business rule
 * about how long after a sale a warranty may be claimed. So it is enforced here
 * as well.
 *
 * Admins are exempt entirely: they file on a store's behalf long after the sale
 * and correct historical records, so a window meant for customers must not stand
 * in their way. A future or unreadable date is still rejected for them, since
 * that is a typo rather than an exception.
 */

const SETTING_KEY = 'purchase_date_window_days';
const DEFAULT_DAYS = 7;

/** Short cache — every submission would otherwise hit the settings table. */
let cached: { days: number; at: number } | null = null;
const CACHE_TTL_MS = 30_000;

export async function getPurchaseDateWindowDays(): Promise<number> {
    if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.days;

    try {
        const [rows]: any = await db.execute(
            'SELECT setting_value FROM system_settings WHERE setting_key = ? LIMIT 1',
            [SETTING_KEY]
        );
        const raw = Number(rows[0]?.setting_value);
        // A missing or nonsensical value must not silently open the window, so
        // anything unusable falls back to the default rather than being trusted.
        const days = Number.isFinite(raw) && raw > 0 && raw <= 3650 ? Math.floor(raw) : DEFAULT_DAYS;
        cached = { days, at: Date.now() };
        return days;
    } catch (error) {
        console.error('[PurchaseWindow] Could not read the setting, using default:', error);
        return DEFAULT_DAYS;
    }
}

export function clearPurchaseDateWindowCache() {
    cached = null;
}

export interface WindowCheck {
    ok: boolean;
    error?: string;
    windowDays?: number;
}

/**
 * Check a submitted purchase date against the window.
 *
 * Compares whole days in local time rather than timestamps: a purchase made
 * this morning and one made at 11pm seven days ago are both "within 7 days" to
 * the person filling the form, and an hours-based comparison would reject the
 * second for reasons no one could see.
 */
export async function checkPurchaseDate(
    purchaseDate: unknown,
    isAdmin: boolean
): Promise<WindowCheck> {
    if (!purchaseDate) return { ok: true }; // absence is handled by required-field checks

    const parsed = new Date(String(purchaseDate));
    if (Number.isNaN(parsed.getTime())) {
        return { ok: false, error: 'That purchase date could not be read.' };
    }

    const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const today = startOfDay(new Date());
    const purchase = startOfDay(parsed);
    const daysAgo = Math.round((today.getTime() - purchase.getTime()) / 86_400_000);

    if (daysAgo < 0) {
        return { ok: false, error: 'The purchase date cannot be in the future.' };
    }

    // No back-dating limit for an admin; the checks above still apply.
    if (isAdmin) return { ok: true };

    const windowDays = await getPurchaseDateWindowDays();

    if (daysAgo > windowDays) {
        return {
            ok: false,
            windowDays,
            error: `Warranties can only be registered within ${windowDays} day${windowDays === 1 ? '' : 's'} of purchase. This one is dated ${daysAgo} days ago.`,
        };
    }

    return { ok: true, windowDays };
}
