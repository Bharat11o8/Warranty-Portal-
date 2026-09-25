import type { SheetLead } from './leadSheetParser.js';
import { leadKey, phoneKey } from './leadIdentity.js';
import { extractPincode } from './storeLocator.js';

/**
 * Deciding what a sheet sync should do with each row, before anything is written.
 *
 * Kept apart from the import that performs it, and free of any database import,
 * because this is where a mistake is expensive: a wrong decision here either
 * files a duplicate an ASM is messaged about twice, or silently drops a real
 * customer. Every rule below is exercised directly in the tests.
 *
 * The sync never decides what happens to a lead after it exists. An admin's
 * review, the store they picked, the status they set — those belong to the
 * admin, and a re-sync leaves them exactly as they were.
 */

/** An existing lead, as much of it as the decision needs. */
export interface ExistingLead {
    id: string;
    phone_key: string | null;
    raw_area: string | null;
    car_model: string | null;
    product: string | null;
}

export type SyncAction =
    /** Not seen before, and recent enough to send. */
    | 'route'
    /** Not seen before, but older than the cutoff: recorded, never sent. */
    | 'import_silent'
    /** Already in the table — the ASM has heard about it. */
    | 'duplicate'
    /** Nothing usable to route or call back. */
    | 'unusable';

export interface SyncDecision {
    lead: SheetLead;
    action: SyncAction;
    /** The lead this repeats, when the action is 'duplicate'. */
    existingId?: string;
    /** Why, in words, for the import report. */
    reason: string;
}

/**
 * A phone we could actually call back.
 *
 * Ten digits after stripping punctuation and any country code. Three rows in
 * the September export fail this — a lead with no reachable number is worth
 * recording nowhere, since neither an ASM nor an admin can act on it.
 */
export function hasUsablePhone(lead: SheetLead): boolean {
    return phoneKey(lead.phone).length === 10;
}

/**
 * When this lead was created, as a date.
 *
 * Meta writes an ISO timestamp with an offset ("2026-06-08T09:55:49-05:00").
 * Returns null for anything unparseable rather than guessing, so a row with a
 * broken date is treated as old and never sent by surprise.
 */
export function leadDate(lead: SheetLead): Date | null {
    const raw = String(lead.createdAt || '').trim();
    if (!raw) return null;
    const at = new Date(raw);
    return Number.isNaN(at.getTime()) ? null : at;
}

/**
 * The identity of a sheet lead, in the same shape the router records.
 *
 * `raw_area` on a lead row holds whatever the customer gave as their location.
 * For a store-locator lead — the workflow's and, since the forms ask for one,
 * Instagram's — that is the pincode, so the pincode leads here too: it is what
 * makes a lead captured on WhatsApp and its sheet copy recognise each other.
 * Older rows without one fall back to the state or city as before.
 */
export function sheetArea(lead: SheetLead): string | null {
    return extractPincode(lead.pincode) ?? extractPincode(lead.city) ?? (lead.state || lead.city);
}

function sheetKey(lead: SheetLead): string {
    return leadKey({
        phone: lead.phone,
        area: sheetArea(lead),
        car: lead.car,
        product: lead.product,
    });
}

function existingKey(row: ExistingLead): string {
    return leadKey({
        phone: row.phone_key,
        area: row.raw_area,
        car: row.car_model,
        product: row.product,
    });
}

/**
 * What to do with every row of a sheet.
 *
 * `cutoff` is the date from which leads may be sent. Anything older is still
 * imported — it is a real customer and belongs in the table — but nobody is
 * messaged about it. Without that, a first sync of a three-month backlog would
 * fire thousands of paid templates at ASMs about enquiries long gone cold.
 *
 * Rows already represented in `existing` are marked duplicate, whichever source
 * put them there. That is what stops a lead captured on WhatsApp being sent a
 * second time when the sheet catches up with it.
 *
 * Duplicates *within the sheet itself* are caught too: the first occurrence
 * wins and later copies see it, so a file listing the same enquiry twice does
 * not produce two leads.
 */
export function planSync(
    leads: SheetLead[],
    existing: ExistingLead[],
    cutoff: Date | null
): SyncDecision[] {
    const byKey = new Map<string, string>();
    for (const row of existing) {
        const key = existingKey(row);
        if (!byKey.has(key)) byKey.set(key, row.id);
    }

    const decisions: SyncDecision[] = [];

    for (const lead of leads) {
        if (!hasUsablePhone(lead)) {
            decisions.push({
                lead, action: 'unusable',
                reason: 'No usable phone number',
            });
            continue;
        }

        const key = sheetKey(lead);
        const match = byKey.get(key);
        if (match) {
            decisions.push({
                lead, action: 'duplicate', existingId: match,
                reason: 'Already recorded — same phone, area, vehicle and product',
            });
            continue;
        }

        const at = leadDate(lead);
        const tooOld = cutoff !== null && (at === null || at < cutoff);

        decisions.push({
            lead,
            action: tooOld ? 'import_silent' : 'route',
            reason: tooOld
                ? (at === null
                    ? 'No readable date — imported without sending'
                    : `Created before the cutoff — imported without sending`)
                : 'New lead',
        });

        /*
         * Claimed immediately, so a second identical row later in the same file
         * is seen as a duplicate of this one rather than filed again. The id is
         * not known until the row is written, so the marker stands in for it.
         */
        byKey.set(key, match ?? '(this sync)');
    }

    return decisions;
}

/** What a sync did, for the admin who asked for it. */
export interface SyncSummary {
    total: number;
    routed: number;
    importedSilently: number;
    duplicates: number;
    unusable: number;
}

export function summarise(decisions: SyncDecision[]): SyncSummary {
    return {
        total: decisions.length,
        routed: decisions.filter(d => d.action === 'route').length,
        importedSilently: decisions.filter(d => d.action === 'import_silent').length,
        duplicates: decisions.filter(d => d.action === 'duplicate').length,
        unusable: decisions.filter(d => d.action === 'unusable').length,
    };
}
