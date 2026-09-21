import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
    diffWarranty,
    diffPhotos,
    diffSubmission,
    normaliseValue,
    summariseChanges,
} from '../warrantyDiff.js';

/**
 * What a resubmission changed.
 *
 * The failure to guard against is a diff that cries wolf: if every save
 * reports a purchase date "change" because one path stored a Date and another
 * an ISO string, the two edits that matter are lost in the noise and nobody
 * reads the record at all.
 */

describe('normaliseValue', () => {
    // The real cause of false positives: the same day, stored two ways.
    test('a Date and its ISO string read alike', () => {
        assert.equal(normaliseValue(new Date('2026-09-14T00:00:00.000Z')), '2026-09-14');
        assert.equal(normaliseValue('2026-09-14T18:30:00.000Z'), '2026-09-14');
        assert.equal(normaliseValue('2026-09-14'), '2026-09-14');
    });

    test('blank, null and undefined are one thing', () => {
        assert.equal(normaliseValue(null), null);
        assert.equal(normaliseValue(undefined), null);
        assert.equal(normaliseValue(''), null);
        assert.equal(normaliseValue('   '), null);
    });

    test('surrounding space is not a change', () => {
        assert.equal(normaliseValue('  Kunal batra  '), 'Kunal batra');
    });

    test('an unreadable date is left as it was written', () => {
        assert.equal(normaliseValue('not a date'), 'not a date');
    });
});

describe('diffWarranty', () => {
    const before = {
        customer_name: 'Kunal batra',
        customer_phone: '9996366055',
        registration_number: 'APPLIED-FOR',
        purchase_date: new Date('2026-09-20T00:00:00.000Z'),
        car_model: null,
    };

    test('names the field that moved', () => {
        const changes = diffWarranty(before, { ...before, customer_name: 'Kunal Batra Jr' });
        assert.deepEqual(changes, {
            'Customer Name': { before: 'Kunal batra', after: 'Kunal Batra Jr' },
        });
    });

    /* The whole point: a resave that changed nothing must report nothing, or
       the record fills with edits nobody made. */
    test('the same date in another shape is not a change', () => {
        assert.deepEqual(diffWarranty(before, { ...before, purchase_date: '2026-09-20' }), {});
        assert.deepEqual(diffWarranty(before, { ...before, purchase_date: '2026-09-20T18:30:00.000Z' }), {});
    });

    test('an identical resubmission reports nothing', () => {
        assert.deepEqual(diffWarranty(before, { ...before }), {});
    });

    test('filling in a field that was empty is a change', () => {
        assert.deepEqual(diffWarranty(before, { ...before, car_model: 'Creta' }), {
            'Vehicle Model': { before: null, after: 'Creta' },
        });
    });

    test('clearing a field is a change', () => {
        assert.deepEqual(diffWarranty(before, { ...before, customer_phone: '' }), {
            'Customer Phone': { before: '9996366055', after: null },
        });
    });

    // A field the caller never sent is one it is not touching.
    test('a field absent from the update is left alone', () => {
        assert.deepEqual(diffWarranty(before, { customer_name: 'Kunal batra' }), {});
    });

    test('several changes at once are all reported', () => {
        const changes = diffWarranty(before, {
            ...before,
            customer_name: 'Kunal Batra',
            registration_number: 'HR-26-AB-1234',
        });
        assert.equal(Object.keys(changes).length, 2);
    });

    // Timestamps and ids move on every save and would bury the real edits.
    test('untracked columns are ignored', () => {
        assert.deepEqual(diffWarranty(
            { ...before, updated_at: '2026-09-01', id: 1 },
            { ...before, updated_at: '2026-09-21', id: 1 },
        ), {});
    });
});

describe('diffPhotos', () => {
    const withPhotos = (photos: Record<string, string>) => ({ photos });

    test('a replaced photo is named, not its filename', () => {
        const changes = diffPhotos(
            withPhotos({ seatCover: 'old_123.jpg' }),
            withPhotos({ seatCover: 'new_456.jpg' }),
        );
        assert.deepEqual(changes, {
            'Seat cover photo': { before: 'previous photo', after: 'replaced' },
        });
    });

    // The commonest correction: the installer forgot one.
    test('a photo that was missing reads as added', () => {
        assert.deepEqual(diffPhotos(withPhotos({}), withPhotos({ warranty: 'inv.jpg' })), {
            'Invoice photo': { before: null, after: 'added' },
        });
    });

    test('an unchanged photo is not reported', () => {
        assert.deepEqual(diffPhotos(
            withPhotos({ seatCover: 'same.jpg', vehicle: 'v.jpg' }),
            withPhotos({ seatCover: 'same.jpg', vehicle: 'v.jpg' }),
        ), {});
    });

    test('product_details arriving as JSON text is read', () => {
        const changes = diffPhotos(
            JSON.stringify({ photos: { lhs: 'a.jpg' } }),
            JSON.stringify({ photos: { lhs: 'b.jpg' } }),
        );
        assert.deepEqual(changes, {
            'Left Hand Side photo': { before: 'previous photo', after: 'replaced' },
        });
    });

    test('missing or unreadable product_details is not a crash', () => {
        assert.deepEqual(diffPhotos(null, null), {});
        assert.deepEqual(diffPhotos('{not json', '{also not}'), {});
        assert.deepEqual(diffPhotos(undefined, withPhotos({})), {});
    });

    test('a photo key we have no name for still reports', () => {
        const changes = diffPhotos(withPhotos({}), withPhotos({ somethingNew: 'x.jpg' }));
        assert.deepEqual(changes, { 'somethingNew photo': { before: null, after: 'added' } });
    });
});

describe('diffSubmission', () => {
    /* One input box means two things: a seat cover carries a pre-printed UID
       and has no serial number, so the label follows the product. */
    test('the identifier is labelled by product type', () => {
        const before = { product_details: { serialNumber: 'OLD1' } };
        const after = { product_details: { serialNumber: 'NEW1' } };

        assert.ok('UID' in diffSubmission(before, after, 'seat-cover'));
        assert.ok('Serial Number' in diffSubmission(before, after, 'ppf'));
    });

    test('fields and photos are reported together', () => {
        const changes = diffSubmission(
            { customer_name: 'Kunal', product_details: { photos: { warranty: 'old.jpg' } } },
            { customer_name: 'Kunal Batra', product_details: { photos: { warranty: 'new.jpg' } } },
            'seat-cover',
        );
        assert.ok('Customer Name' in changes);
        assert.ok('Invoice photo' in changes);
    });

    test('a resubmission that changed nothing reports nothing', () => {
        const same = {
            customer_name: 'Kunal',
            product_details: { photos: { warranty: 'a.jpg' }, serialNumber: 'S1' },
        };
        assert.deepEqual(diffSubmission(same, { ...same }, 'seat-cover'), {});
    });
});

describe('summariseChanges', () => {
    test('names the field when only one moved', () => {
        assert.equal(
            summariseChanges({ 'Invoice photo': { before: null, after: 'added' } }, 'The franchise'),
            'The franchise corrected Invoice photo',
        );
    });

    test('counts them when several did', () => {
        assert.equal(
            summariseChanges({
                'Invoice photo': { before: null, after: 'added' },
                'Customer Name': { before: 'a', after: 'b' },
            }, 'The customer'),
            'The customer corrected 2 details',
        );
    });

    // Worth saying plainly: it was sent back with nothing altered.
    test('says so when nothing changed', () => {
        assert.equal(
            summariseChanges({}, 'The franchise'),
            'The franchise resubmitted this warranty without changing any details',
        );
    });
});
