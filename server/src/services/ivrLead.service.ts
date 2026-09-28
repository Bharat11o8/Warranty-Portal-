import db from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import { phoneKey } from './leadIdentity.js';
import { isMobile, missedCallReason, parseIvrEvent, REPEAT_CALL_HOURS, type IvrCall } from './ivrLead.js';

/** Anything with execute() — the pool, or one connection inside a transaction. */
type Exec = { execute: (sql: string, params?: any[]) => Promise<any> };

/**
 * Turn IVR call events into leads.
 *
 * One lead per caller per day. The first call from a number creates the lead
 * the moment it starts, so it exists even if the hang-up never arrives. A
 * second call within REPEAT_CALL_HOURS joins that lead rather than filing
 * another — one row per person is what the team works from.
 *
 * Everything about the calls lives under raw_payload.ivr.calls, keyed by the
 * IVR's uniqueid, and each ring to an agent under that call's `transfers`,
 * keyed by attemptid — so an event delivered twice changes nothing.
 *
 * Each event writes only its own part, as a JSON merge in one statement. The
 * transfer's end and the hang-up arrive in the same second, and a read-then-
 * write would let one of them overwrite the other.
 *
 * From the transfers the lead also takes:
 *   product         the IVR option the caller pressed (1 Seat Covers, 2 Mats,
 *                   3 Accessories), from the agent group — the first one wins
 *   failure_reason  "Missed call — …" while no agent has answered any of the
 *                   caller's calls, so the team knows to ring back
 */

export const IVR_FLOW_ID = 'ivr';

const NOT_MOBILE = 'Not a mobile number — call back only';

export async function recordIvrEvent(body: Record<string, unknown>, exec: Exec = db): Promise<void> {
    const call = parseIvrEvent(body);
    if (!call || call.kind === 'other') return;

    const leadId = (await leadFor(call, exec)) ?? (await createLead(call, exec));
    await exec.execute(
        `UPDATE leads
            SET raw_payload = JSON_MERGE_PATCH(COALESCE(raw_payload, JSON_OBJECT()), CAST(? AS JSON)),
                product = COALESCE(product, ?),
                updated_at = NOW()
          WHERE id = ?`,
        [JSON.stringify(patchFor(call)), call.transfer?.product ?? null, leadId]
    );
    if (call.kind === 'transfer-end') await refreshMissed(leadId, exec);
}

/**
 * The part of raw_payload this event adds. Only fields it actually carries —
 * a null in a merge patch would delete what another event wrote.
 */
function patchFor(call: IvrCall): object {
    const entry: Record<string, unknown> = {};
    if (call.kind === 'start' && call.at) entry.started = call.at;
    if (call.kind === 'end') {
        if (call.at) entry.ended = call.at;
        if (call.duration !== null) entry.duration = call.duration;
    }
    if (call.transfer) {
        const t: Record<string, unknown> = {};
        for (const [k, v] of Object.entries({
            group: call.transfer.group,
            product: call.transfer.product,
            agent: call.transfer.agent,
            to: call.transfer.to,
            result: call.transfer.result,
        })) if (v) t[k] = v;
        if (call.kind === 'transfer') { if (call.at) t.rang = call.at; }
        else {
            if (call.at) t.ended = call.at;
            if (call.duration !== null) t.talked = call.duration;
        }
        entry.transfers = { [call.transfer.attemptId]: t };
    }
    return { ivr: { calls: { [call.callId]: entry } } };
}

/** The lead this call belongs to: one already holding the call, or the caller's recent one. */
async function leadFor(call: IvrCall, exec: Exec): Promise<string | null> {
    const [rows]: any = await exec.execute(
        `SELECT id FROM leads
          WHERE flow_id = ? AND phone_key = ?
            AND (JSON_CONTAINS_PATH(raw_payload, 'one', CONCAT('$.ivr.calls."', ?, '"'))
                 OR created_at >= DATE_SUB(NOW(), INTERVAL ? HOUR))
          ORDER BY created_at DESC LIMIT 1`,
        [IVR_FLOW_ID, phoneKey(call.phone), call.callId, REPEAT_CALL_HOURS]
    );
    return rows[0]?.id ?? null;
}

async function createLead(call: IvrCall, exec: Exec): Promise<string> {
    const id = uuidv4();
    await exec.execute(
        `INSERT INTO leads
           (id, source, customer_phone, phone_key, flow_id, raw_payload, status, failure_reason)
         VALUES (?, 'ivr', ?, ?, ?, ?, 'unmatched', ?)`,
        [
            id, call.phone, phoneKey(call.phone), IVR_FLOW_ID,
            JSON.stringify({ ivr: { mobile: isMobile(call.phone), calls: {} } }),
            isMobile(call.phone) ? null : NOT_MOBILE,
        ]
    );
    console.log(`[IVR] new lead ${id} from ${call.phone} (call ${call.callId})`);
    return id;
}

/**
 * Whether the caller is still waiting on us: missed while no agent has
 * answered any of their calls, cleared the moment one does. A non-mobile
 * number keeps its own flag, which matters more to whoever rings back.
 */
async function refreshMissed(leadId: string, exec: Exec) {
    const [rows]: any = await exec.execute(
        `SELECT failure_reason, JSON_EXTRACT(raw_payload, '$.ivr.calls') AS calls FROM leads WHERE id = ?`,
        [leadId]
    );
    if (!rows.length || rows[0].failure_reason === NOT_MOBILE) return;
    const calls = typeof rows[0].calls === 'string' ? JSON.parse(rows[0].calls) : rows[0].calls;
    await exec.execute('UPDATE leads SET failure_reason = ? WHERE id = ?', [missedCallReason(calls), leadId]);
}
