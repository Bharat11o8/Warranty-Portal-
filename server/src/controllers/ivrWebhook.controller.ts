import crypto from 'crypto';
import { Request, Response } from 'express';
import db from '../config/database.js';

/**
 * The IVR provider's HTTP hook: one call per phone call.
 *
 * Capture only, for now. The provider's payload is not documented to us, so
 * every call is stored exactly as it arrives in webhook_events (provider
 * 'ivr') and nothing else happens — no lead, no message. The lead mapping is
 * built against real stored calls once one has arrived. The store audit taught
 * this: a parser written against a guessed shape lost the first real
 * submissions, because only the event name was logged, never the body.
 *
 * Secured by a key in the URL (?key=…, set on the server as IVR_WEBHOOK_KEY),
 * since the hook screen offers no header or signature. Without the key set,
 * nothing is accepted.
 *
 * Accepts GET as well as POST, and JSON as well as form bodies: providers
 * differ, and a hook refused for its method is a call silently lost.
 */
export class IvrWebhookController {
    static async handle(req: Request, res: Response) {
        const expected = process.env.IVR_WEBHOOK_KEY || '';
        const given = String(req.query.key ?? '');
        const ok = expected.length > 0 && given.length === expected.length
            && crypto.timingSafeEqual(Buffer.from(given), Buffer.from(expected));
        if (!ok) {
            console.warn(`[IVR] hook refused — ${expected ? 'wrong key' : 'IVR_WEBHOOK_KEY is not set'}`);
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Answered at once: the provider only needs to know it arrived.
        res.status(200).json({ received: true });

        const { key: _key, ...query } = req.query as Record<string, unknown>;
        const body = req.body && typeof req.body === 'object' ? req.body : {};
        const payload = { method: req.method, query, body };

        // Best guesses at the caller and event, only to make the stored row
        // findable; the full payload is kept regardless.
        const pick = (...names: string[]) => {
            for (const n of names) {
                const v = (body as any)[n] ?? (query as any)[n];
                if (v !== undefined && v !== null && String(v).trim()) return String(v).trim();
            }
            return null;
        };
        const phone = pick('caller', 'caller_number', 'callerNumber', 'from', 'From', 'CallFrom', 'customer_number', 'mobile', 'phone');
        const event = pick('event', 'event_type', 'eventType', 'status', 'call_status', 'CallStatus') ?? 'ivr_call';

        try {
            await db.execute(
                `INSERT INTO webhook_events (id, provider, event_type, phone, payload)
                 VALUES (UUID(), 'ivr', ?, ?, ?)`,
                [event.slice(0, 100), phone ? phone.slice(0, 40) : null, JSON.stringify(payload).slice(0, 60000)]
            );
            console.log(`[IVR] ${req.method} call recorded — event "${event}", caller ${phone ?? '(unknown)'}`);
        } catch (error: any) {
            console.error('[IVR] could not record the call:', error?.message || error);
        }
    }
}
