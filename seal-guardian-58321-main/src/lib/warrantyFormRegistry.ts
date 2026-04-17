import SeatCoverForm from "@/components/warranty/SeatCoverForm";
import EVProductsForm from "@/components/warranty/EVProductsForm";

/**
 * Registry of product type → form component mappings.
 * 
 * To add a new product type in the future:
 * 1. Create the new form component (e.g. CeramicCoatingForm)
 * 2. Add an entry here: 'ceramic-coating': CeramicCoatingForm
 * 3. Done — both Customer and Franchise dashboards will pick it up automatically.
 */
export const PRODUCT_FORM_MAP: Record<string, React.ComponentType<any>> = {
    'seat-cover': SeatCoverForm,
    'ev-products': EVProductsForm,
    // Future product types go here:
    // 'ceramic-coating': CeramicCoatingForm,
    // 'dashcam': DashcamForm,
};

/**
 * Returns the correct form component for the given product type.
 * Falls back to EVProductsForm for unknown types.
 */
export function getWarrantyFormComponent(productType: string): React.ComponentType<any> {
    return PRODUCT_FORM_MAP[productType] || EVProductsForm;
}

/**
 * Returns the standard props needed for an edit/resubmit form.
 * Centralises warrantyId resolution and common props.
 */
export function getEditFormProps(warranty: any, onSuccess: () => void) {
    return {
        initialData: warranty,
        warrantyId: warranty?.uid || warranty?.id,
        isEditing: true,
        onSuccess,
        // EVProductsForm needs isUniversal — safe to pass for all forms (ignored by SeatCoverForm)
        isUniversal: false,
    };
}
