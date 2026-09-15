import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { isSamePlace, buildAddress, sameWord } from '../placeMatch.js';

/**
 * Every case here came from real data — the spellings are ones our
 * vendor_details actually holds, and the false matches are ones this code
 * produced before it was fixed.
 */

describe('isSamePlace — the same place, spelled differently', () => {
    const same: Array<[string, string, string]> = [
        // Vowels move around in transliteration; consonants do not.
        ['MEHSANA', 'Mahesana', 'Gujarat'],
        ['AHEMDABAD', 'Ahmedabad Gujarat', 'Gujarat'],
        ['JAMANAGAR', 'Jamnagar', 'Gujarat'],
        ['BAHARUCH', 'Bharuch', 'Gujarat'],
        ['GHANDHINAGAR', 'GANDHINAGAR', 'Gujarat'],
        ['BHUBANESWAR', 'BHUBNESWAR', 'Odisha'],
        ['HISSAR', 'HISAR', 'Haryana'],
        ['BHATINDA', 'BATHINDA', 'Punjab'],

        // The customer names the area alongside the state.
        ['ROHINI', 'Rohini Delhi', 'Delhi'],
        ['PITAMPURA', 'pitampura delhi', 'Delhi'],
        ['KARNAL', 'Karnal, Haryana', 'Haryana'],
        ['JAIPUR', 'Jaipur, Rajasthan', 'Rajasthan'],
        ['NAVSARI', 'Navsari Gujarat', 'Gujarat'],

        // A stored city that qualifies the same place.
        ['SURAT- KAMREJ', 'Surat Gujarat', 'Gujarat'],
        ['KOSAMBA -SURAT', 'Surat Gujarat', 'Gujarat'],
        ['SABARMATI (AHMEDABAD)', 'Ahmedabad Gujarat', 'Gujarat'],
        ['GREATER NOIDA', 'noida', 'Uttar Pradesh'],
        ['KAROL BAG', 'KAROL BAGH', 'Delhi'],
        ['pulwama', 'PULWAMA', 'Jammu & Kashmir'],
    ];

    for (const [city, typed, state] of same) {
        test(`"${city}" is "${typed}"`, () => {
            assert.equal(isSamePlace(city, typed, state), true);
        });
    }
});

describe('isSamePlace — different places that look alike', () => {
    const different: Array<[string, string, string, string]> = [
        // Generic suffixes are not identities. The Vikas Puri case reached a
        // real lead before this was fixed.
        ['VIKAS PURI', 'mangol puri delhi', 'Delhi', 'shared suffix "puri"'],
        ['KAROL BAGH', 'PUNJABI BAGH', 'Delhi', 'shared suffix "bagh"'],

        // Close spellings, genuinely different towns.
        ['BATALA', 'BARNALA', 'Punjab', 'different consonants'],
        ['PATAN', 'Ratan Gujarat', 'Gujarat', 'different first letter'],
        ['MORBI', 'MODASA', 'Gujarat', 'different towns'],
        ['KADI', 'KALOL', 'Gujarat', 'different towns'],

        // A substring test would have matched both of these.
        ['Surat', 'Suratgarh Rajasthan', 'Rajasthan', 'Surat inside Suratgarh'],
        ['Kota', 'Kolkata West Bengal', 'West Bengal', 'Kota inside Kolkata'],

        // Unrelated cities in the same state.
        ['RAJKOT', 'Ahmedabad Gujarat', 'Gujarat', 'unrelated'],
        ['VAPI', 'Navsari Gujarat', 'Gujarat', 'unrelated'],
    ];

    for (const [city, typed, state, why] of different) {
        test(`"${city}" is not "${typed}" (${why})`, () => {
            assert.equal(isSamePlace(city, typed, state), false);
        });
    }
});

describe('isSamePlace — the state itself is not a local match', () => {
    /*
     * "Rohini Delhi" contains "delhi", so a store filed under city DELHI once
     * scored as near for every Delhi enquiry and pushed the real Rohini store
     * down the list. Every store compared is already in the right state.
     */
    test('a store filed under the state name is not "near"', () => {
        assert.equal(isSamePlace('DELHI', 'Rohini Delhi', 'Delhi'), false);
        assert.equal(isSamePlace('Gujarat', 'Navsari Gujarat', 'Gujarat'), false);
    });
});

describe('isSamePlace — nothing to compare', () => {
    test('empty inputs never match', () => {
        assert.equal(isSamePlace('', 'Rohini Delhi', 'Delhi'), false);
        assert.equal(isSamePlace('ROHINI', '', 'Delhi'), false);
        assert.equal(isSamePlace('', '', 'Delhi'), false);
    });

    test('words shorter than four characters carry no identity', () => {
        // Both reduce to nothing once short words are dropped.
        assert.equal(isSamePlace('ABC', 'ABC', 'Delhi'), false);
    });
});

describe('sameWord — the guards, directly', () => {
    test('identical words match', () => {
        assert.equal(sameWord('jaipur', 'jaipur'), true);
    });

    test('a different first letter never matches', () => {
        assert.equal(sameWord('patan', 'ratan'), false);
    });

    test('the same consonants with different vowels match', () => {
        assert.equal(sameWord('mehsana', 'mahesana'), true);
    });

    test('nothing under five characters is fuzzy-matched', () => {
        // One edit apart, but too short to risk it.
        assert.equal(sameWord('kadi', 'kali'), false);
    });
});

describe('buildAddress', () => {
    test('does not repeat a city and pincode the address already holds', () => {
        assert.equal(
            buildAddress({
                address: 'SHOP NO 2, GOPALPURA MORH, TONK ROAD JAIPUR-302018',
                city: 'JAIPUR',
                pincode: '302018',
            }),
            'SHOP NO 2, GOPALPURA MORH, TONK ROAD JAIPUR-302018'
        );
    });

    test('appends the parts an address genuinely lacks', () => {
        assert.equal(
            buildAddress({
                address: 'SHOP NO-381, MUGAL CANAL MARKET',
                city: 'KARNAL',
                pincode: '132001',
            }),
            'SHOP NO-381, MUGAL CANAL MARKET, KARNAL, 132001'
        );
    });

    test('recognises a pincode written with a hyphen', () => {
        // "PITAMPURA-110034" carries both the city and the pincode.
        assert.equal(
            buildAddress({
                address: 'G-53, CD BLOCK, PITAMPURA-110034, DELHI',
                city: 'PITAMPURA',
                pincode: '110034',
            }),
            'G-53, CD BLOCK, PITAMPURA-110034, DELHI'
        );
    });

    test('trims a trailing comma rather than leaving a gap', () => {
        assert.equal(
            buildAddress({ address: 'MAIN ROAD, ', city: 'SURAT', pincode: '395003' }),
            'MAIN ROAD, SURAT, 395003'
        );
    });

    test('survives missing parts', () => {
        assert.equal(buildAddress({ address: 'MAIN ROAD', city: null, pincode: null }), 'MAIN ROAD');
        assert.equal(buildAddress({ address: null, city: 'SURAT', pincode: null }), 'SURAT');
        assert.equal(buildAddress({ address: null, city: null, pincode: null }), '');
    });
});
