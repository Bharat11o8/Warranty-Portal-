/**
 * Reading the IVR provider's call events. Free of any database import, so the
 * rules can be tested; ivrLead.service does the writing.
 *
 * Each call arrives as two events sharing one `uniqueid`, seen on real calls
 * (25 Sept 2026):
 *
 *   { event: "IN", cli: "9820306492", time: "…+05:30", uniqueid: "1790334154.234406", app }
 *   { event: "H",  cli: "9820306492", time: "…+05:30", uniqueid: "…", duration: 56, app }
 *
 * IN is the call starting, H the hang-up with its length in seconds. Nothing
 * else comes with it — no keypad presses, no pincode — so an IVR lead is the
 * caller's number, when they called and for how long, for the team to follow up.
 */

export type IvrEventKind = 'start' | 'end' | 'other';

export interface IvrCall {
    callId: string;
    /** Caller's number as the IVR gives it: 10 digits, no country code. */
    phone: string;
    kind: IvrEventKind;
    /** Seconds; on the hang-up only. */
    duration: number | null;
    /** The IVR's own timestamp, IST. */
    at: string | null;
}

/** A call event, or null for anything we cannot file (no caller, no call id). */
export function parseIvrEvent(body: Record<string, unknown> | null | undefined): IvrCall | null {
    if (!body || typeof body !== 'object') return null;
    const callId = String(body.uniqueid ?? '').trim();
    const phone = String(body.cli ?? '').replace(/\D/g, '');
    if (!callId || !phone) return null;

    const event = String(body.event ?? '').trim().toUpperCase();
    const kind: IvrEventKind = event === 'IN' ? 'start' : event === 'H' ? 'end' : 'other';
    const seconds = Number(body.duration);

    return {
        callId,
        phone,
        kind,
        duration: Number.isFinite(seconds) && seconds >= 0 ? Math.round(seconds) : null,
        at: body.time ? String(body.time) : null,
    };
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
