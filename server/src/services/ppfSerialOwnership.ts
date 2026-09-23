/**
 * Whether a PPF serial belongs to the store presenting it.
 *
 * Serials an admin generates are recorded against the store they were handed
 * to. The QR flow is open to anyone holding the link, so a number copied off
 * another store's paperwork would otherwise register a warranty against a roll
 * this store never received.
 *
 * Kept apart from ppfRoll.service so the rule can be exercised without a
 * database: that service opens a connection pool the moment it is imported.
 */

/** A serial as ppf_serials records it: the number, and who it went to. */
export interface IssuedSerialRow {
    serial_number: string;
    store_code: string | null;
}

/**
 * The serials worth asking the database about.
 *
 * Trimmed, blanks dropped, duplicates collapsed — a submission listing the same
 * roll twice is a separate complaint that reserveRolls makes, and it should not
 * turn into two copies of the same lookup here.
 */
export function serialsToCheck(serials: string[]): string[] {
    return [...new Set(serials.map((s) => String(s || '').trim()).filter(Boolean))];
}

/**
 * The decision itself, given what the database holds.
 *
 * Only issued serials reach this function — a number nobody handed out has no
 * row, and so no owner to disagree with. Installers typed their own serials
 * long before any were issued, and refusing those would stop stores registering
 * warranties they are entitled to.
 *
 * Returns the offending serial, or null when every serial is acceptable.
 */
export function pickSerialIssuedElsewhere(
    rows: IssuedSerialRow[],
    storeCode: string
): string | null {
    const code = storeCode.trim().toUpperCase();
    for (const row of rows) {
        // Compared case-insensitively: the code is printed on paperwork and
        // retyped, and a difference of case is not somebody else's roll.
        if (String(row.store_code || '').trim().toUpperCase() !== code) {
            return String(row.serial_number);
        }
    }
    return null;
}
