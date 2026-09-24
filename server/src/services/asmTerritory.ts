import { findState } from './indianStates.js';

/**
 * ASM territories: which pincodes an ASM answers for.
 *
 * An admin gives an ASM places — "Delhi", then "Gurugram" — and every pincode
 * inside those places is theirs. Places are the ones the India Post directory
 * already sorts every pincode into, so a territory is exact rather than a
 * guess at a name:
 *
 *   state      Delhi              every pincode in the state
 *   district   Gurugram, Haryana  every pincode in the district
 *   pincode    122018             that one pincode
 *
 * The most specific place wins. With Delhi on one ASM and "South, Delhi" on
 * another, a South Delhi pincode goes to the second — which is how a state is
 * split between people without listing every district.
 *
 * A district is always held together with its state: Pratapgarh is a district
 * of both Uttar Pradesh and Rajasthan, and Aurangabad of both Maharashtra and
 * Bihar.
 *
 * Free of any database import; asmTerritoryQuery does the fetching.
 */

export type TerritoryKind = 'state' | 'district' | 'pincode';

export interface Territory {
    kind: TerritoryKind;
    /** Canonical state name, as findState spells it: "Haryana", "Delhi". */
    state: string;
    /** India Post's district name, as the directory spells it. District only. */
    district?: string | null;
    /** Pincode only. */
    pincode?: string | null;
}

/** A place a pincode sits in, from pincode_geo. */
export interface PincodePlace {
    pincode: string;
    district: string | null;
    state: string | null;
}

export const norm = (s: string | null | undefined) =>
    String(s ?? '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '');

/** India Post's state spelling -> ours. "THE DADRA AND NAGAR HAVELI…" and "NA" included. */
export function canonicalState(raw: string | null | undefined): string | null {
    const text = String(raw ?? '').trim();
    if (!text || /^n\.?a\.?$/i.test(text)) return null;
    return findState(text)?.state ?? null;
}

export function titleCase(s: string | null | undefined): string {
    return String(s ?? '').toLowerCase().replace(/\b[a-z]/g, ch => ch.toUpperCase()).trim();
}

/**
 * The one key a place is stored under. Unique in asm_areas, so two ASMs can
 * never hold the same place — the database refuses the second.
 */
export function territoryKey(t: Territory): string {
    switch (t.kind) {
        case 'state': return `state:${norm(t.state)}`;
        case 'district': return `district:${norm(t.state)}:${norm(t.district)}`;
        case 'pincode': return `pincode:${t.pincode}`;
    }
}

export function territoryLabel(t: Territory): string {
    switch (t.kind) {
        case 'state': return t.state;
        case 'district': return `${titleCase(t.district)}, ${t.state}`;
        case 'pincode': return `Pincode ${t.pincode}`;
    }
}

/** How specific a place is: the higher, the more it wins. */
const RANK: Record<TerritoryKind, number> = { pincode: 3, district: 2, state: 1 };

/**
 * The territory a pincode falls in, most specific first; null when nobody
 * holds any place it sits in.
 */
export function territoryFor<T extends Territory>(place: PincodePlace, held: T[]): T | null {
    const state = canonicalState(place.state);
    const district = norm(place.district);

    let best: T | null = null;
    for (const t of held) {
        const hit =
            (t.kind === 'pincode' && t.pincode === place.pincode) ||
            (t.kind === 'district' && !!state && t.state === state && norm(t.district) === district && !!district) ||
            (t.kind === 'state' && !!state && t.state === state);
        if (hit && (!best || RANK[t.kind] > RANK[best.kind])) best = t;
    }
    return best;
}

// ─── Finding a place by name ────────────────────────────────────────────────

/**
 * What people call a place, against what India Post calls its district.
 *
 * Only the names that differ are listed. Everything else — Gurugram, Faridabad,
 * Ghaziabad — is found under its own name. Checked against pincode_geo in
 * September 2026: every target here is a district that exists.
 */
export const DISTRICT_ALIASES: Record<string, { district: string; state: string }[]> = {
    noida: [{ district: 'GAUTAM BUDDHA NAGAR', state: 'Uttar Pradesh' }],
    greaternoida: [{ district: 'GAUTAM BUDDHA NAGAR', state: 'Uttar Pradesh' }],
    gurgaon: [{ district: 'GURUGRAM', state: 'Haryana' }],
    mohali: [{ district: 'S.A.S Nagar', state: 'Punjab' }],
    bangalore: [{ district: 'BENGALURU URBAN', state: 'Karnataka' }],
    bengaluru: [{ district: 'BENGALURU URBAN', state: 'Karnataka' }],
    bombay: [{ district: 'MUMBAI', state: 'Maharashtra' }, { district: 'MUMBAI SUBURBAN', state: 'Maharashtra' }],
};

/** One district as the directory has it, with how many pincodes it holds. */
export interface DirectoryDistrict {
    state: string;          // canonical
    district: string;       // India Post's spelling
    pincodes: number;
}

export interface PlaceOption extends Territory {
    label: string;
    /** Pincodes this place covers. */
    pincodes: number;
    key: string;
}

/**
 * Places matching what an admin typed, for them to pick from.
 *
 * States first, then districts, each best match first: a name that starts
 * with the query beats one that merely contains it. A 6-digit query offers
 * that pincode. An empty query lists the states.
 */
export function searchPlaces(query: string, directory: DirectoryDistrict[], limit = 12): PlaceOption[] {
    const raw = String(query ?? '').trim();
    const q = norm(raw);

    const states = new Map<string, number>();
    for (const d of directory) states.set(d.state, (states.get(d.state) ?? 0) + d.pincodes);

    if (/^[1-9][0-9]{5}$/.test(raw)) {
        return [option({ kind: 'pincode', state: '', pincode: raw }, 1)];
    }

    const score = (name: string) => {
        const n = norm(name);
        if (!q) return 1;
        if (n === q) return 4;
        if (n.startsWith(q)) return 3;
        if (n.includes(q)) return 2;
        return 0;
    };

    const stateHits = [...states]
        .map(([state, pincodes]) => ({ state, pincodes, s: score(state) }))
        .filter(x => x.s > 0)
        .sort((a, b) => b.s - a.s || a.state.localeCompare(b.state))
        .map(x => option({ kind: 'state', state: x.state }, x.pincodes));

    if (!q) return stateHits;

    // Districts by their own name, and by what people call them.
    const aliasTargets = new Set(
        Object.entries(DISTRICT_ALIASES)
            .filter(([alias]) => alias.startsWith(q) || (q.length >= 4 && alias.includes(q)))
            .flatMap(([, targets]) => targets.map(t => `${norm(t.state)}|${norm(t.district)}`))
    );
    const districtHits = directory
        .map(d => ({ d, s: Math.max(score(d.district), aliasTargets.has(`${norm(d.state)}|${norm(d.district)}`) ? 3 : 0) }))
        .filter(x => x.s > 0)
        .sort((a, b) => b.s - a.s || b.d.pincodes - a.d.pincodes || a.d.district.localeCompare(b.d.district))
        .map(x => option({ kind: 'district', state: x.d.state, district: x.d.district }, x.d.pincodes));

    return [...stateHits, ...districtHits].slice(0, limit);
}

function option(t: Territory, pincodes: number): PlaceOption {
    return { ...t, label: territoryLabel(t), pincodes, key: territoryKey(t) };
}

/** Pincodes a territory covers, from the directory. */
export function pincodesIn(t: Territory, directory: DirectoryDistrict[]): number {
    if (t.kind === 'pincode') return 1;
    return directory
        .filter(d => d.state === t.state && (t.kind === 'state' || norm(d.district) === norm(t.district)))
        .reduce((sum, d) => sum + d.pincodes, 0);
}

// ─── Typed text, for enquiries that give a place rather than a pincode ──────

/**
 * The territory a free-text location falls in — "Rohini Delhi", "gurgaon",
 * "Sector 14 Gurugram 122001".
 *
 * A pincode in the text decides it outright. Otherwise a district named in the
 * text, then the state. A district only counts when it agrees with the state
 * the text names, so "Pratapgarh, Rajasthan" never reaches whoever holds
 * Pratapgarh in Uttar Pradesh.
 */
export function territoryForText<T extends Territory>(
    text: string,
    held: T[],
    placeOfPincode: (pincode: string) => PincodePlace | null,
): T | null {
    const pin = String(text ?? '').match(/\b[1-9][0-9]{5}\b/)?.[0];
    if (pin) {
        const place = placeOfPincode(pin);
        if (place) {
            const hit = territoryFor(place, held);
            if (hit) return hit;
        }
    }

    const state = findState(text)?.state ?? null;
    const words = String(text ?? '').split(/[^A-Za-z0-9.]+/).filter(Boolean);
    const phrases = new Set<string>();
    for (let size = 3; size >= 1; size--) {
        for (let i = 0; i + size <= words.length; i++) phrases.add(norm(words.slice(i, i + size).join(' ')));
    }

    const districts = held.filter(t => t.kind === 'district' && (!state || t.state === state));
    for (const t of districts) {
        const names = [norm(t.district), ...Object.entries(DISTRICT_ALIASES)
            .filter(([, targets]) => targets.some(x => x.state === t.state && norm(x.district) === norm(t.district)))
            .map(([alias]) => alias)];
        if (names.some(n => n && phrases.has(n))) return t;
    }

    if (state) return held.find(t => t.kind === 'state' && t.state === state) ?? null;
    return null;
}
