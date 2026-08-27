import db from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * The admin's own store list, uploaded as CSV.
 *
 * A WhatsApp audit arrives carrying little more than the phone that submitted
 * it — the Flow is meant to prefill store name, zone and ASM, but those come
 * through empty, so anything not already a registered franchise shows as
 * "Unmatched". This list fills that gap: the admin uploads the contacts the
 * audit was sent to, and an arriving response is named from it.
 *
 * Matching is always on the last ten digits, since the portal stores ten and
 * WhatsApp sends twelve with the country code.
 */

export interface ParsedContact {
    phone_key: string;
    raw_phone: string;
    store_name: string | null;
    contact_person: string | null;
    area: string | null;
    city: string | null;
    state: string | null;
    zone: string | null;
    asm: string | null;
    brands: string | null;
    category: string | null;
}

/** Last ten digits, or '' when there are not ten to take. */
export function phoneKey(value: unknown): string {
    const digits = String(value ?? '').replace(/\D/g, '');
    return digits.length >= 10 ? digits.slice(-10) : '';
}

/**
 * Header aliases, so an export does not have to be reshaped by hand.
 *
 * A Google Contacts export names the phone column "Phone 1 - Value" and the
 * store "Organization Name"; a hand-made sheet is more likely to say "phone"
 * and "store name". Both are accepted.
 */
const FIELD_ALIASES: Record<keyof Omit<ParsedContact, 'phone_key' | 'raw_phone'> | 'phone', string[]> = {
    phone: ['phone 1 - value', 'phone', 'phone number', 'mobile', 'mobile number', 'contact', 'contact number', 'store contact', 'phone_number'],
    store_name: ['organization name', 'store name', 'store', 'franchise', 'franchise name', 'organisation name', 'shop name', 'store_name'],
    contact_person: ['contact person', 'name', 'given name', 'owner', 'person', 'contact_person'],
    area: ['area', 'locality', 'region', 'address 1 - city'],
    city: ['address 1 - city', 'city', 'town'],
    state: ['address 1 - region', 'state', 'province'],
    zone: ['zone'],
    asm: ['asm', 'area manager', 'area sales manager'],
    brands: ['brands', 'brand'],
    category: ['category', 'categories'],
};

function pick(row: Record<string, string>, keys: string[]): string | null {
    for (const k of keys) {
        for (const header of Object.keys(row)) {
            if (header.trim().toLowerCase() === k) {
                const v = String(row[header] ?? '').trim();
                if (v) return v;
            }
        }
    }
    return null;
}

/**
 * A Google Contacts "Name" packs store, area and person into one field:
 * "RG AUTOSTYLE - Indirapuram - Mr.puneet grover". Split it only when the
 * dedicated columns are absent, so an explicit column always wins.
 */
function splitCompositeName(name: string | null) {
    if (!name) return { store: null as string | null, area: null as string | null, person: null as string | null };
    const parts = name.split(' - ').map(p => p.trim()).filter(Boolean);
    if (parts.length >= 3) return { store: parts[0], area: parts[1], person: parts.slice(2).join(' - ') };
    if (parts.length === 2) return { store: parts[0], area: null, person: parts[1] };
    return { store: null, area: null, person: name.trim() || null };
}

/** Minimal CSV reader: handles quoted fields, embedded commas and CRLF. */
export function parseCsv(text: string): Record<string, string>[] {
    const rows: string[][] = [];
    let row: string[] = [];
    let field = '';
    let inQuotes = false;

    const body = text.replace(/^﻿/, '');
    for (let i = 0; i < body.length; i++) {
        const ch = body[i];
        if (inQuotes) {
            if (ch === '"') {
                if (body[i + 1] === '"') { field += '"'; i++; }
                else inQuotes = false;
            } else field += ch;
            continue;
        }
        if (ch === '"') { inQuotes = true; continue; }
        if (ch === ',') { row.push(field); field = ''; continue; }
        if (ch === '\r') continue;
        if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; continue; }
        field += ch;
    }
    if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }

    if (rows.length === 0) return [];
    const headers = rows[0].map(h => h.trim());
    return rows.slice(1)
        .filter(r => r.some(c => String(c).trim() !== ''))
        .map(r => {
            const obj: Record<string, string> = {};
            headers.forEach((h, i) => { obj[h] = r[i] ?? ''; });
            return obj;
        });
}

export interface ParseResult {
    contacts: ParsedContact[];
    totalRows: number;
    skippedNoPhone: number;
    duplicatePhones: number;
}

/** Turn CSV text into contacts, keyed and deduplicated by phone. */
export function parseContacts(text: string): ParseResult {
    const rows = parseCsv(text);
    const byPhone = new Map<string, ParsedContact>();
    let skippedNoPhone = 0;
    let duplicatePhones = 0;

    for (const row of rows) {
        const rawPhone = pick(row, FIELD_ALIASES.phone);
        const key = phoneKey(rawPhone);
        if (!key) { skippedNoPhone++; continue; }

        const composite = splitCompositeName(pick(row, ['name', 'given name']));

        const contact: ParsedContact = {
            phone_key: key,
            raw_phone: String(rawPhone ?? '').trim(),
            store_name: pick(row, FIELD_ALIASES.store_name) || composite.store,
            contact_person: composite.person || pick(row, ['contact person', 'owner', 'person']),
            area: pick(row, ['area', 'locality', 'region']) || composite.area,
            city: pick(row, FIELD_ALIASES.city),
            state: pick(row, FIELD_ALIASES.state),
            zone: pick(row, FIELD_ALIASES.zone),
            asm: pick(row, FIELD_ALIASES.asm),
            brands: pick(row, FIELD_ALIASES.brands),
            category: pick(row, FIELD_ALIASES.category),
        };

        if (byPhone.has(key)) duplicatePhones++;
        // Last row wins, so a re-export with corrected details replaces the old.
        byPhone.set(key, contact);
    }

    return {
        contacts: Array.from(byPhone.values()),
        totalRows: rows.length,
        skippedNoPhone,
        duplicatePhones,
    };
}

export interface MatchedContact extends ParsedContact {
    vendor_details_id: string | null;
    match_method: 'phone' | 'store_name' | 'none';
    matched_store_name: string | null;
}

/**
 * Link each contact to a portal franchise.
 *
 * Phone first, since that is the identity. Falling back to an exact store name
 * catches the stores whose portal record carries a different number — a shop
 * line against an owner's mobile, typically — so an audit from either number
 * still reaches the right franchise.
 */
export async function matchContacts(contacts: ParsedContact[]): Promise<MatchedContact[]> {
    if (contacts.length === 0) return [];

    const [byPhoneRows]: any = await db.query(
        `SELECT vd.id, vd.store_name,
                RIGHT(REGEXP_REPLACE(COALESCE(p.phone_number, ''), '[^0-9]', ''), 10) AS phone_key
         FROM vendor_details vd
         JOIN profiles p ON p.id = vd.user_id
         WHERE RIGHT(REGEXP_REPLACE(COALESCE(p.phone_number, ''), '[^0-9]', ''), 10) IN (?)`,
        [contacts.map(c => c.phone_key)]
    );
    const phoneMap = new Map<string, any>();
    byPhoneRows.forEach((r: any) => { if (r.phone_key) phoneMap.set(r.phone_key, r); });

    const names = Array.from(new Set(contacts.map(c => c.store_name).filter(Boolean))) as string[];
    const nameMap = new Map<string, any>();
    if (names.length > 0) {
        const [byNameRows]: any = await db.query(
            `SELECT id, store_name FROM vendor_details WHERE store_name IN (?)`,
            [names]
        );
        byNameRows.forEach((r: any) => {
            const k = String(r.store_name || '').trim().toLowerCase();
            if (k && !nameMap.has(k)) nameMap.set(k, r);
        });
    }

    return contacts.map(c => {
        const byPhone = phoneMap.get(c.phone_key);
        if (byPhone) {
            return { ...c, vendor_details_id: byPhone.id, match_method: 'phone' as const, matched_store_name: byPhone.store_name };
        }
        const byName = c.store_name ? nameMap.get(c.store_name.trim().toLowerCase()) : null;
        if (byName) {
            return { ...c, vendor_details_id: byName.id, match_method: 'store_name' as const, matched_store_name: byName.store_name };
        }
        return { ...c, vendor_details_id: null, match_method: 'none' as const, matched_store_name: null };
    });
}

/** Save contacts, replacing any row already held for the same number. */
export async function saveContacts(
    matched: MatchedContact[],
    meta: { sourceFile?: string; adminId?: string; adminName?: string }
): Promise<{ inserted: number; updated: number }> {
    let inserted = 0;
    let updated = 0;

    for (const c of matched) {
        const [existing]: any = await db.execute(
            `SELECT id FROM audit_contacts WHERE phone_key = ? LIMIT 1`,
            [c.phone_key]
        );

        if (existing.length > 0) {
            await db.execute(
                `UPDATE audit_contacts
                 SET raw_phone = ?, store_name = ?, contact_person = ?, area = ?, city = ?, state = ?,
                     zone = ?, asm = ?, brands = ?, category = ?, vendor_details_id = ?, match_method = ?,
                     source_file = ?, uploaded_by = ?, uploaded_by_name = ?
                 WHERE phone_key = ?`,
                [c.raw_phone, c.store_name, c.contact_person, c.area, c.city, c.state,
                 c.zone, c.asm, c.brands, c.category, c.vendor_details_id, c.match_method,
                 meta.sourceFile || null, meta.adminId || null, meta.adminName || null, c.phone_key]
            );
            updated++;
        } else {
            await db.execute(
                `INSERT INTO audit_contacts
                   (id, phone_key, raw_phone, store_name, contact_person, area, city, state,
                    zone, asm, brands, category, vendor_details_id, match_method,
                    source_file, uploaded_by, uploaded_by_name)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [uuidv4(), c.phone_key, c.raw_phone, c.store_name, c.contact_person, c.area, c.city, c.state,
                 c.zone, c.asm, c.brands, c.category, c.vendor_details_id, c.match_method,
                 meta.sourceFile || null, meta.adminId || null, meta.adminName || null]
            );
            inserted++;
        }
    }

    return { inserted, updated };
}

/** The uploaded contact for a phone, if the admin has one on file. */
export async function findContactByPhone(phone: string) {
    const key = phoneKey(phone);
    if (!key) return null;
    const [rows]: any = await db.execute(
        `SELECT * FROM audit_contacts WHERE phone_key = ? LIMIT 1`,
        [key]
    );
    return rows.length > 0 ? rows[0] : null;
}

/**
 * Make the uploaded list the round's chase list.
 *
 * Every contact in the file is a target, because every contact was sent the
 * message — a store with three numbers on file got three messages and is three
 * rows here. Deduplicating by store would hide numbers that never replied.
 *
 * Existing targets are left alone, so a store that has already responded is
 * never reset to outstanding.
 */
export async function syncRoundTargets(roundId: string): Promise<{ added: number; existing: number }> {
    const [contacts]: any = await db.execute(
        `SELECT phone_key, store_name, vendor_details_id FROM audit_contacts`
    );
    if (contacts.length === 0) return { added: 0, existing: 0 };

    let added = 0;
    let existing = 0;

    for (const c of contacts) {
        const [r]: any = await db.execute(
            `INSERT IGNORE INTO audit_round_targets
               (id, round_id, vendor_details_id, phone_key, store_name)
             VALUES (?, ?, ?, ?, ?)`,
            [uuidv4(), roundId, c.vendor_details_id || null, c.phone_key, c.store_name || null]
        );
        if (r.affectedRows > 0) added++; else existing++;
    }

    return { added, existing };
}
