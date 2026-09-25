import { normaliseProduct } from './productMatch.js';

/**
 * Reading Meta's lead-ad export, whatever shape it arrives in.
 *
 * Not every Instagram lead reaches WhatsApp. The customer fills the ad form,
 * Meta records it in the campaign sheet, and only some of them go on to open a
 * chat — so the sheet holds leads our webhook never sees. This reads that
 * sheet; the webhook path is unchanged and still the fast one.
 *
 * Two things about the real export make a naive read wrong, both found in the
 * September file:
 *
 *  - It is several exports concatenated, with header rows in the middle and
 *    THREE different column orders. Rows belonging to one layout appear above
 *    that layout's own header, so a reader that decides the layout by where a
 *    row sits gets 372 rows wrong — reading a lead id where the date should be.
 *
 *  - The same field sits in different columns between layouts. City is at
 *    index 6 in one and 5 in another, and getting it wrong left 2,724 rows
 *    with no city at all — which means no state, which means no ASM.
 *
 * So every row carries its own header, matched by what the row looks like
 * rather than by its position in the file.
 *
 * Free of any database import: this is the part worth testing exhaustively.
 */

export interface SheetLead {
    /** Meta's own lead id where the export carries one; not every layout does. */
    leadId: string | null;
    createdAt: string | null;
    name: string | null;
    phone: string | null;
    /**
     * The answer to the pincode question, as typed. Campaigns from late
     * September 2026 ask for this instead of the city; leads are routed by it.
     */
    pincode: string | null;
    city: string | null;
    /** The state, if a form ever asks for it. Superseded by the pincode. */
    state: string | null;
    car: string | null;
    product: string | null;
    platform: string | null;
    /** Which row of the file this came from, for reporting a bad import. */
    rowNumber: number;
    /** Columns we saw but had no home for — how a new question shows up. */
    unmapped: Record<string, string>;
}

/**
 * Which column means what.
 *
 * Keyword-matched rather than exact, so a renamed question still lands in the
 * right field. Order matters: the first pattern to claim a header wins, so the
 * narrower ones come first.
 */
const COLUMN_PATTERNS: Array<[keyof Omit<SheetLead, 'unmapped' | 'rowNumber' | 'product'>, RegExp]> = [
    ['leadId', /^id$/i],
    ['createdAt', /created_?time|created_?at|timestamp/i],
    ['name', /full_?name|^name$/i],
    ['phone', /phone|mobile|contact_?number/i],
    // "pincode", "pin_code", "your_pincode", "postal_code", "zip_code".
    ['pincode', /pin_?code|^pin$|postal_?code|zip_?code/i],
    // Checked before city: "state" must never be claimed by the city pattern.
    ['state', /^state$|which_?state|your_?state/i],
    ['city', /^city$|town|which_?city/i],
    // "car model year" is a year, not a car — excluded so it cannot win here.
    ['car', /(?!.*year)(which_?car|car_?model|vehicle|car)/i],
    ['platform', /^platform$/i],
];

/*
 * Columns that describe the ad rather than the customer. Listing them keeps
 * `unmapped` meaningful, so a genuinely new question is visible instead of
 * buried under campaign metadata.
 */
const IGNORED = /^(ad_id|ad_name|adset_id|adset_name|campaign_id|campaign_name|form_id|form_name|is_organic|lead_status)$/i;

/** A header row restating the column names, not a lead. */
export function isHeaderRow(cells: string[]): boolean {
    const first = String(cells[0] ?? '').trim().toLowerCase();
    return first === 'created_time' || first === 'id';
}

/**
 * Meta's test submissions, which carry dummy data in every field.
 *
 * Left out rather than imported and ignored: a row reading "<test lead: dummy
 * data for full_name>" is not a customer and should never reach an ASM.
 */
export function isTestRow(cells: string[]): boolean {
    return cells.some(c => /test lead:\s*dummy data/i.test(String(c ?? '')));
}

/**
 * The header whose shape matches this row.
 *
 * Returns null for a row that is neither — a header, a blank, or a stray line.
 * Layouts are told apart by their first cell and by which columns hold data:
 *
 *   "l:<digits>" first        -> the id-first layout
 *   a date first, blank at 5  -> the long layout, city at 6
 *   a date first, value at 5  -> the short layout, city at 5
 */
export function pickHeader(cells: string[], headers: string[][]): string[] | null {
    const first = String(cells[0] ?? '').trim();

    const idFirst = headers.find(h => /^id$/i.test(String(h[0] ?? '').trim()));
    const dateFirst = headers.filter(h => /created_?time/i.test(String(h[0] ?? '').trim()));

    if (/^l:/i.test(first)) return idFirst ?? null;
    if (!/^\d{4}-\d{2}-\d{2}T/.test(first)) return null;
    if (dateFirst.length === 0) return null;
    if (dateFirst.length === 1) return dateFirst[0];

    /*
     * Two date-first layouts. The long one leaves column 5 empty and puts the
     * city at 6; the short one uses 5 for the city and has nothing past 6.
     */
    const atFive = String(cells[5] ?? '').trim();
    const beyondSix = cells.slice(7).some(c => String(c ?? '').trim());

    const long = dateFirst.find(h => !String(h[5] ?? '').trim());
    const short = dateFirst.find(h => String(h[5] ?? '').trim());

    if (!atFive) return long ?? short ?? null;
    if (!beyondSix) return short ?? long ?? null;
    return long ?? short ?? null;
}

/**
 * Turn one row into a lead, given the header it belongs to.
 *
 * The product is read from the column heading rather than a column of its own:
 * the campaign names it inside the question ("...do you need the seat cover?"),
 * so a mats campaign files correctly without another change here.
 */
export function parseSheetRow(
    cells: string[],
    header: string[],
    rowNumber: number
): SheetLead {
    const lead: SheetLead = {
        leadId: null, createdAt: null, name: null, phone: null, pincode: null, city: null,
        state: null, car: null, product: null, platform: null,
        rowNumber, unmapped: {},
    };

    header.forEach((rawLabel, index) => {
        const label = String(rawLabel ?? '').trim();
        if (!label) return;

        const value = String(cells[index] ?? '').trim();

        /*
         * Read from the heading, which is where the campaign names the product
         * ("...do_you_need_the_seat_cover?"). Underscores become spaces first:
         * a sheet header writes them where the WhatsApp message has spaces, and
         * normaliseProduct matches words.
         */
        if (!lead.product) {
            const fromLabel = normaliseProduct(label.replace(/_/g, ' '));
            if (fromLabel) lead.product = fromLabel;
        }

        if (!value) return;

        for (const [field, pattern] of COLUMN_PATTERNS) {
            if (lead[field] === null && pattern.test(label)) {
                /*
                 * Meta writes the number as "p:+919876543210". The prefix is
                 * the export's own marker, not part of the number, and left on
                 * it survives into the lead row where a person reads it.
                 */
                lead[field] = field === 'phone' ? value.replace(/^p:/i, '').trim() : value;
                return;
            }
        }

        if (!IGNORED.test(label)) lead.unmapped[label] = value;
    });

    return lead;
}

export interface SheetReadResult {
    leads: SheetLead[];
    skipped: { headers: number; tests: number; unrecognised: number };
}

/**
 * Read a whole sheet: rows in, leads out.
 *
 * `rows` is the file as a grid, header rows included and in their original
 * order. Rows that are headers, test submissions, or of no recognisable shape
 * are dropped and counted, so an import can report what it skipped rather than
 * silently losing rows.
 */
export function readLeadSheet(rows: string[][]): SheetReadResult {
    const leads: SheetLead[] = [];
    const skipped = { headers: 0, tests: 0, unrecognised: 0 };

    /*
     * Every header first, before a single row is read.
     *
     * This is the whole point. In the real export, 372 rows using the id-first
     * layout sit ABOVE that layout's header — so a reader that collects headers
     * as it goes has not met the right one yet when it reaches them, and reads
     * a lead id into the date column. Two passes, and position stops mattering.
     */
    const headers = rows
        .filter(cells => cells && cells.length > 0 && isHeaderRow(cells))
        .map(cells => cells.map(c => String(c ?? '')));
    skipped.headers = headers.length;

    rows.forEach((cells, index) => {
        if (!cells || cells.length === 0) return;
        if (isHeaderRow(cells)) return;
        if (isTestRow(cells)) { skipped.tests++; return; }

        const header = pickHeader(cells, headers);
        if (!header) { skipped.unrecognised++; return; }

        leads.push(parseSheetRow(cells, header, index + 1));
    });

    return { leads, skipped };
}
