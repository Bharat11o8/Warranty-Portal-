import { normaliseProduct, type Product } from './productMatch.js';

/**
 * Reading the IVR provider's call events. Free of any database import, so the
 * rules can be tested; ivrLead.service does the writing.
 *
 * A call arrives as several events sharing one `uniqueid`, seen on real calls
 * (25 Sept 2026):
 *
 *   IN  { cli, time, uniqueid }                     the call starts
 *   TA  { group: "SeatCovers", to, agentName, attemptid }
 *                                                   the caller pressed an option
 *                                                   and an agent's phone rings
 *   TE  { group, to, result: "answered"|"noanswer", duration, attemptid }
 *                                                   that ring ended
 *   H   { duration }                                the caller hung up
 *
 * The IVR menu is 1 Seat Covers, 2 Mats, 3 Accessories, and each option
 * transfers to an agent group named for it — so the group is the product.
 */

export type IvrEventKind = 'start' | 'end' | 'transfer' | 'transfer-end' | 'other';

export interface IvrCall {
    callId: string;
    /** Caller's number as the IVR gives it: 10 digits, no country code. */
    phone: string;
    kind: IvrEventKind;
    /** Seconds: the whole call on H, the agent's part on TE. */
    duration: number | null;
    /** The IVR's own timestamp, IST. */
    at: string | null;
    /** Transfer events only. */
    transfer?: {
        attemptId: string;
        group: string | null;
        product: Product | null;
        agent: string | null;
        to: string | null;
        /** "answered" | "noanswer" | … — on TE only. */
        result: string | null;
    };
}

const KINDS: Record<string, IvrEventKind> = { IN: 'start', H: 'end', TA: 'transfer', TE: 'transfer-end' };

/**
 * The product an IVR agent group stands for. "SeatCovers" and "CarMats" are
 * split into words first, so the same matcher the WhatsApp flow uses reads them.
 */
export function productFromGroup(group: string | null | undefined): Product | null {
    const words = String(group ?? '').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ');
    return normaliseProduct(words);
}

const text = (v: unknown) => {
    const s = String(v ?? '').trim();
    return s ? s : null;
};

/** A call event, or null for anything we cannot file (no caller, no call id). */
export function parseIvrEvent(body: Record<string, unknown> | null | undefined): IvrCall | null {
    if (!body || typeof body !== 'object') return null;
    const callId = String(body.uniqueid ?? '').trim();
    const phone = String(body.cli ?? '').replace(/\D/g, '');
    if (!callId || !phone) return null;

    const kind = KINDS[String(body.event ?? '').trim().toUpperCase()] ?? 'other';
    const seconds = Number(body.duration);

    const call: IvrCall = {
        callId,
        phone,
        kind,
        duration: body.duration !== undefined && Number.isFinite(seconds) && seconds >= 0 ? Math.round(seconds) : null,
        at: text(body.time),
    };

    if (kind === 'transfer' || kind === 'transfer-end') {
        const group = text(body.group);
        call.transfer = {
            attemptId: text(body.attemptid) ?? `${callId}.?`,
            group,
            product: productFromGroup(group),
            agent: text(body.agentName),
            to: text(body.to),
            result: text(body.result)?.toLowerCase() ?? null,
        };
    }
    return call;
}

/**
 * A number a store or the team could call back — or message on WhatsApp.
 * Indian mobiles are ten digits starting 6–9. The IVR also passes landline and
 * trunk numbers ("1409800269"); those are still recorded, but flagged.
 */
export function isMobile(phone: string): boolean {
    return /^[6-9]\d{9}$/.test(phone.replace(/\D/g, '').slice(-10));
}

/** How long a repeat call from the same number joins the earlier lead. */
export const REPEAT_CALL_HOURS = 24;

/**
 * What the team needs to know about a lead's calls, in a line: whether anyone
 * picked up. A caller whose every transfer rang out is a missed call — the one
 * the team must ring back. Null while nothing has reached an agent yet.
 */
export function missedCallReason(calls: Record<string, any>): string | null {
    const transfers = Object.values(calls ?? {}).flatMap((c: any) => Object.values(c?.transfers ?? {})) as any[];
    const ended = transfers.filter(t => t?.result);
    if (!ended.length) return null;
    if (ended.some(t => t.result === 'answered')) return null;
    return 'Missed call — no agent answered, call back';
}

/** One call on the lead screen: when, how long, and each ring to an agent. */
export interface IvrCallSummary {
    started: string | null;
    /** Seconds the caller was on the line, when the hang-up arrived. */
    duration: number | null;
    rings: { group: string | null; to: string | null; answered: boolean; talked: number | null; at: string | null }[];
}

/**
 * What the lead screen shows for an IVR lead, read from raw_payload.ivr —
 * so the browser never has to know how the events are stored.
 *
 *   status  'missed' while every ring went unanswered, 'answered' once one
 *           was picked up, 'no-agent' when the caller hung up in the menu
 */
export interface IvrSummary {
    status: 'answered' | 'missed' | 'no-agent';
    calls: number;
    rings: number;
    answered: number;
    /** Seconds agents spent talking, across every call. */
    talkSeconds: number;
    lastCall: string | null;
    mobile: boolean;
    detail: IvrCallSummary[];
}

export function summariseIvr(rawPayload: unknown): IvrSummary | null {
    let raw: any = rawPayload;
    if (typeof raw === 'string') {
        try { raw = JSON.parse(raw); } catch { return null; }
    }
    const ivr = raw?.ivr;
    if (!ivr || typeof ivr !== 'object') return null;

    const detail: IvrCallSummary[] = Object.values(ivr.calls ?? {}).map((c: any) => ({
        started: c?.started ?? null,
        duration: typeof c?.duration === 'number' ? c.duration : null,
        rings: (Object.values(c?.transfers ?? {}) as any[])
            .map(t => ({
                group: t?.group ?? null,
                to: t?.to ?? null,
                answered: t?.result === 'answered',
                talked: typeof t?.talked === 'number' ? t.talked : null,
                at: t?.rang ?? t?.ended ?? null,
            }))
            .sort((a, b) => String(a.at ?? '').localeCompare(String(b.at ?? ''))),
    }));
    detail.sort((a, b) => String(a.started ?? '').localeCompare(String(b.started ?? '')));

    const rings = detail.flatMap(c => c.rings);
    const answered = rings.filter(r => r.answered).length;
    return {
        status: answered ? 'answered' : rings.length ? 'missed' : 'no-agent',
        calls: detail.length,
        rings: rings.length,
        answered,
        talkSeconds: rings.reduce((sum, r) => sum + (r.answered ? r.talked ?? 0 : 0), 0),
        lastCall: detail.reduce<string | null>((last, c) => (c.started && (!last || c.started > last) ? c.started : last), null),
        mobile: ivr.mobile !== false,
        detail,
    };
}
