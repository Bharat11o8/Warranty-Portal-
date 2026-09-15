import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { parseLeadForm } from '../instagramLeadParser.js';
import { normaliseProduct } from '../productMatch.js';

/**
 * A false positive here routes an ordinary "hi" straight past the question
 * flow and sends an ASM an enquiry with no area. A false negative loses a paid
 * ad lead. The messages below are real ones, copied verbatim.
 */

describe('parseLeadForm — real messages', () => {
    test('reads a complete lead form', () => {
        const lead = parseLeadForm(
            `Hello! I filled in your form and would like to know more about your business.

For which car do you need the seat cover?: Verna Sedan
Full name: Kuldeep Sharma
Phone number: +917307388011
City: Mohali
Can you share the car model year?: 2024`
        );

        assert.equal(lead?.name, 'Kuldeep Sharma');
        assert.equal(lead?.city, 'Mohali');
        assert.equal(lead?.car, 'Verna Sedan');
        assert.equal(lead?.product, 'Seat Covers');
        assert.equal(lead?.phone, '+917307388011');
    });

    test('accepts "filled out", the other wording Meta sends', () => {
        // Both appear in real messages; only "filled in" was handled at first,
        // which silently dropped two of three leads.
        const lead = parseLeadForm(
            `Hello! I filled out your form and would like to know more about your business.

Full name: Mangesh Taware
City: Pune
For which car do you need the seat cover?: maruti swift`
        );
        assert.equal(lead?.name, 'Mangesh Taware');
        assert.equal(lead?.city, 'Pune');
    });

    test('finds the marker when text precedes the greeting', () => {
        // One real message opened with the sender's own name.
        const lead = parseLeadForm(
            `Gyan Prakash Dubey Hello! I filled out your form and would like to know more about your business.

Full name: gyanprakeshmdubey
City: Ahemdabadahemdabad .gujrat.`
        );
        assert.equal(lead?.city, 'Ahemdabadahemdabad .gujrat.');
    });

    test('field order does not matter', () => {
        const lead = parseLeadForm(
            `Hello! I filled in your form and would like to know more about your business.

City: Gurgaon
Can you share the car model year?: 2020-2023
Full name: Shekhar Kapoor
For which car do you need the seat cover?: Hatchback`
        );
        assert.equal(lead?.name, 'Shekhar Kapoor');
        assert.equal(lead?.city, 'Gurgaon');
        assert.equal(lead?.car, 'Hatchback');
    });
});

describe('parseLeadForm — the year is not the car', () => {
    test('"car model year" does not fill the car field', () => {
        const lead = parseLeadForm(
            `Hello! I filled in your form and would like to know more about your business.

Can you share the car model year?: 2020
For which car do you need the seat cover?: Creta
City: Delhi`
        );
        assert.equal(lead?.car, 'Creta');
    });

    test('the year is kept as an unmapped field rather than dropped', () => {
        const lead = parseLeadForm(
            `Hello! I filled in your form and would like to know more about your business.

City: Delhi
Can you share the car model year?: 2020`
        );
        assert.deepEqual(Object.keys(lead?.unmapped ?? {}), ['Can you share the car model year']);
    });
});

describe('parseLeadForm — the product comes from the question', () => {
    const cases: Array<[string, string | null]> = [
        ['For which car do you need the seat cover?: Swift', 'Seat Covers'],
        ['For which car do you need the car mats?: Swift', 'Mats'],
        ['Which accessories do you need?: Lights', 'Accessories'],
    ];

    for (const [line, expected] of cases) {
        test(`"${line.slice(0, 40)}…" -> ${expected}`, () => {
            const lead = parseLeadForm(
                `Hello! I filled in your form and would like to know more about your business.\n\n${line}\nCity: Pune`
            );
            assert.equal(lead?.product, expected);
        });
    }
});

describe('parseLeadForm — label wording can vary', () => {
    const cases: Array<[string, keyof NonNullable<ReturnType<typeof parseLeadForm>>, string]> = [
        ['Which city are you in?: Jaipur', 'city', 'Jaipur'],
        ['Location: Indore', 'city', 'Indore'],
        ['Your name: Amit', 'name', 'Amit'],
        ['Mobile number: 9812345678', 'phone', '9812345678'],
    ];

    for (const [line, field, expected] of cases) {
        test(`"${line}" fills ${String(field)}`, () => {
            const lead = parseLeadForm(
                `Hello! I filled in your form and would like to know more about your business.\n\n${line}`
            );
            assert.equal(lead?.[field], expected);
        });
    }
});

describe('parseLeadForm — ordinary messages fall through', () => {
    /*
     * Checked against all 181 message_received events we had recorded: not one
     * was a false positive. These are the shapes that matter.
     */
    const notForms = [
        'hi',
        'hello',
        'Approve Installation',
        'None',
        'Same design for swift 24 IH',
        'I want to fill your form',        // similar words, not the marker
        'Hello! I filled in the form',      // "the", not "your"
        '',
    ];

    for (const message of notForms) {
        test(`"${message}" is not a lead form`, () => {
            assert.equal(parseLeadForm(message), null);
        });
    }
});

describe('parseLeadForm — whitespace and formatting', () => {
    test('handles CRLF line endings', () => {
        const lead = parseLeadForm(
            'Hello! I filled in your form and would like to know more about your business.\r\n\r\nCity: Kochi\r\n'
        );
        assert.equal(lead?.city, 'Kochi');
    });

    test('handles a missing space after the colon', () => {
        const lead = parseLeadForm(
            'Hello! I filled in your form and would like to know more about your business.\n\nCity:Mumbai'
        );
        assert.equal(lead?.city, 'Mumbai');
    });

    test('skips a label with no value', () => {
        const lead = parseLeadForm(
            'Hello! I filled in your form and would like to know more about your business.\n\nCity: \nLocation: Surat'
        );
        assert.equal(lead?.city, 'Surat');
    });
});

describe('normaliseProduct', () => {
    const cases: Array<[string | null, string | null]> = [
        // The button labels, exactly as the workflow sends them.
        ['Car Seat Covers', 'Seat Covers'],
        ['Car Mats', 'Mats'],
        ['Car Accessories', 'Accessories'],

        // Typed instead of tapped.
        ['seat cover', 'Seat Covers'],
        ['seatcover', 'Seat Covers'],
        ['Seat-Cover', 'Seat Covers'],
        ['floor mats', 'Mats'],
        ['accessory', 'Accessories'],
        ['i want seat covers for my swift', 'Seat Covers'],

        // Seat covers win over mats when both appear: "car seat cover mat" is
        // a seat cover enquiry.
        ['car seat cover mat', 'Seat Covers'],

        // Nothing recognisable stays null rather than being guessed into a
        // line, which would quietly inflate that product's numbers.
        ['accident claim', null],
        ['hi', null],
        ['Delhi', null],
        ['', null],
        [null, null],
    ];

    for (const [input, expected] of cases) {
        test(`${JSON.stringify(input)} -> ${expected}`, () => {
            assert.equal(normaliseProduct(input), expected);
        });
    }
});
