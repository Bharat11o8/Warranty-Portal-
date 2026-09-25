import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
    placeAllPincodes,
    placePincode,
    placeholderValues,
    distinctPoints,
    distanceKm,
    isInOwnState,
    statesByPrefix,
    withInferredState,
    placeFromNeighbours,
    nearestDistrict,
    type Office,
} from '../pincodeCentre.js';

/**
 * Each case is a failure the real India Post file produced. A pincode placed in
 * the wrong state makes every store near the customer look out of reach.
 */

const office = (pincode: string, lat: number, lng: number, district = 'D', state = 'S'): Office =>
    ({ pincode, lat, lng, district, state });

/** Offices elsewhere in the same district, so it has a median to anchor on. */
const districtAround = (lat: number, lng: number, district: string, state: string, n = 12): Office[] =>
    Array.from({ length: n }, (_, i) =>
        office(String(900000 + i), lat + (i % 3) * 0.02, lng + (i % 4) * 0.02, district, state));

const near = (a: { lat: number; lng: number }, b: { lat: number; lng: number }, km: number) =>
    distanceKm(a, b) <= km;

describe('Noida — two strays outvoting the one correct office', () => {
    /* 201301 has Noida HO in the right place and two "Sector" offices 560 and
       780 km south. A mean put Noida in Madhya Pradesh. */
    test('placed at Noida, not averaged into Madhya Pradesh', () => {
        const offices = [
            ...districtAround(28.55, 77.35, 'GAUTAM BUDDHA NAGAR', 'UTTAR PRADESH'),
            office('201301', 28.579201, 77.324242, 'GAUTAM BUDDHA NAGAR', 'UTTAR PRADESH'),
            office('201301', 21.5478600, 77.8562450, 'GAUTAM BUDDHA NAGAR', 'UTTAR PRADESH'),
            office('201301', 23.5168400, 78.5489600, 'GAUTAM BUDDHA NAGAR', 'UTTAR PRADESH'),
        ];
        const noida = placeAllPincodes(offices).find(c => c.pincode === '201301')!;
        assert.ok(near(noida, { lat: 28.58, lng: 77.32 }, 5), `got ${noida.lat}, ${noida.lng}`);
    });
});

describe('placeholders — filler repeated across the country', () => {
    /* 15.5934 sits on 840 offices across five states. Fifteen identical fake
       points look like a very convincing cluster. */
    test('a latitude shared by many pincodes is a placeholder', () => {
        const filler = Array.from({ length: 40 }, (_, i) => office(String(100000 + i), 15.5934, 70 + i * 0.3));
        const p = placeholderValues(filler, 30);
        assert.ok(p.lat.has('15.5934'));
    });

    test('a real latitude used by a few pincodes is not', () => {
        const few = Array.from({ length: 5 }, (_, i) => office(String(100000 + i), 22.3036, 73.1977));
        assert.equal(placeholderValues(few, 30).lat.has('22.3036'), false);
    });

    // Vadodara 391240: fifteen offices on the placeholder, six real ones.
    test('the placeholder cluster does not win on numbers', () => {
        const filler = Array.from({ length: 40 }, (_, i) => office(String(300000 + i), 15.59, 60 + i));
        const pincode = [
            ...Array.from({ length: 15 }, () => office('391240', 15.59, 73.32, 'VADODARA', 'GUJARAT')),
            office('391240', 22.30, 73.20, 'VADODARA', 'GUJARAT'),
            office('391240', 22.31, 73.21, 'VADODARA', 'GUJARAT'),
        ];
        const all = [...districtAround(22.3, 73.2, 'VADODARA', 'GUJARAT'), ...filler, ...pincode];
        const c = placeAllPincodes(all).find(x => x.pincode === '391240')!;
        assert.ok(c.lat > 22 && c.lat < 22.5, `got ${c.lat}`);
    });

    test('a pincode with only placeholders sits at its district', () => {
        const filler = Array.from({ length: 40 }, (_, i) => office(String(300000 + i), 15.59, 60 + i));
        const all = [
            ...districtAround(22.3, 73.2, 'VADODARA', 'GUJARAT'),
            ...filler,
            office('391999', 15.59, 73.32, 'VADODARA', 'GUJARAT'),
        ];
        const c = placeAllPincodes(all).find(x => x.pincode === '391999')!;
        assert.equal(c.source, 'district');
        assert.ok(c.lat > 22 && c.lat < 22.5);
    });
});

describe('Raipur — the district is a tiebreaker, never a filter', () => {
    /* India Post's Raipur district spans most of Chhattisgarh, so its median
       sits 226 km south of Raipur city. Using it to discard offices threw away
       the nine correct offices of 492001. */
    test("a pincode's own agreeing offices beat a distant district median", () => {
        const districtFarSouth = districtAround(19.3, 81.8, 'RAIPUR', 'CHHATTISGARH', 30);
        const city = [
            office('492001', 21.2260, 81.6472, 'RAIPUR', 'CHHATTISGARH'),
            office('492001', 21.2247, 81.6411, 'RAIPUR', 'CHHATTISGARH'),
            office('492001', 21.2434, 81.6361, 'RAIPUR', 'CHHATTISGARH'),
            office('492001', 21.2341, 81.6468, 'RAIPUR', 'CHHATTISGARH'),
        ];
        const c = placeAllPincodes([...districtFarSouth, ...city]).find(x => x.pincode === '492001')!;
        assert.ok(near(c, { lat: 21.235, lng: 81.64 }, 5), `got ${c.lat}, ${c.lng}`);
        assert.equal(c.offices, 4);
    });
});

describe('Pratapgarh — a whole district filed in the wrong state', () => {
    /* India Post put 34 of Pratapgarh (UP)'s 38 pincodes around Raipur, so the
       offices agree with each other and the district median sits in Raipur too.
       Only the state's own box catches it. */
    const shifted = (pincode: string, i: number) =>
        office(pincode, 21.2 + (i % 3) * 0.03, 81.4 + (i % 4) * 0.03, 'PRATAPGARH', 'UTTAR PRADESH');
    const real = (pincode: string) => office(pincode, 25.9, 81.95, 'PRATAPGARH', 'UTTAR PRADESH');

    test('a pincode whose offices all sit in Chhattisgarh falls back to its district in UP', () => {
        const offices = [
            ...Array.from({ length: 30 }, (_, i) => shifted(String(230100 + i), i)),
            ...['230001', '230002', '230003', '230004'].map(real),
            shifted('230125', 0), shifted('230125', 1), shifted('230125', 2),
        ];
        const c = placeAllPincodes(offices).find(x => x.pincode === '230125')!;
        assert.equal(c.source, 'district');
        assert.ok(near(c, { lat: 25.9, lng: 81.95 }, 5), `got ${c.lat}, ${c.lng}`);
    });

    test('with no office left in the state, the pincode is left unplaced', () => {
        const c = placeAllPincodes([shifted('230125', 0), shifted('230126', 1)]).find(x => x.pincode === '230125');
        assert.equal(c, undefined);
    });

    test('an office just over a border is kept', () => {
        // Kundli, Sonipat — a Haryana pincode a few km from Delhi.
        assert.equal(isInOwnState({ lat: 28.90, lng: 77.11, state: 'HARYANA' }), true);
        // Raipur filed as Uttar Pradesh is not.
        assert.equal(isInOwnState({ lat: 21.25, lng: 81.61, state: 'UTTAR PRADESH' }), false);
        // No state, no judgement.
        assert.equal(isInOwnState({ lat: 21.25, lng: 81.61, state: 'NA' }), true);
    });
});

describe('filling India Post\'s gaps', () => {
    const stated = (pincode: string, state: string | null) => ({ pincode, state });

    test('an "NA" state takes the state its prefix agrees on', () => {
        const offices = [
            ...Array.from({ length: 12 }, (_, i) => stated(`8113${String(i).padStart(2, '0')}`, 'BIHAR')),
            stated('811315', 'NA'),
        ];
        const byPrefix = statesByPrefix(offices);
        assert.equal(withInferredState(stated('811315', 'NA'), byPrefix).state, 'BIHAR');
        assert.equal(withInferredState(stated('811315', null), byPrefix).state, 'BIHAR');
    });

    test('a split prefix is left alone rather than guessed', () => {
        const offices = [
            ...Array.from({ length: 6 }, (_, i) => stated(`4960${i}0`, 'CHHATTISGARH')),
            ...Array.from({ length: 4 }, (_, i) => stated(`4960${i}1`, 'ODISHA')),
        ];
        assert.equal(statesByPrefix(offices).has('496'), false);
        assert.equal(withInferredState(stated('496999', 'NA'), statesByPrefix(offices)).state, 'NA');
    });

    test('a known state is never overwritten', () => {
        const byPrefix = new Map([['811', 'BIHAR']]);
        const o = stated('811315', 'JHARKHAND');
        assert.equal(withInferredState(o, byPrefix), o);
    });

    const centre = (pincode: string, lat: number, lng: number, district: string | null, state = 'MADHYA PRADESH') =>
        ({ pincode, lat, lng, district, state, offices: 2, discarded: 0, source: 'india-post' as const });

    test('a pincode with no location sits at its district\'s centre', () => {
        const placed = [centre('483001', 23.18, 79.95, 'JABALPUR'), centre('483002', 23.20, 79.97, 'JABALPUR'),
            centre('483501', 23.83, 80.39, 'KATNI')];
        const [c] = placeFromNeighbours([{ pincode: '483222', state: 'MADHYA PRADESH', district: 'JABALPUR' }], placed);
        assert.equal(c.source, 'district');
        assert.ok(c.lat > 23.1 && c.lat < 23.3, `got ${c.lat}`);
    });

    test('with no district, it sits at the centre of its prefix in the same state', () => {
        const placed = [centre('500001', 17.38, 78.47, 'HYDERABAD', 'TELANGANA'), centre('500002', 17.36, 78.48, 'HYDERABAD', 'TELANGANA')];
        const [c] = placeFromNeighbours([{ pincode: '500934', state: 'TELANGANA', district: 'NA' }], placed);
        assert.equal(c.source, 'prefix');
        assert.equal(c.district, null);
    });

    test('with neither, it stays unplaced', () => {
        assert.deepEqual(placeFromNeighbours([{ pincode: '999999', state: 'NOWHERE', district: 'NA' }], []), []);
    });

    test('an "NA" district takes the nearest pincode\'s, in the same state only', () => {
        const target = centre('122999', 28.46, 77.03, 'NA', 'HARYANA');
        const placed = [
            centre('122001', 28.47, 77.03, 'GURUGRAM', 'HARYANA'),
            centre('110037', 28.46, 77.05, 'SOUTH WEST', 'DELHI'),   // nearer, but another state
        ];
        assert.equal(nearestDistrict(target, placed), 'GURUGRAM');
        assert.equal(nearestDistrict(centre('122999', 20, 70, 'NA', 'HARYANA'), placed), null, 'too far away');
    });
});

describe('placePincode', () => {
    test('the biggest agreeing group wins', () => {
        const r = placePincode(
            [{ lat: 28.60, lng: 77.30 }, { lat: 28.61, lng: 77.31 }, { lat: 28.62, lng: 77.30 }, { lat: 21.5, lng: 77.8 }],
            undefined, 15);
        assert.equal(r.used, 3);
        assert.ok(r.lat > 28.5);
    });

    test('between equal groups, the one nearest the district wins', () => {
        const r = placePincode([{ lat: 28.58, lng: 77.32 }, { lat: 21.55, lng: 77.86 }], { lat: 28.5, lng: 77.4 }, 15);
        assert.ok(r.lat > 28);
    });

    test('a single office is taken as given', () => {
        const r = placePincode([{ lat: 22.5, lng: 73.1 }], undefined, 15);
        assert.deepEqual([r.lat, r.lng, r.used], [22.5, 73.1, 1]);
    });
});

describe('distinctPoints — a copied default counts once', () => {
    // Three offices at exactly 22.78, 73.32 are one rough default.
    test('identical coordinates collapse', () => {
        const pts = distinctPoints([
            office('1', 22.78, 73.32), office('1', 22.78, 73.32), office('1', 22.78, 73.32), office('1', 22.30, 73.20),
        ]);
        assert.equal(pts.length, 2);
    });
});
