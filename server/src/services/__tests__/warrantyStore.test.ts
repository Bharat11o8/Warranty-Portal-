import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { pickStoreId, storeEmailOf, ownerStoreIdOf } from '../warrantyStoreRules.js';

/**
 * Which store a warranty belongs to.
 *
 * The failure to guard against is a warranty filed under the wrong store: it
 * then shows in that store's dashboard, its verification WhatsApp goes to that
 * store's owner, and its reminders chase the wrong dealer. Names never decide
 * it — two stores can share one — so none of these inputs is a name.
 */

describe('pickStoreId', () => {
    test('the installer decides', () => {
        assert.deepEqual(pickStoreId({ manpowerStoreId: 'A', emailStoreId: 'A', submitterStoreId: null }), { ok: true, storeId: 'A' });
    });

    test('the owner sentinel counts as the installer', () => {
        assert.deepEqual(pickStoreId({ ownerStoreId: 'B', emailStoreId: 'B' }), { ok: true, storeId: 'B' });
    });

    test('email alone is enough when no installer was picked (public QR, owner)', () => {
        assert.deepEqual(pickStoreId({ emailStoreId: 'C' }), { ok: true, storeId: 'C' });
    });

    test('an installer whose store the email cannot name still decides', () => {
        assert.deepEqual(pickStoreId({ manpowerStoreId: 'A', emailStoreId: null }), { ok: true, storeId: 'A' });
    });

    // The Kalol/Patan case: a form that swapped in another store's email.
    test('installer and email naming different stores is refused, not guessed', () => {
        const r = pickStoreId({ manpowerStoreId: 'KALOL', emailStoreId: 'PATAN' });
        assert.equal(r.ok, false);
    });

    test('the QR page store code names the store when nothing else does', () => {
        assert.deepEqual(pickStoreId({ codeStoreId: 'Q' }), { ok: true, storeId: 'Q' });
    });

    test('QR page and form email naming different stores is refused', () => {
        assert.equal(pickStoreId({ codeStoreId: 'Q', emailStoreId: 'E' }).ok, false);
    });

    test('an installer from another store than the QR page is refused', () => {
        assert.equal(pickStoreId({ manpowerStoreId: 'A', codeStoreId: 'Q' }).ok, false);
    });

    test('a franchise submitting from its own dashboard is its own store', () => {
        assert.deepEqual(pickStoreId({ submitterStoreId: 'D' }), { ok: true, storeId: 'D' });
    });

    test('the installer outranks the submitting account', () => {
        assert.deepEqual(pickStoreId({ manpowerStoreId: 'A', submitterStoreId: 'D' }), { ok: true, storeId: 'A' });
    });

    test('nothing known → no store, not a guess', () => {
        assert.deepEqual(pickStoreId({}), { ok: true, storeId: null });
    });
});

describe('storeEmailOf', () => {
    test('plain email', () => assert.equal(storeEmailOf('a@b.com'), 'a@b.com'));
    test('EV form "email | phone"', () => assert.equal(storeEmailOf(' a@b.com | 9876543210'), 'a@b.com'));
    test('empty and missing', () => {
        assert.equal(storeEmailOf(''), null);
        assert.equal(storeEmailOf(null), null);
        assert.equal(storeEmailOf(undefined), null);
    });
});

describe('ownerStoreIdOf', () => {
    test('owner-<id>', () => assert.equal(ownerStoreIdOf('owner-7e0370d8-1a56'), '7e0370d8-1a56'));
    test('bare owner carries no store', () => assert.equal(ownerStoreIdOf('owner'), null));
    test('a manpower id is not an owner', () => assert.equal(ownerStoreIdOf('aa238cf4-61b3'), null));
    test('missing', () => assert.equal(ownerStoreIdOf(null), null));
});
