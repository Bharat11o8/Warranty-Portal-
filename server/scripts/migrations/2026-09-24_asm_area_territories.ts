/**
 * ASM areas become places from the pincode directory: a state, a district or
 * a single pincode, and every pincode inside it belongs to that ASM.
 *
 * 1. Adds three nullable columns to asm_areas:
 *      kind      'state' | 'district' | 'pincode'
 *      district  India Post's district name, for kind = 'district'
 *      pincode   for kind = 'pincode'
 *    `state` already exists and holds the canonical state for every kind.
 *
 *    Additive only, each column added at the end as NULL, which MySQL 8
 *    applies with ALGORITHM=INSTANT — no rebuild, existing rows untouched. The
 *    deployed code's INSERT names its columns, so it keeps working meanwhile.
 *
 * 2. Converts the areas already typed in under the old screen. Territory
 *    lookups only read rows with a kind, so an unconverted row would silently
 *    stop routing. A name that IS a state becomes that state ("DELHI",
 *    "rajasthan"); otherwise a district of that name, in the row's state when
 *    it has one ("GURUGRAM" with state HARYANA -> Gurugram, Haryana). A name
 *    that resolves to neither, or to more than one district, is left as it is
 *    and listed, to be re-added from the new screen.
 *
 * Safe to re-run: columns already there are skipped, and only rows without a
 * kind are converted. `--dry` reports the conversion without writing it.
 *
 *   npx tsx scripts/migrations/2026-09-24_asm_area_territories.ts [--dry]
 */
import db from '../../src/config/database.js';
import { directory } from '../../src/services/asmTerritoryQuery.js';
import {
    canonicalState,
    norm,
    territoryKey,
    territoryLabel,
    DISTRICT_ALIASES,
    type Territory,
} from '../../src/services/asmTerritory.js';

const dry = process.argv.includes('--dry');

const COLUMNS: [name: string, definition: string][] = [
    ['kind', 'VARCHAR(10) NULL'],
    ['district', 'VARCHAR(120) NULL'],
    ['pincode', 'CHAR(6) NULL'],
];

async function addColumns() {
    const [existing]: any = await db.query('SHOW COLUMNS FROM asm_areas');
    const have = new Set(existing.map((c: any) => c.Field));
    for (const [name, definition] of COLUMNS) {
        if (have.has(name)) { console.log(`column ${name}: already there`); continue; }
        if (dry) { console.log(`column ${name}: would add`); continue; }
        await db.query(`ALTER TABLE asm_areas ADD COLUMN ${name} ${definition}, ALGORITHM=INSTANT`);
        console.log(`column ${name}: added`);
    }
    return have.has('kind');
}

/** What an old typed area becomes, or why it can't be converted. */
async function convert(label: string, rowState: string | null): Promise<Territory | string> {
    const dir = await directory();
    const typed = String(label).trim();

    // The name of a state, exactly — not a city findState happens to know.
    const asState = canonicalState(typed);
    if (asState && norm(asState) === norm(typed) && dir.some(d => d.state === asState)) {
        return { kind: 'state', state: asState };
    }

    const inState = canonicalState(rowState);
    const aliasHits = (DISTRICT_ALIASES[norm(typed)] ?? []).map(a => `${norm(a.state)}|${norm(a.district)}`);
    const districts = dir.filter(d =>
        (norm(d.district) === norm(typed) || aliasHits.includes(`${norm(d.state)}|${norm(d.district)}`))
        && (!inState || d.state === inState));

    if (districts.length === 1) return { kind: 'district', state: districts[0].state, district: districts[0].district };
    if (districts.length > 1) return `matches ${districts.length} districts (${districts.map(d => d.state).join(', ')})`;
    return 'is neither a state nor a district in the pincode directory';
}

async function convertOldRows(hadKind: boolean) {
    const [rows]: any = await db.query(
        hadKind || !dry
            ? `SELECT ar.id, ar.area_label, ar.state, a.name FROM asm_areas ar JOIN asms a ON a.id = ar.asm_id WHERE ar.kind IS NULL`
            : `SELECT ar.id, ar.area_label, ar.state, a.name FROM asm_areas ar JOIN asms a ON a.id = ar.asm_id`
    );
    if (!rows.length) { console.log('\nNo old-style areas to convert.'); return; }

    console.log(`\nConverting ${rows.length} old-style area${rows.length === 1 ? '' : 's'}${dry ? ' (dry run)' : ''}:`);
    for (const r of rows) {
        const result = await convert(r.area_label, r.state);
        if (typeof result === 'string') {
            console.log(`   ${r.name}: "${r.area_label}" ${result} — LEFT AS IS, re-add it from the new screen`);
            continue;
        }
        const key = territoryKey(result);
        const label = territoryLabel(result);
        console.log(`   ${r.name}: "${r.area_label}" -> ${result.kind} ${label}`);
        if (dry) continue;

        try {
            await db.query(
                `UPDATE asm_areas SET kind = ?, state = ?, district = ?, pincode = ?, area_key = ?, area_label = ?
                  WHERE id = ?`,
                [result.kind, result.state, result.district ?? null, result.pincode ?? null, key, label, r.id]
            );
        } catch (err: any) {
            if (err?.code !== 'ER_DUP_ENTRY') throw err;
            console.log(`      already held by another row — "${r.area_label}" LEFT AS IS`);
        }
    }
}

async function main() {
    const hadKind = await addColumns();
    await convertOldRows(hadKind);

    if (!dry) {
        const [after]: any = await db.query(
            `SELECT a.name, ar.kind, ar.area_label FROM asm_areas ar JOIN asms a ON a.id = ar.asm_id ORDER BY a.name, ar.area_label`
        );
        console.log('\nAreas now:');
        for (const r of after) console.log(`   ${r.name.padEnd(20)} ${String(r.kind ?? 'OLD').padEnd(9)} ${r.area_label}`);
    }
}

main()
    .then(() => process.exit(0))
    .catch(err => { console.error(err); process.exit(1); });
