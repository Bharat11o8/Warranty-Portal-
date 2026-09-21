import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { leadKey, isSameLead, findMatchingLead, phoneKey, fieldKey } from '../leadIdentity.js';

/**
 * The rule: change any part of the enquiry and it is a new lead.
 *
 * Every combination below is enumerated rather than sampled, because the cases
 * that matter are the ones nobody thinks to write by hand — the same number
 * with a different car, the same car in a different city.
 */

const BASE = { phone: '9876543210', area: 'Jaipur', car: 'Thar', product: 'ppf' };

describe('every permutation of the four fields', () => {
    const variant = {
        phone: '9000000001',
        area: 'Mumbai',
        car: 'Creta',
        product: 'seat cover',
    } as const;

    const fields = ['phone', 'area', 'car', 'product'] as const;

    // 16 combinations: each field either matches the base or does not.
    for (let mask = 0; mask < 16; mask++) {
        const lead: Record<string, string> = { ...BASE };
        const changed: string[] = [];

        fields.forEach((f, i) => {
            if (mask & (1 << i)) {
                lead[f] = variant[f];
                changed.push(f);
            }
        });

        const label = changed.length === 0
            ? 'nothing changed — same lead'
            : `${changed.join(' + ')} changed — new lead`;

        test(label, () => {
            assert.equal(isSameLead(BASE, lead), changed.length === 0);
        });
    }
});

describe('the cases this rule exists for', () => {
    // "suppose number x comes again but with different area, vehicle"
    test('same number, different vehicle, is a new lead', () => {
        assert.equal(isSameLead(BASE, { ...BASE, car: 'Scorpio' }), false);
    });

    test('same number, different area, is a new lead', () => {
        assert.equal(isSameLead(BASE, { ...BASE, area: 'Udaipur' }), false);
    });

    test('same number, different product, is a new lead', () => {
        assert.equal(isSameLead(BASE, { ...BASE, product: 'seat cover' }), false);
    });

    test('the identical enquiry twice is one lead', () => {
        assert.equal(isSameLead(BASE, { ...BASE }), true);
    });
});

describe('the same answer written differently is still the same answer', () => {
    test('case and spacing do not make a new lead', () => {
        assert.equal(isSameLead(BASE, {
            phone: '9876543210', area: ' JAIPUR ', car: 'thar', product: 'PPF',
        }), true);
    });

    test('punctuation does not make a new lead', () => {
        assert.equal(isSameLead(
            { ...BASE, area: 'Jaipur, Rajasthan' },
            { ...BASE, area: 'jaipur rajasthan' },
        ), true);
    });

    // The sheet, the form and a typed reply all write a number differently.
    test('a number written any way is the same number', () => {
        assert.equal(isSameLead(BASE, { ...BASE, phone: '+91 98765 43210' }), true);
        assert.equal(isSameLead(BASE, { ...BASE, phone: '919876543210' }), true);
        assert.equal(isSameLead(BASE, { ...BASE, phone: '098765-43210' }), true);
    });

    /* Not fuzzy on purpose: a trim is not a different car to a person, but
       treating them as one would swallow a genuine second enquiry. */
    test('a fuller vehicle name is a different vehicle', () => {
        assert.equal(isSameLead(BASE, { ...BASE, car: 'Thar LX' }), false);
    });
});

describe('missing fields', () => {
    // A blank is part of the key, never a wildcard.
    test('no car recorded is not the same as a car recorded', () => {
        assert.equal(isSameLead({ ...BASE, car: null }, BASE), false);
    });

    test('two leads with nothing but a phone match each other', () => {
        const bare = { phone: '9876543210' };
        assert.equal(isSameLead(bare, { phone: '9876543210' }), true);
        assert.equal(isSameLead(bare, { phone: '9876543210', area: null, car: null, product: null }), true);
    });

    test('undefined and null and empty read alike', () => {
        assert.equal(leadKey({ phone: '9876543210', area: '' }),
                     leadKey({ phone: '9876543210', area: null }));
    });
});

describe('findMatchingLead', () => {
    const existing = [
        { id: 'a', phone: '9876543210', area: 'Jaipur', car: 'Thar', product: 'ppf' },
        { id: 'b', phone: '9876543210', area: 'Jaipur', car: 'Creta', product: 'ppf' },
    ];

    test('finds the row this repeats', () => {
        assert.equal(findMatchingLead({ ...BASE }, existing)?.id, 'a');
        assert.equal(findMatchingLead({ ...BASE, car: 'Creta' }, existing)?.id, 'b');
    });

    test('a third vehicle on the same number matches nothing', () => {
        assert.equal(findMatchingLead({ ...BASE, car: 'Nexon' }, existing), null);
    });

    test('nothing to match against', () => {
        assert.equal(findMatchingLead(BASE, []), null);
    });
});

describe('the normalisers themselves', () => {
    test('phoneKey takes the last ten digits', () => {
        assert.equal(phoneKey('+91 98765 43210'), '9876543210');
        assert.equal(phoneKey('919876543210'), '9876543210');
        assert.equal(phoneKey(null), '');
    });

    test('fieldKey strips everything but letters and digits', () => {
        assert.equal(fieldKey('  Jaipur, Rajasthan '), 'jaipurrajasthan');
        assert.equal(fieldKey(null), '');
    });
});
