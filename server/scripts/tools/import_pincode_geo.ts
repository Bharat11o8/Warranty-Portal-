import fs from 'fs';
import db from '../../src/config/database.js';
import { placeAllPincodes, distanceKm, type Office, type PincodeCentre } from '../../src/services/pincodeCentre.js';
import { parseCoordinate, isTestAccount } from '../../src/services/storeLocator.js';

/**
 * Build pincode_geo: where every pincode is, so a customer's pincode can be
 * placed on the map.
 *
 * Source: All India Pincode Directory, data.gov.in (Department of Posts). The
 * file lists post offices, and many of their coordinates are placeholders or
 * strays; pincodeCentre explains how each pincode is placed despite that.
 *
 * Our own store pins then fill two gaps. Where India Post has one office or
 * none behind a pincode, a verified store pin in that pincode is the better
 * evidence and is used instead. Where India Post is well supported and a store
 * pin disagrees, India Post is kept and the store is reported: several post
 * offices agreeing are more likely right than one pin, as RADHIKA CAR DECORE's
 * pin in Pune showed.
 *
 * Built into a separate table and swapped in at the end, so the live lookup
 * never sees a half-written table.
 *
 * Run:  npx tsx scripts/tools/import_pincode_geo.ts <path-to-json> [--dry]
 */

/** A store pin further than this from a well-supported pincode is reported. */
const DISAGREE_KM = 30;

/** India Post evidence at or below this many offices is weak enough to override. */
const WEAK_OFFICES = 1;

/**
 * Store pins checked by hand and found right where India Post is wrong. These
 * place their pincode even against well-supported India Post data.
 *
 * FKCD224 KIRPAL CAR DECORS, Sambasivapet, Guntur: India Post puts 522001 near
 * Vijayawada, 40 km away, from four offices that agree with each other.
 */
const TRUSTED_STORE_PINS = new Set(['FKCD224']);

const toNumber = (value: unknown): number | null => {
    const n = Number(String(value ?? '').trim());
    return Number.isFinite(n) ? n : null;
};

const inIndia = (lat: number | null, lng: number | null) =>
    lat !== null && lng !== null && lat >= 6 && lat <= 37.5 && lng >= 68 && lng <= 97.5;

function readOffices(file: string): Office[] {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
    const records: any[] = parsed.records || parsed.data || [];
    const out: Office[] = [];
    for (const r of records) {
        const pincode = String(r.pincode ?? '').trim();
        if (!/^[1-9][0-9]{5}$/.test(pincode)) continue;
        const lat = toNumber(r.latitude);
        const lng = toNumber(r.longitude);
        if (!inIndia(lat, lng)) continue;
        out.push({
            pincode, lat: lat!, lng: lng!,
            district: String(r.district ?? '').trim() || null,
            state: String(r.statename ?? '').trim() || null,
        });
    }
    console.log(`  ${records.length.toLocaleString()} post offices, ${out.length.toLocaleString()} with a coordinate inside India`);
    return out;
}

interface StorePin {
    code: string | null; name: string; city: string | null; state: string | null;
    pincode: string; lat: number; lng: number;
}

async function readStorePins(): Promise<StorePin[]> {
    const [rows]: any = await db.execute(
        `SELECT vd.store_code, vd.store_name, vd.city, vd.state, vd.pincode, vd.latitude, vd.longitude
           FROM vendor_details vd
           JOIN vendor_verification vv ON vv.user_id = vd.user_id AND vv.is_verified = 1
          WHERE vd.is_franchise = 1 AND vd.pincode REGEXP '^[1-9][0-9]{5}$'`
    );
    const pins: StorePin[] = [];
    for (const r of rows) {
        if (isTestAccount(r.store_name)) continue;
        const lat = parseCoordinate(r.latitude);
        const lng = parseCoordinate(r.longitude);
        if (!inIndia(lat, lng)) continue;
        pins.push({ code: r.store_code || null, name: r.store_name, city: r.city, state: r.state,
            pincode: String(r.pincode).trim(), lat: lat!, lng: lng! });
    }
    return pins;
}

type Row = PincodeCentre | (Omit<PincodeCentre, 'source'> & { source: 'store' });

async function main(): Promise<void> {
    const file = process.argv[2];
    const dry = process.argv.includes('--dry');
    if (!file || !fs.existsSync(file)) {
        console.error('Usage: npx tsx scripts/tools/import_pincode_geo.ts <path-to-json> [--dry]');
        process.exit(1);
    }

    console.log(`Reading ${file}…`);
    const offices = readOffices(file);
    const centres = placeAllPincodes(offices, { placeholderPincodes: 30, clusterKm: 15 });
    console.log(`  ${centres.length.toLocaleString()} pincodes placed`);

    const stores = await readStorePins();
    const byPin = new Map<string, StorePin[]>();
    for (const s of stores) (byPin.get(s.pincode) ?? byPin.set(s.pincode, []).get(s.pincode)!).push(s);
    const meanOf = (list: StorePin[]) => ({
        lat: list.reduce((a, s) => a + s.lat, 0) / list.length,
        lng: list.reduce((a, s) => a + s.lng, 0) / list.length,
    });

    const rows = new Map<string, Row>(centres.map(c => [c.pincode, c]));
    let overridden = 0, added = 0;
    const suspect: { s: StorePin; km: number; offices: number }[] = [];

    for (const [pincode, list] of byPin) {
        const centre = rows.get(pincode);
        const pin = meanOf(list);

        if (!centre) {
            // Absent from the national file entirely: the store is all we have.
            rows.set(pincode, {
                pincode, lat: Number(pin.lat.toFixed(6)), lng: Number(pin.lng.toFixed(6)),
                district: list[0].city, state: list[0].state,
                offices: 0, discarded: 0, source: 'store',
            });
            added++;
            continue;
        }

        const trusted = list.filter(s => s.code && TRUSTED_STORE_PINS.has(s.code));
        if (trusted.length) {
            const t = meanOf(trusted);
            rows.set(pincode, { ...centre, lat: Number(t.lat.toFixed(6)), lng: Number(t.lng.toFixed(6)), source: 'store' });
            overridden++;
            continue;
        }

        if (centre.offices <= WEAK_OFFICES) {
            rows.set(pincode, { ...centre, lat: Number(pin.lat.toFixed(6)), lng: Number(pin.lng.toFixed(6)), source: 'store' });
            overridden++;
            continue;
        }

        for (const s of list) {
            const km = distanceKm(s, centre);
            if (km > DISAGREE_KM) suspect.push({ s, km, offices: centre.offices });
        }
    }

    const all = [...rows.values()];
    const bySource = all.reduce<Record<string, number>>((m, r) => ((m[r.source] = (m[r.source] || 0) + 1), m), {});
    console.log(`\n  from India Post offices : ${(bySource['india-post'] || 0).toLocaleString()}`);
    console.log(`  from the district       : ${(bySource['district'] || 0).toLocaleString()}  (every office was a placeholder)`);
    console.log(`  from our store pins     : ${(bySource['store'] || 0).toLocaleString()}  (${overridden} weak or hand-checked, ${added} missing from the file)`);

    if (suspect.length) {
        console.log(`\nStore pins that disagree with a well-supported pincode by more than ${DISAGREE_KM} km —`);
        console.log('India Post was kept; these pins are worth checking:');
        suspect.sort((a, b) => b.km - a.km).forEach(({ s, km, offices }) =>
            console.log(`   ${String(s.code || '-').padEnd(8)} ${s.name.slice(0, 30).padEnd(30)} ${s.pincode}  ${km.toFixed(0).padStart(5)} km  (pincode from ${offices} offices)`));
    }

    if (dry) {
        console.log('\n--dry: nothing written.');
        process.exit(0);
    }

    // Build beside the live table, then swap in one atomic rename.
    await db.execute('DROP TABLE IF EXISTS pincode_geo_next');
    await db.execute(`
        CREATE TABLE pincode_geo_next (
            pincode    CHAR(6)      NOT NULL,
            lat        DECIMAL(9,6) NOT NULL,
            lng        DECIMAL(9,6) NOT NULL,
            district   VARCHAR(120) NULL,
            state      VARCHAR(120) NULL,
            offices    SMALLINT     NOT NULL DEFAULT 1,
            source     VARCHAR(40)  NOT NULL DEFAULT 'india-post',
            updated_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (pincode),
            KEY idx_pincode_state (state)
        /* utf8mb4_unicode_ci to match vendor_details.pincode: MySQL 8 would
           otherwise default to utf8mb4_0900_ai_ci, and joining the two on
           pincode fails outright with an illegal-mix-of-collations error. */
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    const BATCH = 500;
    for (let i = 0; i < all.length; i += BATCH) {
        const slice = all.slice(i, i + BATCH);
        await db.execute(
            `INSERT INTO pincode_geo_next (pincode, lat, lng, district, state, offices, source)
             VALUES ${slice.map(() => '(?, ?, ?, ?, ?, ?, ?)').join(', ')}`,
            slice.flatMap(r => [r.pincode, r.lat, r.lng, r.district, r.state, r.offices, r.source])
        );
    }

    const [[{ n }]]: any = await db.execute('SELECT COUNT(*) AS n FROM pincode_geo_next');
    if (Number(n) !== all.length) throw new Error(`wrote ${n} rows, expected ${all.length} — live table left untouched`);

    const [[exists]]: any = await db.execute("SELECT COUNT(*) AS c FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pincode_geo'");
    if (Number(exists.c)) {
        await db.execute('DROP TABLE IF EXISTS pincode_geo_previous');
        await db.execute('RENAME TABLE pincode_geo TO pincode_geo_previous, pincode_geo_next TO pincode_geo');
    } else {
        await db.execute('RENAME TABLE pincode_geo_next TO pincode_geo');
    }

    console.log(`\nswapped in: ${Number(n).toLocaleString()} pincodes (the previous table is kept as pincode_geo_previous)`);
    process.exit(0);
}

main().catch(err => {
    console.error('Import failed:', err?.message || err);
    process.exit(1);
});
