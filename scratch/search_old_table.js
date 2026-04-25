import mysql from 'mysql2/promise';

async function searchOld() {
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

        console.log('Searching by UID in old_warranties_seatcovers...');
        // For IN clause with mysql2/promise, we use [uids] where uids is an array
        const [rowsByUid] = await db.query(
            'SELECT * FROM old_warranties_seatcovers WHERE uid IN (?)',
            [uids]
        );
        console.log(`Found ${rowsByUid.length} records by UID.`);
        if (rowsByUid.length > 0) {
            console.log('Found UIDs:', rowsByUid.map(r => r.uid));
            console.log('Sample match:', JSON.stringify(rowsByUid[0], null, 2));
        }

        console.log('\nChecking columns of old_warranties_seatcovers...');
        const [cols] = await db.query('SHOW COLUMNS FROM old_warranties_seatcovers');
        const colNames = cols.map(c => c.Field);
        console.log('Columns:', colNames.join(', '));

        const registrationNumbers = ['UP15BW9080', 'DL12CM9796', 'HR26EN5846'];
        
        let regCol = colNames.find(c => c.toLowerCase().includes('reg') || c.toLowerCase().includes('vehicle'));
        if (regCol) {
            console.log(`Searching by ${regCol}...`);
            const [rowsByReg] = await db.query(
                `SELECT * FROM old_warranties_seatcovers WHERE ${regCol} IN (?)`,
                [registrationNumbers]
            );
            console.log(`Found ${rowsByReg.length} records by registration number.`);
            if (rowsByReg.length > 0) {
                 console.log('Sample from Reg match:', JSON.stringify(rowsByReg[0], null, 2));
            }
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await db.end();
    }
}

searchOld();
