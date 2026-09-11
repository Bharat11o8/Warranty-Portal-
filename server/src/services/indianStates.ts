/**
 * Indian states and union territories, and the many ways people write them.
 *
 * ASMs cover states, so the state is what routing turns on — a customer writing
 * "Rohini Delhi" reaches whoever covers Delhi, and the "Rohini" half is carried
 * through to the ASM as context rather than used to choose them.
 *
 * The aliases are not hypothetical. Our own `vendor_details` holds 29 distinct
 * spellings for about 25 states: "Chattisgarh" and "CHHATTISGARH", "Maharashtra"
 * and "Maharastra", "Madhay pradesh", "Utter pradesh", and three different
 * spellings of Jammu & Kashmir. Customers typing on a phone do worse.
 */

export interface StateEntry {
    /** The one spelling everything else resolves to. */
    canonical: string;
    /** Alternates, abbreviations, common misspellings and major cities. */
    aliases: string[];
}

/**
 * Cities appear alongside their state deliberately.
 *
 * A customer who writes only "Mumbai" has still told us the state, and refusing
 * to route that would queue a perfectly answerable enquiry. Only the larger
 * cities are listed — enough to catch the common case without turning this into
 * a gazetteer that has to be maintained.
 */
export const INDIAN_STATES: StateEntry[] = [
    { canonical: 'Andhra Pradesh', aliases: ['ap', 'andhra', 'andra pradesh', 'andhrapradesh', 'visakhapatnam', 'vizag', 'vijayawada', 'guntur', 'tirupati', 'nellore'] },
    { canonical: 'Arunachal Pradesh', aliases: ['arunachal', 'itanagar'] },
    { canonical: 'Assam', aliases: ['guwahati', 'gauhati', 'dibrugarh', 'silchar', 'jorhat'] },
    { canonical: 'Bihar', aliases: ['patna', 'gaya', 'muzaffarpur', 'bhagalpur', 'darbhanga'] },
    { canonical: 'Chhattisgarh', aliases: ['chattisgarh', 'chhatisgarh', 'cg', 'raipur', 'bhilai', 'bilaspur', 'durg'] },
    { canonical: 'Goa', aliases: ['panaji', 'panjim', 'margao', 'vasco'] },
    { canonical: 'Gujarat', aliases: ['gujrat', 'gujarath', 'ahmedabad', 'ahmadabad', 'ahemdabad', 'amdavad', 'surat', 'vadodara', 'baroda', 'rajkot', 'bhavnagar', 'jamnagar', 'gandhinagar'] },
    { canonical: 'Haryana', aliases: ['hariyana', 'gurugram', 'gurgaon', 'faridabad', 'panipat', 'ambala', 'karnal', 'hisar', 'rohtak', 'sonipat'] },
    { canonical: 'Himachal Pradesh', aliases: ['himachal', 'hp', 'shimla', 'simla', 'manali', 'dharamshala', 'solan'] },
    { canonical: 'Jharkhand', aliases: ['jharkand', 'ranchi', 'jamshedpur', 'dhanbad', 'bokaro'] },
    { canonical: 'Karnataka', aliases: ['karnatka', 'bangalore', 'bengaluru', 'mysore', 'mysuru', 'mangalore', 'mangaluru', 'hubli', 'belgaum', 'davangere'] },
    { canonical: 'Kerala', aliases: ['keral', 'kochi', 'cochin', 'trivandrum', 'thiruvananthapuram', 'kozhikode', 'calicut', 'thrissur', 'kollam'] },
    { canonical: 'Madhya Pradesh', aliases: ['mp', 'madhya', 'madhay pradesh', 'madya pradesh', 'indore', 'bhopal', 'jabalpur', 'gwalior', 'ujjain', 'sagar'] },
    { canonical: 'Maharashtra', aliases: ['maharastra', 'maharashta', 'mh', 'mumbai', 'bombay', 'pune', 'poona', 'nagpur', 'nashik', 'nasik', 'thane', 'aurangabad', 'solapur', 'kolhapur', 'navi mumbai'] },
    { canonical: 'Manipur', aliases: ['imphal'] },
    { canonical: 'Meghalaya', aliases: ['shillong'] },
    { canonical: 'Mizoram', aliases: ['aizawl'] },
    { canonical: 'Nagaland', aliases: ['kohima', 'dimapur'] },
    { canonical: 'Odisha', aliases: ['orissa', 'bhubaneswar', 'bhubaneshwar', 'cuttack', 'rourkela', 'puri'] },
    { canonical: 'Punjab', aliases: ['panjab', 'ludhiana', 'amritsar', 'jalandhar', 'patiala', 'bathinda', 'mohali'] },
    { canonical: 'Rajasthan', aliases: ['rajastan', 'jaipur', 'jodhpur', 'udaipur', 'kota', 'ajmer', 'bikaner', 'alwar'] },
    { canonical: 'Sikkim', aliases: ['gangtok'] },
    { canonical: 'Tamil Nadu', aliases: ['tamilnadu', 'tamil nadu', 'tn', 'chennai', 'madras', 'coimbatore', 'madurai', 'salem', 'trichy', 'tiruchirappalli', 'tirupur'] },
    { canonical: 'Telangana', aliases: ['telengana', 'hyderabad', 'secunderabad', 'warangal', 'nizamabad', 'karimnagar'] },
    { canonical: 'Tripura', aliases: ['agartala'] },
    { canonical: 'Uttar Pradesh', aliases: ['up', 'utter pradesh', 'uttarpradesh', 'uttar pradash', 'lucknow', 'kanpur', 'agra', 'varanasi', 'banaras', 'meerut', 'noida', 'greater noida', 'ghaziabad', 'allahabad', 'prayagraj', 'bareilly', 'aligarh', 'moradabad', 'gorakhpur'] },
    { canonical: 'Uttarakhand', aliases: ['uttaranchal', 'uttrakhand', 'dehradun', 'haridwar', 'rishikesh', 'nainital', 'roorkee'] },
    { canonical: 'West Bengal', aliases: ['bengal', 'wb', 'westbengal', 'kolkata', 'calcutta', 'howrah', 'siliguri', 'durgapur', 'asansol'] },

    // Union territories.
    { canonical: 'Andaman & Nicobar', aliases: ['andaman', 'nicobar', 'port blair'] },
    { canonical: 'Chandigarh', aliases: ['chandigarh'] },
    { canonical: 'Dadra & Nagar Haveli and Daman & Diu', aliases: ['dadra', 'nagar haveli', 'daman', 'diu', 'silvassa'] },
    { canonical: 'Delhi', aliases: ['new delhi', 'dilli', 'dehli', 'delhi ncr', 'ncr', 'rohini', 'dwarka', 'saket', 'janakpuri', 'karol bagh', 'lajpat nagar', 'pitampura', 'connaught place', 'nehru place'] },
    { canonical: 'Jammu & Kashmir', aliases: ['jammu', 'kashmir', 'j&k', 'jk', 'jammu and kashmir', 'jammu kashmir', 'srinagar'] },
    { canonical: 'Ladakh', aliases: ['leh', 'kargil'] },
    { canonical: 'Lakshadweep', aliases: ['kavaratti'] },
    { canonical: 'Puducherry', aliases: ['pondicherry', 'pondy'] },
];

/** Lowercase, strip everything that is not a letter or digit. */
const key = (raw: string): string =>
    String(raw || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '');

/*
 * Every spelling, pointing at its canonical state.
 *
 * Built once. A longer key is checked before a shorter one so that "new delhi"
 * is not decided by "delhi" appearing inside it, and so a two-word alias beats
 * a one-word one that happens to overlap.
 */
const LOOKUP = new Map<string, string>();
for (const entry of INDIAN_STATES) {
    LOOKUP.set(key(entry.canonical), entry.canonical);
    for (const alias of entry.aliases) LOOKUP.set(key(alias), entry.canonical);
}
const KEYS_BY_LENGTH = [...LOOKUP.keys()].sort((a, b) => b.length - a.length);

/**
 * Edit distance, capped, counting a swap of adjacent letters as one edit.
 *
 * "dehli" for "delhi" is the most common way that word is mistyped, and plain
 * Levenshtein scores it 2 — the same as two unrelated wrong letters. Treating a
 * transposition as one edit catches it without widening the allowance.
 */
function editDistance(a: string, b: string, max: number): number {
    if (Math.abs(a.length - b.length) > max) return max + 1;
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
        if (best > max) return max + 1;
        twoBack = prev;
        prev = curr;
    }
    return prev[b.length];
}

/** One edit on a medium word, two on a long one, none on a short one. */
const typoAllowance = (len: number): number => (len <= 4 ? 0 : len <= 7 ? 1 : 2);

export interface StateMatch {
    /** The canonical state name. */
    state: string;
    /** Which spelling in the text produced the match. */
    via: string;
    /** 'exact' when the spelling was recognised, 'fuzzy' when a typo was allowed. */
    how: 'exact' | 'fuzzy';
}

/**
 * Find the state in whatever the customer wrote.
 *
 * They type freely — "Rohini, Delhi", "delhi", "I am from dehli", "Mumbai",
 * "Ahemdabadahemdabad .gujrat." — so this looks for a known state or city
 * *inside* the text rather than trying to match the whole of it.
 *
 * Three passes, each looser than the last:
 *   1. the whole string
 *   2. any word or adjacent pair that names a state or a major city, longest first
 *   3. the same, allowing a typo on longer words
 *
 * Longest-first matters: "New Delhi" must not be decided by the "Delhi" inside
 * it, and "Navi Mumbai" must reach Maharashtra through the pair rather than
 * through "navi".
 *
 * Returns null rather than guessing. An unmatched enquiry is queued where
 * somebody can see it; a wrongly matched one is sent to the wrong ASM.
 */
export function findState(text: string): StateMatch | null {
    const whole = key(text);
    if (!whole) return null;

    const direct = LOOKUP.get(whole);
    if (direct) return { state: direct, via: whole, how: 'exact' };

    const words = String(text).split(/[^A-Za-z0-9&]+/).filter(Boolean);
    const pairs = words.slice(0, -1).map((w, i) => key(w + words[i + 1]));
    const singles = words.map(key).filter(w => w.length > 1);

    const candidates = [...new Set([...pairs, ...singles])].sort((a, b) => b.length - a.length);

    for (const candidate of candidates) {
        const hit = LOOKUP.get(candidate);
        if (hit) return { state: hit, via: candidate, how: 'exact' };
    }

    /*
     * A typo pass, and a deliberately mean one. Two-letter codes like "ap" and
     * "up" are never fuzzy-matched — at that length almost any word is one edit
     * away, and the cost of being wrong is an enquiry sent to another state's
     * ASM.
     */
    for (const candidate of candidates) {
        const allow = typoAllowance(candidate.length);
        if (!allow) continue;

        let best: string | null = null;
        let bestVia = '';
        let bestDist = allow + 1;
        for (const known of KEYS_BY_LENGTH) {
            if (known.length <= 4) continue;
            const d = editDistance(candidate, known, allow);
            if (d < bestDist) {
                bestDist = d;
                best = LOOKUP.get(known) || null;
                bestVia = known;
            }
        }
        if (best) return { state: best, via: bestVia, how: 'fuzzy' };
    }

    return null;
}

/**
 * Resolve any spelling of a state to its canonical form.
 *
 * Used when assigning an area to an ASM, so "Gujrat" and "GUJARAT" cannot both
 * be stored as separate territories. Returns the input trimmed when it is not a
 * state we know — an admin may legitimately be entering something we have not
 * listed, and refusing it outright would be worse than storing it as typed.
 */
export function canonicalState(raw: string): string {
    const hit = findState(raw);
    return hit ? hit.state : String(raw || '').trim();
}
