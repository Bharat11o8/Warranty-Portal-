import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { describeMessage, describeMessages, type MessageContext } from '../leadMessages.js';

const ctx = (over: Partial<MessageContext> = {}): MessageContext => ({
    customerPhone: '7827889388',
    offered: 'stores',
    asm: { name: 'Atul Dwivedi', phone: '9000000001' },
    support: { name: 'Autoform Customer Support', phone: '9000000002' },
    contacts: new Map([['9810046085', { name: 'CAR PLUS - NOIDA', kind: 'store' as const }]]),
    ...over,
});
const msg = (template: string, to: string, at = '2026-09-24T11:38:57Z') =>
    ({ template_name: template, recipient_phone: to, status: 'read', error_message: null, created_at: at, updated_at: null });

describe('describeMessage — the lead\'s WhatsApp history', () => {
    test('what the locator said to the customer depends on what it offered', () => {
        assert.equal(describeMessage(msg('session:InteractiveList', '+917827889388'), ctx()).what, 'List of nearby stores to pick from');
        assert.equal(describeMessage(msg('session:Text', '+917827889388'), ctx()).what, 'Details of the store they picked');
        assert.equal(describeMessage(msg('session:Text', '+917827889388'), ctx({ offered: 'asm' })).what, "The ASM's contact");
        assert.equal(describeMessage(msg('session:Text', '+917827889388'), ctx({ offered: 'invalid-pincode' })).what, 'Asked for a valid pincode');
        assert.equal(describeMessage(msg('session:InteractiveList', '+917827889388'), ctx({ offered: 'distributor' })).what, 'List of distributors to pick from');
    });

    test('a store alert is named by the store\'s phone', () => {
        const m = describeMessage(msg('af_franchise_lead_transfer', '+91 98100 46085'), ctx());
        assert.deepEqual([m.to, m.toName, m.what], ['store', 'CAR PLUS - NOIDA', 'New lead alert']);
    });

    test('a store alert to the customer\'s own number (a test) is still the store\'s', () => {
        const m = describeMessage(msg('af_franchise_lead_transfer', '+917827889388'), ctx());
        assert.equal(m.to, 'store');
    });

    test('the ASM, and support — including support\'s fallback to the store template', () => {
        assert.deepEqual(
            [describeMessage(msg('af_asm_enquiry_v2', '9000000001'), ctx()).toName, describeMessage(msg('af_asm_enquiry_v2', '9000000001'), ctx()).what],
            ['Atul Dwivedi', 'New enquiry alert'],
        );
        assert.equal(describeMessage(msg('af_support_lead_alert', '9000000002'), ctx()).to, 'support');
        assert.equal(describeMessage(msg('af_franchise_lead_transfer', '+919000000002'), ctx()).to, 'support');
    });

    test('an admin\'s store details, and oldest first', () => {
        const list = describeMessages([
            msg('af_customer_store_details', '7827889388', '2026-09-29T06:50:52Z'),
            msg('session:InteractiveList', '7827889388', '2026-09-24T11:38:00Z'),
        ], ctx());
        assert.deepEqual(list.map(m => m.what), ['List of nearby stores to pick from', 'Store details, sent by an admin']);
    });
});

describe("describeMessage — our chat's questions", () => {
    test('each chat message says what it asked', () => {
        const m = (context: string) => describeMessage({ ...msg('session:Text', '+917827889388'), context }, ctx());
        assert.equal(m('chat:car-question').what, 'Asked which car they have');
        assert.equal(m('chat:pincode-retry').what, 'Asked for the pincode again (not valid)');
        assert.equal(m('chat:gave-up').to, 'customer');
    });
    test('without a chat tag, the locator reply is read as before', () => {
        assert.equal(describeMessage({ ...msg('session:Text', '+917827889388'), context: 'store_locator' }, ctx()).what,
            'Details of the store they picked');
    });
});
