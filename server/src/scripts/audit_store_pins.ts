import db from '../config/database.js';
import { distanceKm } from '../services/pincodeCentre.js';
import { parseCoordinate, isInIndia, isTestAccount } from '../services/storeLocator.js';
import { findState } from '../services/indianStates.js';

/**
 * Check every store's pin before customers are sent to it.
 *
 * A store is found by its pin, so a wrong pin hides the store from the
 * customers next to it and offers it to customers somewhere else. RADHIKA CAR
 * DECORE sat in Pune for a Jaipur shop; SHIVAM AUTO MALL briefly held another
 * store's Ambala pin. Each check below is one of the ways that has happened.
 *
 * Read-only. Run:  npx tsx src/scripts/audit_store_pins.ts
 */

/** A pin this far from its own pincode's centre is worth a look. */
const WARN_KM = 15;
/** And this far is almost certainly wrong. */
const FAIL_KM = 30;

/** Internal accounts that are not shops but don't say "test" in their name. */
const NOT_STORES = new Set(['noida office']);

interface Finding { level: 'FAIL' | 'WARN'; code: string; store: string; city: string; issue: string; }

async function main(): Promise<void> {
    const [stores]: any = await db.execute(
        `SELECT vd.id, vd.store_code, vd.store_name, vd.city, vd.state, vd.pincode,
                vd.latitude, vd.longitude
           FROM vendor_details vd
           JOIN vendor_verification vv ON vv.user_id = vd.user_id AND vv.is_verified = 1
          WHERE vd.is_franchise = 1`
    );
    const [geo]: any = await db.execute('SELECT pincode, lat, lng, district, state, offices, source FROM pincode_geo');
    const G = new Map<string, any>(geo.map((g: any) => [g.pincode, { ...g, lat: Number(g.lat), lng: Number(g.lng) }]));
    const strong = [...G.values()].filter(g => g.offices >= 3);

    /** The well-supported pincode a point is nearest to — where a pin "lands". */
    const landsIn = (p: { lat: number; lng: number }) => {
        let best: any = null, d = Infinity;
        for (const g of strong) { const k = distanceKm(p, g); if (k < d) { d = k; best = g; } }
        return best;
    };

    const findings: Finding[] = [];
    const add = (level: Finding['level'], s: any, issue: string) => findings.push({
        level, code: s.store_code || '—', store: String(s.store_name).trim(), city: String(s.city ?? '').trim(), issue,
    });

    const byCoord = new Map<string, any[]>();
    let checked = 0;

    for (const s of stores) {
        if (isTestAccount(s.store_name) || NOT_STORES.has(String(s.store_name).trim().toLowerCase())) continue;
        checked++;

        const rawLat = String(s.latitude ?? '').trim();
        const rawLng = String(s.longitude ?? '').trim();
        const lat = parseCoordinate(s.latitude);
        const lng = parseCoordinate(s.longitude);

        // 1. Missing or malformed.
        if (lat === null || lng === null) {
            add('FAIL', s, 'No coordinates — never offered to any customer');
            continue;
        }
        if (!/^-?\d+(\.\d+)?$/.test(rawLat) || !/^-?\d+(\.\d+)?$/.test(rawLng)) {
            add('WARN', s, `Stray characters around the coordinates ("${rawLat}", "${rawLng}") — read correctly, but worth cleaning`);
        }

        // 2. Outside India.
        if (!isInIndia(lat, lng)) {
            add('FAIL', s, `Pin ${lat}, ${lng} is outside India`);
            continue;
        }

        const pin = { lat, lng };
        (byCoord.get(`${lat.toFixed(5)},${lng.toFixed(5)}`) ?? byCoord.set(`${lat.toFixed(5)},${lng.toFixed(5)}`, []).get(`${lat.toFixed(5)},${lng.toFixed(5)}`)!).push(s);

        // 3. Pincode placeable.
        const centre = G.get(String(s.pincode ?? '').trim());
        if (!centre) {
            add('WARN', s, `Pincode ${s.pincode} is not in pincode_geo — the store is still found by its pin`);
            continue;
        }

        // 4. Distance to its own pincode. Where a far pin lands is named, and
        // named as a different state when it is one.
        const d = distanceKm(pin, centre);
        if (d > WARN_KM) {
            const at = landsIn(pin);
            const own = findState(String(centre.state ?? ''))?.state;
            const there = findState(String(at?.state ?? ''))?.state;
            const where = own && there && own !== there ? `${at.district}, ${there} — another state` : `${at.district} (${at.pincode})`;
            add(d > FAIL_KM || where.includes('another state') ? 'FAIL' : 'WARN', s,
                `Pin is ${d.toFixed(0)} km from its pincode ${s.pincode}; it lands in ${where}`);
        }

        // 5. The state on record against the pincode's state. The store is
        // found by its pin either way, but the distributor fallback goes by
        // state, and a Chandigarh store filed under Punjab is filed wrong.
        // Checked only against a pincode India Post places, not one we took
        // from a store pin, which carries whatever state the store claimed.
        const onRecord = findState(String(s.state ?? ''))?.state;
        const ofPincode = centre.source === 'store' ? undefined : findState(String(centre.state ?? ''))?.state;
        if (onRecord && ofPincode && onRecord !== ofPincode) {
            add('WARN', s, `State on record is ${onRecord}, but pincode ${s.pincode} is in ${ofPincode}`);
        }
    }

    // 6. Two different stores on the same spot.
    for (const [coord, list] of byCoord) {
        const names = new Set(list.map((s: any) => String(s.store_name).trim().toLowerCase()));
        if (list.length > 1 && names.size > 1) {
            for (const s of list) {
                const others = list.filter((o: any) => o.id !== s.id).map((o: any) => o.store_name).join(', ');
                add('WARN', s, `Same exact pin (${coord}) as ${others} — a copied pin, or two shops in one building`);
            }
        }
    }

    // 7. pincode_geo rows taken from a store pin that has since moved.
    const stale: string[] = [];
    const pinsByPincode = new Map<string, { lat: number; lng: number }[]>();
    for (const s of stores) {
        const lat = parseCoordinate(s.latitude), lng = parseCoordinate(s.longitude);
        if (lat === null || lng === null || isTestAccount(s.store_name)) continue;
        (pinsByPincode.get(s.pincode) ?? pinsByPincode.set(s.pincode, []).get(s.pincode)!).push({ lat, lng });
    }
    for (const g of G.values()) {
        if (g.source !== 'store') continue;
        const pins = pinsByPincode.get(g.pincode);
        if (!pins) continue;
        const mean = { lat: pins.reduce((a, p) => a + p.lat, 0) / pins.length, lng: pins.reduce((a, p) => a + p.lng, 0) / pins.length };
        const moved = distanceKm(mean, g);
        if (moved > 1) stale.push(`${g.pincode} (moved ${moved.toFixed(1)} km)`);
    }

    // ── Report ──
    const fails = findings.filter(f => f.level === 'FAIL');
    const warns = findings.filter(f => f.level === 'WARN');
    console.log(`\nStores checked: ${checked}`);
    console.log(`  FAIL: ${fails.length}   WARN: ${warns.length}   clean: ${checked - new Set(findings.map(f => f.code + f.store)).size}`);

    const print = (list: Finding[]) => list.forEach(f =>
        console.log(`   ${f.code.padEnd(9)} ${f.store.slice(0, 30).padEnd(30)} ${f.city.slice(0, 13).padEnd(13)} ${f.issue}`));
    if (fails.length) { console.log('\nFAIL — customers are being sent to the wrong place:'); print(fails); }
    if (warns.length) { console.log('\nWARN — worth a look:'); print(warns); }

    console.log(stale.length
        ? `\npincode_geo built from store pins that have since moved: ${stale.join(', ')} — re-run the import`
        : '\npincode_geo is in step with every store pin it was built from.');
    process.exit(0);
}

main().catch(err => { console.error('Audit failed:', err?.message || err); process.exit(1); });
