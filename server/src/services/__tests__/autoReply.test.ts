import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { isAutoReply, hasAutoReplyContent } from '../autoReply.js';

/**
 * The first case is the real one: eleven leads from a single number in three
 * minutes, every field holding the same line from an auto-responder app.
 */

describe('isAutoReply — responses no person typed', () => {
    const auto = [
        '*Auto Reply* \nHey there! I am using Whatauto App.',
        'Auto Reply: I will get back to you soon',
        '*AUTO-REPLY* Currently away',
        'This is an automated message, please do not reply',
        'Sent using WhatsAuto',
        'I am currently unavailable, will revert shortly',
        'Automatic reply: Out of office',
    ];

    for (const text of auto) {
        test(JSON.stringify(text.slice(0, 40)), () => {
            assert.equal(isAutoReply(text), true);
        });
    }
});

describe('isAutoReply — real enquiries are never refused', () => {
    /*
     * A false positive silently drops a genuine enquiry, so these matter more
     * than the cases above: an admin can delete a junk row, but nobody can
     * recover a customer who was never recorded.
     */
    const real = [
        'Jaipur',
        'Mumbai, Maharashtra',
        'I want ppf for my Thar',
        'Kya rate hai bhai',
        'automatic transmission car ke liye chahiye',
        'Auto parts market, Karol Bagh',
        'Reply me fast',
        'Autonagar Vijayawada',
        '',
        '   ',
    ];

    for (const text of real) {
        test(JSON.stringify(text.slice(0, 40)) || 'empty', () => {
            assert.equal(isAutoReply(text), false);
        });
    }

    test('null and undefined are not auto-replies', () => {
        assert.equal(isAutoReply(null), false);
        assert.equal(isAutoReply(undefined), false);
    });
});

describe('hasAutoReplyContent', () => {
    // The responder's line lands in whichever field the workflow was filling.
    test('catches it in any field', () => {
        assert.equal(hasAutoReplyContent(['Jaipur', '*Auto Reply* Hey', null]), true);
        assert.equal(hasAutoReplyContent(['*Auto Reply* Hey', 'Thar', null]), true);
    });

    test('a genuine enquiry passes', () => {
        assert.equal(hasAutoReplyContent(['Jaipur', 'Thar', 'Ravi']), false);
        assert.equal(hasAutoReplyContent([null, null, null]), false);
        assert.equal(hasAutoReplyContent([]), false);
    });
});
