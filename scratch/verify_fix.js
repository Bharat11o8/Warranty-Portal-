const { z } = require('zod');

// The new permissive regex
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// The updated schema
const emailSchema = z.string()
    .min(1, 'Email is required')
    .trim()
    .toLowerCase()
    .regex(EMAIL_REGEX, 'Please enter a valid email address');

const testCases = [
    { input: 'test@yahoo.com', expected: 'test@yahoo.com' },
    { input: 'test@yahoo.com ', expected: 'test@yahoo.com' }, // Trailing space
    { input: ' TEST@yahoo.com', expected: 'test@yahoo.com' }, // Leading space + caps
    { input: 'user..name@yahoo.com', expected: 'user..name@yahoo.com' }, // Consecutive dots
    { input: 'user@sub.yahoo.co.in', expected: 'user@sub.yahoo.co.in' }
];

console.log('--- FINAL VALIDATION VERIFICATION ---');
testCases.forEach(({ input, expected }) => {
    const result = emailSchema.safeParse(input);
    if (result.success && result.data === expected) {
        console.log(`PASS ✅: "${input}" -> "${result.data}"`);
    } else {
        console.log(`FAIL ❌: "${input}" (Result: ${result.success ? result.data : result.error.issues[0].message})`);
    }
});
