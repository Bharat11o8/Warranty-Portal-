import mysql from 'mysql2/promise';
import fs from 'fs';

async function extractPreciseData() {
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

        const logData = [];

        for (const uid of uids) {
            console.log(`Checking logs for UID: ${uid}`);
            
            // Search in context as it might be a JSON field
            const [rows] = await db.execute(
                'SELECT * FROM message_logs WHERE context LIKE ? OR reference_id = ?', 
                [`%${uid}%`, uid]
            );

            if (rows.length > 0) {
                console.log(`Successfully found logs for UID ${uid}: ${rows.length} entries`);
                logData.push({
                    uid,
                    logs: rows.map(r => ({
                        template: r.template_name,
                        context: typeof r.context === 'string' ? JSON.parse(r.context) : r.context
                    }))
                });
            } else {
                console.log(`No precise logs found for UID ${uid}`);
            }
        }

        fs.writeFileSync('./scratch/precise_log_data.json', JSON.stringify(logData, null, 2));
        console.log('\nExtracted precise data to scratch/precise_log_data.json');

    } catch (error) {
        console.error('Error during extraction:', error);
    } finally {
        await db.end();
    }
}

extractPreciseData();
