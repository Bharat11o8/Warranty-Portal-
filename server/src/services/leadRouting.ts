/**
 * Where a store-locator lead actually went, for the Forwarded to column.
 *
 * The locator (storeLocatorChat) walks a chain for the customer's pincode:
 *
 *   stores within 15 km → the customer picks one, and that store is alerted
 *   else the ASM        → the ASM is alerted straight away
 *   else distributors   → the customer picks one, and that one is alerted
 *   else support        → customer support is alerted
 *
 * Only the ASM lands in leads.asm_id. Everyone else alerted is kept in
 * raw_payload.locator.notified, keyed `store:<id>`, `distributor:<id>` or
 * `support`, and each alert's delivery sits in message_logs against the lead
 * id. This reads the two together. Free of any database import, so it can be
 * tested; the controller fetches the names and delivery statuses.
 */

import { extractPincode } from './storeLocator.js';

export type LocatorOutcome = 'stores' | 'distributor' | 'asm' | 'support' | 'invalid-pincode';
export type Delivery = 'sent' | 'delivered' | 'read' | 'failed';

export interface Recipient {
    kind: 'store' | 'distributor' | 'support';
    id: string | null;
    name: string;
    /** How far the alert got. Null when message_logs has no record of it. */
    delivery: Delivery | null;
}

export interface LeadRouting {
    outcome: LocatorOutcome;
    /** How many stores or distributors the customer was shown. */
    offered: number;
    /** The customer got no reply: the locator was not live for their number. */
    held: boolean;
    /** Everyone alerted about this lead, in the order it happened. */
    recipients: Recipient[];
    /** The customer's pick when nobody was alerted about it (not live). */
    pickedOnly: string | null;
}

/**
 * A lead's pincode. raw_payload.pincode first — what the workflow or the form
 * captured, or what an auditor entered — then one inside the area as typed,
 * where the store locator keeps the customer's.
 */
export function leadPincode(rawPayload: unknown, rawArea: unknown): string | null {
    let raw: any = rawPayload;
    if (typeof raw === 'string') {
        try { raw = JSON.parse(raw); } catch { raw = null; }
    }
    return extractPincode(raw?.pincode) ?? extractPincode(rawArea);
}

/** The area as typed, unless it is only a pincode — that has its own column. */
export function areaText(rawArea: unknown): string | null {
    const s = String(rawArea ?? '').trim();
    return s && !/^[1-9]\d{2}\s?-?\d{3}$/.test(s) ? s : null;
}

/**
 * Where a lead stands, in plain words — in place of the routing statuses
 * (unmatched, matched, throttled…) that describe the software rather than the
 * customer. "Unmatched" in particular read as a failure for every IVR lead
 * that is simply waiting for the auditor.
 *
 *   not-forwarded  nobody has it yet: the auditor calls and sends a store
 *   no-pincode     the locator asked the customer for a valid pincode again
 *   choosing       the customer was sent a list and has not picked yet
 *   forwarded      a store, ASM, distributor or support has it
 *   failed         the alert to whoever should have it did not arrive
 *   repeat         the same customer again within a day, not sent twice
 */
export type LeadStage = 'answering' | 'not-forwarded' | 'no-pincode' | 'choosing' | 'forwarded' | 'failed' | 'repeat';
export const LEAD_STAGES: LeadStage[] = ['answering', 'not-forwarded', 'no-pincode', 'choosing', 'forwarded', 'failed', 'repeat'];

/* A chat nobody has answered for this long has stopped; see locatorConversation. */
const CHAT_IDLE_MS = 30 * 60_000;

const AUTO_ROUTED = ['whatsapp', 'instagram'];

export interface StageInput {
    source: string;
    status: string;
    routing: LeadRouting | null;
    asm_name?: string | null;
    delivery_status?: string | null;
    store_name?: string | null;
    store_sent_by?: string | null;
    store_alert_status?: string | null;
    raw_payload?: unknown;
}

/** How far each alert about the lead got — the forwards, not the customer's own messages. */
export function forwardDeliveries(l: StageInput): (string | null)[] {
    if (l.routing && l.routing.outcome !== 'asm') return l.routing.recipients.map(r => r.delivery);
    if (l.asm_name) return [l.delivery_status ?? null];
    if (auditorSentStore(l)) return [l.store_alert_status ?? null];
    return [];
}

/** An IVR or hand-added lead the auditor forwarded by sending a store. */
const auditorSentStore = (l: StageInput) =>
    !AUTO_ROUTED.includes(l.source) && Boolean(l.store_name) && l.store_sent_by !== 'customer';

export function leadStage(l: StageInput, now = Date.now()): LeadStage {
    // Still answering our chat's car or pincode question. Once it goes quiet
    // it is simply not forwarded — the auditor calls.
    const session = locatorOf(l.raw_payload)?.session;
    if (session && ['product', 'product-other', 'car', 'pincode'].includes(session.stage)
        && now - Date.parse(session.at ?? '') <= CHAT_IDLE_MS) return 'answering';
    if (l.status === 'duplicate' || l.status === 'throttled') return 'repeat';
    if (l.status === 'failed' || forwardDeliveries(l).includes('failed')) return 'failed';
    const r = l.routing;
    const forwarded = r && r.outcome !== 'asm'
        ? r.recipients.length > 0
        : Boolean(l.asm_name) || auditorSentStore(l);
    if (forwarded) return 'forwarded';
    if (r?.outcome === 'invalid-pincode') return 'no-pincode';
    if (r && !r.pickedOnly && (r.outcome === 'stores' || r.outcome === 'distributor')) return 'choosing';
    return 'not-forwarded';
}

/** Who has the lead, as kinds: 'asm', 'store', 'distributor', 'support'. Empty for nobody. */
export function forwardKinds(l: StageInput): string[] {
    if (l.routing && l.routing.outcome !== 'asm') return [...new Set(l.routing.recipients.map(r => r.kind))];
    if (l.asm_name) return ['asm'];
    if (auditorSentStore(l)) return ['store'];
    return [];
}

/**
 * The stores this lead went to, by id and name: those alerted after the
 * customer picked them, and the one an admin sent the customer.
 */
export function leadStores(l: StageInput & { store_id?: string | null }): { id: string; name: string }[] {
    const out = new Map<string, string>();
    for (const r of l.routing?.recipients ?? []) {
        if (r.kind === 'store' && r.id) out.set(String(r.id), r.name);
    }
    if (l.store_id && l.store_name) out.set(String(l.store_id), l.store_name);
    return [...out].map(([id, name]) => ({ id, name }));
}

/** The locator part of raw_payload, whether it arrives as text or parsed. */
export function locatorOf(rawPayload: unknown): Record<string, any> | null {
    let raw: any = rawPayload;
    if (typeof raw === 'string') {
        try { raw = JSON.parse(raw); } catch { return null; }
    }
    const loc = raw?.locator;
    return loc && typeof loc === 'object' ? loc : null;
}

/** The ids of the stores and distributors a lead's alerts went to. */
export function notifiedIds(rawPayload: unknown): { stores: string[]; distributors: string[] } {
    const keys = notifiedKeys(locatorOf(rawPayload));
    const ids = (prefix: string) => keys.filter(k => k.startsWith(prefix)).map(k => k.slice(prefix.length));
    return { stores: ids('store:'), distributors: ids('distributor:') };
}

function notifiedKeys(loc: Record<string, any> | null): string[] {
    return Array.isArray(loc?.notified) ? loc!.notified.map(String) : [];
}

const OUTCOMES: LocatorOutcome[] = ['stores', 'distributor', 'asm', 'support', 'invalid-pincode'];

/** The last ten digits, so "+91 98100 46085" and "9810046085" compare equal. */
export const phoneTail = (p: unknown) => String(p ?? '').replace(/\D/g, '').slice(-10);

export interface RoutingLookups {
    stores: Map<string, { name: string; phone: string | null }>;
    distributors: Map<string, { name: string; phone: string | null }>;
    support: { name: string; phone: string | null };
    /** This lead's store and support alerts: who they went to and how far they got. */
    alerts: { phone: string; status: string }[];
}

export function leadRouting(
    lead: { raw_payload: unknown; store_id?: string | null; store_sent_by?: string | null; store_name?: string | null },
    look: RoutingLookups,
): LeadRouting | null {
    const loc = locatorOf(lead.raw_payload);
    const outcome = OUTCOMES.find(o => o === loc?.offered);
    if (!loc || !outcome) return null;

    /* The newest log per recipient: a retry after a failure is what counts. */
    const deliveryTo = (phone: string | null): Delivery | null => {
        const tail = phoneTail(phone);
        if (!tail) return null;
        const hit = [...look.alerts].reverse().find(a => phoneTail(a.phone) === tail);
        return (hit?.status as Delivery) ?? null;
    };

    const recipients: Recipient[] = [];
    for (const key of notifiedKeys(loc)) {
        if (key === 'support') {
            recipients.push({ kind: 'support', id: null, name: look.support.name, delivery: deliveryTo(look.support.phone) });
            continue;
        }
        const cut = key.indexOf(':');
        const kind = key.slice(0, cut);
        const id = key.slice(cut + 1);
        if (kind !== 'store' && kind !== 'distributor') continue;
        const found = (kind === 'store' ? look.stores : look.distributors).get(id);
        recipients.push({
            kind, id,
            name: found?.name ?? (kind === 'store' ? 'Store (no longer listed)' : 'Distributor (no longer listed)'),
            delivery: deliveryTo(found?.phone ?? null),
        });
    }

    /* A pick nobody heard about: the locator was held back for this number,
       so the customer chose but the store's phone never rang. */
    let pickedOnly: string | null = null;
    if (!recipients.length) {
        if (outcome === 'stores' && lead.store_sent_by === 'customer' && lead.store_name) pickedOnly = lead.store_name;
        if (outcome === 'distributor' && loc.picked_distributor?.name) pickedOnly = String(loc.picked_distributor.name);
    }

    return {
        outcome,
        offered: Number(loc.count) || 0,
        held: loc.reply === 'held',
        recipients,
        pickedOnly,
    };
}
