import mysql from 'mysql2/promise';

async function checkPhotoCols() {
    const db = await mysql.createConnection({
        host: 'srv839.hstgr.io',
        user: 'u823909847_warr',
        password: '@V+S&7Fc?f3V',
        database: 'u823909847_warranty'
    });

    try {
        const uids = [
            '25100402380610', '25102302384412', '26030202421275', '25081602368091',
            '26031602424705', '26031602424404', '25122902403812', '26010302405294',
            '26021602417718', '26031902425824', '261480004540587', '26041302432606',
            '26010802406519', '25122302402392', '26032502427391', '26041302432620'
        ];

        console.log('Checking photo columns in warranty_registrations...');
        const [rows] = await db.query(
            'SELECT uid, seat_cover_photo_url, car_outer_photo_url FROM warranty_registrations WHERE uid IN (?)',
            [uids]
        );

        console.log(`Found ${rows.length} records.`);
        for (const row of rows) {
            console.log(`${row.uid}: SC=${row.seat_cover_photo_url ? 'YES' : 'NO'}, CO=${row.car_outer_photo_url ? 'YES' : 'NO'}`);
            if (row.seat_cover_photo_url) console.log(`  SC: ${row.seat_cover_photo_url}`);
            if (row.car_outer_photo_url) console.log(`  CO: ${row.car_outer_photo_url}`);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await db.end();
    }
}

checkPhotoCols();
