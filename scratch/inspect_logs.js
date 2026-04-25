import mysql from 'mysql2/promise';

async function checkLogs() {
    const db = await mysql.createConnection({
        host: 'srv839.hstgr.io',
        user: 'u823909847_warr',
        password: '@V+S&7Fc?f3V',
        database: 'u823909847_warranty'
    });

    try {
        const uid = '26041302432606';
        console.log(`Checking logs for UID: ${uid}`);

        const [notifs] = await db.execute('SELECT * FROM notifications WHERE message LIKE ? OR metadata LIKE ?', [`%${uid}%`, `%${uid}%`]);
        console.log('Notifications:', JSON.stringify(notifs, null, 2));

        const [msgLogs] = await db.execute('SELECT * FROM message_logs WHERE message_body LIKE ?', [`%${uid}%`]);
        console.log('Message Logs:', JSON.stringify(msgLogs, null, 2));

        const [otpLogs] = await db.execute('SELECT * FROM warranty_verification_otps WHERE uid = ?', [uid]);
        console.log('OTP Logs:', JSON.stringify(otpLogs, null, 2));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await db.end();
    }
}

checkLogs();
