import db from '../config/database';
export class DiagnosticController {
    static async checkVendorVerification(req, res) {
        try {
            // Get all vendors with their verification status
            const [vendors] = await db.execute(`
                SELECT 
                    p.id,
                    p.name,
                    p.email,
                    p.created_at as profile_created,
                    ur.role,
                    vv.is_verified,
                    vv.verified_at,
                    vd.store_name,
                    CASE 
                        WHEN vv.is_verified = true THEN 'approved'
                        WHEN vv.is_verified = false AND vv.verified_at IS NOT NULL THEN 'disapproved'
                        WHEN vv.is_verified = false AND vv.verified_at IS NULL THEN 'pending'
                        ELSE 'unknown'
                    END as vendor_status
                FROM profiles p
                LEFT JOIN user_roles ur ON p.id = ur.user_id
                LEFT JOIN vendor_verification vv ON p.id = vv.user_id
                LEFT JOIN vendor_details vd ON p.id = vd.user_id
                WHERE ur.role = 'vendor'
                ORDER BY p.created_at DESC
            `);
            // Get count of vendor_verification records
            const [vvCount] = await db.execute('SELECT COUNT(*) as count FROM vendor_verification');
            // Get count of vendor_details records
            const [vdCount] = await db.execute('SELECT COUNT(*) as count FROM vendor_details');
            // Get count of vendors in user_roles
            const [vendorCount] = await db.execute("SELECT COUNT(*) as count FROM user_roles WHERE role = 'vendor'");
            res.json({
                success: true,
                summary: {
                    total_vendors: vendorCount[0].count,
                    vendor_verification_records: vvCount[0].count,
                    vendor_details_records: vdCount[0].count
                },
                vendors,
                note: 'This diagnostic shows all vendors and their verification status'
            });
        }
        catch (error) {
            console.error('Diagnostic check error:', error);
            res.status(500).json({ error: 'Diagnostic check failed', details: error.message });
        }
    }
    static async runMigration(req, res) {
        try {
            const changes = [];
            // Check current table structure
            const [columns] = await db.execute('SHOW COLUMNS FROM warranty_registrations');
            const columnNames = columns.map((col) => col.Field);
            const hasUid = columnNames.includes('uid');
            const hasWarrantyType = columnNames.includes('warranty_type');
            // Add warranty_type column if it doesn't exist
            if (!hasWarrantyType) {
                await db.execute(`
                    ALTER TABLE warranty_registrations 
                    ADD COLUMN warranty_type VARCHAR(50) NOT NULL DEFAULT '1 Year'
                `);
                changes.push('Added warranty_type column');
            }
            res.json({
                success: true,
                message: changes.length > 0 ? 'Migration completed successfully' : 'Schema is already up to date',
                changes,
                currentColumns: columnNames
            });
        }
        catch (error) {
            console.error('Migration error:', error);
            res.status(500).json({
                error: 'Migration failed',
                details: error.message,
                sqlMessage: error.sqlMessage
            });
        }
    }
}
