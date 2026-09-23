/**
 * When two enquiries are the same enquiry.
 *
 * The phone alone cannot decide it. One person owns two cars, moves city, or
 * asks about PPF in March and seat covers in June — each of those is a real
 * lead an ASM should hear about. The same person filling the same form twice
 * because the first submit seemed not to work is not.
 *
 * So identity is the whole enquiry: who, where, what car, what product. Change
 * any one of them and it is a different enquiry, even a minute later. Repeat
 * all of them and it is the same one, and the ASM is not messaged twice.
 *
 * Free of any database import so the rule can be tested directly.
 */

/** Last 10 digits — the stable part of an Indian number however it is written. */
export function phoneKey(raw: string | null | undefined): string {
    return String(raw || '').replace(/\D/g, '').slice(-10);
}

/**
 * Normalise a free-text field for comparison.
 *
 * "Jaipur", "jaipur " and "JAIPUR" are one place; punctuation and spacing are
 * how the same answer differs between a form, a sheet and a typed reply.
 * Deliberately *not* fuzzy: "Thar" and "Thar LX" are different vehicles, and
 * treating them as one would swallow a real second enquiry.
 */
export function fieldKey(raw: string | null | undefined): string {
    return String(raw || '')
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[^a-z0-9]+/g, '')
        .trim();
}

/** The parts of an enquiry that decide whether it is new. */
export interface LeadIdentity {
    phone?: string | null;
    area?: string | null;
    car?: string | null;
    product?: string | null;
}

/**
 * A single string standing for this enquiry.
 *
 * Two enquiries are the same when their keys match. Built from the four fields
 * above, each normalised, joined by a character none of them can contain.
 *
 * An empty field is part of the key rather than a wildcard: a lead with no car
 * recorded is not the same as one naming a Thar, and letting a blank match
 * anything would hide exactly the second enquiry this is meant to catch.
 */
export function leadKey(lead: LeadIdentity): string {
    return [
        phoneKey(lead.phone),
        fieldKey(lead.area),
        fieldKey(lead.car),
        fieldKey(lead.product),
    ].join('|');
}

/**
 * True when the two describe the same enquiry.
 *
 * The window is a separate question the caller answers: this says only whether
 * the content is identical, not whether enough time has passed to treat a
 * repeat as genuine.
 */
export function isSameLead(a: LeadIdentity, b: LeadIdentity): boolean {
    return leadKey(a) === leadKey(b);
}

/**
 * Which of an existing set, if any, this lead repeats.
 *
 * Returns the first match, or null when the enquiry is new. The caller decides
 * what a match means — skip it, or record it as a duplicate without sending.
 */
export function findMatchingLead<T extends LeadIdentity>(
    incoming: LeadIdentity,
    existing: T[]
): T | null {
    const key = leadKey(incoming);
    return existing.find(row => leadKey(row) === key) ?? null;
}
