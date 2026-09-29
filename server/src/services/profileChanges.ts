/**
 * What an edit changed, for the activity log: `{ field: { from, to } }` holding
 * only the fields whose value actually differs — the same shape
 * ADMIN_CONTACT_UPDATED already logs.
 *
 * Profile edits used to log only that an edit happened. Reconstructing a
 * franchise's history (UMIYA Patan/Kalol, Sept 2026: a phone number moved
 * between two accounts twice) meant inferring each change from where the next
 * login code or WhatsApp went. With this, the log itself answers it.
 *
 * Pure, so it is testable without a database.
 */
export type FieldChanges = Record<string, { from: string | null; to: string | null }>;

/** Blank, whitespace and null all read as "no value"; numbers compare as text. */
function normalise(v: unknown): string | null {
    if (v === null || v === undefined) return null;
    const s = String(v).trim();
    return s === '' ? null : s;
}

export function fieldChanges(
    before: Record<string, unknown>,
    after: Record<string, unknown>
): FieldChanges {
    const changes: FieldChanges = {};
    for (const key of Object.keys(after)) {
        const from = normalise(before[key]);
        const to = normalise(after[key]);
        if (from !== to) changes[key] = { from, to };
    }
    return changes;
}
