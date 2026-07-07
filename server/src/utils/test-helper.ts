import pool from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import { NotificationService } from '../services/notification.service.js';

export async function runIntegrationTest() {
    const results: any = {
        success: false,
        steps: []
    };

    try {
        const testUid = "9999999999999";
        const testProductName = "TEST AUTO PRODUCT " + Date.now();

        results.steps.push("1. Cleaning up any previous test data...");
        await pool.query("DELETE FROM pre_generated_uids WHERE uid = ?", [testUid]);
        await pool.query("DELETE FROM products WHERE name LIKE 'TEST AUTO PRODUCT %'");

        results.steps.push(`2. Syncing test UID ${testUid} with product name "${testProductName}"`);
        // Import controller dynamically to avoid circular dependencies
        const { UIDController } = await import('../controllers/uid.controller.js');
        
        let responseJson: any = null;
        let responseStatus: number = 200;

        const mockReq: any = {
            body: {
                uids: [
                    { uid: testUid, product_name: testProductName }
                ]
            }
        };

        const mockRes: any = {
            status: (code: number) => {
                responseStatus = code;
                return mockRes;
            },
            json: (data: any) => {
                responseJson = data;
                return mockRes;
            }
        };

        await UIDController.syncUIDs(mockReq, mockRes);
        results.syncResponse = { status: responseStatus, body: responseJson };

        results.steps.push("3. Verifying UID insertion...");
        const [uidRows]: any = await pool.query(
            "SELECT uid, is_used, product_name, source FROM pre_generated_uids WHERE uid = ?",
            [testUid]
        );
        results.uidInDb = uidRows;

        results.steps.push("4. Verifying Product auto-registration...");
        const [productRows]: any = await pool.query(
            "SELECT id, name, type, warranty_years FROM products WHERE name = ?",
            [testProductName]
        );
        results.productInDb = productRows;

        results.steps.push("5. Verifying Admin notification broadcast...");
        // Select notifications matching product name
        const [notificationRows]: any = await pool.query(
            "SELECT title, message, type FROM notifications WHERE message LIKE ? ORDER BY id DESC LIMIT 1",
            [`%${testProductName}%`]
        );
        results.notificationsInDb = notificationRows;

        // Cleanup
        results.steps.push("6. Cleaning up test data...");
        await pool.query("DELETE FROM pre_generated_uids WHERE uid = ?", [testUid]);
        await pool.query("DELETE FROM products WHERE name = ?", [testProductName]);

        results.success = (
            results.syncResponse.status === 200 &&
            results.uidInDb.length > 0 &&
            results.uidInDb[0].product_name === testProductName &&
            results.productInDb.length > 0 &&
            results.productInDb[0].type === "seat_cover" &&
            results.notificationsInDb.length > 0
        );

    } catch (error: any) {
        results.error = error.message || error;
    }

    return results;
}
