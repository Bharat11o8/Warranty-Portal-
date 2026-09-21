import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
    readLeadSheet,
    parseSheetRow,
    pickHeader,
    isHeaderRow,
    isTestRow,
} from '../leadSheetParser.js';

/**
 * Every layout below is taken from the real September export, which turned out
 * to be three files concatenated. The cases that matter are the ones a naive
 * reader gets wrong: rows sitting above their own header, and the same field
 * living in different columns between layouts.
 */

/** Long layout: created_time first, blank at index 5, city at 6. */
const HEADER_LONG = [
    'created_time', 'for_which_car_do_you_need_the_seat_cover?',
    'can_you_share_the_car_model_year?', 'full_name', 'phone', '', 'city',
    'id', 'ad_id', 'ad_name', 'adset_id', 'adset_name', 'campaign_id',
    'campaign_name', 'form_id', 'form_name', 'is_organic', 'platform', 'lead_status',
];

/** Short layout: created_time first, city at 5, nothing past 6. */
const HEADER_SHORT = [
    'created_time', 'for_which_car_do_you_need_the_seat_cover?',
    'can_you_share_the_car_model_year?', 'full_name', 'phone', 'city', 'lead_status',
];

/** Id-first layout: "l:<digits>" in column 0, everything shifted. */
const HEADER_ID = [
    'id', 'created_time', 'ad_id', 'ad_name', 'adset_id', 'adset_name',
    'campaign_id', 'campaign_name', 'form_id', 'form_name', 'is_organic',
    'platform', 'for_which_car_do_you_need_the_seat_cover?',
    'can_you_share_the_car_model_year?', 'full_name', 'phone', 'city', 'lead_status',
];

const ROW_LONG = [
    '2026-06-08T09:55:49-05:00', '3xo', 'Ax5', 'Moon Biswas', 'p:+918016602209',
    '', 'Mothabari', '8016602209', '', '', '', '', '', '', '', '', '', '', '',
];

const ROW_SHORT = [
    '2026-07-13T21:41:10-05:00', 'Tata tiago', '2024 oct', 'Kamal Preet',
    'p:+919050696095', 'Rewari', 'CREATED',
];

const ROW_ID = [
    'l:946144057770738', '2026-08-27T13:10:44-05:00', 'f:207895', 'consumer Lead form',
    'as:1202', 'ad set 1', 'c:1202', 'Consumer 2 Leads Campaign', 'f:2078', 'form',
    'false', 'ig', 'Vw virtus', '2025', 'Kevin Mody', 'p:+919408083935',
    'Killa Pardi', 'CREATED',
];

describe('parseSheetRow — each layout reads the same lead', () => {
    test('long layout: city comes from index 6, not the blank at 5', () => {
        const lead = parseSheetRow(ROW_LONG, HEADER_LONG, 2);
        assert.equal(lead.name, 'Moon Biswas');
        assert.equal(lead.city, 'Mothabari');
        assert.equal(lead.car, '3xo');
        assert.equal(lead.createdAt, '2026-06-08T09:55:49-05:00');
    });

    test('short layout: city comes from index 5', () => {
        const lead = parseSheetRow(ROW_SHORT, HEADER_SHORT, 900);
        assert.equal(lead.name, 'Kamal Preet');
        assert.equal(lead.city, 'Rewari');
        assert.equal(lead.car, 'Tata tiago');
    });

    test('id-first layout: the date is in column 1, not column 0', () => {
        const lead = parseSheetRow(ROW_ID, HEADER_ID, 3200);
        assert.equal(lead.createdAt, '2026-08-27T13:10:44-05:00');
        assert.equal(lead.leadId, 'l:946144057770738');
        assert.equal(lead.city, 'Killa Pardi');
        assert.equal(lead.platform, 'ig');
    });

    // Meta writes "p:+919876543210"; the prefix is the export's, not the number's.
    test('the p: prefix is stripped from the phone', () => {
        assert.equal(parseSheetRow(ROW_LONG, HEADER_LONG, 2).phone, '+918016602209');
        assert.equal(parseSheetRow(ROW_ID, HEADER_ID, 3200).phone, '+919408083935');
    });

    /* The campaign names the product inside the question, and the sheet writes
       that question with underscores where a message would have spaces. */
    test('the product is read from the column heading', () => {
        assert.equal(parseSheetRow(ROW_LONG, HEADER_LONG, 2).product, 'Seat Covers');
        assert.equal(parseSheetRow(ROW_ID, HEADER_ID, 3200).product, 'Seat Covers');
    });

    test('the model year is not mistaken for the car', () => {
        const lead = parseSheetRow(ROW_SHORT, HEADER_SHORT, 900);
        assert.equal(lead.car, 'Tata tiago');
        assert.equal(lead.unmapped['can_you_share_the_car_model_year?'], '2024 oct');
    });

    test('campaign metadata is not reported as an unmapped question', () => {
        const lead = parseSheetRow(ROW_ID, HEADER_ID, 3200);
        assert.equal('ad_id' in lead.unmapped, false);
        assert.equal('campaign_name' in lead.unmapped, false);
    });

    // The campaign team is adding this; nothing else should change when it lands.
    test('a state column is read when the form starts asking for one', () => {
        const header = [...HEADER_SHORT.slice(0, 6), 'state', 'lead_status'];
        const row = [...ROW_SHORT.slice(0, 6), 'Haryana', 'CREATED'];
        const lead = parseSheetRow(row, header, 1);
        assert.equal(lead.state, 'Haryana');
        assert.equal(lead.city, 'Rewari');
    });
});

describe('pickHeader — layout is decided by the row, never its position', () => {
    const all = [HEADER_LONG, HEADER_SHORT, HEADER_ID];

    test('an l: row takes the id-first header', () => {
        assert.equal(pickHeader(ROW_ID, all), HEADER_ID);
    });

    test('a date row with a blank column 5 takes the long header', () => {
        assert.equal(pickHeader(ROW_LONG, all), HEADER_LONG);
    });

    test('a date row using column 5 takes the short header', () => {
        assert.equal(pickHeader(ROW_SHORT, all), HEADER_SHORT);
    });

    test('a row of no recognisable shape is refused', () => {
        assert.equal(pickHeader(['', '', ''], all), null);
        assert.equal(pickHeader(['not a date', 'x'], all), null);
    });

    test('nothing matches when that layout has no header', () => {
        assert.equal(pickHeader(ROW_ID, [HEADER_LONG]), null);
    });
});

describe('readLeadSheet — the whole file', () => {
    /*
     * The real trap: 372 id-first rows sit ABOVE their own header. A reader
     * that collects headers as it goes has not met the right one yet, and
     * reads a lead id into the date column.
     */
    test('a row above its own header is still read correctly', () => {
        const { leads, skipped } = readLeadSheet([
            HEADER_LONG,
            ROW_LONG,
            ROW_ID,          // id-first, and its header has not appeared yet
            HEADER_ID,
            ROW_ID,
        ]);

        assert.equal(leads.length, 3);
        assert.equal(skipped.unrecognised, 0);
        // Both id-first rows read the same, wherever they sat.
        assert.equal(leads[1].createdAt, '2026-08-27T13:10:44-05:00');
        assert.equal(leads[2].createdAt, '2026-08-27T13:10:44-05:00');
        assert.equal(leads[1].city, 'Killa Pardi');
    });

    test('every header in the file is counted, not just the first', () => {
        const { skipped } = readLeadSheet([HEADER_LONG, ROW_LONG, HEADER_SHORT, ROW_SHORT]);
        assert.equal(skipped.headers, 2);
    });

    test('Meta test submissions are left out', () => {
        const dummy = [
            '2026-06-08T03:29:28-05:00', '<test lead: dummy data for car>', '',
            '<test lead: dummy data for full_name>', 'p:<test lead: dummy data for phone>',
            '', '<test lead: dummy data for city>',
        ];
        const { leads, skipped } = readLeadSheet([HEADER_LONG, dummy, ROW_LONG]);
        assert.equal(leads.length, 1);
        assert.equal(skipped.tests, 1);
    });

    test('blank and stray rows are counted, never guessed at', () => {
        const { leads, skipped } = readLeadSheet([
            HEADER_LONG, [], ['', '', ''], ['stray text'], ROW_LONG,
        ]);
        assert.equal(leads.length, 1);
        assert.equal(skipped.unrecognised, 2);
    });

    test('the row number points at the line in the file', () => {
        const { leads } = readLeadSheet([HEADER_LONG, ROW_LONG]);
        assert.equal(leads[0].rowNumber, 2);
    });

    test('an empty sheet is not an error', () => {
        const { leads, skipped } = readLeadSheet([]);
        assert.deepEqual(leads, []);
        assert.equal(skipped.headers, 0);
    });

    test('rows with no header at all are refused, not guessed', () => {
        const { leads, skipped } = readLeadSheet([ROW_LONG, ROW_SHORT]);
        assert.equal(leads.length, 0);
        assert.equal(skipped.unrecognised, 2);
    });
});

describe('row classifiers', () => {
    test('header rows are recognised by their first cell', () => {
        assert.equal(isHeaderRow(HEADER_LONG), true);
        assert.equal(isHeaderRow(HEADER_ID), true);
        assert.equal(isHeaderRow(ROW_LONG), false);
    });

    test('a test submission is recognised from any column', () => {
        assert.equal(isTestRow(['ok', '<test lead: dummy data for x>']), true);
        assert.equal(isTestRow(ROW_LONG), false);
    });
});
