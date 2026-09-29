import db from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import { WhatsAppService } from './whatsapp.service.js';
import { phoneKey, normaliseProduct } from './asmRouting.service.js';
import { getLocatorSettings, repliesTo } from './storeLocatorQuery.js';
import { LOCATOR_FLOW_ID, startStoreEnquiry } from './storeLocatorChat.js';
import { readCarAnswer } from './carModels.js';
import { hasAutoReplyContent } from './autoReply.js';
import {
    nextStep, menuStep, isRestart, isCancel, isIdle, OPEN_STAGES,
    type ChatStage, type MenuStep,
} from './locatorConversation.js';
import {
    CAR_QUESTION, PINCODE_QUESTION, PLEASE_TYPE_TEXT, CANCELLED_TEXT, SORRY_TEXT, MENU_RETRY,
    productMenu, otherProductsMenu, menuTapFromWebhook, type InteractiveList,
} from './storeLocatorMessages.js';

/**
 * Our side of the WhatsApp chat. The Interakt workflow only starts it ("Heyy")
 * and hands over; from there the server runs everything: the product menu (and
 * its "Other Products" sub-menu, with a way back), then the car, then the
 * pincode — checking each answer. The rules are in locatorConversation; this
 * reads and writes the lead, and sends.
 *
 * The chat lives on its lead, under raw_payload.locator.session — so an
 * enquiry is one lead from the first message, and one that stops half-way is
 * still in Lead Management for the auditor to call. The pincode step then
 * finishes that same lead through startStoreEnquiry.
 *
 * Nothing here may throw into the webhook: Interakt disables a webhook after
 * five failures in ten minutes. Anything unexpected is caught, the customer is
 * told the team will call, and the lead is marked for the auditor.
 */

/*
 * Each chat message is logged under its own tag ("chat:car-question"…), so the
 * lead's WhatsApp history can say exactly what was asked (leadMessages).
 */
type ChatTag = 'product-menu' | 'other-menu' | 'product-retry' | 'car-question' | 'pincode-question'
    | 'car-retry' | 'pincode-retry' | 'please-type' | 'cancelled' | 'gave-up' | 'error';

const send = (phone: string, body: string, leadId: string, tag: ChatTag) =>
    WhatsAppService.sendSessionMessage(phone, 'Text', { message: body }, `chat:${tag}`, leadId);

const sendList = (phone: string, list: InteractiveList, leadId: string, tag: ChatTag) =>
    WhatsAppService.sendSessionMessage(phone, 'InteractiveList', list as any, `chat:${tag}`, leadId);

const nowIso = () => new Date().toISOString();

/* "{{4}}" from a workflow variable nobody mapped is not a value. */
const given = (v: unknown) => {
    const s = String(v ?? '').trim();
    return s && !/^\{\{\s*\d+\s*\}\}$/.test(s) ? s : null;
};

/** Set raw_payload.locator.session in one statement, plus any columns, and touch the lead. */
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
 * The hand-off. Starts the chat at the first thing still missing: the product
 * menu when the workflow sends nothing, the car when it sends the product, the
 * pincode when it sends the car too. `announce: false` opens the chat without
 * sending anything — for a tap on an old menu, answered by the caller.
 */
export async function startConversation(input: {
    phone: string; name?: string | null; product?: string | null; car?: string | null; rawPayload?: unknown;
    announce?: boolean;
}): Promise<{ result: 'asked' | 'held'; leadId: string }> {
    const phone = String(input.phone).trim();
    const settings = await getLocatorSettings();
    const canReply = repliesTo(settings, phone);
    const productText = given(input.product);
    const carText = given(input.car);

    // A new start replaces any chat still open for this number.
    await endOpenChats(phone, 'replaced');

    const givenCar = carText ? readCarAnswer(carText) : null;
    const stage: ChatStage = !productText ? 'product' : givenCar?.ok ? 'pincode' : 'car';
    const leadId = uuidv4();
    const session = { stage: canReply ? stage : 'held', tries: 0, at: nowIso(), choice: productText };

    await db.execute(
        `INSERT INTO leads
           (id, source, product, car_model, customer_name, customer_phone, phone_key, flow_id, raw_payload, status, failure_reason)
         VALUES (?, 'whatsapp', ?, ?, ?, ?, ?, ?, ?, 'unmatched', ?)`,
        [
            leadId,
            normaliseProduct(productText),
            givenCar?.ok ? givenCar.car : (carText ? carText.slice(0, 80) : null),
            given(input.name)?.slice(0, 255) ?? null,
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
        return { result: 'held', leadId };
    }
    if (input.announce !== false) {
        if (stage === 'product') await sendList(phone, productMenu(leadId), leadId, 'product-menu');
        else await send(phone, stage === 'car' ? CAR_QUESTION : PINCODE_QUESTION, leadId, stage === 'car' ? 'car-question' : 'pincode-question');
    }
    console.log(`[Chat] ${phoneKey(phone)} started at ${stage} — lead ${leadId}`);
    return { result: 'asked', leadId };
}

async function endOpenChats(phone: string, how: 'replaced' | 'restarted') {
    await db.execute(
        `UPDATE leads
            SET raw_payload = JSON_SET(raw_payload, '$.locator.session.stage', ?), updated_at = NOW()
          WHERE flow_id = ? AND phone_key = ?
            AND JSON_UNQUOTE(JSON_EXTRACT(raw_payload, '$.locator.session.stage')) IN (${OPEN_STAGES.map(() => '?').join(', ')})`,
        [how, LOCATOR_FLOW_ID, phoneKey(phone), ...OPEN_STAGES]
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

/* ─── Two ways in, one chat ──────────────────────────────────────────────── */

/**
 * Whether a chat for this number began in the last few seconds — and, if
 * `openOnly`, is still going: a chat the customer just ended by sending "Heyy"
 * again must not stop the fresh one.
 */
async function chatStartedWithin(phone: string, seconds: number, openOnly: boolean): Promise<boolean> {
    const [rows]: any = await db.execute(
        `SELECT 1 FROM leads
          WHERE flow_id = ? AND phone_key = ?
            AND JSON_EXTRACT(raw_payload, '$.locator.session') IS NOT NULL
            AND created_at >= NOW() - INTERVAL ? SECOND
            ${openOnly ? `AND JSON_UNQUOTE(JSON_EXTRACT(raw_payload, '$.locator.session.stage')) IN (${OPEN_STAGES.map(() => '?').join(', ')})` : ''}
          LIMIT 1`,
        [LOCATOR_FLOW_ID, phoneKey(phone), seconds, ...(openOnly ? OPEN_STAGES : [])]
    );
    return rows.length > 0;
}

/*
 * The customer's "Heyy", straight from the incoming-message webhook — about
 * eight seconds before the Interakt workflow gets round to its hand-off, and
 * with the right phone number whatever the workflow's variables say.
 *
 * Skipped only when the hand-off got there first a moment ago, so the menu is
 * never sent twice; a customer sending "Heyy" again later starts over.
 */
export function startFromMessage(phone: string, name: string | null): Promise<void> {
    return inOrder(phoneKey(phone), async () => {
        if (await chatStartedWithin(phone, 20, true)) {
            console.log(`[Chat] ${phoneKey(phone)} "Heyy" — chat already started by the hand-off`);
            return;
        }
        await startConversation({ phone, name, rawPayload: { source: 'heyy' } });
    });
}

/*
 * The workflow's hand-off. It always follows a "Heyy" we have usually acted on
 * already, so it only starts a chat when none began in the last two minutes —
 * a backup for when the message webhook is late or missed.
 */
export function startFromHandoff(input: Parameters<typeof startConversation>[0]): Promise<void> {
    return inOrder(phoneKey(input.phone), async () => {
        if (await chatStartedWithin(input.phone, 120, false)) {
            console.log(`[Chat] ${phoneKey(input.phone)} hand-off — chat already running`);
            return;
        }
        await startConversation(input);
    });
}

async function isKnownPincode(pincode: string): Promise<boolean> {
    const [rows]: any = await db.execute('SELECT 1 FROM pincode_geo WHERE pincode = ? LIMIT 1', [pincode]);
    return rows.length > 0;
}

interface OpenChat {
    id: string;
    customer_phone: string;
    customer_name: string | null;
    product: string | null;
    car_model: string | null;
    raw: any;
    session: any;
}

async function openChat(senderPhone: string): Promise<OpenChat | null> {
    const [rows]: any = await db.execute(
        `SELECT id, customer_phone, customer_name, product, car_model, raw_payload
           FROM leads
          WHERE flow_id = ? AND phone_key = ?
            AND JSON_UNQUOTE(JSON_EXTRACT(raw_payload, '$.locator.session.stage')) IN (${OPEN_STAGES.map(() => '?').join(', ')})
          ORDER BY created_at DESC LIMIT 1`,
        [LOCATOR_FLOW_ID, phoneKey(senderPhone), ...OPEN_STAGES]
    );
    if (!rows.length) return null;
    const raw = typeof rows[0].raw_payload === 'string' ? JSON.parse(rows[0].raw_payload) : (rows[0].raw_payload ?? {});
    const session = raw?.locator?.session ?? {};
    // Gone quiet: the chat is over, and the lead waits for the auditor.
    if (isIdle(session.at)) return null;
    return { ...rows[0], raw, session };
}

/**
 * A customer's message, if our chat is waiting for it — or a tap on one of our
 * product menus. Returns whether it was ours; anything else (a store-list tap,
 * a fresh "Heyy", no open chat) is left for the other handlers and Interakt.
 */
export async function handleConversationMessage(senderPhone: string, message: any): Promise<boolean> {
    if (!message) return false;
    const key = phoneKey(senderPhone);
    const type = String(message.message_content_type ?? '');
    const tap = menuTapFromWebhook(message);

    let chat = await openChat(senderPhone);

    if (/Reply$/.test(type) && !tap) return false;      // a store-list tap, not ours
    if (!chat && !tap) return false;
    if (!firstTime(message.id)) return true;

    return inOrder(key, async () => {
        const phone = chat?.customer_phone || senderPhone;
        try {
            if (tap) {
                // A tap on a menu from an earlier chat, or after this one moved
                // on: start again from that choice rather than ignore it.
                if (!chat || chat.id !== tap.leadId || !['product', 'product-other'].includes(chat.session.stage)) {
                    const fresh = await startConversation({ phone, announce: false });
                    if (fresh.result === 'held') return true;
                    chat = await openChat(senderPhone);
                    if (!chat) return true;
                }
                await applyMenu(chat, phone, menuStep(chat.session.stage, 0, { tap: tap.key }));
                return true;
            }
            const current = chat!;

            if (type !== 'Text') {
                await send(phone, PLEASE_TYPE_TEXT, current.id, 'please-type');
                return true;
            }
            const text = String(message.message ?? message.text ?? '');

            if (isRestart(text)) {
                // The workflow answers "Heyy" and hands over again; ours steps aside.
                await endOpenChats(senderPhone, 'restarted');
                return false;
            }
            if (isCancel(text)) {
                await saveSession(current.id, { ...current.session, stage: 'cancelled', at: nowIso() });
                await send(phone, CANCELLED_TEXT, current.id, 'cancelled');
                return true;
            }
            // A business's auto-reply answering our question is not the customer.
            if (hasAutoReplyContent([text])) return true;

            const stage = current.session.stage as ChatStage;
            const tries = Number(current.session.tries) || 0;
            if (stage === 'product' || stage === 'product-other') {
                await applyMenu(current, phone, menuStep(stage, tries, { text }));
                return true;
            }

            const step = await nextStep({ stage, tries }, text, isKnownPincode);
            if (step.kind === 'retry') {
                await saveSession(current.id, { ...current.session, tries: step.tries, at: nowIso() });
                await send(phone, step.reply, current.id, stage === 'car' ? 'car-retry' : 'pincode-retry');
            } else if (step.kind === 'car') {
                await saveSession(
                    current.id,
                    { ...current.session, stage: 'pincode', tries: 0, at: nowIso(), car_checked: step.checked },
                    { car_model: step.car.slice(0, 80) }
                );
                await send(phone, step.reply, current.id, 'pincode-question');
            } else if (step.kind === 'give-up') {
                await saveSession(
                    current.id,
                    { ...current.session, stage: 'ended', tries: tries + 1, at: nowIso() },
                    { failure_reason: 'No valid pincode given', raw_area: text.slice(0, 255) }
                );
                await send(phone, step.reply, current.id, 'gave-up');
            } else {
                // The pincode: the locator takes over and finishes this lead.
                await saveSession(current.id, { ...current.session, stage: 'done', at: nowIso() });
                const { locator: _chat, ...payload } = current.raw ?? {};
                await startStoreEnquiry({
                    pincode: step.pincode,
                    phone,
                    name: current.customer_name,
                    product: current.product,
                    car: current.car_model,
                    source: 'whatsapp',
                    rawPayload: payload,
                    leadId: current.id,
                    chat: {
                        choice: current.session.choice ?? null,
                        car_checked: current.session.car_checked !== false,
                        pincode_checked: step.checked,
                    },
                });
            }
            return true;
        } catch (err: any) {
            console.error(`[Chat] ${key} failed${chat ? ` on lead ${chat.id}` : ''}:`, err?.message);
            // Never silent: the customer hears from us, and the auditor sees it.
            if (chat) {
                await send(phone, SORRY_TEXT, chat.id, 'error').catch(() => undefined);
                await saveSession(
                    chat.id,
                    { ...chat.session, stage: 'error', at: nowIso() },
                    { failure_reason: 'Chat error: call the customer' }
                ).catch(() => undefined);
            }
            return true;
        }
    });
}

/** Act on a menu step: show a menu (or a retry), or take the product and ask for the car. */
async function applyMenu(chat: OpenChat, phone: string, step: MenuStep) {
    if (step.kind === 'menu') {
        await saveSession(chat.id, {
            ...chat.session, stage: step.menu === 'other' ? 'product-other' : 'product', tries: step.tries, at: nowIso(),
        });
        if (step.retry) await send(phone, MENU_RETRY, chat.id, 'product-retry');
        else if (step.menu === 'other') await sendList(phone, otherProductsMenu(chat.id), chat.id, 'other-menu');
        else await sendList(phone, productMenu(chat.id), chat.id, 'product-menu');
        return;
    }
    await saveSession(
        chat.id,
        { ...chat.session, stage: 'car', tries: 0, at: nowIso(), choice: step.choice },
        { product: step.product }
    );
    await send(phone, CAR_QUESTION, chat.id, 'car-question');
}

