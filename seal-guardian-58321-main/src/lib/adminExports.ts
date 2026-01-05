import { downloadCSV } from "@/lib/utils";

/**
 * Format warranty data for export
 */
export const formatWarrantyForExport = (w: any) => {
    const productDetails = typeof w.product_details === 'string'
        ? JSON.parse(w.product_details)
        : w.product_details || {};
    const rawProductName = productDetails.product || productDetails.productName || w.product_type;
    const productName = rawProductName?.replace(/-/g, ' ').toUpperCase() || w.product_type;

    return {
        Date: new Date(w.created_at).toLocaleDateString(),
        'Product Name': productName,
        'Product Type': w.product_type,
        'UID/Lot': w.uid || productDetails.lotNumber || 'N/A',
        'Customer Name': w.customer_name,
        'Customer Phone': w.customer_phone,
        'Vehicle': `${w.car_make || ''} ${w.car_model || ''} (${w.car_year || ''})`.trim(),
        'Vehicle Reg': w.registration_number || productDetails.carRegistration || 'N/A',
        'Installer Store': productDetails.storeName || w.installer_name || 'N/A',
        'Installer Manpower': w.manpower_name || 'N/A',
        'Status': w.status?.toUpperCase() || 'N/A',
        'Purchase Date': w.purchase_date ? new Date(w.purchase_date).toLocaleDateString() : 'N/A'
    };
};

/**
 * Format vendor data for export
 */
export const formatVendorForExport = (v: any) => ({
    'Store Name': v.store_name,
    'Contact Person': v.contact_name || v.vendor_name,
    'Email': v.email || v.store_email,
    'Phone': v.phone_number,
    'Manpower Count': v.manpower_count || 0,
    'City': v.city,
    'State': v.state,
    'Address': v.full_address || v.address || 'N/A',
    'Pincode': v.pincode || 'N/A',
    'Status': v.is_verified ? 'Approved' : (v.verified_at ? 'Disapproved' : 'Pending'),
    'Approved Warranties': v.validated_warranties || 0,
    'Pending Warranties': v.pending_warranties || 0,
    'Disapproved Warranties': v.rejected_warranties || 0,
    'Total Warranties': v.total_warranties || 0,
    'Joined Date': new Date(v.created_at).toLocaleDateString()
});

/**
 * Format customer data for export
 */
export const formatCustomerForExport = (c: any) => ({
    'Customer Name': c.customer_name,
    'Email': c.customer_email,
    'Phone': c.customer_phone,
    'Approved Warranties': c.validated_warranties || 0,
    'Disapproved Warranties': c.rejected_warranties || 0,
    'Pending Warranties': c.pending_warranties || 0,
    'Total Warranties': c.total_warranties || 0,
    'Registered Date': new Date(c.created_at).toLocaleDateString()
});

/**
 * Format manpower data for export
 */
export const formatManpowerForExport = (m: any) => ({
    Name: m.name,
    Phone: m.phone_number,
    'Manpower ID': m.manpower_id,
    'Role': m.applicator_type?.replace('_', ' ').toUpperCase() || 'N/A',
    'Status': m.is_active ? 'Active' : 'Inactive',
    'Approved Points': m.points || 0,
    'Pending Points': m.pending_points || 0,
    'Disapproved Points': m.rejected_points || 0,
    'Total Applications': m.total_applications || 0,
    'Joined Date': new Date(m.created_at).toLocaleDateString()
});

/**
 * Export warranties to CSV
 */
export const exportWarrantiesToCSV = (warranties: any[], filename?: string) => {
    const exportData = warranties.map(formatWarrantyForExport);
    downloadCSV(exportData, filename || `warranties_export_${new Date().toISOString().split('T')[0]}.csv`);
};

/**
 * Export vendors to CSV
 */
export const exportVendorsToCSV = (vendors: any[], filename?: string) => {
    const exportData = vendors.map(formatVendorForExport);
    downloadCSV(exportData, filename || `vendors_export_${new Date().toISOString().split('T')[0]}.csv`);
};

/**
 * Export customers to CSV
 */
export const exportCustomersToCSV = (customers: any[], filename?: string) => {
    const exportData = customers.map(formatCustomerForExport);
    downloadCSV(exportData, filename || `customers_export_${new Date().toISOString().split('T')[0]}.csv`);
};

/**
 * Export manpower to CSV
 */
export const exportManpowerToCSV = (manpower: any[], filename?: string) => {
    const exportData = manpower.map(formatManpowerForExport);
    downloadCSV(exportData, filename || `manpower_export_${new Date().toISOString().split('T')[0]}.csv`);
};
