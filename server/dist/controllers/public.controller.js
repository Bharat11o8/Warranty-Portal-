import db from '../config/database';
export class PublicController {
    static async getStores(req, res) {
        try {
            // Get all vendors with their store details
            const [stores] = await db.execute(`
        SELECT 
          vd.id as vendor_details_id,
          vd.store_name,
          vd.address,
          vd.city,
          vd.state,
          vd.pincode,
          vd.store_email,
          p.phone_number as phone
        FROM vendor_details vd
        JOIN profiles p ON vd.user_id = p.id
        ORDER BY vd.store_name ASC
      `);
            res.json({
                success: true,
                stores
            });
        }
        catch (error) {
            console.error('Get stores error:', error);
            res.status(500).json({ error: 'Failed to fetch stores' });
        }
    }
    static async getStoreManpower(req, res) {
        try {
            const { vendorDetailsId } = req.params;
            if (!vendorDetailsId) {
                return res.status(400).json({ error: 'Vendor details ID is required' });
            }
            const [manpower] = await db.execute('SELECT id, name, manpower_id, applicator_type FROM manpower WHERE vendor_id = ? ORDER BY name ASC', [vendorDetailsId]);
            res.json({
                success: true,
                manpower
            });
        }
        catch (error) {
            console.error('Get store manpower error:', error);
            res.status(500).json({ error: 'Failed to fetch manpower' });
        }
    }
    static async checkVendorSchema(req, res) {
        try {
            const [columns] = await db.execute('SHOW COLUMNS FROM vendor_details');
            res.json({
                success: true,
                columns: columns.map((col) => ({
                    field: col.Field,
                    type: col.Type
                }))
            });
        }
        catch (error) {
            console.error('Schema check error:', error);
            res.status(500).json({ error: 'Schema check failed', details: error.message });
        }
    }
}
