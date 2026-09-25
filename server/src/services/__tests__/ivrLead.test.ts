import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { parseIvrEvent, isMobile } from '../ivrLead.js';

/** The events below are real ones from the IVR's first calls, 25 Sept 2026. */

const APP = 'f815924d-ffdf-4081-ac62-7aad98c422a9';

describe('parseIvrEvent', () => {
    test('a call starting', () => {
        assert.deepEqual(
            parseIvrEvent({ app: APP, cli: '9820306492', event: 'IN', time: '2026-09-25T16:32:34+05:30', uniqueid: '1790334154.234406' }),
            { callId: '1790334154.234406', phone: '9820306492', kind: 'start', duration: null, at: '2026-09-25T16:32:34+05:30' },
        );
    });

    test('the hang-up carries the length of the call', () => {
        const call = parseIvrEvent({ app: APP, cli: '9820306492', duration: 56, event: 'H', time: '2026-09-25T16:33:32+05:30', uniqueid: '1790334154.234406' });
        assert.equal(call?.kind, 'end');
        assert.equal(call?.duration, 56);
    });

    test('a form-encoded duration arrives as text and is still read', () => {
        assert.equal(parseIvrEvent({ cli: '9820306492', duration: '20', event: 'H', uniqueid: 'x' })?.duration, 20);
    });

    test('an event we do not know is kept apart, not filed as a call', () => {
        assert.equal(parseIvrEvent({ cli: '9820306492', event: 'DTMF', uniqueid: 'x' })?.kind, 'other');
    });

    test('no caller or no call id means nothing to file', () => {
        assert.equal(parseIvrEvent({ event: 'IN', uniqueid: 'x' }), null);
        assert.equal(parseIvrEvent({ cli: '9820306492', event: 'IN' }), null);
        assert.equal(parseIvrEvent(null), null);
    });
});

describe('isMobile', () => {
    test('a 10-digit mobile', () => assert.equal(isMobile('9820306492'), true));
    test('with a country code', () => assert.equal(isMobile('919820306492'), true));
    test('a landline or trunk number from the IVR is not', () => assert.equal(isMobile('1409800269'), false));
});
