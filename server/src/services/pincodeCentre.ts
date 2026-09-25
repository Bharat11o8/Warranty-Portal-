/**
 * Where a pincode is, from the post offices that share it.
 *
 * The India Post directory lists offices, not pincodes, and a large share of
 * its coordinates are wrong while still sitting inside India. Two kinds:
 *
 *  - Placeholders. The same latitude appears on hundreds of offices across
 *    several states — 15.5934 on 840 of them, 21.5 on 454. That is filler, not
 *    a place, and fifteen identical fake points look like a very convincing
 *    cluster to anything that counts agreement.
 *
 *  - Strays. Noida (201301) has three offices: Noida HO in the right place and
 *    two "Sector" offices 560 and 780 km south. Averaging them put Noida in
 *    Madhya Pradesh, and made every store in Noida look out of reach.
 *
 * The fix, in order:
 *
 *  1. Throw placeholders away before anything is measured.
 *  2. Count identical coordinates inside a pincode once. Three offices at
 *     exactly 22.78, 73.32 are one rough default, not three witnesses.
 *  3. Group the pincode's offices by nearness, and take the biggest group. A
 *     pincode's own offices, when they agree, are the best evidence there is.
 *  4. Only when groups tie — Noida's three offices all disagree — does the
 *     district decide, by picking the group nearest its median.
 *
 *  - Wrong state. Pratapgarh in Uttar Pradesh has 34 of its 38 pincodes'
 *    offices sitting in Chhattisgarh, around Raipur, so a customer from
 *    Pratapgarh was shown Raipur stores. The whole district is shifted, so
 *    neither the district nor agreement between offices can catch it — only a
 *    fixed map of where each state is. An office outside its own state's box is
 *    thrown away with the placeholders.
 *
 * The district is a tiebreaker and never a filter. India Post "districts" are
 * postal districts, and some are enormous: Raipur's spans most of Chhattisgarh,
 * so its median sits 226 km from Raipur city. Using distance from it to discard
 * offices threw away the nine correct offices of 492001 and kept nothing.
 *
 * Free of any database import, and measured against our own store pins, which
 * are verified coordinates with known pincodes.
 */

export interface Office {
    pincode: string;
    lat: number;
    lng: number;
    district: string | null;
    state: string | null;
}

/**
 * Where a pincode's location came from:
 *   india-post  its own offices
 *   district    its district's centre — every office was a placeholder, or had
 *               no usable coordinate at all
 *   prefix      the centre of pincodes sharing its first three digits — no
 *               usable coordinate and no district either
 */
export type CentreSource = 'india-post' | 'district' | 'prefix';

export interface PincodeCentre {
    pincode: string;
    lat: number;
    lng: number;
    district: string | null;
    state: string | null;
    /** Offices the centre was taken from; 0 when it fell back to the district. */
    offices: number;
    /** Offices set aside as placeholders or strays. */
    discarded: number;
    source: CentreSource;
}

const EARTH_RADIUS_KM = 6371;
const toRad = (d: number) => (d * Math.PI) / 180;

export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
    return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function median(values: number[]): number {
    const s = [...values].sort((a, b) => a - b);
    const m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

// ─── Tuning ──────────────────────────────────────────────────────────────────

export interface CentreOptions {
    /**
     * A coordinate value shared by offices in this many different pincodes is
     * a placeholder. No real latitude, to four decimal places (about 11 m),
     * belongs to that many separate postal areas.
     */
    placeholderPincodes: number;
    /** Offices of one pincode within this of each other belong together. */
    clusterKm: number;
}

export const DEFAULT_OPTIONS: CentreOptions = {
    placeholderPincodes: 30,
    clusterKm: 15,
};

// ─── Steps ───────────────────────────────────────────────────────────────────

const districtKey = (o: { state: string | null; district: string | null }) =>
    `${String(o.state ?? '').toLowerCase().trim()}|${String(o.district ?? '').toLowerCase().trim()}`;

/**
 * Coordinate values that are filler rather than places.
 *
 * Counted per axis: the file reuses a latitude with varying longitudes, and a
 * longitude with varying latitudes, so a pair-based count misses most of them.
 */
export function placeholderValues(offices: Office[], threshold: number): { lat: Set<string>; lng: Set<string> } {
    const latPins = new Map<string, Set<string>>();
    const lngPins = new Map<string, Set<string>>();
    for (const o of offices) {
        const la = o.lat.toFixed(4);
        const ln = o.lng.toFixed(4);
        (latPins.get(la) ?? latPins.set(la, new Set()).get(la)!).add(o.pincode);
        (lngPins.get(ln) ?? lngPins.set(ln, new Set()).get(ln)!).add(o.pincode);
    }
    const pick = (m: Map<string, Set<string>>) =>
        new Set([...m].filter(([, pins]) => pins.size >= threshold).map(([v]) => v));
    return { lat: pick(latPins), lng: pick(lngPins) };
}

export function isPlaceholder(o: Office, p: { lat: Set<string>; lng: Set<string> }): boolean {
    return p.lat.has(o.lat.toFixed(4)) || p.lng.has(o.lng.toFixed(4));
}

/**
 * Where each state is: [south, north, west, east], in degrees, keyed by the
 * state name as India Post writes it.
 *
 * Deliberately loose — a box, not a border — and padded further by
 * STATE_MARGIN, so a real office near a border is never thrown away. It only
 * has to catch offices hundreds of kilometres out, like Pratapgarh's.
 */
export const STATE_BOUNDS: Record<string, [number, number, number, number]> = {
    'ANDAMAN AND NICOBAR ISLANDS': [6.5, 14.0, 92.0, 94.3],
    'ANDHRA PRADESH': [12.6, 19.3, 76.7, 84.8],
    'ARUNACHAL PRADESH': [26.6, 29.5, 91.5, 97.5],
    'ASSAM': [24.1, 28.0, 89.6, 96.1],
    'BIHAR': [24.2, 27.6, 83.3, 88.3],
    'CHANDIGARH': [30.6, 30.85, 76.65, 76.9],
    'CHHATTISGARH': [17.7, 24.2, 80.2, 84.5],
    'THE DADRA AND NAGAR HAVELI AND DAMAN AND DIU': [20.0, 20.8, 70.8, 73.3],
    'DELHI': [28.4, 28.9, 76.8, 77.4],
    'GOA': [14.8, 15.9, 73.6, 74.4],
    'GUJARAT': [20.0, 24.8, 68.0, 74.6],
    'HARYANA': [27.6, 31.0, 74.4, 77.7],
    'HIMACHAL PRADESH': [30.3, 33.3, 75.5, 79.1],
    'JAMMU AND KASHMIR': [32.2, 37.1, 73.2, 80.4],
    'JHARKHAND': [21.9, 25.4, 83.3, 87.9],
    'KARNATAKA': [11.5, 18.5, 74.0, 78.6],
    'KERALA': [8.2, 12.8, 74.8, 77.5],
    'LADAKH': [32.2, 36.0, 75.2, 80.4],
    'LAKSHADWEEP': [8.0, 12.4, 71.6, 74.0],
    'MADHYA PRADESH': [21.0, 26.9, 74.0, 82.9],
    'MAHARASHTRA': [15.6, 22.1, 72.6, 80.9],
    'MANIPUR': [23.8, 25.7, 93.0, 94.8],
    'MEGHALAYA': [25.0, 26.2, 89.8, 92.8],
    'MIZORAM': [21.9, 24.6, 92.2, 93.5],
    'NAGALAND': [25.2, 27.1, 93.3, 95.3],
    'ODISHA': [17.8, 22.6, 81.3, 87.5],
    // Puducherry, Karaikal, Mahe on the Kerala coast and Yanam in Andhra.
    'PUDUCHERRY': [10.7, 16.8, 75.4, 82.3],
    'PUNJAB': [29.5, 32.6, 73.8, 77.0],
    'RAJASTHAN': [23.0, 30.2, 69.4, 78.3],
    'SIKKIM': [27.0, 28.2, 88.0, 88.95],
    'TAMIL NADU': [8.0, 13.6, 76.2, 80.4],
    'TELANGANA': [15.8, 19.95, 77.2, 81.4],
    'TRIPURA': [22.9, 24.6, 91.1, 92.4],
    'UTTAR PRADESH': [23.8, 30.5, 77.0, 84.7],
    'UTTARAKHAND': [28.7, 31.5, 77.5, 81.1],
    'WEST BENGAL': [21.5, 27.3, 85.8, 89.9],
};

/** Padding around every box, in degrees — roughly 30 km. */
export const STATE_MARGIN = 0.3;

/** False only when the office's state is known and the office is well outside it. */
export function isInOwnState(o: { lat: number; lng: number; state: string | null }): boolean {
    const box = STATE_BOUNDS[String(o.state ?? '').toUpperCase().trim()];
    if (!box) return true;
    const [s, n, w, e] = box;
    return o.lat >= s - STATE_MARGIN && o.lat <= n + STATE_MARGIN
        && o.lng >= w - STATE_MARGIN && o.lng <= e + STATE_MARGIN;
}

/** The median point of every district, from offices already cleared of placeholders. */
export function districtMedians(offices: Office[]): Map<string, { lat: number; lng: number }> {
    const groups = new Map<string, Office[]>();
    for (const o of offices) {
        const k = districtKey(o);
        (groups.get(k) ?? groups.set(k, []).get(k)!).push(o);
    }
    const out = new Map<string, { lat: number; lng: number }>();
    for (const [k, list] of groups) {
        out.set(k, { lat: median(list.map(o => o.lat)), lng: median(list.map(o => o.lng)) });
    }
    return out;
}

/** One distinct location among a pincode's offices, and how many sat there. */
interface Point { lat: number; lng: number; }

/**
 * A pincode's offices reduced to distinct locations.
 *
 * Repeats of one coordinate are a rough default copied between offices, so
 * they count once — otherwise the laziest data would outvote the careful.
 */
export function distinctPoints(offices: Office[]): Point[] {
    const seen = new Map<string, Point>();
    for (const o of offices) {
        const k = `${o.lat.toFixed(4)},${o.lng.toFixed(4)}`;
        if (!seen.has(k)) seen.set(k, { lat: o.lat, lng: o.lng });
    }
    return [...seen.values()];
}

/**
 * Place one pincode from its credible, distinct points.
 *
 * Every point proposes a group — itself and the others within clusterKm. The
 * biggest group wins outright. Only between groups of equal size does the
 * district anchor decide, by nearness. The pincode sits at the mean of the
 * winning group.
 */
export function placePincode(
    points: Point[],
    anchor: Point | undefined,
    clusterKm: number,
): { lat: number; lng: number; used: number } {
    let best: { members: Point[]; toAnchor: number } | null = null;

    for (const seed of points) {
        const members = points.filter(o => distanceKm(seed, o) <= clusterKm);
        const centre = {
            lat: members.reduce((s, o) => s + o.lat, 0) / members.length,
            lng: members.reduce((s, o) => s + o.lng, 0) / members.length,
        };
        const toAnchor = anchor ? distanceKm(centre, anchor) : 0;

        if (!best
            || members.length > best.members.length
            || (members.length === best.members.length && toAnchor < best.toAnchor)) {
            best = { members, toAnchor };
        }
    }

    const m = best!.members;
    return {
        lat: m.reduce((s, o) => s + o.lat, 0) / m.length,
        lng: m.reduce((s, o) => s + o.lng, 0) / m.length,
        used: m.length,
    };
}

/** Place every pincode in a list of offices. */
export function placeAllPincodes(offices: Office[], options: CentreOptions = DEFAULT_OPTIONS): PincodeCentre[] {
    const placeholders = placeholderValues(offices, options.placeholderPincodes);
    const isCredible = (o: Office) => !isPlaceholder(o, placeholders) && isInOwnState(o);
    const credible = offices.filter(isCredible);
    const anchors = districtMedians(credible);

    const byPincode = new Map<string, Office[]>();
    for (const o of offices) {
        (byPincode.get(o.pincode) ?? byPincode.set(o.pincode, []).get(o.pincode)!).push(o);
    }

    const out: PincodeCentre[] = [];
    for (const [pincode, all] of byPincode) {
        const first = all[0];
        const anchor = anchors.get(districtKey(first));
        const points = distinctPoints(all.filter(isCredible));

        if (points.length === 0) {
            // Every office was a placeholder or in the wrong state. The district
            // is the best we know, and better than any coordinate thrown away.
            if (!anchor) continue;
            out.push({
                pincode, lat: round(anchor.lat), lng: round(anchor.lng),
                district: first.district, state: first.state,
                offices: 0, discarded: all.length, source: 'district',
            });
            continue;
        }

        const placed = placePincode(points, anchor, options.clusterKm);
        out.push({
            pincode, lat: round(placed.lat), lng: round(placed.lng),
            district: first.district, state: first.state,
            offices: placed.used, discarded: points.length - placed.used, source: 'india-post',
        });
    }
    return out;
}

const round = (n: number) => Number(n.toFixed(6));

// ─── Filling India Post's gaps ───────────────────────────────────────────────

const isBlank = (s: string | null | undefined) => !s || /^n\.?a\.?$/i.test(String(s).trim());

/**
 * The state each 3-digit pincode prefix belongs to, where the file agrees.
 *
 * The first three digits are the sorting district, which never crosses a
 * state line in practice — so a pincode India Post files under state "NA"
 * (811315, 494111) can take the state its neighbours all share. A prefix is
 * only trusted when at least `minShare` of its offices, and `minCount` of
 * them, agree; a split prefix is left alone rather than guessed.
 */
export function statesByPrefix(
    offices: { pincode: string; state: string | null }[],
    minShare = 0.9,
    minCount = 5,
): Map<string, string> {
    const tally = new Map<string, Map<string, number>>();
    for (const o of offices) {
        if (isBlank(o.state)) continue;
        const p = o.pincode.slice(0, 3);
        const m = tally.get(p) ?? tally.set(p, new Map()).get(p)!;
        m.set(o.state!, (m.get(o.state!) ?? 0) + 1);
    }
    const out = new Map<string, string>();
    for (const [p, m] of tally) {
        const total = [...m.values()].reduce((a, b) => a + b, 0);
        const [state, n] = [...m].sort((a, b) => b[1] - a[1])[0];
        if (n >= minCount && n / total >= minShare) out.set(p, state);
    }
    return out;
}

/** An "NA" state replaced by its prefix's, when the prefix is unanimous enough. */
export function withInferredState<T extends { pincode: string; state: string | null }>(
    o: T, byPrefix: Map<string, string>,
): T {
    if (!isBlank(o.state)) return o;
    const state = byPrefix.get(o.pincode.slice(0, 3));
    return state ? { ...o, state } : o;
}

/**
 * Pincodes with no usable coordinate anywhere in the file, placed from what is
 * known about them: the centre of their district's placed pincodes, or failing
 * that, of the pincodes sharing their first three digits in the same state.
 * A pincode with neither stays unplaced.
 */
export function placeFromNeighbours(
    missing: { pincode: string; state: string | null; district: string | null }[],
    placed: PincodeCentre[],
): PincodeCentre[] {
    const byDistrict = new Map<string, PincodeCentre[]>();
    const byPrefix = new Map<string, PincodeCentre[]>();
    for (const c of placed) {
        if (!isBlank(c.district)) {
            const k = districtKey(c);
            (byDistrict.get(k) ?? byDistrict.set(k, []).get(k)!).push(c);
        }
        const k = `${String(c.state ?? '').toLowerCase()}|${c.pincode.slice(0, 3)}`;
        (byPrefix.get(k) ?? byPrefix.set(k, []).get(k)!).push(c);
    }

    const out: PincodeCentre[] = [];
    for (const m of missing) {
        const district = isBlank(m.district) ? undefined : byDistrict.get(districtKey(m));
        const prefix = byPrefix.get(`${String(m.state ?? '').toLowerCase()}|${m.pincode.slice(0, 3)}`);
        const group = district?.length ? district : prefix;
        if (!group?.length) continue;
        out.push({
            pincode: m.pincode,
            lat: round(median(group.map(c => c.lat))),
            lng: round(median(group.map(c => c.lng))),
            district: isBlank(m.district) ? null : m.district,
            state: m.state,
            offices: 0,
            discarded: 0,
            source: district?.length ? 'district' : 'prefix',
        });
    }
    return out;
}

/**
 * A district for a pincode India Post left as "NA": the district of the
 * nearest placed pincode in the same state, if one is within `maxKm`. Needed
 * because an ASM can hold a district (Gurugram, Daman), and a pincode with no
 * district could never reach them.
 */
export function nearestDistrict(
    c: PincodeCentre, placed: PincodeCentre[], maxKm = 25,
): string | null {
    let best: PincodeCentre | null = null;
    let bestKm = maxKm;
    for (const p of placed) {
        if (p.pincode === c.pincode || isBlank(p.district) || p.state !== c.state) continue;
        const km = distanceKm(c, p);
        if (km <= bestKm) { bestKm = km; best = p; }
    }
    return best?.district ?? null;
}
