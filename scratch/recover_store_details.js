import mysql from 'mysql2/promise';
import fs from 'fs';

async function recoverStoreDetails() {
    const db = await mysql.createConnection({
        host: 'srv839.hstgr.io',
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: 'u823909847_warranty'
    });

    console.log('--- Recovering Store Details for 16 Corrupted Records ---\n');

    // Load the email-recovered store data
    let emailStoreData = [];
    try {
        emailStoreData = JSON.parse(fs.readFileSync('./recovered_store_data.json', 'utf8'));
    } catch(e) { console.log('No email store data file found, continuing with DB lookup only.'); }
    
    const emailStoreMap = {};
    for (const s of emailStoreData) {
        emailStoreMap[s.uid] = s;
    }

    const [warranties] = await db.execute('SELECT id, uid, user_id, customer_name, product_details FROM warranty_registrations WHERE id BETWEEN 1 AND 16');
    
    const results = [];

    for (const w of warranties) {
        let storeName = null;
        let storeEmail = null;
        let manpowerName = null;
        let manpowerId = null;
        let source = '';

        // Strategy 1: Check vendor_details table via user_id
        const [vd] = await db.execute('SELECT store_name, store_email, user_id FROM vendor_details WHERE user_id = ?', [w.user_id]);
        if (vd.length > 0) {
            storeName = vd[0].store_name;
            storeEmail = vd[0].store_email;
            source = 'vendor_details (direct)';
        }

        // Strategy 2: Check if user is manpower -> find parent vendor
        if (!storeName) {
            try {
                const [mp] = await db.execute('SELECT id, name, vendor_id FROM manpower WHERE profile_id = ?', [w.user_id]);
                if (mp.length > 0) {
                    manpowerName = mp[0].name;
                    const [parentVendor] = await db.execute('SELECT store_name, store_email FROM vendor_details WHERE user_id = ?', [mp[0].vendor_id]);
                    if (parentVendor.length > 0) {
                        storeName = parentVendor[0].store_name;
                        storeEmail = parentVendor[0].store_email;
                        source = 'manpower -> vendor_details';
                    }
                }
            } catch(e) { /* manpower table might have different schema */ }
        }

        // Strategy 3: Check email-recovered store data
        if (!storeName && emailStoreMap[w.uid]) {
            storeName = emailStoreMap[w.uid].storeName;
            storeEmail = emailStoreMap[w.uid].storeEmail;
            source = 'email (vendor confirmation)';
        }

        // Strategy 4: Check product_details for manpowerId -> resolve vendor
        if (!storeName) {
            try {
                const pd = JSON.parse(w.product_details);
                if (pd.manpowerId) {
                    // manpowerId might be like "owner-UUID" or just an ID
                    const mpIdParts = pd.manpowerId.split('-');
                    const mpType = mpIdParts[0];
                    if (mpType === 'owner') {
                        // The owner IS the vendor, user_id is the vendor
                        // Already checked above, skip
                    } else {
                        // Try to find the manpower by their ID
                        const mpUuid = pd.manpowerId;
                        const [mp] = await db.execute('SELECT id, name, vendor_id FROM manpower WHERE id = ?', [mpUuid]);
                        if (mp.length > 0) {
                            manpowerName = mp[0].name;
                            const [parentVendor] = await db.execute('SELECT store_name, store_email FROM vendor_details WHERE user_id = ?', [mp[0].vendor_id]);
                            if (parentVendor.length > 0) {
                                storeName = parentVendor[0].store_name;
                                storeEmail = parentVendor[0].store_email;
                                source = 'product_details.manpowerId -> vendor';
                            }
                        }
                    }
                }
            } catch(e) { /* parse error */ }
        }

        // Strategy 5: Check notifications
        if (!storeName) {
            try {
                const [notifs] = await db.execute(
                    "SELECT message FROM notifications WHERE reference_id = ? AND message LIKE '%registered by%' LIMIT 1",
                    [w.uid]
                );
                if (notifs.length > 0) {
                    const storeMatch = notifs[0].message.match(/registered by (.+)/);
                    if (storeMatch) {
                        storeName = storeMatch[1].trim();
                        source = 'notifications';
                    }
                }
            } catch(e) { /* skip */ }
        }

        results.push({
            id: w.id,
            uid: w.uid,
            customerName: w.customer_name,
            storeName: storeName || 'UNKNOWN',
            storeEmail: storeEmail || 'UNKNOWN',
            manpowerName: manpowerName,
            source: source || 'NOT FOUND'
        });

        console.log(`${w.id} | ${w.uid} | ${w.customer_name} -> ${storeName || 'UNKNOWN'} (${source || 'NOT FOUND'})`);
    }

    fs.writeFileSync('./store_recovery_mapping.json', JSON.stringify(results, null, 2));
    console.log('\nSaved full mapping to scratch/store_recovery_mapping.json');
    
    const found = results.filter(r => r.storeName !== 'UNKNOWN').length;
    const missing = results.filter(r => r.storeName === 'UNKNOWN').length;
    console.log(`\nResults: ${found} found, ${missing} still unknown.`);

    await db.end();
}

recoverStoreDetails();
