import db from '../config/database.js';
import {
    canonicalState,
    norm,
    searchPlaces,
    pincodesIn,
    territoryFor,
    territoryForText,
    territoryKey,
    territoryLabel,
    DISTRICT_ALIASES,
    type DirectoryDistrict,
    type PincodePlace,
    type PlaceOption,
    type Territory,
    type TerritoryKind,
} from './asmTerritory.js';

/**
 * ASM territories, read from the database. The rules live in asmTerritory.
 */

// ─── The directory ──────────────────────────────────────────────────────────

let cached: { at: number; districts: DirectoryDistrict[] } | null = null;
const CACHE_MS = 10 * 60 * 1000;

/**
 * Every district and how many pincodes it holds, states in our spelling.
 * Cached: it changes only when the pincode import is re-run.
 */
export async function directory(): Promise<DirectoryDistrict[]> {
    if (cached && Date.now() - cached.at < CACHE_MS) return cached.districts;

    const [rows]: any = await db.execute(
        'SELECT state, district, COUNT(*) AS n FROM pincode_geo GROUP BY state, district'
    );
    // Store-seeded rows write "Haryana" where India Post writes "HARYANA", so
    // the same district can arrive twice; merged here under one spelling.
    const merged = new Map<string, DirectoryDistrict>();
    for (const r of rows) {
        const state = canonicalState(r.state);
        const district = String(r.district ?? '').trim();
        if (!state || !district || /^n\.?a\.?$/i.test(district)) continue;
        const key = `${norm(state)}|${norm(district)}`;
        const existing = merged.get(key);
        if (existing) existing.pincodes += Number(r.n);
        else merged.set(key, { state, district, pincodes: Number(r.n) });
    }
    cached = { at: Date.now(), districts: [...merged.values()] };
    return cached.districts;
}

async function placeOf(pincode: string): Promise<PincodePlace | null> {
    const [rows]: any = await db.execute(
        'SELECT pincode, district, state FROM pincode_geo WHERE pincode = ? LIMIT 1',
        [pincode]
    );
    return rows[0] ?? null;
}

// ─── Who holds what ─────────────────────────────────────────────────────────

export interface HeldTerritory extends Territory {
    area_id: string;
    area_key: string;
    area_label: string;
    asm_id: string;
    name: string;
    phone_number: string;
    is_active: number;
}

async function held(): Promise<HeldTerritory[]> {
    const [rows]: any = await db.execute(
        `SELECT ar.id AS area_id, ar.area_key, ar.area_label, ar.kind, ar.state, ar.district, ar.pincode,
                a.id AS asm_id, a.name, a.phone_number, a.is_active
           FROM asm_areas ar
           JOIN asms a ON a.id = ar.asm_id
          WHERE ar.kind IS NOT NULL`
    );
    return rows;
}

/** What routing needs back: the ASM, and the place that won them the lead. */
export interface AsmMatch {
    id: string;
    name: string;
    phone_number: string;
    is_active: number;
    area_key: string;
    area_label: string;
}

const asMatch = (t: HeldTerritory | null): AsmMatch | null => {
    // An inactive ASM still holds the place — nobody else gets it by accident —
    // but is not sent anything; the lead queues as unmatched instead.
    if (!t || !t.is_active) return null;
    return {
        id: t.asm_id, name: t.name, phone_number: t.phone_number, is_active: t.is_active,
        area_key: t.area_key, area_label: t.area_label,
    };
};

/** The ASM for a customer's pincode. */
export async function findAsmForPincode(pincode: string, place?: PincodePlace | null): Promise<AsmMatch | null> {
    const where = place ?? await placeOf(pincode);
    if (!where) return null;
    return asMatch(territoryFor({ ...where, pincode }, await held()));
}

/** The ASM for a typed location — manual leads, Instagram forms. */
export async function findAsmForText(text: string): Promise<AsmMatch | null> {
    const territories = await held();
    if (!territories.length) return null;

    // A pincode in the text is looked up first; everything else is in memory.
    const pin = String(text ?? '').match(/\b[1-9][0-9]{5}\b/)?.[0];
    const pinPlace = pin ? await placeOf(pin) : null;

    return asMatch(territoryForText(text, territories, p => (p === pin ? pinPlace : null)));
}

// ─── The admin screen ───────────────────────────────────────────────────────

export interface PlaceResult extends PlaceOption {
    /** The ASM already holding exactly this place, if any. */
    taken_by: string | null;
}

export async function searchAreas(query: string): Promise<PlaceResult[]> {
    const [options, territories] = await Promise.all([directory(), held()]);
    const owners = new Map(territories.map(t => [t.area_key, t.name]));

    let found = searchPlaces(query, options);

    // A typed pincode is offered only if the directory knows it, with its place.
    if (found.length === 1 && found[0].kind === 'pincode') {
        const place = await placeOf(found[0].pincode!);
        if (!place) return [];
        const state = canonicalState(place.state) ?? '';
        const t: Territory = { kind: 'pincode', state, pincode: found[0].pincode };
        found = [{
            ...t,
            label: `${territoryLabel(t)}${place.district ? ` · ${place.district}` : ''}`,
            pincodes: 1,
            key: territoryKey(t),
        }];
    }
    return found.map(o => ({ ...o, taken_by: owners.get(o.key) ?? null }));
}

/** Pincode counts for each held area, for the chips on the ASM cards. */
export async function coverageOf(areas: { kind: TerritoryKind | null; state: string | null; district: string | null; pincode: string | null }[]) {
    const dir = await directory();
    return areas.map(a => a.kind
        ? pincodesIn({ kind: a.kind, state: a.state ?? '', district: a.district, pincode: a.pincode }, dir)
        : 0);
}

/**
 * A place an admin picked, checked against the directory before it is saved.
 * Throws with a message fit to show them.
 */
export async function resolveNewArea(input: {
    kind?: string; state?: string; district?: string; pincode?: string; area_label?: string;
}): Promise<{ territory: Territory; key: string; label: string; state: string }> {
    const dir = await directory();
    const kind = String(input.kind ?? '') as TerritoryKind;

    if (kind === 'pincode') {
        const pincode = String(input.pincode ?? '').trim();
        const place = /^[1-9][0-9]{5}$/.test(pincode) ? await placeOf(pincode) : null;
        if (!place) throw new Error(`${pincode || 'That'} is not a pincode we know`);
        const t: Territory = { kind, state: canonicalState(place.state) ?? '', pincode };
        return { territory: t, key: territoryKey(t), label: territoryLabel(t), state: t.state };
    }

    if (kind === 'district') {
        const state = canonicalState(input.state);
        const match = dir.find(d => d.state === state && norm(d.district) === norm(input.district));
        if (!state || !match) throw new Error('Pick the district from the list');
        const t: Territory = { kind, state, district: match.district };
        return { territory: t, key: territoryKey(t), label: territoryLabel(t), state };
    }

    /*
     * A state — picked from the list, or typed by the old screen as a name.
     * A typed name must BE the state's name: findState also knows cities, and
     * "Noida" resolving to Uttar Pradesh would hand one ASM the whole state.
     */
    const typed = kind === 'state' ? input.state : input.area_label;
    const state = canonicalState(typed);
    const exact = kind === 'state' || norm(state) === norm(typed);
    if (!state || !exact || !dir.some(d => d.state === state)) {
        // The old screen sends a typed name with no kind: a district, by its
        // own name or the one people use, in the state it suggested if any.
        if (!kind && typed) {
            const inState = canonicalState(input.state);
            const aliases = (DISTRICT_ALIASES[norm(typed)] ?? []).map(a => `${norm(a.state)}|${norm(a.district)}`);
            const hits = dir.filter(d =>
                (norm(d.district) === norm(typed) || aliases.includes(`${norm(d.state)}|${norm(d.district)}`))
                && (!inState || d.state === inState));
            if (hits.length === 1) {
                const t: Territory = { kind: 'district', state: hits[0].state, district: hits[0].district };
                return { territory: t, key: territoryKey(t), label: territoryLabel(t), state: t.state };
            }
        }
        throw new Error('Pick the area from the list — a state, a district or a pincode');
    }
    const t: Territory = { kind: 'state', state };
    return { territory: t, key: territoryKey(t), label: territoryLabel(t), state };
}
