import { readCarAnswer, exampleModels } from './carModels.js';
import { extractPincode } from './storeLocator.js';
import {
    CAR_RETRY, PINCODE_QUESTION, INVALID_PINCODE_TEXT, NO_PINCODE_END,
    whichModelText, unknownPincodeText,
} from './storeLocatorMessages.js';

/**
 * The questions our server asks after the Interakt workflow hands over at the
 * product menu: the car, then the pincode. Each answer is checked before the
 * next question, and a wrong one gets a re-prompt that says what to send.
 *
 * Nobody is kept going round: after two wrong answers to a question, the car
 * is taken as typed (and marked unchecked for the auditor), and a pincode that
 * never comes ends the chat with "our team will call you" — the lead is kept
 * either way.
 *
 * Free of any database import, so the rules are tested; the service does the
 * reading, writing and sending.
 */

export type ChatStage = 'car' | 'pincode';

export interface ChatSession {
    stage: ChatStage;
    /** Wrong answers so far to the current question. */
    tries: number;
}

/** Wrong answers to one question before the chat moves on without it. */
export const MAX_TRIES = 2;

/** A chat nobody has answered for this long is over; the lead stays for the auditor. */
export const IDLE_MINUTES = 30;

export type ChatStep =
    /* Same question again, with this re-prompt. */
    | { kind: 'retry'; tries: number; reply: string }
    /* Car settled — ask for the pincode. */
    | { kind: 'car'; car: string; checked: boolean; reply: string }
    /* Pincode settled — find the stores, as the locator always has. */
    | { kind: 'pincode'; pincode: string; checked: boolean }
    /* No pincode after MAX_TRIES — end politely, the team calls. */
    | { kind: 'give-up'; reply: string };

/** "My pin code is: 201301" → the car-free, tidy answer to keep when nothing matched. */
const asTyped = (text: string) => String(text ?? '').replace(/\s+/g, ' ').trim().slice(0, 80);

export async function nextStep(
    session: ChatSession,
    text: string,
    isKnownPincode: (pincode: string) => Promise<boolean>,
): Promise<ChatStep> {
    const wrong = session.tries + 1;

    if (session.stage === 'car') {
        const answer = readCarAnswer(text);
        if (answer.ok) return { kind: 'car', car: answer.car, checked: true, reply: PINCODE_QUESTION };

        // Out of tries: take what they gave, so the chat moves on. A make on its
        // own ("Toyota") is still worth keeping; anything else is kept as typed.
        if (wrong >= MAX_TRIES) {
            const car = answer.why === 'make-only' && answer.make ? answer.make : asTyped(text);
            return { kind: 'car', car, checked: false, reply: PINCODE_QUESTION };
        }
        const reply = answer.why === 'make-only' && answer.make
            ? whichModelText(answer.make, exampleModels(answer.make))
            : CAR_RETRY[answer.why === 'make-only' ? 'junk' : answer.why];
        return { kind: 'retry', tries: wrong, reply };
    }

    // The pincode, read out of a sentence too: "My pin code is : 201301".
    const pincode = extractPincode(text);
    if (pincode) {
        if (await isKnownPincode(pincode)) return { kind: 'pincode', pincode, checked: true };
        // One chance to correct a pincode we cannot place; after that it goes
        // through anyway, and the locator's own fallback (support) takes it.
        if (wrong >= MAX_TRIES) return { kind: 'pincode', pincode, checked: false };
        return { kind: 'retry', tries: wrong, reply: unknownPincodeText(pincode) };
    }
    if (wrong >= MAX_TRIES) return { kind: 'give-up', reply: NO_PINCODE_END };
    return { kind: 'retry', tries: wrong, reply: INVALID_PINCODE_TEXT };
}

/** "Heyy", "hi", "hello": the customer is starting over — the workflow takes it. */
export function isRestart(text: string): boolean {
    return /^\s*(h+i+|hello+|hey+|hii+)\s*[!.]*\s*$/i.test(String(text ?? ''));
}

/** "stop", "cancel": the customer wants out. */
export function isCancel(text: string): boolean {
    return /^\s*(stop|cancel|exit|quit|no thanks)\s*[!.]*\s*$/i.test(String(text ?? ''));
}

/** Whether a chat last touched at this time has gone quiet for good. */
export function isIdle(lastAt: string | null | undefined, now = Date.now()): boolean {
    const t = lastAt ? Date.parse(lastAt) : NaN;
    return !Number.isFinite(t) || now - t > IDLE_MINUTES * 60_000;
}
