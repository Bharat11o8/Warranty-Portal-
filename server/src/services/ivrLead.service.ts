import db from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import { phoneKey } from './leadIdentity.js';
import { isMobile, parseIvrEvent, REPEAT_CALL_HOURS, type IvrCall } from './ivrLead.js';

/** Anything with execute() — the pool, or one connection inside a transaction. */
type Exec = { execute: (sql: string, params?: any[]) => Promise<any> };

/**
 * Turn IVR call events into leads.
 *
 * One lead per caller per day. The first call from a number creates the lead
 * the moment it starts, so it exists even if the hang-up never arrives; the
 * hang-up then adds the duration. A second call within REPEAT_CALL_HOURS is
 * added to that lead's call list rather than filing another — it is the same
 * person asking again, and one row per person is what the team works from.
 *
 * Each call is kept under raw_payload.ivr.calls, keyed by the IVR's uniqueid,
 * so an event delivered twice changes nothing.
 */

export const IVR_FLOW_ID = 'ivr';

export async function recordIvrEvent(body: Record<string, unknown>, exec: Exec = db): Promise<void> {
    const call = parseIvrEvent(body);
    if (!call || call.kind === 'other') return;

    const lead = await leadFor(call, exec);
    if (!lead) {
        await createLead(call, exec);
        return;
    }
    await addCall(lead, call, exec);
}

/** The lead this call belongs to: one already holding the call, or the caller's recent one. */
async function leadFor(call: IvrCall, exec: Exec): Promise<{ id: string; calls: Record<string, any> } | null> {
    const [rows]: any = await exec.execute(
        `SELECT id, JSON_EXTRACT(raw_payload, '$.ivr.calls') AS calls FROM leads
          WHERE flow_id = ? AND phone_key = ?
            AND (JSON_CONTAINS_PATH(raw_payload, 'one', CONCAT('$.ivr.calls."', ?, '"'))
                 OR created_at >= DATE_SUB(NOW(), INTERVAL ? HOUR))
          ORDER BY created_at DESC LIMIT 1`,
        [IVR_FLOW_ID, phoneKey(call.phone), call.callId, REPEAT_CALL_HOURS]
    );
    if (!rows.length) return null;
    const raw = rows[0].calls;
    const calls = (typeof raw === 'string' ? JSON.parse(raw) : raw) || {};
    return { id: rows[0].id, calls };
}

function callEntry(call: IvrCall, existing?: any) {
    return {
        started: existing?.started ?? (call.kind === 'start' ? call.at : null),
        ended: call.kind === 'end' ? call.at : existing?.ended ?? null,
        duration: call.kind === 'end' ? call.duration : existing?.duration ?? null,
    };
}

async function createLead(call: IvrCall, exec: Exec) {
    const id = uuidv4();
    const payload = {
        ivr: {
            mobile: isMobile(call.phone),
            calls: { [call.callId]: callEntry(call) },
        },
    };
    await exec.execute(
        `INSERT INTO leads
           (id, source, customer_phone, phone_key, flow_id, raw_payload, status, failure_reason)
         VALUES (?, 'ivr', ?, ?, ?, ?, 'unmatched', ?)`,
        [
            id, call.phone, phoneKey(call.phone), IVR_FLOW_ID, JSON.stringify(payload),
            isMobile(call.phone) ? null : 'Not a mobile number — call back only',
        ]
    );
    console.log(`[IVR] new lead ${id} from ${call.phone} (call ${call.callId})`);
}

async function addCall(lead: { id: string; calls: Record<string, any> }, call: IvrCall, exec: Exec) {
    const entry = callEntry(call, lead.calls[call.callId]);
    await exec.execute(
        `UPDATE leads
            SET raw_payload = JSON_SET(COALESCE(raw_payload, JSON_OBJECT()),
                    CONCAT('$.ivr.calls."', ?, '"'), CAST(? AS JSON)),
                updated_at = NOW()
          WHERE id = ?`,
        [call.callId, JSON.stringify(entry), lead.id]
    );
    const isNew = !lead.calls[call.callId];
    if (isNew) console.log(`[IVR] repeat call from ${call.phone} added to lead ${lead.id}`);
}
