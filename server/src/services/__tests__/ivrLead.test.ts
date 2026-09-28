import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { parseIvrEvent, isMobile, productFromGroup, missedCallReason } from '../ivrLead.js';

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

    test('the caller pressing an option: the agent group is the product', () => {
        const call = parseIvrEvent({
            agentName: 'Agent', app: APP, attemptid: '1790338686.244718.1', cli: '9820306492', event: 'TA',
            group: 'SeatCovers', time: '2026-09-25T17:48:23+05:30', to: '7217014601', uniqueid: '1790338686.244718',
        });
        assert.equal(call?.kind, 'transfer');
        assert.deepEqual(call?.transfer, {
            attemptId: '1790338686.244718.1', group: 'SeatCovers', product: 'Seat Covers',
            agent: 'Agent', to: '7217014601', result: null,
        });
    });

    test('the ring ending: answered or not, and how long the agent talked', () => {
        const call = parseIvrEvent({
            agentName: 'Agent', app: APP, attemptid: '1790338615.244585.1', cli: '9810032411', duration: 17, event: 'TE',
            group: 'SeatCovers', result: 'answered', time: '2026-09-25T17:47:51+05:30', to: '7217014601', uniqueid: '1790338615.244585',
        });
        assert.equal(call?.kind, 'transfer-end');
        assert.equal(call?.transfer?.result, 'answered');
        assert.equal(call?.duration, 17);
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

describe('productFromGroup — the IVR menu: 1 Seat Covers, 2 Mats, 3 Accessories', () => {
    const cases: Array<[string | null, string | null]> = [
        ['SeatCovers', 'Seat Covers'], ['Seat Covers', 'Seat Covers'], ['seat_cover', 'Seat Covers'],
        ['Mats', 'Mats'], ['CarMats', 'Mats'], ['FloorMats', 'Mats'], ['car-mats', 'Mats'],
        ['Accessories', 'Accessories'], ['CarAccessories', 'Accessories'],
        ['default', null], ['', null], [null, null],
    ];
    for (const [group, expected] of cases) {
        test(`${JSON.stringify(group)} -> ${expected}`, () => assert.equal(productFromGroup(group), expected));
    }
});

describe('missedCallReason — whether the caller is waiting on us', () => {
    const call = (...results: (string | undefined)[]) => ({
        transfers: Object.fromEntries(results.map((r, i) => [`a${i}`, r ? { result: r } : { group: 'SeatCovers' }])),
    });

    test('nothing has reached an agent yet', () => assert.equal(missedCallReason({ c1: call(undefined) }), null));
    test('every ring went unanswered', () => assert.match(missedCallReason({ c1: call('noanswer') })!, /Missed call/));
    test('answered on any call clears it', () => {
        assert.equal(missedCallReason({ c1: call('noanswer'), c2: call('answered') }), null);
    });
    test('a call with no transfers at all', () => assert.equal(missedCallReason({ c1: {} }), null));
});

describe('isMobile', () => {
    test('a 10-digit mobile', () => assert.equal(isMobile('9820306492'), true));
    test('with a country code', () => assert.equal(isMobile('919820306492'), true));
    test('a landline or trunk number from the IVR is not', () => assert.equal(isMobile('1409800269'), false));
});
