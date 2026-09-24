import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
    territoryFor,
    territoryForText,
    territoryKey,
    territoryLabel,
    searchPlaces,
    pincodesIn,
    canonicalState,
    type Territory,
    type DirectoryDistrict,
    type PincodePlace,
} from '../asmTerritory.js';

/**
 * The example the territories were built for: "Delhi" for one ASM covers every
 * Delhi pincode, and adding "Gurugram" gives them Gurugram's too.
 */

type Held = Territory & { asm: string };

const delhi: Held = { asm: 'X', kind: 'state', state: 'Delhi' };
const gurugram: Held = { asm: 'X', kind: 'district', state: 'Haryana', district: 'GURUGRAM' };

// Places as pincode_geo has them — India Post's spelling of the state.
const connaughtPlace: PincodePlace = { pincode: '110001', district: 'NEW DELHI', state: 'DELHI' };
const saket: PincodePlace = { pincode: '110017', district: 'SOUTH', state: 'DELHI' };
const cyberCity: PincodePlace = { pincode: '122002', district: 'GURUGRAM', state: 'HARYANA' };
const faridabad: PincodePlace = { pincode: '121001', district: 'FARIDABAD', state: 'HARYANA' };

const who = (place: PincodePlace, held: Held[]) => territoryFor(place, held)?.asm ?? null;

describe('a state and a district for one ASM', () => {
    test('every Delhi pincode, whatever its district', () => {
        assert.equal(who(connaughtPlace, [delhi]), 'X');
        assert.equal(who(saket, [delhi]), 'X');
    });

    test('adding Gurugram brings its pincodes, and only its', () => {
        assert.equal(who(cyberCity, [delhi]), null);
        assert.equal(who(cyberCity, [delhi, gurugram]), 'X');
        assert.equal(who(faridabad, [delhi, gurugram]), null, 'the rest of Haryana is not theirs');
    });
});

describe('the most specific place wins', () => {
    const southDelhi: Held = { asm: 'Y', kind: 'district', state: 'Delhi', district: 'SOUTH' };
    const onePin: Held = { asm: 'Z', kind: 'pincode', state: 'Delhi', pincode: '110017' };

    test('a district held by someone else splits the state', () => {
        assert.equal(who(saket, [delhi, southDelhi]), 'Y');
        assert.equal(who(connaughtPlace, [delhi, southDelhi]), 'X');
    });

    test('a single pincode beats its district and its state', () => {
        assert.equal(who(saket, [delhi, southDelhi, onePin]), 'Z');
        assert.equal(who({ ...saket, pincode: '110030' }, [delhi, southDelhi, onePin]), 'Y');
    });

    test('order of the list does not matter', () => {
        assert.equal(who(saket, [onePin, southDelhi, delhi]), 'Z');
    });
});

describe('a district belongs to its state', () => {
    // Pratapgarh is a district of both Uttar Pradesh and Rajasthan.
    const pratapgarhUp: Held = { asm: 'UP', kind: 'district', state: 'Uttar Pradesh', district: 'PRATAPGARH' };

    test('the Rajasthan Pratapgarh does not reach the UP holder', () => {
        assert.equal(who({ pincode: '312605', district: 'PRATAPGARH', state: 'RAJASTHAN' }, [pratapgarhUp]), null);
        assert.equal(who({ pincode: '230001', district: 'PRATAPGARH', state: 'UTTAR PRADESH' }, [pratapgarhUp]), 'UP');
    });

    test('keys keep them apart, so both can be held at once', () => {
        const pratapgarhRaj: Territory = { kind: 'district', state: 'Rajasthan', district: 'PRATAPGARH' };
        assert.notEqual(territoryKey(pratapgarhUp), territoryKey(pratapgarhRaj));
        assert.equal(territoryKey(delhi), 'state:delhi');
        assert.equal(territoryKey(gurugram), 'district:haryana:gurugram');
        assert.equal(territoryLabel(gurugram), 'Gurugram, Haryana');
    });

    test('a pincode India Post files under "NA" is reachable only as that pincode', () => {
        const place = { pincode: '390026', district: 'NA', state: 'NA' };
        assert.equal(canonicalState('NA'), null);
        assert.equal(who(place, [delhi]), null);
        assert.equal(who(place, [{ asm: 'P', kind: 'pincode', state: '', pincode: '390026' }]), 'P');
    });
});

describe('finding a place to assign', () => {
    const dir: DirectoryDistrict[] = [
        { state: 'Delhi', district: 'NEW DELHI', pincodes: 18 },
        { state: 'Delhi', district: 'SOUTH', pincodes: 15 },
        { state: 'Haryana', district: 'GURUGRAM', pincodes: 28 },
        { state: 'Haryana', district: 'FARIDABAD', pincodes: 15 },
        { state: 'Uttar Pradesh', district: 'GAUTAM BUDDHA NAGAR', pincodes: 27 },
        { state: 'Punjab', district: 'S.A.S Nagar', pincodes: 21 },
    ];

    test('"delhi" offers the state first, with every pincode in it', () => {
        const [first] = searchPlaces('delhi', dir);
        assert.equal(first.kind, 'state');
        assert.equal(first.label, 'Delhi');
        assert.equal(first.pincodes, 33);
    });

    test('districts are found under the names people use', () => {
        assert.equal(searchPlaces('gurugram', dir)[0].label, 'Gurugram, Haryana');
        assert.equal(searchPlaces('gurgaon', dir)[0].label, 'Gurugram, Haryana');
        assert.equal(searchPlaces('noida', dir)[0].label, 'Gautam Buddha Nagar, Uttar Pradesh');
        assert.equal(searchPlaces('mohali', dir)[0].label, 'S.A.S Nagar, Punjab');
    });

    test('a 6-digit query is a pincode', () => {
        assert.deepEqual(searchPlaces('122018', dir).map(o => o.kind), ['pincode']);
    });

    test('nothing typed lists the states', () => {
        assert.deepEqual(searchPlaces('', dir).map(o => o.label), ['Delhi', 'Haryana', 'Punjab', 'Uttar Pradesh']);
    });

    test('coverage counts', () => {
        assert.equal(pincodesIn(delhi, dir), 33);
        assert.equal(pincodesIn(gurugram, dir), 28);
    });
});

describe('typed locations, for manual and Instagram leads', () => {
    const noPincodes = () => null;

    test('"Rohini Delhi" reaches the Delhi holder through the state', () => {
        assert.equal(territoryForText('Rohini Delhi', [delhi], noPincodes)?.asm, 'X');
        assert.equal(territoryForText('dehli', [delhi], noPincodes)?.asm, 'X');
    });

    test('a district named in the text, by either name', () => {
        assert.equal(territoryForText('Sector 14, Gurugram', [delhi, gurugram], noPincodes)?.asm, 'X');
        assert.equal(territoryForText('gurgaon', [gurugram], noPincodes)?.asm, 'X');
    });

    test('an uncovered place stays unmatched rather than crossing a state line', () => {
        assert.equal(territoryForText('Noida', [delhi, gurugram], noPincodes), null);
        assert.equal(territoryForText('Faridabad', [delhi, gurugram], noPincodes), null);
    });

    test('a pincode in the text decides it', () => {
        const lookup = (p: string) => (p === '122002' ? cyberCity : null);
        assert.equal(territoryForText('near cyber hub 122002', [gurugram], lookup)?.asm, 'X');
    });
});
