import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { leadRouting, notifiedIds, leadPincode, areaText, leadStage, type RoutingLookups } from '../leadRouting.js';

const look = (over: Partial<RoutingLookups> = {}): RoutingLookups => ({
    stores: new Map([
        ['s1', { name: 'Autoform Brand Store', phone: '7827889388' }],
        ['s2', { name: 'CAR PLUS - NOIDA', phone: '+91 98100 46085' }],
    ]),
    distributors: new Map([['7', { name: 'Delhi Distributor', phone: '9999900000' }]]),
    support: { name: 'Autoform Customer Support', phone: '8888800000' },
    alerts: [],
    ...over,
});

const lead = (locator: object, extra: object = {}) => ({ raw_payload: JSON.stringify({ locator }), ...extra });

describe('leadRouting — who a store-locator lead went to', () => {
    test('the stores the customer picked, each with its own delivery', () => {
        const r = leadRouting(
            lead({ offered: 'stores', count: 5, reply: 'sent', notified: ['store:s1', 'store:s2'] }),
            look({ alerts: [{ phone: '+917827889388', status: 'read' }, { phone: '+919810046085', status: 'delivered' }] }),
        )!;
        assert.equal(r.outcome, 'stores');
        assert.equal(r.offered, 5);
        assert.deepEqual(r.recipients.map(x => [x.kind, x.name, x.delivery]), [
            ['store', 'Autoform Brand Store', 'read'],
            ['store', 'CAR PLUS - NOIDA', 'delivered'],
        ]);
    });

    test('a retry after a failure counts, not the failure', () => {
        const r = leadRouting(
            lead({ offered: 'stores', notified: ['store:s1'] }),
            look({ alerts: [{ phone: '7827889388', status: 'failed' }, { phone: '+917827889388', status: 'read' }] }),
        )!;
        assert.equal(r.recipients[0].delivery, 'read');
    });

    test('stores offered, nothing picked yet', () => {
        const r = leadRouting(lead({ offered: 'stores', count: 3, reply: 'sent' }), look())!;
        assert.equal(r.recipients.length, 0);
        assert.equal(r.pickedOnly, null);
        assert.equal(r.offered, 3);
    });

    test('picked while not live: the store was never alerted', () => {
        const r = leadRouting(
            lead({ offered: 'stores', reply: 'held' }, { store_sent_by: 'customer', store_name: 'Autoform Brand Store' }),
            look(),
        )!;
        assert.equal(r.held, true);
        assert.equal(r.pickedOnly, 'Autoform Brand Store');
    });

    test('an admin sending a store is not the customer\'s pick', () => {
        const r = leadRouting(
            lead({ offered: 'stores' }, { store_sent_by: 'admin-uuid', store_name: 'CAR DEC' }),
            look(),
        )!;
        assert.equal(r.pickedOnly, null);
    });

    test('a distributor, and customer support', () => {
        const d = leadRouting(lead({ offered: 'distributor', notified: ['distributor:7'] }),
            look({ alerts: [{ phone: '9999900000', status: 'sent' }] }))!;
        assert.deepEqual([d.recipients[0].kind, d.recipients[0].name, d.recipients[0].delivery], ['distributor', 'Delhi Distributor', 'sent']);

        const s = leadRouting(lead({ offered: 'support', notified: ['support'] }), look())!;
        assert.deepEqual([s.recipients[0].kind, s.recipients[0].name, s.recipients[0].delivery], ['support', 'Autoform Customer Support', null]);
    });

    test('a store since removed still shows it was alerted', () => {
        const r = leadRouting(lead({ offered: 'stores', notified: ['store:gone'] }), look())!;
        assert.equal(r.recipients[0].name, 'Store (no longer listed)');
    });

    test('not a locator lead', () => {
        assert.equal(leadRouting({ raw_payload: '{"ivr":{}}' }, look()), null);
        assert.equal(leadRouting({ raw_payload: null }, look()), null);
    });

    test('notifiedIds', () => {
        assert.deepEqual(
            notifiedIds({ locator: { notified: ['store:a', 'support', 'distributor:7', 'store:b'] } }),
            { stores: ['a', 'b'], distributors: ['7'] },
        );
    });
});

describe('leadPincode and areaText — the Pincode and Area / State columns', () => {
    test('the saved pincode first, then one in the area', () => {
        assert.equal(leadPincode('{"pincode":"110085"}', 'Rohini Delhi'), '110085');
        assert.equal(leadPincode({ locator: {} }, '201301'), '201301');
        assert.equal(leadPincode(null, 'Rohini Delhi 110 085'), '110085');
        assert.equal(leadPincode({ pincode: 'near bus stand' }, 'Sirsa haryana'), null);
        assert.equal(leadPincode('{bad', '463106'), '463106');
    });

    test('an area that is only a pincode is not an area', () => {
        assert.equal(areaText('201301'), null);
        assert.equal(areaText(' 110 085 '), null);
        assert.equal(areaText('Rohini Delhi'), 'Rohini Delhi');
        assert.equal(areaText('Rohini 110085'), 'Rohini 110085');
        assert.equal(areaText(''), null);
    });
});

describe('leadStage — where a lead stands, in plain words', () => {
    const routing = (over: object) => ({ outcome: 'stores', offered: 5, held: false, recipients: [], pickedOnly: null, ...over }) as any;
    const store = (delivery: string | null) => ({ kind: 'store', id: 's1', name: 'Autoform Brand Store', delivery });

    test('an IVR lead waiting for the auditor is not forwarded — not a failure', () => {
        assert.equal(leadStage({ source: 'ivr', status: 'unmatched', routing: null }), 'not-forwarded');
    });
    test('an IVR lead the auditor sent a store is forwarded; a failed store alert is not', () => {
        const ivr = { source: 'ivr', status: 'sent', routing: null, store_name: 'X', store_sent_by: 'admin-1' };
        assert.equal(leadStage({ ...ivr, store_alert_status: 'read' }), 'forwarded');
        assert.equal(leadStage({ ...ivr, store_alert_status: 'failed' }), 'failed');
    });
    test('WhatsApp: picked and alerted, still choosing, no pincode', () => {
        assert.equal(leadStage({ source: 'whatsapp', status: 'sent', routing: routing({ recipients: [store('read')] }) }), 'forwarded');
        assert.equal(leadStage({ source: 'whatsapp', status: 'matched', routing: routing({}) }), 'choosing');
        assert.equal(leadStage({ source: 'whatsapp', status: 'unmatched', routing: routing({ outcome: 'invalid-pincode' }) }), 'no-pincode');
    });
    test('a store the customer picked in test mode was never alerted', () => {
        assert.equal(leadStage({ source: 'whatsapp', status: 'matched', routing: routing({ pickedOnly: 'X' }) }), 'not-forwarded');
    });
    test('the ASM: forwarded, or failed', () => {
        const asm = { source: 'whatsapp', routing: routing({ outcome: 'asm' }), asm_name: 'Atul' };
        assert.equal(leadStage({ ...asm, status: 'sent', delivery_status: 'read' }), 'forwarded');
        assert.equal(leadStage({ ...asm, status: 'failed', delivery_status: 'failed' }), 'failed');
    });
    test('a repeat enquiry', () => {
        assert.equal(leadStage({ source: 'whatsapp', status: 'throttled', routing: null, asm_name: 'Atul' }), 'repeat');
    });
    test('an old WhatsApp enquiry no ASM covered', () => {
        assert.equal(leadStage({ source: 'whatsapp', status: 'unmatched', routing: null }), 'not-forwarded');
    });
});

describe('leadStage — a customer still answering our chat', () => {
    const now = Date.parse('2026-09-29T12:00:00Z');
    const chat = (stage: string, at: string) => ({
        source: 'whatsapp', status: 'unmatched', routing: null,
        raw_payload: JSON.stringify({ locator: { session: { stage, tries: 0, at } } }),
    });
    test('answering while the chat is live', () => {
        assert.equal(leadStage(chat('car', '2026-09-29T11:50:00Z'), now), 'answering');
        assert.equal(leadStage(chat('pincode', '2026-09-29T11:59:00Z'), now), 'answering');
    });
    test('gone quiet, or ended: not forwarded, the auditor calls', () => {
        assert.equal(leadStage(chat('car', '2026-09-29T10:00:00Z'), now), 'not-forwarded');
        assert.equal(leadStage(chat('ended', '2026-09-29T11:59:00Z'), now), 'not-forwarded');
    });
});
