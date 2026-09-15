/**
 * Deciding whether two Indian place names mean the same place.
 *
 * Used to mark which of a state's stores the customer's own words point at.
 * The mark is advice — an admin still chooses — but a wrong one is worse than
 * none, because it is the reason they would pick one store over another, and
 * the result is a customer sent across their state.
 *
 * Lives apart from the controller so it can be tested without a database. It
 * took four attempts to get right, which is exactly the kind of logic that
 * regresses silently.
 */

/** Lowercase, letters and digits only, so punctuation and case drop out. */
export function squash(value: string): string {
    return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
}

/**
 * Levenshtein with a cap, counting a swap of adjacent letters as one edit.
 *
 * The transposition matters: "Mahesana" and "Mehsana" differ by a swap and a
 * deletion, which plain Levenshtein scores as two unrelated changes.
 *
 * Bails as soon as the best possible distance exceeds `max`, so a long name is
 * rejected in a few rows rather than a full matrix.
 */
export function withinEdits(a: string, b: string, max: number): boolean {
    if (a === b) return true;
    if (Math.abs(a.length - b.length) > max) return false;

    let twoBack: number[] = [];
    let prev = Array.from({ length: b.length + 1 }, (_, i) => i);

    for (let i = 1; i <= a.length; i++) {
        const curr = [i];
        let best = i;
        for (let j = 1; j <= b.length; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            let val = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
            if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
                val = Math.min(val, twoBack[j - 2] + 1);
            }
            curr[j] = val;
            if (val < best) best = val;
        }
        if (best > max) return false;
        twoBack = prev;
        prev = curr;
    }
    return prev[b.length] <= max;
}

/** Nothing under five characters is fuzzy-matched: at that length almost any
 *  short word is one edit from another. */
function allowance(len: number): number {
    return len <= 4 ? 0 : len <= 7 ? 1 : 2;
}

/** Consonants only. Indian transliteration varies in its vowels. */
function skeleton(word: string): string {
    return word.replace(/[aeiou]/g, '');
}

/**
 * Two single words naming the same place.
 *
 * Three rules, because no single one holds:
 *
 *   The first letters must agree. A misspelling keeps its opening letter, and
 *   requiring it is what stops Patan matching Ratan.
 *
 *   Then the consonants. Mahesana and Mehsana are one place and share the
 *   skeleton "mhsn"; so do Ahemdabad/Ahmedabad and Bhatinda/Bathinda. Batala
 *   and Barnala are two different Punjab towns and do not — btl against brnl —
 *   which an edit count alone cannot separate at that length.
 *
 *   An edit allowance catches what is left.
 */
export function sameWord(a: string, b: string): boolean {
    if (a === b) return true;
    if (!a || !b || a[0] !== b[0]) return false;
    if (skeleton(a) === skeleton(b)) return true;
    return withinEdits(a, b, Math.min(allowance(a.length), allowance(b.length)));
}

/**
 * The meaningful words of a place name.
 *
 * The state itself is dropped: every store being compared is already in the
 * right state, so matching on it would mark a store filed under city "DELHI"
 * as local to every Delhi enquiry. Short words go too — they carry no identity.
 */
export function placeWords(value: string, state: string): string[] {
    const stateKey = squash(state);
    return String(value || '')
        .split(/[^A-Za-z0-9]+/)
        .map(squash)
        .filter(word => word.length >= 4 && word !== stateKey);
}

/**
 * Whether a store's city is the place the customer named.
 *
 * Whole names, not loose words. Matching any single word made "Karol Bagh" a
 * match for "Punjabi Bagh", and tagged a real Mangol Puri enquiry with Vikas
 * Puri — both share a generic suffix, not an identity.
 *
 * So the names must agree as a whole, or one must be entirely contained in the
 * other: "Surat" inside "Surat- Kamrej" is the same place narrowed, whereas
 * "Bagh" is only a word two places happen to end with.
 */
export function isSamePlace(city: string, typedArea: string, state: string): boolean {
    const cityWords = placeWords(city, state);
    const typedWords = placeWords(typedArea, state);
    if (!cityWords.length || !typedWords.length) return false;

    // Whole name, ignoring word order.
    if (sameWord([...cityWords].sort().join(''), [...typedWords].sort().join(''))) return true;

    const isSubset = (a: string[], b: string[]) =>
        a.every(x => b.some(y => sameWord(x, y)));

    return isSubset(cityWords, typedWords) || isSubset(typedWords, cityWords);
}

/**
 * One address line, without repeating the city or pincode.
 *
 * Most stored addresses already end with their own city and pincode —
 * "…TONK ROAD JAIPUR-302018" — so appending both again produced
 * "…JAIPUR-302018, JAIPUR, 302018" in a message a customer reads. Each part is
 * added only when the address does not already carry it, compared with
 * punctuation stripped so "JAIPUR-302018" is recognised as holding both.
 */
export function buildAddress(store: {
    address?: string | null;
    city?: string | null;
    pincode?: string | null;
}): string {
    const base = String(store.address || '').trim().replace(/[,\s]+$/, '');
    const squashed = squash(base);
    const parts = [base];

    for (const extra of [store.city, store.pincode]) {
        const value = String(extra || '').trim();
        if (!value) continue;
        const key = squash(value);
        if (key && !squashed.includes(key)) parts.push(value);
    }

    return parts.filter(Boolean).join(', ');
}
