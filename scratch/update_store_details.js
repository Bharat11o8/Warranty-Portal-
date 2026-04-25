import mysql from 'mysql2/promise';

async function updateStoreDetails() {
    const db = await mysql.createConnection({
        host: 'srv839.hstgr.io',
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: 'u823909847_warranty'
    });

    // Complete store mapping for all 16 records
    const storeMapping = {
        '25100402380610': { storeName: 'CAR WORLD', storeEmail: null },
        '25102302384412': { storeName: 'CAR WORLD', storeEmail: null },
        '26030202421275': { storeName: 'AUTOCRAFT CAR ACCESSORIES', storeEmail: null },
        '25081602368091': { storeName: 'Avs Motors', storeEmail: null },
        '26031602424705': { storeName: 'CAR DYNAMIC PVT LTD', storeEmail: 'cardynamic@outlook.com' }, // This one was actually correct!
        '26031602424404': { storeName: 'AASHARY CAR ACCESSORIES', storeEmail: 'aashraycorp@gmail.com' },
        '25122902403812': { storeName: 'BHARAT MOTOR', storeEmail: null },
        '26010302405294': { storeName: 'UNITED AUTO LUDHIANA', storeEmail: 'unitedauto06@gmail.com' },
        '26021602417718': { storeName: 'NEELKHANTH CAR ACCESSORIES', storeEmail: 'neelkanthcaraccessories2007@gmail.com' },
        '26031902425824': { storeName: 'CAR ACCESSORIES JUNCTION', storeEmail: 'tyrejunctionplus@gmail.com' },
        '261480004540587': { storeName: 'UMIYA CAR ACCESSORIES & SPA', storeEmail: 'umiyacarspa1@gmail.com' },
        '26041302432606': { storeName: 'CAR PLUS', storeEmail: 'rachit.chopra123@gmail.com' },
        '26010802406519': { storeName: 'NEELKHANTH CAR ACCESSORIES', storeEmail: 'neelkanthcaraccessories2007@gmail.com' },
        '25122302402392': { storeName: 'GUPTA CAR ACCESSORIES', storeEmail: 'guptacaraccessories2825@gmail.com' },
        '26032502427391': { storeName: 'CAR PLUS', storeEmail: 'rachit.chopra123@gmail.com' },
        '26041302432620': { storeName: 'GENUINE AUTO SPARES', storeEmail: 'genuine28ch@yahoo.co.in' },
    };

    // Get vendor_details for store emails we don't have yet
    const [vdAll] = await db.execute('SELECT store_name, store_email FROM vendor_details');
    const vendorEmailMap = {};
    for (const v of vdAll) { vendorEmailMap[v.store_name] = v.store_email; }

    // Also need manpower IDs for each store
    const [vendors] = await db.execute('SELECT user_id, store_name FROM vendor_details');
    const vendorUserMap = {};
    for (const v of vendors) { vendorUserMap[v.store_name] = v.user_id; }

    console.log('--- Updating Store Details for 16 Corrupted Records ---\n');

    for (const [uid, store] of Object.entries(storeMapping)) {
        // Get current product_details
        const [rows] = await db.execute('SELECT id, product_details FROM warranty_registrations WHERE uid = ?', [uid]);
        if (rows.length === 0) {
            console.log(`❌ UID ${uid} not found in DB`);
            continue;
        }

        const record = rows[0];
        const pd = JSON.parse(record.product_details);

        // Update store details in product_details JSON
        pd.storeName = store.storeName;
        pd.storeEmail = store.storeEmail || vendorEmailMap[store.storeName] || pd.storeEmail;

        // Find the correct manpowerId for this store's vendor
        const vendorUserId = vendorUserMap[store.storeName];
        if (vendorUserId) {
            pd.manpowerId = 'owner-' + vendorUserId;
        }

        // Find the manpower name (the vendor's profile name)
        if (vendorUserId) {
            const [profile] = await db.execute('SELECT name FROM profiles WHERE id = ?', [vendorUserId]);
            if (profile.length > 0) {
                pd.manpowerName = profile[0].name;
            }
        }

        await db.execute(
            'UPDATE warranty_registrations SET product_details = ? WHERE uid = ?',
            [JSON.stringify(pd), uid]
        );

        console.log(`✅ ${record.id} | ${uid} -> ${store.storeName} (${pd.storeEmail || 'N/A'})`);
    }

    console.log('\n--- Store Details Restoration Complete ---');
    await db.end();
}

updateStoreDetails();
