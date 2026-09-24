/**
 * The WhatsApp messages the store locator sends, built without a database so
 * they can be checked against WhatsApp's limits in tests.
 *
 * WhatsApp refuses a list message outright — not truncates, refuses — when any
 * part is over its limit, and the customer then gets nothing at all. So every
 * piece of text is cut to size here, in one place:
 *
 *   rows in a list          10 in total, across all sections
 *   row title               24 characters
 *   row description         72
 *   section title           24
 *   list button             20
 *   body                    1024
 *   row id                  200
 *
 * A row id carries everything needed to act on the tap, because the tap comes
 * back through the webhook with nothing else attached: `sl:<lead id>:<kind>:<ref>`.
 */

export const LIMITS = {
    rows: 10,
    rowTitle: 24,
    rowDescription: 72,
    sectionTitle: 24,
    button: 20,
    body: 1024,
    rowId: 200,
} as const;

/** Rows per page when there are more than ten: nine, plus "More stores". */
const PAGE_WITH_MORE = LIMITS.rows - 1;

const ID_PREFIX = 'sl';

export type ReplyKind = 'store' | 'distributor' | 'more';
const KIND_CODE: Record<ReplyKind, string> = { store: 's', distributor: 'd', more: 'm' };
const CODE_KIND: Record<string, ReplyKind> = { s: 'store', d: 'distributor', m: 'more' };

/** Cut to a length, ending in an ellipsis rather than mid-word where it can. */
export function fit(text: string, max: number): string {
    const clean = String(text ?? '').replace(/\s+/g, ' ').trim();
    if (clean.length <= max) return clean;
    const cut = clean.slice(0, max - 1);
    const lastSpace = cut.lastIndexOf(' ');
    return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

export function rowId(leadId: string, kind: ReplyKind, ref: string | number): string {
    return `${ID_PREFIX}:${leadId}:${KIND_CODE[kind]}:${ref}`;
}

export interface LocatorReply { leadId: string; kind: ReplyKind; ref: string; }

/** The row id of a tap, if it is one of ours; null for anything else. */
export function parseRowId(id: string): LocatorReply | null {
    const parts = String(id ?? '').split(':');
    if (parts.length !== 4 || parts[0] !== ID_PREFIX) return null;
    const kind = CODE_KIND[parts[2]];
    if (!kind || !parts[1] || !parts[3]) return null;
    return { leadId: parts[1], kind, ref: parts[3] };
}

/**
 * The row id out of a message_received webhook, if the customer tapped a list
 * row or a reply button of ours.
 *
 * Interakt passes the WhatsApp reply through as a JSON string in
 * data.message.message — the stored button taps look like
 * {"type": "button_reply", "button_reply": {"id": …, "title": …}}. List taps
 * are read the same way under list_reply.
 */
export function replyFromWebhook(message: any): LocatorReply | null {
    let body: any = message?.message;
    if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { return null; }
    }
    const id = body?.list_reply?.id ?? body?.button_reply?.id;
    return id ? parseRowId(String(id)) : null;
}

// ─── Shapes going in ────────────────────────────────────────────────────────

export interface ListStore {
    id: string;
    store_name: string;
    city: string | null;
    distance_label: string;
}

export interface ListContact {
    id: string | null;
    name: string;
    phone: string | null;
    city?: string | null;
    distance_label?: string | null;
}

/** An Interakt InteractiveList message's `data` block. */
export interface InteractiveList {
    message: {
        type: 'list';
        body: { text: string };
        action: {
            button: string;
            sections: { title: string; rows: { id: string; title: string; description?: string }[] }[];
        };
    };
}

// ─── Lists ──────────────────────────────────────────────────────────────────

interface Row { id: string; title: string; description?: string; }

/**
 * One page of rows. Up to ten fit on a page when that is all there are;
 * otherwise nine and a "More" row, so the customer can always reach the rest.
 */
function paginate<T>(items: T[], page: number, toRow: (item: T) => Row, moreRow: (next: number) => Row) {
    if (page < 1 || page > pageCount(items.length)) return { rows: [] as Row[], hasMore: false };
    let start = 0;
    for (let p = 1; p < page; p++) start += PAGE_WITH_MORE;
    const remaining = items.length - start;
    if (remaining <= 0) return { rows: [] as Row[], hasMore: false };
    if (remaining <= LIMITS.rows) return { rows: items.slice(start).map(toRow), hasMore: false };
    return {
        rows: [...items.slice(start, start + PAGE_WITH_MORE).map(toRow), moreRow(page + 1)],
        hasMore: true,
    };
}

export function pageCount(total: number): number {
    if (total <= LIMITS.rows) return 1;
    let pages = 1, left = total;
    while (left > LIMITS.rows) { left -= PAGE_WITH_MORE; pages++; }
    return pages;
}

function list(body: string, button: string, section: string, rows: Row[]): InteractiveList {
    return {
        message: {
            type: 'list',
            body: { text: fit(body, LIMITS.body) },
            action: {
                button: fit(button, LIMITS.button),
                sections: [{
                    title: fit(section, LIMITS.sectionTitle),
                    rows: rows.map(r => ({
                        id: r.id.slice(0, LIMITS.rowId),
                        title: fit(r.title, LIMITS.rowTitle),
                        ...(r.description ? { description: fit(r.description, LIMITS.rowDescription) } : {}),
                    })),
                }],
            },
        },
    };
}

export function titleCase(s: string | null | undefined): string {
    return String(s ?? '').toLowerCase().replace(/\b[a-z]/g, ch => ch.toUpperCase()).trim();
}

/*
 * What the customer reads.
 *
 * Every contact is presented to the customer as an Autoform store — a store
 * nearby, a distributor, the ASM, or customer support. Who is behind the
 * number is our routing, not something the customer needs to weigh up; to them
 * it is simply where to go. No distance or range is shown either: "near you"
 * is the promise, and a kilometre figure only invites second-guessing.
 */

const LIST_BODY =
    'Here are the Autoform stores near you 📍\n\n' +
    "Tap *View stores* and select one — we'll send you its address and phone number.";
const LIST_BODY_MORE = 'More Autoform stores near you 📍';

/** Stores, or the state's distributors standing in for them — the same list to the customer. */
function nearbyList(
    leadId: string,
    kind: 'store' | 'distributor',
    items: { id: string | null; name: string; city?: string | null }[],
    page: number,
): InteractiveList | null {
    const { rows } = paginate(
        items, page,
        item => ({
            id: rowId(leadId, kind, String(item.id)),
            title: item.name,
            description: titleCase(item.city) || undefined,
        }),
        next => ({ id: rowId(leadId, 'more', next), title: 'More stores', description: 'See more stores near you' }),
    );
    if (!rows.length) return null;
    return list(page === 1 ? LIST_BODY : LIST_BODY_MORE, 'View stores', 'Stores near you', rows);
}

/** The stores near the customer, alphabetical as the locator returned them. */
export function storeList(leadId: string, stores: ListStore[], page = 1): InteractiveList | null {
    return nearbyList(leadId, 'store', stores.map(s => ({ id: s.id, name: s.store_name, city: s.city })), page);
}

/** The state's distributors, when no store is close enough — shown as stores. */
export function distributorList(leadId: string, distributors: ListContact[], page = 1): InteractiveList | null {
    return nearbyList(leadId, 'distributor', distributors, page);
}

// ─── Plain text ─────────────────────────────────────────────────────────────

export interface StoreDetails {
    store_name: string;
    address: string | null;
    city: string | null;
    pincode: string | null;
    phone: string | null;
}

/** One address line, without repeating a city or pincode the address already ends in. */
function addressLine(address: string | null, city: string | null, pincode: string | null): string {
    const parts = [address, titleCase(city), pincode].map(p => String(p ?? '').trim()).filter(Boolean);
    return parts
        .filter((p, i) => i === 0 || !parts[0].toLowerCase().includes(p.toLowerCase()))
        .join(', ');
}

function card(name: string, address: string, phone: string | null): string {
    return [
        `🏪 *${name.trim()}*`,
        address ? `📍 ${address}` : null,
        phone ? `📞 ${formatPhone(phone)}` : null,
    ].filter(Boolean).join('\n');
}

const HELP_LINE =
    'Feel free to call or visit — the team will be happy to help you choose the right products for your car. 🚗';
const ANOTHER_LINE = 'Looking for a store somewhere else? Just send us that pincode.';

/** The store the customer picked. */
export function storeDetailsText(s: StoreDetails): string {
    return [
        'Thank you for choosing Autoform! 🙏',
        '',
        "Here are your store's details:",
        '',
        card(s.store_name, addressLine(s.address, s.city, s.pincode), s.phone),
        '',
        HELP_LINE,
        '',
        ANOTHER_LINE,
    ].join('\n');
}

/** The distributor the customer picked — told as a store, like the list they picked from. */
export function distributorDetailsText(d: ListContact): string {
    return storeDetailsText({ store_name: d.name, address: null, city: d.city ?? null, pincode: null, phone: d.phone });
}

/** The ASM, when no store is near: one contact, sent straight away. */
export function asmText(asm: ListContact): string {
    return [
        'Thank you for reaching out to Autoform! 🙏',
        '',
        'Here is the Autoform store contact nearest to you:',
        '',
        card(asm.name, titleCase(asm.city), asm.phone),
        '',
        'Give them a call — they will be happy to help you choose the right products for your car. 🚗',
    ].join('\n');
}

/** The last resort: nobody in the state, or a pincode we could not place. */
export function supportText(support: ListContact): string {
    if (!support.phone) {
        return [
            'Thank you for reaching out to Autoform! 🙏',
            '',
            'Our team will get in touch with you shortly to help you find the right store and products for your car. 🚗',
        ].join('\n');
    }
    return [
        'Thank you for reaching out to Autoform! 🙏',
        '',
        'Our team will help you find the right store and products for your car:',
        '',
        card(support.name, '', support.phone),
        '',
        "Give us a call — we'll be happy to help. 🚗",
    ].join('\n');
}

export const INVALID_PINCODE_TEXT =
    "That doesn't look like a pincode. Please send your 6-digit area pincode, for example 110001.";

/** 919876543210 or 9876543210 -> +91 98765 43210. */
export function formatPhone(raw: string): string {
    const digits = String(raw ?? '').replace(/\D/g, '');
    const ten = digits.slice(-10);
    if (ten.length !== 10) return String(raw ?? '').trim();
    return `+91 ${ten.slice(0, 5)} ${ten.slice(5)}`;
}
