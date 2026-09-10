import db from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import { WhatsAppService } from './whatsapp.service.js';

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

export interface EnquiryInput {
    area: string;
    phone: string;
    name?: string | null;
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
    status: 'sent' | 'failed' | 'unmatched';
    asm?: { id: string; name: string; phone_number: string };
    matchedArea?: string;
}

/**
 * Find the ASM for an area.
 *
 * Tries the whole string first, then each word within it. People write their
 * location as they speak it — "Rohini, Delhi", "Andheri Mumbai" — and only the
 * wider part of that is ever mapped, so matching the whole string alone would
 * turn a perfectly clear answer into an unmatched lead.
 *
 * A word only matches if it IS a mapped area, so this cannot invent a match:
 * "Rohini" hits nothing, "Delhi" hits Gunjan, and a location naming no mapped
 * area still lands in the unmatched queue where someone can fix it.
 *
 * Longer words are tried first, so "New Delhi" beats "Delhi" when both are
 * mapped to different people — the more specific mapping should win.
 */
async function findAsmForArea(area: string) {
    const whole = areaKey(area);
    if (!whole) return null;

    const candidates = [whole];

    // Multi-word locations: try the parts too, longest first.
    const words = String(area)
        .split(/[^A-Za-z0-9]+/)
        .map(w => areaKey(w))
        .filter(w => w.length > 2 && w !== whole)
        .sort((a, b) => b.length - a.length);

    // Adjacent pairs catch "New Delhi" inside "Rohini New Delhi".
    const raw = String(area).split(/[^A-Za-z0-9]+/).filter(Boolean);
    for (let i = 0; i < raw.length - 1; i++) {
        const pair = areaKey(raw[i] + raw[i + 1]);
        if (pair && pair !== whole) candidates.push(pair);
    }
    candidates.push(...words);

    for (const key of [...new Set(candidates)]) {
        const [rows]: any = await db.execute(
            `SELECT a.id, a.name, a.phone_number, a.is_active, ar.area_label
               FROM asm_areas ar
               JOIN asms a ON a.id = ar.asm_id
              WHERE ar.area_key = ?
              LIMIT 1`,
            [key]
        );
        if (!rows.length) continue;

        // A deactivated ASM should not be messaged, but the area is still
        // "known" — recorded as unmatched so it shows as a gap to reassign.
        if (!rows[0].is_active) return null;

        if (key !== whole) console.log(`[ASM] "${area}" matched on "${rows[0].area_label}"`);
        return rows[0];
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
        input.name || null,
        phone,
        phoneKey(phone),
        rawArea || null,
        input.flowId || null,
        input.rawPayload ? JSON.stringify(input.rawPayload) : null,
    ];

    if (!asm) {
        await db.execute(
            `INSERT INTO leads
               (id, source, customer_name, customer_phone, phone_key, raw_area,
                flow_id, raw_payload, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'unmatched')`,
            baseRow
        );
        console.log(`[ASM] no ASM covers "${rawArea}" — lead ${leadId} queued as unmatched`);
        return { leadId, status: 'unmatched' };
    }

    const receivedAt = new Date().toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true,
    });

    let sent = false;
    try {
        sent = await WhatsAppService.sendAsmEnquiry(
            asm.phone_number,
            asm.name,
            input.name || '',
            phone,
            asm.area_label || rawArea,
            receivedAt
        );
    } catch (err: any) {
        // Swallowed deliberately — the lead is still recorded below, and a lost
        // enquiry with no trace is the outcome worth avoiding.
        console.error(`[ASM] send to ${asm.name} failed:`, err?.message);
    }

    await db.execute(
        `INSERT INTO leads
           (id, source, customer_name, customer_phone, phone_key, raw_area,
            flow_id, raw_payload, matched_area, asm_id, status, sent_at, failure_reason)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            ...baseRow,
            asm.area_label || rawArea,
            asm.id,
            sent ? 'sent' : 'failed',
            sent ? new Date() : null,
            sent ? null : 'WhatsApp send failed',
        ]
    );

    console.log(`[ASM] "${rawArea}" -> ${asm.name} (${sent ? 'sent' : 'FAILED'}) — lead ${leadId}`);
    return {
        leadId,
        status: sent ? 'sent' : 'failed',
        asm: { id: asm.id, name: asm.name, phone_number: asm.phone_number },
        matchedArea: asm.area_label || rawArea,
    };
}
