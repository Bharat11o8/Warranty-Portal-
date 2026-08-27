import { useState, useEffect } from "react";
import api from "@/lib/api";

/**
 * How far back a purchase date may be set on the warranty forms.
 *
 * The QR flow's window is admin-controlled, since how long after a sale a
 * customer may still register is a business decision that changes with
 * campaigns — it used to be hardcoded at 7 days, needing a deploy to move.
 *
 * Admins have no limit: they file on a store's behalf long after the sale and
 * correct historical records, so the calendar leaves the past open for them.
 * The server agrees — it still rejects a future date, which is a typo.
 */

/** Matches the seeded setting, and is used until the request returns. */
const DEFAULT_PUBLIC_WINDOW = 7;

/** Effectively unlimited for an admin, while still giving the picker a bound. */
const ADMIN_WINDOW = 36500;

/** Cached per page load — every form instance would otherwise refetch it. */
let cached: number | null = null;
let inFlight: Promise<number> | null = null;

async function fetchWindow(): Promise<number> {
    if (cached !== null) return cached;
    if (inFlight) return inFlight;

    inFlight = api
        .get("/settings/public/purchase_date_window_days")
        .then(res => {
            const raw = res.data?.value ?? res.data?.setting_value ?? res.data?.data?.setting_value;
            const days = Number(raw);
            // A missing or nonsensical value must not open the window wide or
            // close it entirely, so anything unusable falls back to the default.
            cached = Number.isFinite(days) && days > 0 && days <= 3650
                ? Math.floor(days)
                : DEFAULT_PUBLIC_WINDOW;
            return cached;
        })
        .catch(() => {
            cached = DEFAULT_PUBLIC_WINDOW;
            return cached;
        })
        .finally(() => { inFlight = null; });

    return inFlight;
}

/** Clear the cache after an admin saves a new value. */
export function clearPurchaseDateWindowCache() {
    cached = null;
}

export function usePurchaseDateWindow(isAdmin: boolean): number {
    const [days, setDays] = useState<number>(isAdmin ? ADMIN_WINDOW : (cached ?? DEFAULT_PUBLIC_WINDOW));

    useEffect(() => {
        if (isAdmin) { setDays(ADMIN_WINDOW); return; }
        let cancelled = false;
        fetchWindow().then(d => { if (!cancelled) setDays(d); });
        return () => { cancelled = true; };
    }, [isAdmin]);

    return days;
}
