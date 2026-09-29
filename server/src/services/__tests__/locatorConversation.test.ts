import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readCarAnswer } from '../carModels.js';
import { nextStep, isRestart, isCancel, isIdle, MAX_TRIES } from '../locatorConversation.js';
import { CAR_RETRY, PINCODE_QUESTION, INVALID_PINCODE_TEXT, NO_PINCODE_END } from '../storeLocatorMessages.js';

describe('readCarAnswer — lenient, tidies known models', () => {
    // Real answers from our leads (Sept 2026), then the tricky ones.
    const cases: [string, string][] = [
        ['Creta', 'Hyundai Creta'], ['creat', 'Hyundai Creta'], ['Grand VITARA', 'Maruti Suzuki Grand Vitara'],
        ['Hyundai Grand i10 nios 2025', 'Hyundai Grand i10 Nios'], ['Hy cross', 'Toyota Innova Hycross'],
        ['Suzuki fronx', 'Maruti Suzuki Fronx'], ['I have a Vitara Brezza', 'Maruti Suzuki Brezza'],
        ['My car is a Honda City', 'Honda City'], ['City', 'Honda City'], ['Creta from Delhi', 'Hyundai Creta'],
        ['Mahindra XUV 700', 'Mahindra XUV700'], ['Swift Dzire', 'Maruti Suzuki Dzire'], ['BMW X1', 'BMW X1'],
    ];
    for (const [answer, car] of cases) {
        test(`"${answer}" → ${car}`, () => assert.deepEqual(readCarAnswer(answer), { ok: true, car, known: true }));
    }
    test('an unknown model is still accepted, as typed', () => {
        assert.deepEqual(readCarAnswer('Hyundai Xyzzy'), { ok: true, car: 'Hyundai Xyzzy', known: false });
    });
    test('not a car: numbers, greetings, places, sentences', () => {
        for (const a of ['6', '201301', 'ok', 'hi']) assert.equal((readCarAnswer(a) as any).why, 'junk', a);
        for (const a of ['West bengal', 'Delhi city', 'Noida']) assert.equal((readCarAnswer(a) as any).why, 'place', a);
        assert.equal((readCarAnswer('I want seat covers for my car please') as any).why, 'junk');
        assert.equal((readCarAnswer('') as any).why, 'empty');
    });
    test('a make alone asks which model', () => {
        assert.deepEqual(readCarAnswer('Toyota'), { ok: false, why: 'make-only', make: 'Toyota' });
        assert.deepEqual(readCarAnswer('Toyota car'), { ok: false, why: 'make-only', make: 'Toyota' });
    });
});

describe('nextStep — one chat step at a time', () => {
    const known = async () => true;
    const unknown = async () => false;

    test('a good car moves on to the pincode', async () => {
        assert.deepEqual(await nextStep({ stage: 'car', tries: 0 }, 'creat', known),
            { kind: 'car', car: 'Hyundai Creta', checked: true, reply: PINCODE_QUESTION });
    });
    test('a wrong car is asked again, saying what was wrong', async () => {
        assert.deepEqual(await nextStep({ stage: 'car', tries: 0 }, 'West bengal', known),
            { kind: 'retry', tries: 1, reply: CAR_RETRY.place });
        const which = await nextStep({ stage: 'car', tries: 0 }, 'Toyota', known) as any;
        assert.equal(which.kind, 'retry');
        assert.match(which.reply, /^Which Toyota\? .*Innova/);
    });
    test(`after ${MAX_TRIES} wrong cars the chat moves on, marked unchecked`, async () => {
        assert.deepEqual(await nextStep({ stage: 'car', tries: 1 }, '6', known),
            { kind: 'car', car: '6', checked: false, reply: PINCODE_QUESTION });
        assert.deepEqual(await nextStep({ stage: 'car', tries: 1 }, 'Toyota', known),
            { kind: 'car', car: 'Toyota', checked: false, reply: PINCODE_QUESTION });
    });
    test('a pincode inside a sentence is taken first time', async () => {
        assert.deepEqual(await nextStep({ stage: 'pincode', tries: 0 }, 'My pin code is : 201301', known),
            { kind: 'pincode', pincode: '201301', checked: true });
    });
    test('no pincode: asked again, then the chat ends politely', async () => {
        assert.deepEqual(await nextStep({ stage: 'pincode', tries: 0 }, 'Noida', known),
            { kind: 'retry', tries: 1, reply: INVALID_PINCODE_TEXT });
        assert.deepEqual(await nextStep({ stage: 'pincode', tries: 1 }, 'Noida', known),
            { kind: 'give-up', reply: NO_PINCODE_END });
    });
    test('a pincode we cannot place: one chance to fix, then it goes through', async () => {
        const first = await nextStep({ stage: 'pincode', tries: 0 }, '999999', unknown) as any;
        assert.equal(first.kind, 'retry');
        assert.match(first.reply, /999999/);
        assert.deepEqual(await nextStep({ stage: 'pincode', tries: 1 }, '999999', unknown),
            { kind: 'pincode', pincode: '999999', checked: false });
    });
});

describe('restart, cancel, idle', () => {
    test('greetings restart; a car name does not', () => {
        for (const t of ['Heyy', 'hi', 'Hello!', 'hii']) assert.equal(isRestart(t), true, t);
        for (const t of ['Hyundai', 'hi creta', 'Honda City']) assert.equal(isRestart(t), false, t);
    });
    test('stop and cancel end the chat', () => {
        assert.equal(isCancel('Stop'), true);
        assert.equal(isCancel('cancel.'), true);
        assert.equal(isCancel('stop by tomorrow'), false);
    });
    test('quiet for 30 minutes is over', () => {
        const now = Date.parse('2026-09-29T12:00:00Z');
        assert.equal(isIdle('2026-09-29T11:45:00Z', now), false);
        assert.equal(isIdle('2026-09-29T11:15:00Z', now), true);
        assert.equal(isIdle(null, now), true);
    });
});
