import db from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import { WhatsAppService } from './whatsapp.service.js';
import { findState } from './indianStates.js';
import { phoneKey, normaliseProduct, asmLeadNumber } from './asmRouting.service.js';
import { isPincode, extractPincode } from './storeLocator.js';
import { findStoresForPincode, getLocatorSettings, repliesTo, type LocatorResult } from './storeLocatorQuery.js';
import {
    storeList,
    distributorList,
    storeDetailsText,
    distributorDetailsText,
    asmText,
    supportText,
    titleCase,
    INVALID_PINCODE_TEXT,
    type LocatorReply,
} from './storeLocatorMessages.js';

/**
 * The store locator over WhatsApp.
 *
 * The Interakt workflow greets the customer, asks what they want and for their
 * pincode, then hands over to us through a webhook and stops. From there:
 *
 *   pincode        → a list of stores near them, or the fallback contact
 *   tap a store    → its name, address and phone; the lead records the store
 *   tap a partner  → the same, for a distributor standing in for a store
 *   "More stores"  → the next page of the same list
 *   a new pincode  → the search again, for anyone mid-conversation with us
 *
 * Every enquiry is a lead, whether or not a reply went out. While the locator
 * is not live, only the admin's test numbers get replies, and nobody else is
 * ever messaged — not a customer, not an ASM. Third parties are contacted only
 * when it is live, so testing from your own phone can never reach a real ASM.
 */

/** Marks the leads this flow creates, to find them again when a tap comes back. */
export const LOCATOR_FLOW_ID = 'store-locator';

/**
 * The workflow can fire twice for one answer; the second is the same enquiry.
 *
 * Seconds, not minutes: a double-fire lands almost at once, while a customer
 * who runs the whole flow again for the same pincode is asking again and must
 * get the list again. At two minutes, a tester re-running the flow after 95
 * seconds was silently ignored.
 */
const REPEAT_WINDOW_SECONDS = 15;

/** How long after an enquiry a bare pincode is taken as a new search. */
const FOLLOW_UP_HOURS = 24;

const CONTEXT = 'store_locator';

export interface StoreEnquiry {
    pincode: string;
    phone: string;
    name?: string | null;
    product?: string | null;
    car?: string | null;
    /** Where the enquiry came from: the Interakt workflow, or an Instagram lead form. */
    source?: 'whatsapp' | 'instagram';
    rawPayload?: unknown;
}

export type EnquiryOutcome =
    | 'invalid-pincode' | 'repeat'
    | 'stores' | 'distributor' | 'asm' | 'support';

const receivedAt = () => new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true,
});

async function reply(phone: string, type: 'Text' | 'InteractiveList', data: Record<string, unknown>, leadId?: string) {
    return WhatsAppService.sendSessionMessage(phone, type, data, CONTEXT, leadId);
}

const text = (body: string) => ({ message: body });

/**
 * A pincode from the workflow, or typed again mid-conversation.
 *
 * Never throws: it runs after the webhook has already been answered, and an
 * error here would only be lost in the log.
 */
export async function startStoreEnquiry(input: StoreEnquiry): Promise<EnquiryOutcome> {
    const phone = String(input.phone || '').trim();
    const typed = String(input.pincode || '').trim();
    const pincode = extractPincode(typed) ?? '';
    const source = input.source ?? 'whatsapp';
    const settings = await getLocatorSettings();
    const canReply = repliesTo(settings, phone);

    const [recent]: any = await db.execute(
        `SELECT id FROM leads
          WHERE phone_key = ? AND flow_id = ? AND raw_area <=> ?
            AND created_at >= DATE_SUB(NOW(), INTERVAL ? SECOND)
          LIMIT 1`,
        [phoneKey(phone), LOCATOR_FLOW_ID, pincode || typed.slice(0, 255) || null, REPEAT_WINDOW_SECONDS]
    );
    if (recent.length) {
        console.log(`[Locator] repeat of ${pincode || typed || '(no pincode)'} from ${phoneKey(phone)} — lead ${recent[0].id} already answered`);
        return 'repeat';
    }

    if (!isPincode(pincode)) {
        /*
         * No usable pincode — an Instagram form answered "near the bus stand",
         * or left blank. The customer is asked for it, and the enquiry is kept
         * as a lead so it is not lost: that record is also what lets the
         * pincode they type next be taken up (handlePincodeMessage looks for a
         * recent locator lead from the same phone).
         */
        const leadId = uuidv4();
        if (canReply) await reply(phone, 'Text', text(INVALID_PINCODE_TEXT), leadId);
        await db.execute(
            `INSERT INTO leads
               (id, source, product, car_model, customer_name, customer_phone, phone_key,
                raw_area, flow_id, raw_payload, status, failure_reason)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'unmatched', 'No valid pincode given')`,
            [
                leadId, source, normaliseProduct(input.product),
                String(input.car || '').trim().slice(0, 80) || null,
                input.name ? String(input.name).trim().slice(0, 255) : null,
                phone, phoneKey(phone), typed.slice(0, 255) || null, LOCATOR_FLOW_ID,
                JSON.stringify({
                    ...(input.rawPayload && typeof input.rawPayload === 'object' ? input.rawPayload as object : {}),
                    locator: { pincode: typed || null, offered: 'invalid-pincode' },
                }),
            ]
        );
        console.log(`[Locator] no valid pincode in "${typed}" from ${phoneKey(phone)} (${source}) — asked for one, lead ${leadId}`);
        return 'invalid-pincode';
    }

    const result = await findStoresForPincode(pincode);
    const leadId = uuidv4();
    const district = result.customer?.district ?? null;
    const place = district && district !== 'NA' ? `${titleCase(district)} (${pincode})` : pincode;
    const kind: EnquiryOutcome = result.stores.length ? 'stores' : (result.fallback?.kind ?? 'support');

    // ─── What the customer gets ─────────────────────────────────────────────
    let sent: boolean | null = null;   // null: held back, not live for this number
    if (canReply) {
        sent = await sendResult(phone, leadId, result, 1);
    }

    // ─── Who else hears about it: live only ─────────────────────────────────
    let status: 'matched' | 'unmatched' | 'sent' | 'failed' = kind === 'support' ? 'unmatched' : 'matched';
    let asmId: string | null = null;
    if (kind === 'asm') {
        const asm = result.fallback!.contacts[0];
        asmId = asm.id;
        if (settings.whatsapp_live && asm.phone) {
            const ok = await WhatsAppService.sendAsmEnquiry(
                asm.phone, asm.name, input.name || '', phone, place, receivedAt(),
                normaliseProduct(input.product), input.car || null,
                asm.id ? await asmLeadNumber(asm.id).catch(() => undefined) : undefined,
            ).catch(() => false);
            status = ok ? 'sent' : 'failed';
        }
    }

    const raw = {
        ...(input.rawPayload && typeof input.rawPayload === 'object' ? input.rawPayload as object : {}),
        locator: {
            pincode,
            offered: kind,
            count: kind === 'stores' ? result.stores.length : (result.fallback?.contacts.length ?? 0),
            reply: sent === null ? 'held' : sent ? 'sent' : 'failed',
        },
    };

    await db.execute(
        `INSERT INTO leads
           (id, source, product, car_model, state, customer_name, customer_phone, phone_key,
            raw_area, matched_area, asm_id, flow_id, raw_payload, status, sent_at, failure_reason)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            leadId,
            source,
            normaliseProduct(input.product),
            String(input.car || '').trim().slice(0, 80) || null,
            findState(String(result.customer?.state ?? ''))?.state ?? null,
            input.name ? String(input.name).trim().slice(0, 255) : null,
            phone,
            phoneKey(phone),
            pincode,
            district && district !== 'NA' ? place : null,
            asmId,
            LOCATOR_FLOW_ID,
            JSON.stringify(raw),
            status,
            status === 'sent' ? new Date() : null,
            sent === false ? 'WhatsApp reply to the customer failed' : null,
        ]
    );

    console.log(`[Locator] ${pincode} from ${phoneKey(phone)} (${source}) -> ${kind}` +
        `${kind === 'stores' ? ` (${result.stores.length})` : ''}, reply ${raw.locator.reply} — lead ${leadId}`);

    /*
     * Nobody near — no store, ASM or distributor — so customer support is the
     * one place this lead can go. The customer is shown the support number;
     * support is told about the customer, in the same alert a store gets, so
     * the lead does not sit unseen in Lead Management. After the insert,
     * because notifyOnce records the alert on the lead row.
     */
    if (kind === 'support') {
        const support = result.fallback?.contacts[0];
        await notifyOnce(
            { id: leadId, notified: null, customer_phone: phone, location: place,
              product: normaliseProduct(input.product), car_model: String(input.car || '').trim() || null },
            'support', support?.phone ?? null, support?.name || 'Autoform Customer Support', settings.whatsapp_live,
        ).catch(err => console.error('[Locator] support alert failed:', err?.message));
    }
    return kind;
}

/** Send the customer what the locator found, at a given page of the list. */
async function sendResult(phone: string, leadId: string, result: LocatorResult, page: number): Promise<boolean> {
    if (result.stores.length) {
        const msg = storeList(leadId, result.stores, page);
        return msg ? reply(phone, 'InteractiveList', msg as any, leadId) : false;
    }

    const fallback = result.fallback;
    if (fallback?.kind === 'distributor') {
        const msg = distributorList(leadId, fallback.contacts, page);
        return msg ? reply(phone, 'InteractiveList', msg as any, leadId) : false;
    }
    if (fallback?.kind === 'asm') {
        return reply(phone, 'Text', text(asmText(fallback.contacts[0])), leadId);
    }
    const support = fallback?.contacts[0] ?? { id: null, name: 'Autoform Customer Support', phone: null };
    return reply(phone, 'Text', text(supportText(support)), leadId);
}

/**
 * The customer tapped a row in one of our lists.
 *
 * The lead is looked up by the id in the row and must belong to the phone the
 * tap came from, so a row id cannot be replayed from another number to pull
 * someone else's enquiry. Returns whether the tap was ours to handle.
 */
export async function handleLocatorReply(senderPhone: string, tap: LocatorReply): Promise<boolean> {
    const [rows]: any = await db.execute(
        `SELECT id, raw_area, phone_key, customer_phone, product, car_model,
                JSON_EXTRACT(raw_payload, '$.locator.notified') AS notified
           FROM leads WHERE id = ? AND flow_id = ? LIMIT 1`,
        [tap.leadId, LOCATOR_FLOW_ID]
    );
    const lead = rows[0];
    if (!lead || lead.phone_key !== phoneKey(senderPhone)) {
        console.warn(`[Locator] tap for lead ${tap.leadId} from ${phoneKey(senderPhone)} does not match — ignored`);
        return true;
    }

    const settings = await getLocatorSettings();
    if (!repliesTo(settings, senderPhone)) return true;

    if (tap.kind === 'more') {
        const page = Math.max(2, Math.min(50, Number(tap.ref) || 2));
        const result = await findStoresForPincode(lead.raw_area);
        await sendResult(senderPhone, lead.id, result, page);
        return true;
    }

    if (tap.kind === 'store') {
        const [stores]: any = await db.execute(
            `SELECT vd.id, vd.store_name, vd.address, vd.city, vd.pincode, p.phone_number
               FROM vendor_details vd
               JOIN vendor_verification vv ON vv.user_id = vd.user_id AND vv.is_verified = 1
               LEFT JOIN profiles p ON p.id = vd.user_id
              WHERE vd.id = ? AND vd.is_franchise = 1
              LIMIT 1`,
            [tap.ref]
        );
        const store = stores[0];
        if (!store) {
            console.warn(`[Locator] tapped store ${tap.ref} is no longer a verified franchise`);
            return true;
        }
        await reply(senderPhone, 'Text', text(storeDetailsText({
            store_name: store.store_name,
            address: store.address,
            city: store.city,
            pincode: store.pincode,
            phone: store.phone_number,
        })), lead.id);

        // Recorded as the customer's own choice, not an admin's.
        await db.execute(
            `UPDATE leads SET store_id = ?, store_sent_at = NOW(), store_sent_by = 'customer' WHERE id = ?`,
            [store.id, lead.id]
        );
        console.log(`[Locator] lead ${lead.id} picked ${store.store_name}`);
        await notifyOnce(lead, `store:${store.id}`, store.phone_number, store.store_name, settings.whatsapp_live);
        return true;
    }

    // A distributor, when no store was near.
    const [dists]: any = await db.execute(
        'SELECT id, name, phone_number, city FROM distributors WHERE id = ? LIMIT 1',
        [tap.ref]
    );
    const d = dists[0];
    if (!d) return true;
    await reply(senderPhone, 'Text', text(distributorDetailsText({
        id: String(d.id), name: d.name, phone: d.phone_number, city: d.city,
    })), lead.id);
    await db.execute(
        `UPDATE leads SET raw_payload = JSON_SET(COALESCE(raw_payload, JSON_OBJECT()),
            '$.locator.picked_distributor', JSON_OBJECT('id', ?, 'name', ?)) WHERE id = ?`,
        [String(d.id), d.name, lead.id]
    );
    console.log(`[Locator] lead ${lead.id} picked distributor ${d.name}`);
    await notifyOnce(lead, `distributor:${d.id}`, d.phone_number, d.name, settings.whatsapp_live);
    return true;
}

/**
 * Tell whoever the lead went to — the store or distributor the customer
 * picked, or customer support when nobody was near — that it is coming.
 *
 * Live only: a test from an admin's phone must never land on a real store's
 * phone. Once per recipient per enquiry — a customer tapping the same row
 * twice is one lead, while picking a second store is a lead for that store too.
 * Whether it went is kept on the lead, under locator.notified, keyed
 * `store:<id>`, `distributor:<id>` or `support`.
 */
async function notifyOnce(lead: any, key: string, phone: string | null, name: string, live: boolean) {
    if (!live || !phone) return;

    let notified: string[] = [];
    try {
        const parsed = typeof lead.notified === 'string' ? JSON.parse(lead.notified) : lead.notified;
        if (Array.isArray(parsed)) notified = parsed.map(String);
    } catch { /* nothing recorded yet */ }
    if (notified.includes(key)) return;

    /*
     * The recipient's lead number for the month: the leads it has already been
     * alerted about since the 1st, plus this one. Starts again at #1 each
     * month. The connection runs in IST, so the month turns at midnight India
     * time. Counted from locator.notified, the same record that stops a repeat
     * alert, so a lead is numbered only if the store actually heard about it.
     */
    const [[{ prior }]]: any = await db.execute(
        `SELECT COUNT(*) AS prior FROM leads
          WHERE flow_id = ?
            AND created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')
            AND JSON_CONTAINS(COALESCE(JSON_EXTRACT(raw_payload, '$.locator.notified'), JSON_ARRAY()), JSON_QUOTE(?))`,
        [LOCATOR_FLOW_ID, key]
    );

    const leadNumber = Number(prior) + 1;
    const when = receivedAt();

    /*
     * Support has its own template, which adds where the customer is — they
     * are the ones who must find them somewhere to go. Until Meta approves it
     * the send fails, and support gets the store alert instead, so no lead
     * goes unannounced in the meantime.
     */
    let ok = false;
    if (key === 'support') {
        ok = await WhatsAppService.sendSupportLead(
            phone, lead.customer_phone, lead.location || '', lead.product, lead.car_model, when, leadNumber, lead.id,
        ).catch(() => false);
    }
    if (!ok) {
        ok = await WhatsAppService.sendStoreLead(
            phone, name, lead.customer_phone, lead.product, lead.car_model, when, leadNumber, lead.id,
        ).catch(() => false);
    }
    if (!ok) return;

    await db.execute(
        `UPDATE leads
            SET raw_payload = JSON_SET(COALESCE(raw_payload, JSON_OBJECT()), '$.locator.notified',
                    JSON_ARRAY_APPEND(COALESCE(JSON_EXTRACT(raw_payload, '$.locator.notified'), JSON_ARRAY()), '$', ?)),
                status = 'sent', sent_at = COALESCE(sent_at, NOW())
          WHERE id = ?`,
        [key, lead.id]
    );
}

/**
 * A bare 6-digit message, as a new search — but only from someone who used the
 * locator in the last day. Anyone else's six digits are not ours to answer.
 */
export async function handlePincodeMessage(senderPhone: string, body: string): Promise<boolean> {
    const pincode = String(body || '').trim();
    if (!/^[1-9][0-9]{5}$/.test(pincode)) return false;

    const [rows]: any = await db.execute(
        `SELECT customer_name, product, car_model, source FROM leads
          WHERE phone_key = ? AND flow_id = ?
            AND created_at >= DATE_SUB(NOW(), INTERVAL ? HOUR)
          ORDER BY created_at DESC LIMIT 1`,
        [phoneKey(senderPhone), LOCATOR_FLOW_ID, FOLLOW_UP_HOURS]
    );
    if (!rows.length) return false;

    const last = rows[0];
    await startStoreEnquiry({
        pincode, phone: senderPhone, name: last.customer_name, product: last.product, car: last.car_model,
        source: last.source === 'instagram' ? 'instagram' : 'whatsapp',
        rawPayload: { source: 'follow-up pincode' },
    });
    return true;
}
