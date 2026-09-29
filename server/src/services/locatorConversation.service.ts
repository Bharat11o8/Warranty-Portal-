import db from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import { WhatsAppService } from './whatsapp.service.js';
import { phoneKey, normaliseProduct } from './asmRouting.service.js';
import { getLocatorSettings, repliesTo } from './storeLocatorQuery.js';
import { LOCATOR_FLOW_ID, startStoreEnquiry } from './storeLocatorChat.js';
import { readCarAnswer } from './carModels.js';
import { hasAutoReplyContent } from './autoReply.js';
import {
    nextStep, isRestart, isCancel, isIdle, type ChatSession, type ChatStage,
} from './locatorConversation.js';
import {
    CAR_QUESTION, PINCODE_QUESTION, PLEASE_TYPE_TEXT, CANCELLED_TEXT, SORRY_TEXT,
} from './storeLocatorMessages.js';

/**
 * Our side of the WhatsApp chat, after the Interakt workflow hands over at the
 * product menu. The rules are in locatorConversation; this reads and writes the
 * lead, and sends.
 *
 * The chat lives on its lead, under raw_payload.locator.session — so an
 * enquiry is one lead from the first question, and one that stops half-way is
 * still in Lead Management for the auditor to call. The pincode step then
 * finishes that same lead through startStoreEnquiry, as the workflow's pincode
 * always has.
 *
 * Nothing here may throw into the webhook: Interakt disables a webhook after
 * five failures in ten minutes. Anything unexpected is caught, the customer is
 * told the team will call, and the lead is marked for the auditor.
 */

/*
 * Each chat message is logged under its own tag ("chat:car-question"…), so the
 * lead's WhatsApp history can say exactly what was asked (leadMessages).
 */
type ChatTag = 'car-question' | 'pincode-question' | 'car-retry' | 'pincode-retry'
    | 'please-type' | 'cancelled' | 'gave-up' | 'error';

const send = (phone: string, body: string, leadId: string, tag: ChatTag) =>
    WhatsAppService.sendSessionMessage(phone, 'Text', { message: body }, `chat:${tag}`, leadId);

const nowIso = () => new Date().toISOString();

/** Set fields of raw_payload.locator.session in one statement, and touch the lead. */
async function saveSession(leadId: string, session: Record<string, unknown>, extra: Record<string, unknown> = {}) {
    const cols = Object.keys(extra);
    await db.execute(
        `UPDATE leads
            SET raw_payload = JSON_SET(COALESCE(raw_payload, JSON_OBJECT()),
                    '$.locator', COALESCE(JSON_EXTRACT(raw_payload, '$.locator'), JSON_OBJECT()),
                    '$.locator.session', CAST(? AS JSON))
                ${cols.map(c => `, ${c} = ?`).join('')},
                updated_at = NOW()
          WHERE id = ?`,
        [JSON.stringify(session), ...Object.values(extra), leadId]
    );
}

/**
 * The hand-off: the workflow has the customer's product, and nothing more.
 * Starts the chat at the first thing still missing — the car, or the pincode
 * if the workflow already asked for the car.
 */
export async function startConversation(input: {
    phone: string; name?: string | null; product?: string | null; car?: string | null; rawPayload?: unknown;
}): Promise<'asked' | 'held'> {
    const phone = String(input.phone).trim();
    const settings = await getLocatorSettings();
    const canReply = repliesTo(settings, phone);

    // A new run of the workflow replaces any chat still open for this number.
    await endOpenChats(phone, 'replaced');

    const givenCar = input.car ? readCarAnswer(input.car) : null;
    const stage: ChatStage = givenCar?.ok ? 'pincode' : 'car';
    const leadId = uuidv4();
    const session = { stage: canReply ? stage : 'held', tries: 0, at: nowIso() };

    await db.execute(
        `INSERT INTO leads
           (id, source, product, car_model, customer_name, customer_phone, phone_key, flow_id, raw_payload, status, failure_reason)
         VALUES (?, 'whatsapp', ?, ?, ?, ?, ?, ?, ?, 'unmatched', ?)`,
        [
            leadId,
            normaliseProduct(input.product),
            givenCar?.ok ? givenCar.car : (input.car ? String(input.car).trim().slice(0, 80) : null),
            input.name ? String(input.name).trim().slice(0, 255) : null,
            phone,
            phoneKey(phone),
            LOCATOR_FLOW_ID,
            JSON.stringify({
                ...(input.rawPayload && typeof input.rawPayload === 'object' ? input.rawPayload as object : {}),
                locator: { session },
            }),
            // Not live for this number: the chat cannot ask, so the team calls.
            canReply ? null : 'Store locator not live for this number: details not asked',
        ]
    );

    if (!canReply) {
        console.log(`[Chat] ${phoneKey(phone)} not live — lead ${leadId} kept for the team`);
        return 'held';
    }
    await send(phone, stage === 'car' ? CAR_QUESTION : PINCODE_QUESTION, leadId, stage === 'car' ? 'car-question' : 'pincode-question');
    console.log(`[Chat] ${phoneKey(phone)} started at ${stage} — lead ${leadId}`);
    return 'asked';
}

async function endOpenChats(phone: string, how: 'replaced' | 'restarted') {
    await db.execute(
        `UPDATE leads
            SET raw_payload = JSON_SET(raw_payload, '$.locator.session.stage', ?), updated_at = NOW()
          WHERE flow_id = ? AND phone_key = ?
            AND JSON_UNQUOTE(JSON_EXTRACT(raw_payload, '$.locator.session.stage')) IN ('car', 'pincode')`,
        [how, LOCATOR_FLOW_ID, phoneKey(phone)]
    );
}

/* ─── One message at a time ──────────────────────────────────────────────── */

/* Interakt can deliver a message twice; the same message id is handled once. */
const seen: string[] = [];
function firstTime(messageId: string | undefined): boolean {
    if (!messageId) return true;
    if (seen.includes(messageId)) return false;
    seen.push(messageId);
    if (seen.length > 500) seen.shift();
    return true;
}

/* Two quick messages from one customer are handled in order, never together. */
const queues = new Map<string, Promise<unknown>>();
function inOrder<T>(key: string, work: () => Promise<T>): Promise<T> {
    const run = (queues.get(key) ?? Promise.resolve()).then(work, work);
    const tail = run.catch(() => undefined);
    queues.set(key, tail);
    tail.then(() => { if (queues.get(key) === tail) queues.delete(key); });
    return run;
}

async function isKnownPincode(pincode: string): Promise<boolean> {
    const [rows]: any = await db.execute('SELECT 1 FROM pincode_geo WHERE pincode = ? LIMIT 1', [pincode]);
    return rows.length > 0;
}

/**
 * A customer's message, if our chat is waiting for it. Returns whether it was
 * ours — anything else (a list tap, a new "Heyy", no open chat) is left for
 * the other handlers and the Interakt workflow.
 */
export async function handleConversationMessage(senderPhone: string, message: any): Promise<boolean> {
    if (!message) return false;
    const key = phoneKey(senderPhone);

    const [rows]: any = await db.execute(
        `SELECT id, customer_phone, customer_name, product, car_model, raw_payload
           FROM leads
          WHERE flow_id = ? AND phone_key = ?
            AND JSON_UNQUOTE(JSON_EXTRACT(raw_payload, '$.locator.session.stage')) IN ('car', 'pincode')
          ORDER BY created_at DESC LIMIT 1`,
        [LOCATOR_FLOW_ID, key]
    );
    if (!rows.length) return false;

    const lead = rows[0];
    const raw = typeof lead.raw_payload === 'string' ? JSON.parse(lead.raw_payload) : (lead.raw_payload ?? {});
    const session = raw?.locator?.session ?? {};
    // Gone quiet: the chat is over, and the lead waits for the auditor.
    if (isIdle(session.at)) return false;

    const type = String(message.message_content_type ?? '');
    // Taps belong to the menus and lists; a tap on the workflow's menu means
    // the customer went back to it.
    if (/Reply$/.test(type)) {
        if (type === 'InteractiveButtonReply') await endOpenChats(senderPhone, 'restarted');
        return false;
    }
    if (!firstTime(message.id)) return true;

    return inOrder(key, async () => {
        const phone = lead.customer_phone || senderPhone;
        try {
            if (type !== 'Text') {
                await send(phone, PLEASE_TYPE_TEXT, lead.id, 'please-type');
                return true;
            }
            const text = String(message.message ?? message.text ?? '');

            if (isRestart(text)) {
                // The workflow answers "Heyy" with its menu; ours steps aside.
                await endOpenChats(senderPhone, 'restarted');
                return false;
            }
            if (isCancel(text)) {
                await saveSession(lead.id, { ...session, stage: 'cancelled', at: nowIso() });
                await send(phone, CANCELLED_TEXT, lead.id, 'cancelled');
                return true;
            }
            // A business's auto-reply answering our question is not the customer.
            if (hasAutoReplyContent([text])) return true;

            const current: ChatSession = { stage: session.stage, tries: Number(session.tries) || 0 };
            const step = await nextStep(current, text, isKnownPincode);

            if (step.kind === 'retry') {
                await saveSession(lead.id, { ...session, tries: step.tries, at: nowIso() });
                await send(phone, step.reply, lead.id, current.stage === 'car' ? 'car-retry' : 'pincode-retry');
            } else if (step.kind === 'car') {
                await saveSession(
                    lead.id,
                    { ...session, stage: 'pincode', tries: 0, at: nowIso(), car_checked: step.checked },
                    { car_model: step.car.slice(0, 80) }
                );
                await send(phone, step.reply, lead.id, 'pincode-question');
            } else if (step.kind === 'give-up') {
                await saveSession(
                    lead.id,
                    { ...session, stage: 'ended', tries: current.tries + 1, at: nowIso() },
                    { failure_reason: 'No valid pincode given', raw_area: text.slice(0, 255) }
                );
                await send(phone, step.reply, lead.id, 'gave-up');
            } else {
                // The pincode: the locator takes over and finishes this lead.
                await saveSession(lead.id, { ...session, stage: 'done', at: nowIso() });
                const { locator: _chat, ...payload } = raw ?? {};
                await startStoreEnquiry({
                    pincode: step.pincode,
                    phone,
                    name: lead.customer_name,
                    product: lead.product,
                    car: lead.car_model,
                    source: 'whatsapp',
                    rawPayload: payload,
                    leadId: lead.id,
                    chat: { car_checked: session.car_checked !== false, pincode_checked: step.checked },
                });
            }
            return true;
        } catch (err: any) {
            console.error(`[Chat] ${key} failed on lead ${lead.id}:`, err?.message);
            // Never silent: the customer hears from us, and the auditor sees it.
            await send(phone, SORRY_TEXT, lead.id, 'error').catch(() => undefined);
            await saveSession(
                lead.id,
                { ...session, stage: 'error', at: nowIso() },
                { failure_reason: 'Chat error: call the customer' }
            ).catch(() => undefined);
            return true;
        }
    });
}
