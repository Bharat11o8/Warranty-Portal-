import db from '../config/database.js';
import { findAsmForPincode } from './asmTerritoryQuery.js';
import { findState } from './indianStates.js';
import {
    storesToOffer,
    distributorsToOffer,
    isTestAccount,
    parseCoordinate,
    isPincode,
    formatDistance,
    clampMinWarranties,
    RADIUS_KM,
    type LocatableStore,
} from './storeLocator.js';

/**
 * What a customer is offered for their pincode, read from the database.
 *
 *   stores within 15 km           → a list, the customer picks one
 *   else the ASM for the pincode  → one person, who gets the lead
 *   else the state's distributors → a list, the customer picks one
 *   else customer support         → one number
 *
 * Kept apart from storeLocator so the filtering stays testable without a
 * database; this file fetches the points, the settings and walks the chain.
 */

// ─── Settings ────────────────────────────────────────────────────────────────

const SETTING_KEY = 'store_locator';

export interface LocatorSettings {
    /** Only stores with at least this many approved warranties are offered. */
    min_warranties: number;
    /** The last resort: no store, no ASM and no distributor in the state. */
    support_phone: string;
    support_name: string;
    /**
     * Whether WhatsApp replies go to every customer. Off, only the numbers in
     * test_numbers get one; everyone else's enquiry is still recorded as a
     * lead, for the team to follow up by hand.
     */
    whatsapp_live: boolean;
    /** Last ten digits of the phones that get replies while not live. */
    test_numbers: string[];
}

/** At most this many test numbers — it is for a handful of people's phones. */
export const MAX_TEST_NUMBERS = 10;

const DEFAULTS: LocatorSettings = {
    // Leaves out only stores with no approved warranty at all — 131 of 339 as
    // of September 2026. An admin raises it from Lead Management.
    min_warranties: 1,
    support_phone: '',
    support_name: 'Autoform Customer Support',
    whatsapp_live: false,
    test_numbers: [],
};

/** The ten digits a phone is compared on: country code and formatting dropped. */
const tenDigits = (raw: unknown) => String(raw ?? '').replace(/\D/g, '').slice(-10);

function cleanTestNumbers(raw: unknown): string[] {
    const list = Array.isArray(raw) ? raw : String(raw ?? '').split(/[\s,;]+/);
    const out = [...new Set(list.map(tenDigits).filter(n => n.length === 10))];
    return out.slice(0, MAX_TEST_NUMBERS);
}

/** Whether this phone gets a WhatsApp reply from the locator right now. */
export function repliesTo(settings: LocatorSettings, phone: string): boolean {
    return settings.whatsapp_live || settings.test_numbers.includes(tenDigits(phone));
}

export async function getLocatorSettings(): Promise<LocatorSettings> {
    try {
        const [rows]: any = await db.execute(
            'SELECT setting_value FROM system_settings WHERE setting_key = ? LIMIT 1',
            [SETTING_KEY]
        );
        if (!rows.length) return { ...DEFAULTS };
        const stored = JSON.parse(rows[0].setting_value || '{}');
        return {
            min_warranties: clampMinWarranties(stored.min_warranties ?? DEFAULTS.min_warranties),
            // Read under the old company_* names too: settings saved before the
            // rename would otherwise lose their number without anyone noticing.
            support_phone: String(stored.support_phone ?? stored.company_phone ?? DEFAULTS.support_phone).trim(),
            support_name: String(stored.support_name ?? '').trim() || DEFAULTS.support_name,
            // Only a stored true switches it on: anything unreadable stays off.
            whatsapp_live: stored.whatsapp_live === true,
            test_numbers: cleanTestNumbers(stored.test_numbers ?? []),
        };
    } catch (error) {
        // An unreadable setting must not take the locator down with it.
        console.error('[Locator] Could not read settings, using defaults:', error);
        return { ...DEFAULTS };
    }
}

/**
 * Save the settings, keeping anything the caller did not send.
 *
 * The support number is checked — digits only, 10 to 12 of them — because it
 * is the one number a customer with nowhere else to go is told to ring, and a
 * typo there leaves them nowhere.
 */
export async function saveLocatorSettings(
    changes: Partial<LocatorSettings>,
    updatedBy: string | null,
): Promise<LocatorSettings> {
    const current = await getLocatorSettings();
    const next: LocatorSettings = { ...current };

    if (changes.min_warranties !== undefined) {
        next.min_warranties = clampMinWarranties(changes.min_warranties);
    }
    if (changes.support_phone !== undefined) {
        const digits = String(changes.support_phone).replace(/\D/g, '');
        if (digits && (digits.length < 10 || digits.length > 12)) {
            throw new Error('The customer support number should be 10 to 12 digits');
        }
        next.support_phone = digits;
    }
    if (changes.support_name !== undefined) {
        next.support_name = String(changes.support_name).trim().slice(0, 80) || DEFAULTS.support_name;
    }
    if (changes.whatsapp_live !== undefined) {
        next.whatsapp_live = changes.whatsapp_live === true;
    }
    if (changes.test_numbers !== undefined) {
        const given = Array.isArray(changes.test_numbers) ? changes.test_numbers : [changes.test_numbers];
        const bad = given.map(String).filter(n => n.trim() && tenDigits(n).length !== 10);
        if (bad.length) throw new Error(`Not a 10-digit mobile number: ${bad.join(', ')}`);
        next.test_numbers = cleanTestNumbers(given);
    }

    await db.execute(
        `INSERT INTO system_settings (setting_key, setting_value, updated_by)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_by = VALUES(updated_by)`,
        [SETTING_KEY, JSON.stringify(next), updatedBy]
    );
    return next;
}

// ─── Shapes ──────────────────────────────────────────────────────────────────

export interface OfferedStoreRow {
    id: string;
    store_code: string | null;
    store_name: string;
    address: string | null;
    city: string | null;
    pincode: string | null;
    phone: string | null;
    warranties: number;
    distance_km: number;
    distance_label: string;
}

/** Someone a customer can be put in touch with when no store is near. */
export interface Contact {
    id: string | null;
    name: string;
    phone: string | null;
    city?: string | null;
    distance_km?: number | null;
    distance_label?: string | null;
}

/**
 * What happens when no store qualifies.
 *
 * `asm` and `support` carry one contact, who gets the lead. `distributor`
 * carries every active distributor in the state, and the customer picks — the
 * lead goes to whichever they choose, as it does with a store.
 */
export interface LocatorFallback {
    kind: 'asm' | 'distributor' | 'support';
    contacts: Contact[];
}

export interface LocatorResult {
    pincode: string;
    found: boolean;
    customer: { lat: number; lng: number; district: string | null; state: string | null } | null;
    rules: { radius_km: number; min_warranties: number };
    stores: OfferedStoreRow[];
    /** Present only when no store qualified. */
    fallback: LocatorFallback | null;
    reason?: string;
}

// ─── Lookups ─────────────────────────────────────────────────────────────────

/**
 * Approved warranties per store.
 *
 * A warranty reaches a store four ways: through its staff (manpower), from the
 * franchise's own account, through the legacy "owner-<id>" link, and by the
 * installer's name and email. The overview screen counts activity the same
 * way. A warranty matching two of these must count once, so the pairs are
 * de-duplicated before counting rather than the four counts being added.
 */
async function warrantyCounts(): Promise<Map<string, number>> {
    const [rows]: any = await db.execute(`
        SELECT franchise_id, COUNT(DISTINCT warranty_id) AS n FROM (
            SELECT m.vendor_id AS franchise_id, wr.id AS warranty_id
              FROM manpower m
              JOIN warranty_registrations wr ON wr.manpower_id = m.id
             WHERE wr.status = 'validated'
            UNION
            SELECT vd.id, wr.id
              FROM warranty_registrations wr
              JOIN vendor_details vd ON vd.user_id = wr.user_id
             WHERE wr.status = 'validated'
            UNION
            SELECT vd.id, wr.id
              FROM warranty_registrations wr
              JOIN vendor_details vd ON wr.manpower_id = CONCAT('owner-', vd.id)
             WHERE wr.status = 'validated'
            UNION
            SELECT vd.id, wr.id
              FROM warranty_registrations wr
              JOIN vendor_details vd
                ON wr.installer_name = vd.store_name
               AND wr.installer_contact = vd.store_email
             WHERE wr.status = 'validated'
        ) attributed
        GROUP BY franchise_id
    `);
    /* Keyed as text: vendor_details.id is a UUID. Converting it with Number()
       gave NaN for every store, and a Map treats every NaN as the same key, so
       all 339 stores read back one store's count. */
    return new Map(rows.map((r: any) => [String(r.franchise_id), Number(r.n)]));
}

/**
 * Every active distributor in the customer's state, alphabetically.
 *
 * Only distributors on the admin Distributors list: a row in `distributors`
 * whose linked store account is flagged is_distributor. The table also holds
 * rows that were never switched on — "Autoform Brand Store", set up against an
 * internal number, and MAHAVEER in Jaisalmer — and a lead handed to either goes
 * nowhere. The same rule as getAllDistributors, so the two screens agree.
 *
 * States are compared through findState rather than as text: the distributors
 * table writes "punjab", "PUNJAB" and "J&K" where pincode_geo writes "PUNJAB"
 * and "JAMMU AND KASHMIR".
 */
async function distributorsInState(
    customer: { lat: number; lng: number; state: string | null },
): Promise<Contact[]> {
    const customerState = findState(String(customer.state ?? ''))?.state;
    if (!customerState) return [];

    const [rows]: any = await db.execute(
        `SELECT d.id, d.name, d.phone_number, d.city, d.state, pg.lat, pg.lng
           FROM distributors d
           JOIN vendor_details vd ON vd.user_id = d.profile_id
           LEFT JOIN pincode_geo pg ON pg.pincode = d.pincode
          WHERE d.profile_id IS NOT NULL
            AND vd.is_distributor = TRUE`
    );

    interface DistributorPoint {
        id: string; name: string; phone_number: string; city: string | null; lat: number; lng: number;
    }
    const inState: DistributorPoint[] = rows
        .filter((r: any) => !isTestAccount(r.name))
        .filter((r: any) => r.phone_number)
        .filter((r: any) => findState(String(r.state ?? ''))?.state === customerState)
        .map((r: any) => ({ ...r, lat: Number(r.lat), lng: Number(r.lng) }));

    return distributorsToOffer(customer, inState).map(({ distributor, distanceKm }) => ({
        id: String(distributor.id),
        name: String(distributor.name).trim(),
        phone: distributor.phone_number,
        city: distributor.city || null,
        distance_km: distanceKm === null ? null : Number(distanceKm.toFixed(2)),
        distance_label: distanceKm === null ? null : formatDistance(distanceKm),
    }));
}

/**
 * Who a customer is put in touch with when no store qualifies.
 *
 * The ASM whose territory holds their pincode first — their state, their
 * district, or the pincode itself: a person who knows the area and can place
 * them with a store further out. Then the state's distributors, for the
 * customer to choose from. Customer support only when the state has neither.
 */
async function fallbackFor(
    pincode: string,
    customer: { lat: number; lng: number; district: string | null; state: string | null } | null,
    settings: LocatorSettings,
): Promise<LocatorFallback> {
    if (customer) {
        const asm = await findAsmForPincode(pincode, { pincode, district: customer.district, state: customer.state })
            .catch(() => null);
        if (asm?.phone_number) {
            return { kind: 'asm', contacts: [{ id: asm.id, name: asm.name, phone: asm.phone_number }] };
        }

        const distributors = await distributorsInState(customer).catch(() => [] as Contact[]);
        if (distributors.length) return { kind: 'distributor', contacts: distributors };
    }

    return {
        kind: 'support',
        contacts: [{ id: null, name: settings.support_name, phone: settings.support_phone || null }],
    };
}

export async function findStoresForPincode(rawPincode: string): Promise<LocatorResult> {
    const pincode = String(rawPincode ?? '').trim();
    const settings = await getLocatorSettings();
    const rules = { radius_km: RADIUS_KM, min_warranties: settings.min_warranties };

    if (!isPincode(pincode)) {
        return { pincode, found: false, customer: null, rules, stores: [],
            fallback: null, reason: 'Not a valid 6-digit pincode' };
    }

    const [pinRows]: any = await db.execute(
        'SELECT lat, lng, district, state FROM pincode_geo WHERE pincode = ? LIMIT 1',
        [pincode]
    );
    if (!pinRows.length) {
        // A real pincode we cannot place still gets someone to call.
        return { pincode, found: false, customer: null, rules, stores: [],
            fallback: await fallbackFor(pincode, null, settings),
            reason: 'Pincode not in the India Post directory' };
    }

    const customer = {
        lat: Number(pinRows[0].lat),
        lng: Number(pinRows[0].lng),
        district: pinRows[0].district,
        state: pinRows[0].state,
    };

    const [[storeRows], counts]: any = await Promise.all([
        db.execute(
            `SELECT vd.id, vd.store_code, vd.store_name, vd.address, vd.city, vd.pincode,
                    vd.latitude, vd.longitude, p.phone_number
               FROM vendor_details vd
               JOIN vendor_verification vv ON vv.user_id = vd.user_id AND vv.is_verified = 1
               LEFT JOIN profiles p ON p.id = vd.user_id
              WHERE vd.is_franchise = 1`
        ),
        warrantyCounts(),
    ]);

    const stores: (LocatableStore & { row: any })[] = [];
    for (const row of storeRows) {
        if (isTestAccount(row.store_name)) continue;
        const lat = parseCoordinate(row.latitude);
        const lng = parseCoordinate(row.longitude);
        if (lat === null || lng === null) continue;
        stores.push({
            id: row.id,
            store_name: row.store_name,
            lat,
            lng,
            warranties: counts.get(String(row.id)) ?? 0,
            row,
        });
    }

    const offered = storesToOffer(customer, stores, {
        radiusKm: RADIUS_KM,
        minWarranties: settings.min_warranties,
    });

    return {
        pincode,
        found: true,
        customer,
        rules,
        stores: offered.map(({ store, distanceKm }) => ({
            id: String(store.row.id),
            store_code: store.row.store_code || null,
            store_name: store.row.store_name,
            address: store.row.address || null,
            city: store.row.city || null,
            pincode: store.row.pincode || null,
            phone: store.row.phone_number || null,
            warranties: store.warranties,
            distance_km: Number(distanceKm.toFixed(2)),
            distance_label: formatDistance(distanceKm),
        })),
        fallback: offered.length ? null : await fallbackFor(pincode, customer, settings),
        reason: offered.length ? undefined
            : `No store within ${RADIUS_KM} km with ${settings.min_warranties}+ approved warranties`,
    };
}
