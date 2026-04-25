import mysql from 'mysql2/promise';
import fs from 'fs';

async function main() {
    const db = await mysql.createConnection({
        host: 'srv839.hstgr.io',
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: 'u823909847_warranty'
    });

    // Load email store data (from vendor confirmation emails)
    const emailStoreData = JSON.parse(fs.readFileSync(new URL('./recovered_store_data.json', import.meta.url), 'utf8'));
    const emailMap = {};
    for (const s of emailStoreData) { emailMap[s.uid] = s; }

    // DB-found stores (from vendor_details lookup)
    const dbStoreMap = {
        '25100402380610': { storeName: 'CAR WORLD', storeEmail: null },
        '25102302384412': { storeName: 'CAR WORLD', storeEmail: null },
        '26030202421275': { storeName: 'AUTOCRAFT CAR ACCESSORIES', storeEmail: null },
        '25081602368091': { storeName: 'Avs Motors', storeEmail: null },
        '26031602424705': { storeName: 'CAR DYNAMIC PVT LTD', storeEmail: 'cardynamic@outlook.com' },
        '25122902403812': { storeName: 'BHARAT MOTOR', storeEmail: null },
    };

    // Get emails for the DB-found stores
    const [vdAll] = await db.execute('SELECT user_id, store_name, store_email FROM vendor_details');
    const vendorByStore = {};
    for (const v of vdAll) {
        vendorByStore[v.store_name] = v.store_email;
    }

    // Merge: DB stores + Email stores
    const [warranties] = await db.execute('SELECT id, uid, customer_name, product_details FROM warranty_registrations WHERE id BETWEEN 1 AND 16');

    const finalMapping = [];

    for (const w of warranties) {
        let storeName = null;
        let storeEmail = null;
        let source = '';

        // Priority 1: DB vendor_details
        if (dbStoreMap[w.uid]) {
            storeName = dbStoreMap[w.uid].storeName;
            storeEmail = dbStoreMap[w.uid].storeEmail || vendorByStore[storeName] || null;
            source = 'vendor_details';
        }

        // Priority 2: Email recovery
        if (!storeName && emailMap[w.uid]) {
            storeName = emailMap[w.uid].storeName;
            storeEmail = emailMap[w.uid].storeEmail;
            source = 'email_recovery';
        }

        // Priority 3: Notifications - search for the UID or customer name in messages
        if (!storeName) {
            const [notifs] = await db.execute(
                'SELECT message FROM notifications WHERE message LIKE ? LIMIT 10',
                ['%' + w.customer_name.split(' ')[0] + '%']
            );
            for (const n of notifs) {
                const match = n.message.match(/registered by (.+)/);
                if (match) {
                    storeName = match[1].trim();
                    storeEmail = vendorByStore[storeName] || null;
                    source = 'notifications';
                    break;
                }
                // Also check "through your store for Customer"
                const match2 = n.message.match(/through your store for/);
                if (match2) {
                    // This notification was sent to the vendor, check metadata or other notifs
                    // for the same customer to find the store
                }
            }
        }

        // Priority 4: product_details already has the manpowerId -> look up the manpower's vendor
        if (!storeName) {
            try {
                const pd = JSON.parse(w.product_details);
                if (pd.manpowerId) {
                    const idStr = pd.manpowerId;
                    if (idStr.startsWith('owner-')) {
                        // owner means the vendor themselves submitted it
                        // user_id is the vendor profile_id
                        const [wr] = await db.execute('SELECT user_id FROM warranty_registrations WHERE uid = ?', [w.uid]);
                        if (wr.length > 0) {
                            const [vd2] = await db.execute('SELECT store_name, store_email FROM vendor_details WHERE user_id = ?', [wr[0].user_id]);
                            if (vd2.length > 0) {
                                storeName = vd2[0].store_name;
                                storeEmail = vd2[0].store_email;
                                source = 'manpowerId(owner)->vendor_details';
                            }
                        }
                    }
                }
            } catch(e) {}
        }

        finalMapping.push({
            id: w.id,
            uid: w.uid,
            customerName: w.customer_name,
            storeName: storeName || 'UNKNOWN',
            storeEmail: storeEmail || 'UNKNOWN',
            source
        });

        const status = storeName ? '✅' : '❌';
        console.log(`${status} ${w.id} | ${w.uid} | ${w.customer_name} -> ${storeName || 'UNKNOWN'} (${source || 'NOT FOUND'})`);
    }

    fs.writeFileSync(new URL('./store_recovery_final.json', import.meta.url), JSON.stringify(finalMapping, null, 2));
    
    const found = finalMapping.filter(r => r.storeName !== 'UNKNOWN').length;
    const missing = finalMapping.filter(r => r.storeName === 'UNKNOWN').length;
    console.log(`\nFinal: ${found} found, ${missing} still unknown.`);

    await db.end();
}

main();
