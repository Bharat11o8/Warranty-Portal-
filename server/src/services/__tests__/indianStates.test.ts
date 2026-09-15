import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { findState, canonicalState, INDIAN_STATES } from '../indianStates.js';

/**
 * The state decides which ASM receives an enquiry, so a wrong answer here sends
 * a customer's details across the country. Every spelling below is one our own
 * data actually contains, or one a customer actually typed.
 */

describe('findState — spellings our database really holds', () => {
    // vendor_details held 29 distinct spellings for about 25 states.
    const cases: Array<[string, string]> = [
        ['Chattisgarh', 'Chhattisgarh'],
        ['CHHATTISGARH', 'Chhattisgarh'],
        ['Maharastra', 'Maharashtra'],
        ['Madhay pradesh  ', 'Madhya Pradesh'],
        ['Utter pradesh  ', 'Uttar Pradesh'],
        ['J&K', 'Jammu & Kashmir'],
        ['Jammu  Kashmir', 'Jammu & Kashmir'],
        ['Jammu and Kashmir', 'Jammu & Kashmir'],
        ['TAMILNADU', 'Tamil Nadu'],
        ['New Delhi', 'Delhi'],
        ['delhi', 'Delhi'],
        ['ODISHA', 'Odisha'],
        ['PUDUCHERRY', 'Puducherry'],
    ];

    for (const [input, expected] of cases) {
        test(`"${input}" -> ${expected}`, () => {
            assert.equal(findState(input)?.state, expected);
        });
    }
});

describe('findState — what customers actually type', () => {
    const cases: Array<[string, string]> = [
        ['Rohini Delhi', 'Delhi'],
        ['Rohini, delhi', 'Delhi'],
        ['mangol puri delhi', 'Delhi'],
        ['pitampura delhi', 'Delhi'],
        ['Delhi 110085', 'Delhi'],
        ['I am from dehli', 'Delhi'],          // a transposition
        ['Jaipur, Rajasthan', 'Rajasthan'],
        ['Navsari Gujarat', 'Gujarat'],
        ['Karnal, Haryana', 'Haryana'],
        ['noida sector 62', 'Uttar Pradesh'],
        ['Ahemdabadahemdabad .gujrat.', 'Gujarat'],
    ];

    for (const [input, expected] of cases) {
        test(`"${input}" -> ${expected}`, () => {
            assert.equal(findState(input)?.state, expected);
        });
    }
});

describe('findState — a city alone still names its state', () => {
    /*
     * Someone who writes only "Mumbai" has told us the state. Refusing that
     * would queue a perfectly answerable enquiry as unmatched.
     */
    const cases: Array<[string, string]> = [
        ['Mumbai', 'Maharashtra'],
        ['Navi Mumbai', 'Maharashtra'],   // the pair must beat "navi" alone
        ['Pune', 'Maharashtra'],
        ['bangalore', 'Karnataka'],
        ['Kolkata', 'West Bengal'],
        ['Hyderabad', 'Telangana'],
        ['Mohali', 'Punjab'],
        ['Gurgaon', 'Haryana'],
        ['Chennai', 'Tamil Nadu'],
    ];

    for (const [input, expected] of cases) {
        test(`"${input}" -> ${expected}`, () => {
            assert.equal(findState(input)?.state, expected);
        });
    }
});

describe('findState — refuses rather than guesses', () => {
    /*
     * An unmatched enquiry is queued where somebody can see it. A wrongly
     * matched one is sent to the wrong ASM, which nobody sees.
     */
    for (const input of ['', '   ', 'hi', 'hello', 'Approve Installation', 'Car Mats', 'None']) {
        test(`"${input}" matches nothing`, () => {
            assert.equal(findState(input), null);
        });
    }

    test('a two-letter code is never fuzzy-matched', () => {
        // "ap" and "up" are real aliases, but at that length almost any word is
        // one edit away, so only an exact match counts.
        assert.equal(findState('an')?.state ?? null, null);
    });
});

describe('findState — reports how it matched', () => {
    test('an exact spelling reports "exact"', () => {
        assert.equal(findState('Delhi')?.how, 'exact');
    });

    test('a listed misspelling still counts as exact', () => {
        // "Rajastan" is an alias we carry, so it never reaches the typo pass.
        assert.equal(findState('Rajastan')?.how, 'exact');
    });

    test('an unlisted typo reports "fuzzy"', () => {
        const hit = findState('Rajasthann');
        assert.equal(hit?.state, 'Rajasthan');
        assert.equal(hit?.how, 'fuzzy');
    });
});

describe('canonicalState', () => {
    test('normalises a known state', () => {
        assert.equal(canonicalState('Gujrat'), 'Gujarat');
        assert.equal(canonicalState('MAHARASTRA'), 'Maharashtra');
    });

    test('returns the input trimmed when it is not a state we know', () => {
        // An admin may be entering something we have not listed; refusing it
        // outright would be worse than storing it as typed.
        assert.equal(canonicalState('  Somewhere Else  '), 'Somewhere Else');
    });
});

describe('the state table itself', () => {
    test('covers all 28 states and 8 union territories', () => {
        assert.equal(INDIAN_STATES.length, 36);
    });

    test('every canonical name resolves to itself', () => {
        for (const entry of INDIAN_STATES) {
            assert.equal(
                findState(entry.canonical)?.state,
                entry.canonical,
                `${entry.canonical} does not resolve to itself`
            );
        }
    });

    test('no alias is claimed by two different states', () => {
        const owner = new Map<string, string>();
        for (const entry of INDIAN_STATES) {
            for (const alias of entry.aliases) {
                const key = alias.toLowerCase().replace(/[^a-z0-9]+/g, '');
                const existing = owner.get(key);
                assert.equal(
                    existing ?? entry.canonical,
                    entry.canonical,
                    `"${alias}" is claimed by both ${existing} and ${entry.canonical}`
                );
                owner.set(key, entry.canonical);
            }
        }
    });
});
