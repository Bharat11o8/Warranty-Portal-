import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { fieldChanges } from '../profileChanges.js';

/**
 * What a profile edit changed, as the activity log records it.
 *
 * The failure to guard against is a log that cries wolf — every save reporting
 * the GST "changed" from null to "" — so the one change that matters, a phone
 * number moved to another account, is lost among them.
 */
describe('fieldChanges', () => {
    test('records only what differs, as from → to', () => {
        assert.deepEqual(
            fieldChanges(
                { phone_number: '9727826524', store_name: 'UMIYA CAR ACCESSORIES & SPA' },
                { phone_number: '8401104131', store_name: 'UMIYA CAR ACCESSORIES & SPA' }
            ),
            { phone_number: { from: '9727826524', to: '8401104131' } }
        );
    });

    test('an untouched save records nothing', () => {
        assert.deepEqual(fieldChanges({ city: 'KALOL', gst_number: null }, { city: 'KALOL', gst_number: null }), {});
    });

    test('null, blank and whitespace are all "no value"', () => {
        assert.deepEqual(fieldChanges({ gst_number: null, pincode: '' }, { gst_number: '', pincode: '   ' }), {});
    });

    test('surrounding whitespace is not a change', () => {
        assert.deepEqual(fieldChanges({ city: 'Patan' }, { city: ' Patan ' }), {});
    });

    test('clearing a value is a change to null', () => {
        assert.deepEqual(fieldChanges({ address: 'Main Road' }, { address: '' }), { address: { from: 'Main Road', to: null } });
    });

    test('numbers compare as text (a map pin read back as a number)', () => {
        assert.deepEqual(fieldChanges({ latitude: 23.36799953 }, { latitude: '23.36799953' }), {});
        assert.deepEqual(fieldChanges({ latitude: '23.36' }, { latitude: '23.30' }), { latitude: { from: '23.36', to: '23.30' } });
    });

    test('a case change is a change', () => {
        assert.deepEqual(fieldChanges({ store_name: 'Aditya Enterprises' }, { store_name: 'ADITYA ENTERPRISES' }),
            { store_name: { from: 'Aditya Enterprises', to: 'ADITYA ENTERPRISES' } });
    });

    test('only fields in "after" are compared', () => {
        assert.deepEqual(fieldChanges({ city: 'KADI', latitude: '1' }, { city: 'KADI' }), {});
    });
});
