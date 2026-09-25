import { normaliseProduct } from './productMatch.js';

/**
 * Instagram lead-form enquiries, which arrive as an ordinary WhatsApp message.
 *
 * Meta's click-to-WhatsApp lead ads send the form answers as the customer's
 * first message, from the customer's own number:
 *
 *   Hello! I filled in your form and would like to know more about your business.
 *
 *   For which car do you need the seat cover?: Verna Sedan
 *   Full name: Kuldeep Sharma
 *   Phone number: +917307388011
 *   City: Mohali
 *   Can you share the car model year?: 2024
 *
 * Everything routing needs is already in there, so these are answered straight
 * away rather than being put through the question flow. Asking someone their
 * city moments after they typed it into the ad form is how a warm lead goes
 * cold.
 *
 * Only the reading lives here. Sending is in instagramLead.service, which
 * imports the router and therefore a database pool — keeping them apart is
 * what lets the parsing be tested on its own.
 */

/**
 * The marker every lead-form message carries.
 *
 * Meta sends two wordings for the same thing — "filled in your form" and
 * "filled out your form" — so both are accepted. Real messages also arrive
 * with text before the greeting (one opened with the sender's own name), which
 * is why this is searched for anywhere in the body rather than anchored to the
 * start.
 */
const LEAD_FORM_MARKER = /i\s+filled\s+(in|out)\s+your\s+form/i;

export interface ParsedLead {
    name: string | null;
    phone: string | null;
    /**
     * The answer to the pincode question, as typed ("302 001", "Pin 302001").
     * Campaigns from late September 2026 ask for this instead of the city,
     * because leads are routed by pincode; extractPincode reads the digits.
     */
    pincode: string | null;
    city: string | null;
    car: string | null;
    product: string | null;
    /** Labels we saw but had no home for — surfaced so new ad forms are visible. */
    unmapped: Record<string, string>;
}

/**
 * Pull "Label: value" pairs out of the message.
 *
 * Split on the LAST colon of the label rather than the first, because the
 * questions are themselves questions — "For which car do you need the seat
 * cover?: Verna Sedan" would otherwise break at the wrong place and never.
 * A line without a colon is prose, not an answer, and is skipped.
 */
function extractPairs(text: string): Array<[string, string]> {
    const pairs: Array<[string, string]> = [];
    for (const line of String(text || '').split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        // "?:" is the separator Meta uses when the label is a question.
        const at = trimmed.lastIndexOf('?:') >= 0
            ? trimmed.lastIndexOf('?:') + 1
            : trimmed.indexOf(':');
        if (at <= 0) continue;

        const label = trimmed.slice(0, at).replace(/\?+$/, '').trim();
        const value = trimmed.slice(at + 1).trim();
        if (label && value) pairs.push([label, value]);
    }
    return pairs;
}

/*
 * Which label means what.
 *
 * Matched on keywords rather than the exact wording, so a campaign that asks
 * "Which city are you in?" instead of "City" still routes. The user confirmed
 * the forms use consistent labels today; this is here so that a new ad with
 * slightly different phrasing degrades into a correct match rather than a
 * silently dropped lead.
 *
 * Order matters — the first pattern to match a label wins, so the more specific
 * ones are declared first.
 */
const FIELD_PATTERNS: Array<[keyof Omit<ParsedLead, 'unmapped' | 'product'>, RegExp]> = [
    ['name', /full\s*name|your\s*name|^name$/i],
    ['phone', /phone|mobile|contact\s*number|whats\s*app/i],
    // Before city, whose "area" and "location" would otherwise claim "Area pincode".
    ['pincode', /pin\s*code|\bpin\b|postal|zip/i],
    ['city', /city|town|location|area|where.*located/i],
    // "car model year" is a year, not a car — excluded so it cannot win 'car'.
    ['car', /(?!.*year)(which\s*car|car\s*model|vehicle|car\b)/i],
];

/**
 * Read an Instagram lead-form message.
 *
 * Returns null when the message is not one — an ordinary customer saying hello
 * must fall through to the normal question flow untouched.
 */
export function parseLeadForm(text: string): ParsedLead | null {
    const body = String(text || '');
    if (!LEAD_FORM_MARKER.test(body)) return null;

    const parsed: ParsedLead = {
        name: null, phone: null, pincode: null, city: null, car: null, product: null, unmapped: {},
    };

    for (const [label, value] of extractPairs(body)) {
        let claimed = false;
        for (const [field, pattern] of FIELD_PATTERNS) {
            if (parsed[field] === null && pattern.test(label)) {
                parsed[field] = value;
                claimed = true;
                break;
            }
        }

        /*
         * The product is never its own field — it is named inside the question
         * ("...do you need the seat cover?"). Reading it from the label means a
         * mats or accessories campaign files correctly without another change
         * here.
         */
        if (!parsed.product) {
            const fromLabel = normaliseProduct(label);
            if (fromLabel) parsed.product = fromLabel;
        }

        if (!claimed) parsed.unmapped[label] = value;
    }

    return parsed;
}
