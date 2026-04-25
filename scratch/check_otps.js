import mysql from 'mysql2/promise';

async function checkOtps() {
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

        console.log('Checking warranty_verification_otps...');
        const [rows] = await db.query(
            'SELECT * FROM warranty_verification_otps WHERE uid IN (?)',
            [uids]
        );

        console.log(`Found ${rows.length} OTP records.`);
        if (rows.length > 0) {
            console.log('Sample OTP Record:', JSON.stringify(rows[0], null, 2));
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await db.end();
    }
}

checkOtps();
