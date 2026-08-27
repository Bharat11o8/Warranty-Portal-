import db from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import { findContactByPhone } from './auditContacts.service.js';

/**
 * Store the answers from a WhatsApp Flow audit submission.
 *
 * Interakt does not document the shape of `message_campaign_flow_response`, and
 * the three responses that arrived before this existed were logged as an event
 * name only, so their bodies are gone. Rather than wait for a captured payload,
 * this searches the whole body for the answer object instead of reading a fixed
 * path — a nesting change on their side then costs us nothing.
 *
 * The complete payload always goes into `raw_response`, so even a submission
 * this fails to interpret can be re-parsed later without asking the store to
 * fill the audit in again.
 */

/** The Flow's field names, from the published JSON (v7.1). */
const ANSWER_FIELDS = [
    'signage_status',
    'online_presence',
    'online_presence_other',
    'footfall',
    'seat_covers_stock',
    'products_stocked',
    'last_month_business',
    'staff_training',
    'warranty_registration',
    'support_needed',
    'support_details',
] as const;

/** Carried into the Flow when it is sent, not answered by the store. */
const CONTEXT_FIELDS = [
    'audit_date',
    'franchise_name',
    'store_contact_no',
    'contact_person',
    'city',
    'state',
    'zone',
    'asm',
    'brands',
    'category',
] as const;

const ALL_FIELDS: string[] = [...ANSWER_FIELDS, ...CONTEXT_FIELDS];

/**
 * Keys whose string values are worth trying to parse as JSON.
 *
 * The real payload (captured 2026-08-26) nests the answers TWICE over:
 * data.message.message is a JSON string holding nfm_reply.response_json, which
 * is itself a JSON string holding the answers. So `message` belongs here, and
 * the walk below has to keep unwrapping rather than parse a single layer.
 */
const LIKELY_CONTAINERS = [
    'response_json',
    'responseJson',
    'message',
    'flow_response',
    'flowResponse',
    'response',
    'flow_data',
    'screen_data',
];

/**
 * Find the object holding the Flow answers.
 *
 * Walks the payload breadth-first and returns whichever object carries the most
 * known field names, so the answers are found wherever they sit. A JSON string
 * is parsed and searched too — Interakt sends `response_json` as a string in
 * some of their webhooks.
 */
export function findAnswers(payload: any): Record<string, any> | null {
    let best: Record<string, any> | null = null;
    let bestScore = 0;

    const queue: any[] = [payload];
    const seen = new Set<any>();

    while (queue.length > 0) {
        const node = queue.shift();
        if (!node || typeof node !== 'object' || seen.has(node)) continue;
        seen.add(node);

        // Score this object by how many known fields it carries.
        const score = ALL_FIELDS.filter(f => f in node).length;
        if (score > bestScore) {
            best = node as Record<string, any>;
            bestScore = score;
        }

        for (const [key, value] of Object.entries(node)) {
            if (value && typeof value === 'object') {
                queue.push(value);
                continue;
            }
            // A string holding JSON: parse and search it too. Whatever comes out
            // goes back on the queue, so a value encoded more than once — as the
            // real Interakt payload is — gets unwrapped layer by layer.
            if (typeof value === 'string') {
                const trimmed = value.trim();
                const looksJson = trimmed.startsWith('{') || trimmed.startsWith('[');
                // Parse anything under a known container key, and anything that
                // looks like JSON regardless of key, since Interakt puts the
                // outer layer under a plain "message".
                if (looksJson && (LIKELY_CONTAINERS.includes(key) || trimmed.length < 100000)) {
                    try {
                        queue.push(JSON.parse(trimmed));
                    } catch {
                        // Not JSON after all; ignore and keep walking.
                    }
                }
            }
        }
    }

    // One known field could be a coincidence; two is the answer object.
    return bestScore >= 2 ? best : null;
}

/** Interakt may send the phone under any of these. */
function findPhone(payload: any): string {
    const c = payload?.data?.customer ?? payload?.customer ?? {};
    const raw =
        c.phone_number ?? c.phoneNumber ?? c.phone ??
        payload?.data?.phone_number ?? payload?.phone_number ?? '';
    const cc = String(c.country_code ?? c.countryCode ?? '').replace('+', '');
    const num = String(raw).replace(/\D/g, '');
    if (!num) return '';
    // Avoid doubling the country code when it is already part of the number.
    return cc && !num.startsWith(cc) ? `${cc}${num}` : num;
}

/** Multi-selects arrive as arrays; store them the same way a call audit does. */
function join(x: any): string | null {
    if (Array.isArray(x)) return x.join(', ') || null;
    if (x === undefined || x === null || x === '') return null;
    return String(x);
}

function val(answers: Record<string, any>, key: string): string | null {
    const v = answers[key];
    if (v === undefined || v === null || v === '') return null;
    return Array.isArray(v) ? join(v) : String(v);
}

/**
 * Match the submission to a store: by the phone that submitted it, falling back
 * to the store name the Flow carried. Returns null when neither matches, and
 * the audit is still stored so it can be attached by hand later.
 */
async function resolveVendor(phone: string, franchiseName: string | null) {
    if (phone) {
        // Compare on the last 10 digits so country codes and formatting differences
        // do not prevent a match.
        const last10 = phone.slice(-10);
        if (last10.length === 10) {
            const [rows]: any = await db.execute(
                `SELECT vd.id
                 FROM vendor_details vd
                 JOIN profiles p ON p.id = vd.user_id
                 WHERE RIGHT(REGEXP_REPLACE(COALESCE(p.phone_number, ''), '[^0-9]', ''), 10) = ?
                 LIMIT 1`,
                [last10]
            );
            if (rows.length > 0) return rows[0].id as string;
        }
    }

    if (franchiseName && franchiseName.trim()) {
        const [rows]: any = await db.execute(
            `SELECT id FROM vendor_details WHERE store_name = ? LIMIT 1`,
            [franchiseName.trim()]
        );
        if (rows.length > 0) return rows[0].id as string;
    }

    return null;
}

/** The audit template, so campaign traffic for other templates is ignored. */
const AUDIT_TEMPLATE = 'af_audit_template';

/** Pull the campaign identity out of a payload, whichever event it is. */
function campaignOf(payload: any) {
    const d = payload?.data ?? {};
    const m = d.message ?? {};
    const src = d.source_template_message ?? {};
    return {
        id: String(m.campaign_id ?? src.campaign_id ?? d.campaign_id ?? '').trim(),
        name: String(m.campaign_name ?? d.campaign_name ?? '').trim(),
        template: String(src.template_name ?? d.template_name ?? m.template_name ?? '').trim(),
    };
}

/** A readable round name from the campaign, falling back to the month. */
function roundNameFor(campaignName: string, when: Date) {
    if (campaignName) return campaignName;
    return when.toLocaleString('en-GB', { month: 'long', year: 'numeric' });
}

/**
 * The round for a campaign, created on first sight.
 *
 * The campaign IS the round: a reply carries the campaign_id of the message it
 * answers, so a store replying in September to an August campaign is still
 * counted for August. That makes attribution exact without grace periods, and
 * lets two campaigns overlap without ambiguity.
 *
 * Rounds are created lazily — a month with no campaign creates nothing, rather
 * than showing an empty round as 0% compliance.
 */
async function ensureRound(payload: any): Promise<string | null> {
    const c = campaignOf(payload);
    if (!c.id) return null;

    const [existing]: any = await db.execute(
        `SELECT id FROM audit_rounds WHERE campaign_id = ? LIMIT 1`,
        [c.id]
    );
    if (existing.length > 0) return existing[0].id as string;

    const id = uuidv4();
    const now = new Date();
    try {
        await db.execute(
            `INSERT INTO audit_rounds (id, name, campaign_id, campaign_name, template_name, first_sent_at, status)
             VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 'open')`,
            [id, roundNameFor(c.name, now), c.id, c.name || null, c.template || null]
        );
        console.log(`[Audit] Opened round "${roundNameFor(c.name, now)}" for campaign ${c.id}`);
        return id;
    } catch (err: any) {
        // Two events for the same campaign can race; the unique key settles it.
        if (err?.code === 'ER_DUP_ENTRY') {
            const [again]: any = await db.execute(
                `SELECT id FROM audit_rounds WHERE campaign_id = ? LIMIT 1`, [c.id]
            );
            return again.length > 0 ? (again[0].id as string) : null;
        }
        throw err;
    }
}

/**
 * Record that the audit was sent to one store.
 *
 * This is what makes non-responders exist as data: without a row per recipient,
 * a store that never replies is simply absent rather than outstanding.
 */
export async function recordAuditSent(payload: any): Promise<void> {
    try {
        const c = campaignOf(payload);
        // Only audit campaigns; other campaign traffic is none of our business.
        if (!c.id) return;
        if (c.template && c.template !== AUDIT_TEMPLATE) return;

        const roundId = await ensureRound(payload);
        if (!roundId) return;

        const phone = findPhone(payload);
        if (!phone) return;

        const vendorId = await resolveVendor(phone, null);

        await db.execute(
            `INSERT INTO audit_round_targets (id, round_id, vendor_details_id, sent_at, sent_phone)
             VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?)
             ON DUPLICATE KEY UPDATE sent_at = COALESCE(sent_at, CURRENT_TIMESTAMP)`,
            [uuidv4(), roundId, vendorId, phone]
        );
    } catch (error: any) {
        // A failure here must not break the webhook, or Interakt retries and we
        // lose later events too.
        console.error('[Audit] Failed to record campaign send:', error?.message || error);
    }
}

/**
 * Mark this store as having responded to the round.
 *
 * Only fills a target that is still outstanding, so a store that submits twice
 * keeps the first response time and both audits are still stored.
 */
async function markResponded(roundId: string, vendorId: string, auditId: string) {
    const [r]: any = await db.execute(
        `UPDATE audit_round_targets
         SET store_audit_id = ?, responded_at = CURRENT_TIMESTAMP
         WHERE round_id = ? AND vendor_details_id = ? AND responded_at IS NULL`,
        [auditId, roundId, vendorId]
    );

    // A reply with no target row means the send event never reached us. Record
    // it anyway: a store that answered must never show as outstanding.
    if (r.affectedRows === 0) {
        await db.execute(
            `INSERT INTO audit_round_targets (id, round_id, vendor_details_id, store_audit_id, responded_at)
             VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
             ON DUPLICATE KEY UPDATE
                store_audit_id = COALESCE(store_audit_id, VALUES(store_audit_id)),
                responded_at   = COALESCE(responded_at, VALUES(responded_at))`,
            [uuidv4(), roundId, vendorId, auditId]
        );
    }
}

export interface AuditIngestResult {
    stored: boolean;
    id?: string;
    vendorMatched: boolean;
    fieldsFound: number;
    reason?: string;
}

/**
 * Ingest one `message_campaign_flow_response` payload.
 *
 * Never throws: a webhook that fails must not take down the endpoint, or
 * Interakt will retry and we lose later events too.
 */
export async function ingestFlowAuditResponse(payload: any): Promise<AuditIngestResult> {
    try {
        const answers = findAnswers(payload);
        const phone = findPhone(payload);

        if (!answers) {
            // Keep the body regardless — an unparsed audit is recoverable, a
            // discarded one is not. This is exactly what cost us the first three.
            const id = uuidv4();
            const roundId = await ensureRound(payload);
            await db.execute(
                `INSERT INTO store_audits
                   (id, round_id, vendor_details_id, submitted_phone, channel, flow_name, raw_response, review_status)
                 VALUES (?, ?, NULL, ?, 'whatsapp', 'af_store_audit_2', ?, 'follow_up')`,
                [id, roundId, phone || '', JSON.stringify(payload)]
            );
            console.warn('[Audit] Flow response stored but no answers recognised — id', id);
            return { stored: true, id, vendorMatched: false, fieldsFound: 0, reason: 'no answer fields recognised' };
        }

        const franchiseName = val(answers, 'franchise_name');
        let vendorId = await resolveVendor(phone, franchiseName);

        // Not a registered franchise, so try the admin's uploaded store list.
        // The Flow is supposed to prefill the store's details but sends them
        // empty, leaving only the phone; this list is where the name, area and
        // territory come from for a store the portal does not hold.
        const contact = vendorId ? null : await findContactByPhone(phone);
        if (contact?.vendor_details_id) vendorId = contact.vendor_details_id;
        const id = uuidv4();
        const roundId = await ensureRound(payload);

        await db.execute(
            `INSERT INTO store_audits
               (id, round_id, vendor_details_id, submitted_phone, channel, audited_by, audited_by_name,
                flow_id, flow_name, flow_version,
                audit_date, franchise_name, store_contact_no, contact_person, city, state,
                zone, asm, brands, category,
                signage_status, online_presence, online_presence_other, footfall,
                seat_covers_stock, products_stocked, last_month_business, staff_training,
                warranty_registration, support_needed, support_details,
                raw_response, review_status)
             VALUES (?, ?, ?, ?, 'whatsapp', NULL, NULL,
                     ?, 'af_store_audit_2', ?,
                     ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                     ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                     ?, ?)`,
            [
                id,
                roundId,
                vendorId,
                phone || '',
                String(payload?.data?.flow_id ?? payload?.flow_id ?? '2152498745701937'),
                String(payload?.data?.flow_version ?? payload?.flow_version ?? '7.1'),
                val(answers, 'audit_date') || new Date().toISOString().slice(0, 10),
                franchiseName || contact?.store_name || null,
                val(answers, 'store_contact_no') || contact?.raw_phone || null,
                val(answers, 'contact_person') || contact?.contact_person || null,
                val(answers, 'city') || contact?.city || null,
                val(answers, 'state') || contact?.state || null,
                val(answers, 'zone') || contact?.zone || null,
                val(answers, 'asm') || contact?.asm || null,
                val(answers, 'brands') || contact?.brands || null,
                val(answers, 'category') || contact?.category || null,
                val(answers, 'signage_status'),
                join(answers['online_presence']),
                val(answers, 'online_presence_other'),
                val(answers, 'footfall'),
                val(answers, 'seat_covers_stock'),
                join(answers['products_stocked']),
                val(answers, 'last_month_business'),
                val(answers, 'staff_training'),
                val(answers, 'warranty_registration'),
                val(answers, 'support_needed'),
                val(answers, 'support_details'),
                JSON.stringify(payload),
                // An unmatched store needs a human to attach it before the audit
                // counts, which is what follow_up means here.
                (vendorId || contact) ? 'new' : 'follow_up',
            ]
        );

        // Tick this store off the round's target list, so what remains is the
        // set of stores that have not answered.
        if (roundId && vendorId) {
            await markResponded(roundId, vendorId, id);
        }

        const fieldsFound = ALL_FIELDS.filter(f => f in answers).length;
        console.log(
            `[Audit] Flow response stored — id ${id}, store ${vendorId ?? 'UNMATCHED'}, ${fieldsFound} fields`
        );

        return { stored: true, id, vendorMatched: Boolean(vendorId), fieldsFound };
    } catch (error: any) {
        console.error('[Audit] Failed to store Flow response:', error?.message || error);
        return { stored: false, vendorMatched: false, fieldsFound: 0, reason: error?.message };
    }
}
