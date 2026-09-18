import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
    serialsToCheck,
    pickSerialIssuedElsewhere,
    type IssuedSerialRow,
} from '../ppfSerialOwnership.js';

/**
 * A serial an admin issued to one store must not be usable at another.
 *
 * The QR flow is open to anyone holding the link, so a number copied off
 * somebody else's paperwork would otherwise register a warranty against a roll
 * that store never received. Every case below was first run against the real
 * ppf_serials table; they are kept here so the rule survives without one.
 */

const row = (serial: string, store: string | null): IssuedSerialRow =>
    ({ serial_number: serial, store_code: store });

describe('pickSerialIssuedElsewhere', () => {
    test('a serial issued to this store is allowed', () => {
        assert.equal(
            pickSerialIssuedElsewhere([row('20260917FAB064_1', 'FAB064')], 'FAB064'),
            null
        );
    });

    test('a serial issued to another store is named', () => {
        assert.equal(
            pickSerialIssuedElsewhere([row('20260917FAB064_1', 'FAB064')], 'FAB999'),
            '20260917FAB064_1'
        );
    });

    // The code is printed on paperwork and retyped; case is not ownership.
    test('the store code is matched case-insensitively', () => {
        assert.equal(
            pickSerialIssuedElsewhere([row('20260917fab064_1', 'fab064')], 'FAB064'),
            null
        );
        assert.equal(
            pickSerialIssuedElsewhere([row('X1', '  FAB064  ')], 'fab064'),
            null
        );
    });

    /*
     * Installers typed their own serials long before any were issued. A number
     * the admin never handed out has no owner to disagree with, so it never
     * reaches this function — the query returns no row for it.
     */
    test('serials nobody issued produce no rows, so nothing is refused', () => {
        assert.equal(pickSerialIssuedElsewhere([], 'FAB064'), null);
    });

    test('one stranger among several of our own is caught', () => {
        const rows = [
            row('20260917FAB064_1', 'FAB064'),
            row('20260917FAB064_2', 'FAB064'),
            row('20260101FAB999_5', 'FAB999'),
        ];
        assert.equal(pickSerialIssuedElsewhere(rows, 'FAB064'), '20260101FAB999_5');
    });

    // An issued row with no owner cannot be claimed by the store in front of it.
    test('an issued serial with no store code is refused', () => {
        assert.equal(pickSerialIssuedElsewhere([row('X1', null)], 'FAB064'), 'X1');
        assert.equal(pickSerialIssuedElsewhere([row('X2', '')], 'FAB064'), 'X2');
    });

    test('the first offender is reported, not the last', () => {
        const rows = [row('A', 'OTHER1'), row('B', 'OTHER2')];
        assert.equal(pickSerialIssuedElsewhere(rows, 'FAB064'), 'A');
    });
});

describe('serialsToCheck', () => {
    test('trims, drops blanks, and collapses duplicates', () => {
        assert.deepEqual(
            serialsToCheck(['  A1  ', 'A1', '', '   ', 'B2']),
            ['A1', 'B2']
        );
    });

    test('nothing to look up when no serial was entered', () => {
        assert.deepEqual(serialsToCheck([]), []);
        assert.deepEqual(serialsToCheck(['', '  ']), []);
    });

    // Anything unusable is skipped rather than sent to the database as a NULL.
    test('survives values that are not strings', () => {
        assert.deepEqual(serialsToCheck([null as any, undefined as any, 'A1']), ['A1']);
    });
});
