/**
 * Which product line an enquiry is about.
 *
 * The greeting offers three buttons, so most enquiries arrive as an exact
 * label. But a customer can type instead of tapping, and the keyword that
 * opened the conversation ("mat", "seat cover") is itself a signal worth
 * keeping. Both paths land here so a lead is filed under one of three names
 * rather than a dozen spellings — the team wants leads split by line, and that
 * only works if the value is closed.
 *
 * Kept apart from the routing service, which opens a database pool on import:
 * this is a pure function and should not need one to be exercised.
 */

export const PRODUCTS = ['Seat Covers', 'Mats', 'Accessories'] as const;
export type Product = (typeof PRODUCTS)[number];

const PRODUCT_PATTERNS: Array<[Product, RegExp]> = [
    // Seat covers first: "car seat cover mat" is a seat cover enquiry, and the
    // looser mat pattern would otherwise claim it.
    ['Seat Covers', /seat\s*-?\s*covers?|seatcovers?|\bcovers?\b/i],
    ['Mats', /\bmats?\b|floor\s*mats?|car\s*mats?/i],
    ['Accessories', /accessor|\baccs?\b/i],
];

/**
 * Resolve whatever the customer sent into one of the three lines.
 *
 * Returns null rather than guessing when nothing matches. An unlabelled lead is
 * honest; defaulting to Seat Covers would quietly inflate one line's numbers
 * and make the split worthless.
 */
export function normaliseProduct(raw: string | null | undefined): Product | null {
    const text = String(raw || '').trim();
    if (!text) return null;
    for (const [product, pattern] of PRODUCT_PATTERNS) {
        if (pattern.test(text)) return product;
    }
    return null;
}
