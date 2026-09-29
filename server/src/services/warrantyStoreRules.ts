/**
 * The pure half of services/warrantyStore.ts — which signal decides a
 * warranty's store — kept free of the database import so it can be tested
 * without a connection holding the process open.
 */

export interface StoreSignals {
    manpowerStoreId?: string | null;
    ownerStoreId?: string | null;
    emailStoreId?: string | null;
    codeStoreId?: string | null;
    submitterStoreId?: string | null;
}

export type StoreResolution =
    | { ok: true; storeId: string | null }
    | { ok: false; error: string };

/**
 * Pure choice between the signals. An installer and a store email that name two
 * different stores are refused rather than settled, because either one could be
 * the wrong one and a guess files the warranty, its verification message and its
 * reminders under a store that never fitted it.
 */
export function pickStoreId(s: StoreSignals): StoreResolution {
    if (s.emailStoreId && s.codeStoreId && s.emailStoreId !== s.codeStoreId) {
        return { ok: false, error: 'The store details on this form do not match the store page it was opened from. Please reload the page and try again.' };
    }
    const named = s.emailStoreId || s.codeStoreId || null;
    const fitter = s.manpowerStoreId || s.ownerStoreId || null;
    if (fitter && named && fitter !== named) {
        return { ok: false, error: 'The selected installer does not belong to the selected store. Please re-select the store and installer.' };
    }
    return { ok: true, storeId: fitter || named || s.submitterStoreId || null };
}

/** `a@b.com | 98...` (the EV form's format) → `a@b.com`. */
export function storeEmailOf(installerContact: unknown): string | null {
    if (installerContact === null || installerContact === undefined) return null;
    const email = String(installerContact).split('|')[0].trim();
    return email || null;
}

/** `owner-<storeId>` → storeId. The bare `'owner'` carries no store. */
export function ownerStoreIdOf(manpowerId: unknown): string | null {
    const m = String(manpowerId ?? '');
    return m.startsWith('owner-') && m.length > 6 ? m.slice(6) : null;
}
