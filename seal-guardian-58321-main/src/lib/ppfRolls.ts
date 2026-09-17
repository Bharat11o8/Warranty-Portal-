import type { PPFRoll } from "@/components/warranty/EVProductsForm";

/**
 * What a PPF roll entry must look like before it is worth submitting.
 *
 * Shared by the product step and the form that wraps it. They validated the
 * same fields separately before and had already drifted — the parent rejected
 * photos the step had accepted — so the rule lives in one place and both ask it
 * the same question.
 *
 * The roll's remaining area is deliberately not checked here: only the server
 * knows it, and it is not told to the installer.
 */

export const SERIAL_MIN_LENGTH = 8;
export const SERIAL_MAX_LENGTH = 10;

/** Keeps a typed serial to the characters a serial can contain. */
export const normalizeSerial = (value: string) =>
    value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, SERIAL_MAX_LENGTH);

/**
 * Keeps a typed area numeric while still allowing a decimal point mid-edit.
 * "12." has to survive being typed or the point can never be entered.
 */
export const normalizeSqft = (value: string) => {
    const cleaned = value.replace(/[^0-9.]/g, '');
    const [whole, ...rest] = cleaned.split('.');
    const joined = rest.length > 0 ? `${whole}.${rest.join('')}` : whole;
    return joined.slice(0, 8);
};

/** Why these roll entries cannot be submitted, in words, or null when they can. */
export const getRollsError = (rolls: PPFRoll[]): string | null => {
    if (!rolls || rolls.length === 0) {
        return 'Please enter the serial number and the area used.';
    }

    const seen = new Set<string>();

    for (const roll of rolls) {
        const serial = (roll.serial || '').trim();

        if (!serial) {
            return 'Please enter the serial number for every roll, or remove the empty one.';
        }

        if (serial.length < SERIAL_MIN_LENGTH || serial.length > SERIAL_MAX_LENGTH) {
            return `Serial ${serial} must be ${SERIAL_MIN_LENGTH}–${SERIAL_MAX_LENGTH} alphanumeric characters.`;
        }

        if (seen.has(serial)) {
            return `Serial ${serial} has been entered twice. Please combine it into a single entry.`;
        }
        seen.add(serial);

        const sqft = Number(roll.sqft);
        if (!roll.sqft || !Number.isFinite(sqft) || sqft <= 0) {
            return `Please enter how many sq.ft were used from serial ${serial}.`;
        }

        if (!(roll.installArea || '').trim()) {
            return `Please enter where the film from serial ${serial} was fitted.`;
        }
    }

    return null;
};

/** The rolls as the server takes them, with the area as a number. */
export const toRollPayload = (rolls: PPFRoll[]) =>
    rolls.map((roll) => ({
        serial: roll.serial.trim().toUpperCase(),
        sqft: Number(roll.sqft),
        installArea: roll.installArea.trim(),
    }));

/**
 * The serial number(s) to show for a PPF warranty, however it was stored.
 *
 * Reads the roll list that warranties now carry, the single serialNumber field
 * used before rolls were tracked, and finally the warranty id — which begins
 * with the serial, so it still tells the reader which roll was used even for a
 * record that predates any of this.
 */
export const displaySerial = (productDetails: any, warrantyUid?: string): string => {
    const rolls = productDetails?.rolls;
    if (Array.isArray(rolls) && rolls.length > 0) {
        return rolls.map((r: any) => r?.serial).filter(Boolean).join(', ') || 'N/A';
    }
    return productDetails?.serialNumber || warrantyUid || 'N/A';
};

/**
 * Where the film went, for a warranty however it was stored.
 *
 * Reads the per-roll areas that warranties now carry, and falls back to the
 * single area older records kept for the whole job.
 */
export const displayInstallArea = (productDetails: any): string => {
    const rolls = productDetails?.rolls;
    if (Array.isArray(rolls) && rolls.length > 0) {
        // Several rolls fitted to the same place read better as that place named
        // once than as the same word repeated.
        const unique = [...new Set(rolls.map((r: any) => r?.installArea).filter(Boolean))];
        if (unique.length > 0) return unique.join(', ');
    }
    return productDetails?.installArea || '';
};
