/**
 * Recognising an auto-responder's reply so it never becomes a lead.
 *
 * Apps like WhatAuto and Whatsauto answer every incoming message on the
 * customer's behalf. Our bot asks for an area, the app replies instantly with
 * its canned line, the webhook treats that line AS the area, and a lead is
 * filed. The app answers each of our messages, so one number produced eleven
 * junk leads in three minutes — more than half of everything in the table.
 *
 * These are not customers who mistyped: nobody is at the keyboard. The reply
 * is refused rather than stored for review, because there is no enquiry behind
 * it to recover.
 *
 * Kept free of any database import so it can be tested directly.
 */

/**
 * Phrases an auto-responder announces itself with.
 *
 * Matched case-insensitively against the whole message. Each is a fixed string
 * these apps emit verbatim, not a guess at what a person might type — "I am
 * using Whatauto App" is the app's own default and no customer writes it.
 */
const AUTO_REPLY_MARKERS = [
    'auto reply',
    'auto-reply',
    'autoreply',
    'automatic reply',
    'automated reply',
    'auto response',
    'automated response',
    'whatauto',
    'whatsauto',
    'this is an automated message',
    'i am currently unavailable',
    'i am not available right now',
    'sent using',
];

/**
 * True when this text came from an auto-responder rather than a person.
 *
 * Deliberately narrow. A false positive silently drops a real enquiry, which
 * is worse than a junk row an admin can delete, so it looks only for the
 * apps' own announcements.
 */
export function isAutoReply(text: string | null | undefined): boolean {
    const value = String(text || '').toLowerCase();
    if (!value.trim()) return false;
    return AUTO_REPLY_MARKERS.some(marker => value.includes(marker));
}

/**
 * True when any field of an enquiry looks auto-generated.
 *
 * The responder's text arrives in whichever field the Interakt workflow was
 * filling when it replied — it landed in both `area` and `car` for the number
 * that prompted this — so every free-text field is checked rather than just
 * the area.
 */
export function hasAutoReplyContent(fields: Array<string | null | undefined>): boolean {
    return fields.some(isAutoReply);
}
