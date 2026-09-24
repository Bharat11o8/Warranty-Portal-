import db from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import { WhatsAppService } from './whatsapp.service.js';
import { findState } from './indianStates.js';

/* Re-exported so existing callers keep working; the implementation lives
   in productMatch, which has no database import and can be tested. */
export { normaliseProduct, PRODUCTS } from './productMatch.js';
import { normaliseProduct } from './productMatch.js';
import type { Product } from './productMatch.js';
export type { Product };

/**
 * Route a customer enquiry to the ASM who covers their area.
 *
 * Two things feed this: a customer messaging the business number and answering
 * the area question, or an Instagram ad form carrying the area already. By the
 * time we get here the difference no longer matters — an area is an area — so
 * both share one matcher and one sender.
 *
 * Every enquiry is written to `leads` whether it matched or not. An area with
 * no ASM is the case that actually needs looking at, and it is invisible unless
 * the miss is recorded.
 */

/**
 * Reduce an area to something matchable.
 *
 * Stores and customers type the same place a dozen ways — our own database
 * holds 27 spellings for about 20 states. Lowercasing and stripping everything
 * that is not a letter or digit turns "New  Delhi.", "new-delhi" and "NEW DELHI"
 * into one key, without pretending to fix genuine misspellings.
 */
export function areaKey(raw: string): string {
    return String(raw || '')
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[^a-z0-9]+/g, '')
        .trim();
}

/** Last 10 digits — the stable part of an Indian number however it is written. */
export function phoneKey(raw: string): string {
    return String(raw || '').replace(/\D/g, '').slice(-10);
}

/**
 * Pull the area out of an `af_enquiry_area` Flow submission.
 *
 * The Flow asks for state (a fixed dropdown) and city (free text). We try the
 * city first, since an ASM may cover a single city, then fall back to the
 * state — which is always one of a known set, so it can be mapped reliably
 * however the customer spells their town.
 */
export function areaFromFlowAnswers(answers: Record<string, any>): {
    area: string;
    state: string | null;
    city: string | null;
    carModel: string | null;
} {
    const state = answers?.state ? String(answers.state).trim() : null;
    const city = answers?.city ? String(answers.city).trim() : null;
    return {
        area: city || state || '',
        state,
        city,
        carModel: answers?.car_model ? String(answers.car_model).trim() : null,
    };
}

/**
 * How long the same person + area is treated as one enquiry.
 *
 * A customer tapping twice, a workflow re-firing, or a stale trait replaying an
 * old location should not put the same lead on an ASM's phone again. Ten
 * minutes is long enough to absorb those and short enough that someone genuinely
 * enquiring again later still gets through.
 */
const DUPLICATE_WINDOW_MINUTES = 10;

/**
 * How many enquiries one number may send an ASM in a day.
 *
 * The duplicate window above only stops a repeat of the *same* area, so
 * someone naming a different area each time walks straight past it — and an
 * ASM covering eighteen areas could be messaged eighteen times in a minute by
 * one person. Every send is a paid template and a real phone buzzing, so there
 * is a ceiling on top of it.
 *
 * Three is set well above genuine use: a customer asking about seat covers,
 * then mats, then accessories is still served. The fourth in a day is somebody
 * playing with the bot.
 */
const MAX_ENQUIRIES_PER_DAY = 3;

export interface EnquiryInput {
    area: string;
    phone: string;
    name?: string | null;
    /** Which line they asked about, however they said it. Normalised below. */
    product?: string | null;
    /** The customer's car, as they typed it. Kept verbatim — free text. */
    car?: string | null;
    /** Match and report, but send nothing. For checking routing safely. */
    dryRun?: boolean;
    /** 'whatsapp' | 'instagram' — where the enquiry came from. */
    source?: string;
    /** Which WhatsApp Flow produced this, when it came from one. */
    flowId?: string | null;
    /** Wider area to try when the specific one is unmapped — usually the state. */
    fallbackArea?: string | null;
    rawPayload?: any;
}

export interface RouteResult {
    leadId: string;
    status: 'sent' | 'failed' | 'unmatched' | 'duplicate' | 'throttled' | 'dry-run';
    asm?: { id: string; name: string; phone_number: string };
    matchedArea?: string;
    product?: Product | null;
    car?: string | null;
}

/**
 * Edit distance, capped, counting a swap of two adjacent letters as one edit.
 *
 * That last part matters more than it sounds: "dehli" for "delhi" is the most
 * common way this word is mistyped, and plain Levenshtein scores it 2 — the
 * same as two unrelated wrong letters. Treating a transposition as one edit
 * catches it without raising the allowance, which would otherwise let "Dehri"
 * (a real town in Bihar) match Delhi.
 *
 * Bails out as soon as the best possible distance exceeds `max`, so a long
 * sentence is rejected in a few comparisons rather than a full matrix.
 */
function editDistance(a: string, b: string, max: number): number {
    if (Math.abs(a.length - b.length) > max) return max + 1;

    let twoBack: number[] = [];
    let prev = Array.from({ length: b.length + 1 }, (_, i) => i);

    for (let i = 1; i <= a.length; i++) {
        const curr = [i];
        let rowBest = i;
        for (let j = 1; j <= b.length; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            let val = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
            // Adjacent letters swapped — one edit, not two.
            if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
                val = Math.min(val, twoBack[j - 2] + 1);
            }
            curr[j] = val;
            if (val < rowBest) rowBest = val;
        }
        if (rowBest > max) return max + 1;
        twoBack = prev;
        prev = curr;
    }
    return prev[b.length];
}

/**
 * How close a typo may be before we accept it.
 *
 * Scaled to the word: one edit on a short name, two on a longer one. "dehli"
 * reaches "delhi", but "delhi" never reaches "dehradun" — being generous with
 * short words is how a matcher starts sending enquiries to the wrong person.
 */
function typoAllowance(len: number): number {
    if (len <= 4) return 0;
    if (len <= 7) return 1;
    return 2;
}

/**
 * Find the ASM for an area.
 *
 * A customer types their location however they please: "Delhi", "rohini,
 * delhi", "I am from dehli", "Delhi 110085". So rather than matching the
 * string, this looks for a mapped area *inside* whatever they wrote.
 *
 * Three passes, each stricter than the next is loose:
 *   1. the whole string, exactly
 *   2. any word or adjacent pair that IS a mapped area, longest first
 *   3. the same, allowing a typo or two on longer words
 *
 * Longest-first ordering matters: with both "Delhi" and "New Delhi" mapped,
 * "Dwarka, New Delhi" must reach whoever holds New Delhi.
 *
 * Fuzziness is deliberately mean — no allowance under five characters, and at
 * most two edits on a long name. A matcher that guesses generously sends
 * enquiries to the wrong person, which is worse than queueing them as
 * unmatched where somebody can see and fix the gap.
 */
export async function findAsmForArea(area: string) {
    const whole = areaKey(area);
    if (!whole) return null;

    const [mapped]: any = await db.execute(
        `SELECT ar.area_key, ar.area_label, a.id, a.name, a.phone_number, a.is_active
           FROM asm_areas ar
           JOIN asms a ON a.id = ar.asm_id`
    );
    if (!mapped.length) return null;

    const byKey = new Map<string, any>(mapped.map((m: any) => [m.area_key, m]));

    /*
     * The state decides who gets the enquiry.
     *
     * An ASM covers a state, so "Rohini Delhi", "Saket delhi" and "dehli" are
     * all the same routing decision — and resolving the state first is what
     * makes them so. Matching on the city instead meant the same input could
     * land on whichever mapped area happened to win: identical enquiries
     * reading "Rohini" one time and "Delhi" the next.
     *
     * The city is not discarded. It travels to the ASM in the message, which is
     * where it is actually useful.
     */
    const resolved = findState(area);
    if (resolved) {
        const hit = byKey.get(areaKey(resolved.state));
        if (hit) {
            if (areaKey(resolved.state) !== whole) {
                console.log(`[ASM] "${area}" -> ${resolved.state} (${resolved.how})`);
            }
            return hit.is_active ? hit : null;
        }

        /*
         * The state was understood, and nobody covers it. That is the answer.
         *
         * Falling through to the city passes below would undo the decision:
         * "Noida" is Uttar Pradesh, but a leftover area row named "Noida"
         * belonging to the Delhi ASM would match it by name and send the
         * enquiry across a state line — silently, and looking like a success.
         *
         * An uncovered state is a gap in the roster, and queueing it as
         * unmatched is what puts that gap in front of somebody.
         */
        console.log(`[ASM] "${area}" is ${resolved.state} — no ASM covers that state`);
        return null;
    }

    // Candidates: the whole string, then adjacent pairs, then single words.
    const words = String(area).split(/[^A-Za-z0-9]+/).filter(Boolean);
    const pairs = words.slice(0, -1).map((w, i) => areaKey(w + words[i + 1]));
    const singles = words.map(w => areaKey(w)).filter(w => w.length > 2);

    const candidates = [
        whole,
        ...[...pairs, ...singles].filter(k => k && k !== whole).sort((a, b) => b.length - a.length),
    ];

    const accept = (hit: any, via: string) => {
        // A deactivated ASM should not be messaged, but the area is still
        // "known" — queued as unmatched so it shows as a gap to reassign.
        if (!hit.is_active) return null;
        if (via !== whole) console.log(`[ASM] "${area}" matched on "${hit.area_label}"`);
        return hit;
    };

    // Pass 1 and 2 — exact.
    for (const key of new Set(candidates)) {
        const hit = byKey.get(key);
        if (hit) return accept(hit, key);
    }

    // Pass 3 — allow a typo. "dehli" reaches Delhi; "dwarka" still reaches
    // nothing, because it is a real place nobody has mapped.
    for (const key of new Set(candidates)) {
        const allow = typoAllowance(key.length);
        if (!allow) continue;

        let best: any = null;
        let bestDist = allow + 1;
        for (const m of mapped) {
            const d = editDistance(key, m.area_key, allow);
            if (d < bestDist) { bestDist = d; best = m; }
        }
        if (best) {
            console.log(`[ASM] "${area}" ~ "${best.area_label}" (${bestDist} edit${bestDist > 1 ? 's' : ''})`);
            return accept(best, best.area_key);
        }
    }

    return null;
}

/**
 * Match an enquiry to an ASM and message them.
 *
 * Never throws: a failure here must not take down the webhook that called it.
 * Interakt disables a webhook after five failures in ten minutes, so the caller
 * acknowledges first and runs this afterwards.
 */
export async function routeEnquiry(input: EnquiryInput): Promise<RouteResult> {
    const leadId = uuidv4();
    const phone = String(input.phone || '').trim();
    const rawArea = String(input.area || '').trim();
    const source = input.source || 'whatsapp';
    const product = normaliseProduct(input.product);
    // Kept as typed: a car model is not a closed set, and trimming is enough.
    const car = String(input.car || '').trim().slice(0, 80) || null;

    /*
     * The state the area resolved to, stored on the lead.
     *
     * Routing already turns on this — it is the thing that decides which ASM
     * gets the enquiry — so recording it costs nothing and makes the column
     * reportable: leads per state, and which states have no ASM behind them.
     * Null when the customer wrote something no state could be read from,
     * which is itself worth seeing.
     */
    const state = findState(rawArea)?.state ?? null;

    /*
     * Try the specific area first, then the wider one. A customer in Jaipur
     * should reach the Jaipur ASM if there is one, but still reach the
     * Rajasthan ASM if there is not — falling back is what keeps an enquiry
     * from being orphaned by a town nobody has mapped yet.
     */
    let asm = await findAsmForArea(rawArea).catch(err => {
        console.error('[ASM] area lookup failed:', err?.message);
        return null;
    });
    if (!asm && input.fallbackArea && areaKey(input.fallbackArea) !== areaKey(rawArea)) {
        asm = await findAsmForArea(input.fallbackArea).catch(() => null);
        if (asm) console.log(`[ASM] "${rawArea}" unmapped — matched on "${input.fallbackArea}" instead`);
    }

    const baseRow = [
        leadId,
        source,
        product,
        car,
        state,
        input.name || null,
        phone,
        phoneKey(phone),
        rawArea || null,
        input.flowId || null,
        input.rawPayload ? JSON.stringify(input.rawPayload) : null,
    ];

    if (!asm) {
        /*
         * A dry run must not write, whatever the outcome.
         *
         * The dryRun guard further down is only reached once an ASM has been
         * found, so an unmatched area fell straight through to this insert and
         * every preview of it filed a real lead. Six appeared in one afternoon
         * of somebody typing into the add form without ever pressing Add.
         */
        if (input.dryRun) {
            console.log(`[ASM] dry run: "${rawArea}" matches no ASM`);
            return { leadId, status: 'dry-run', product, car };
        }

        await db.execute(
            `INSERT INTO leads
               (id, source, product, car_model, state, customer_name,
                customer_phone, phone_key, raw_area, flow_id, raw_payload, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'unmatched')`,
            baseRow
        );
        console.log(`[ASM] no ASM covers "${rawArea}" — lead ${leadId} queued as unmatched`);
        return { leadId, status: 'unmatched', product, car };
    }

    /*
     * Matching is the part worth checking; sending is not. A dry run reports
     * who would be messaged without putting anything on their phone.
     *
     * Placed here, above the throttle and duplicate checks, because those
     * record a lead of their own — a preview that tripped either one used to
     * file a real row and then report a dry run.
     */
    if (input.dryRun) {
        console.log(`[ASM] dry run: "${rawArea}" would go to ${asm.name}`);
        return {
            leadId, status: 'dry-run',
            asm: { id: asm.id, name: asm.name, phone_number: asm.phone_number },
            matchedArea: asm.area_label || rawArea,
            product,
            car,
        };
    }

    /*
     * The daily ceiling, checked before the duplicate window because it does
     * not care which area was named — that is the hole it exists to close.
     *
     * Only sends count. A lead already refused as a duplicate or a throttle
     * cost nothing, and counting those would shrink a customer's real
     * allowance every time the workflow re-fired.
     */
    const [[{ sentToday }]]: any = await db.execute(
        `SELECT COUNT(*) AS sentToday FROM leads
          WHERE phone_key = ?
            AND status = 'sent'
            AND created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)`,
        [phoneKey(phone)]
    );
    if (sentToday >= MAX_ENQUIRIES_PER_DAY) {
        await db.execute(
            `INSERT INTO leads
               (id, source, product, car_model, state, customer_name,
                customer_phone, phone_key, raw_area, flow_id, raw_payload,
                matched_area, asm_id, status, failure_reason)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'throttled', ?)`,
            [...baseRow, asm.area_label || rawArea, asm.id,
             `Daily cap reached — ${sentToday} already forwarded in 24 hours`]
        );
        console.warn(`[ASM] ${phone} hit the daily cap (${sentToday}) — not forwarded`);
        /*
         * Answered as though it matched. The customer still gets the ASM's
         * name and number in the workflow's reply, so a genuine person on
         * their fourth question is not left staring at a failure — they simply
         * are not put on the ASM's phone a fourth time.
         */
        return {
            leadId, status: 'throttled',
            asm: { id: asm.id, name: asm.name, phone_number: asm.phone_number },
            matchedArea: asm.area_label || rawArea,
            product,
            car,
        };
    }

    /*
     * Same person, same area, moments ago — do not put it on the ASM's phone
     * twice. A customer tapping again, the workflow re-firing, or a stale trait
     * replaying an old location all land here, and none of them is a new
     * enquiry. Recorded so the repeat is still visible rather than silently
     * dropped.
     */
    const [recent]: any = await db.execute(
        `SELECT id FROM leads
          WHERE phone_key = ? AND asm_id = ?
            AND status IN ('sent', 'duplicate')
            AND created_at >= DATE_SUB(NOW(), INTERVAL ? MINUTE)
          LIMIT 1`,
        [phoneKey(phone), asm.id, DUPLICATE_WINDOW_MINUTES]
    );
    if (recent.length) {
        await db.execute(
            `INSERT INTO leads
               (id, source, product, car_model, state, customer_name,
                customer_phone, phone_key, raw_area, flow_id, raw_payload,
                matched_area, asm_id, status, failure_reason)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'duplicate', ?)`,
            [...baseRow, asm.area_label || rawArea, asm.id,
             `Repeat within ${DUPLICATE_WINDOW_MINUTES} minutes — not re-sent`]
        );
        console.log(`[ASM] repeat enquiry from ${phone} for ${asm.name} — not re-sent`);
        return {
            leadId, status: 'duplicate',
            asm: { id: asm.id, name: asm.name, phone_number: asm.phone_number },
            matchedArea: asm.area_label || rawArea,
            product,
            car,
        };
    }

    const receivedAt = new Date().toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true,
    });

    /*
     * The ASM is told what the customer actually wrote, not the area we matched
     * on.
     *
     * Matching deliberately narrows — "Rohini Delhi" finds the ASM through
     * "Rohini" — but narrowing is a routing decision, not information. Sending
     * only "Rohini" threw away the half of the answer the ASM needs to find
     * them, and the same input could arrive as "Rohini" or "Delhi" depending on
     * which mapped area won, so two identical enquiries read differently.
     *
     * The matched area is still recorded on the lead, where it explains why
     * this ASM was chosen.
     */
    const areaForAsm = rawArea || asm.area_label || '';

    let sent = false;
    try {
        sent = await WhatsAppService.sendAsmEnquiry(
            asm.phone_number,
            asm.name,
            input.name || '',
            phone,
            areaForAsm,
            receivedAt,
            product,
            car
        );
    } catch (err: any) {
        // Swallowed deliberately — the lead is still recorded below, and a lost
        // enquiry with no trace is the outcome worth avoiding.
        console.error(`[ASM] send to ${asm.name} failed:`, err?.message);
    }

    await db.execute(
        `INSERT INTO leads
           (id, source, product, car_model, state, customer_name,
            customer_phone, phone_key, raw_area, flow_id, raw_payload,
            matched_area, asm_id, status, sent_at, failure_reason)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            ...baseRow,
            asm.area_label || rawArea,
            asm.id,
            sent ? 'sent' : 'failed',
            sent ? new Date() : null,
            sent ? null : 'WhatsApp send failed',
        ]
    );

    console.log(
        `[ASM] "${rawArea}"${product ? ` / ${product}` : ''} -> ${asm.name} ` +
        `(${sent ? 'sent' : 'FAILED'}) — lead ${leadId}`
    );
    return {
        leadId,
        status: sent ? 'sent' : 'failed',
        asm: { id: asm.id, name: asm.name, phone_number: asm.phone_number },
        matchedArea: asm.area_label || rawArea,
        product,
        car,
    };
}
