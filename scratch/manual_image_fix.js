const mysql = require('mysql2/promise');

const dbConfig = {
    host: 'srv839.hstgr.io',
    user: 'u823909847_warr',
    password: '@V+S&7Fc?f3V',
    database: 'u823909847_warranty'
};

const updates = [
    {
        uid: '26041002431893',
        changes: { carOuter: 'https://res.cloudinary.com/dmwt4rg4m/image/upload/v1776853298/warranty-portal/iud1qbazqnlsydau5uq2.jpg' }
    },
    {
        uid: '2203210281154',
        changes: { vehicle: 'https://res.cloudinary.com/dmwt4rg4m/image/upload/v1776856519/warranty-portal/ofmbw9ui4g1wnsesnf5w.jpg' }
    },
    {
        uid: '26010802406519',
        changes: { 
            seatCover: 'https://res.cloudinary.com/dmwt4rg4m/image/upload/v1776851259/warranty-portal/c12vzgxhswg5ub9y7lpq.jpg',
            invoiceFileName: 'https://res.cloudinary.com/dmwt4rg4m/image/upload/v1776851258/warranty-portal/jeiyg3ozapjaeay25gb9.jpg'
        }
    }
];

async function applyManualCorrections() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database.');

        for (const update of updates) {
            // First, get the current product_details
            const [rows] = await connection.query(
                'SELECT product_details FROM warranty_registrations WHERE uid = ?', 
                [update.uid]
            );

            if (rows.length === 0) {
                console.warn(`UID ${update.uid} not found.`);
                continue;
            }

            let productDetails = rows[0].product_details;
            if (typeof productDetails === 'string') {
                productDetails = JSON.parse(productDetails);
            }

            // Apply changes
            for (const [key, value] of Object.entries(update.changes)) {
                productDetails[key] = value;
                console.log(`Updating ${update.uid}: ${key} -> ${value}`);
            }

            // Update back to DB
            const updatedJson = JSON.stringify(productDetails);
            await connection.query(
                'UPDATE warranty_registrations SET product_details = ? WHERE uid = ?',
                [updatedJson, update.uid]
            );
            console.log(`Successfully updated UID ${update.uid}`);
        }

        console.log('All manual corrections applied.');
    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (connection) await connection.end();
    }
}

applyManualCorrections();
