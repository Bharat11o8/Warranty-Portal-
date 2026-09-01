/**
 * Store audit questions, mirroring the published WhatsApp Flow.
 *
 * Source of truth: Flow `af_store_audit_2` (id 2152498745701937, JSON v7.1).
 * Field names and option ids are copied from that Flow verbatim — they are the
 * keys inside response_json, so renaming one here silently breaks the webhook
 * mapping.
 *
 * Answers arrive as option IDS, not titles ("installed_working", not
 * "Installed & Working"). We store the id and map to a title only for display,
 * so re-wording a label in the Flow never orphans historical rows.
 *
 * The same definition drives the call form, so a phoned-in audit and a WhatsApp
 * audit produce comparable answers.
 */
export const AUDIT_FLOW = {
    id: "2152498745701937",
    name: "af_store_audit_2",
    version: "7.1",
} as const;

export type AuditFieldKey =
    | "signage_status"
    | "online_presence"
    | "online_presence_other"
    | "footfall"
    | "seat_covers_stock"
    | "products_stocked"
    | "last_month_business"
    | "staff_training"
    | "warranty_registration"
    | "support_needed"
    | "support_details";

export type AuditSection =
    | "Store Overview"
    | "Operations"
    | "Business"
    | "Staff"
    | "Warranty"
    | "Feedback & Support";

export interface AuditOption {
    /** Stored value — the Flow's option id. */
    id: string;
    /** Shown to a human. */
    title: string;
}

export interface AuditQuestion {
    key: AuditFieldKey;
    /** Short label for table columns and the detail view. */
    label: string;
    /** Asked verbatim, matching the Flow. */
    question: string;
    section: AuditSection;
    type: "single" | "multi" | "text" | "longtext";
    options?: AuditOption[];
    placeholder?: string;
    /** Shown only when another answer has a given value. */
    showWhen?: { key: AuditFieldKey; equals: string };
}

export const AUDIT_QUESTIONS: AuditQuestion[] = [
    {
        key: "signage_status",
        label: "Signage",
        question: "Signage installed & working?",
        section: "Store Overview",
        type: "single",
        options: [
            { id: "installed_working", title: "Installed & Working" },
            { id: "installed_not_working", title: "Installed but Not Working" },
            { id: "not_installed", title: "Not Installed" },
        ],
    },
    {
        key: "online_presence",
        label: "Online presence",
        question: "Your online presence?",
        section: "Store Overview",
        type: "multi",
        options: [
            { id: "facebook", title: "Facebook" },
            { id: "instagram", title: "Instagram" },
            { id: "google", title: "Google" },
            { id: "youtube", title: "YouTube" },
            { id: "whatsapp_group", title: "WhatsApp Group" },
            { id: "other_platform", title: "Other Online Platform" },
            { id: "offline_only", title: "Offline Only" },
        ],
    },
    {
        key: "online_presence_other",
        label: "Other platform",
        question: "Please specify the other online platform",
        section: "Store Overview",
        type: "text",
        placeholder: "Only if 'Other Online Platform' was selected",
        showWhen: { key: "online_presence", equals: "other_platform" },
    },
    {
        key: "footfall",
        label: "Monthly footfall",
        question: "Average monthly footfall?",
        section: "Store Overview",
        type: "text",
        placeholder: "e.g. 150-200 customers/month",
    },
    {
        key: "seat_covers_stock",
        label: "Seat covers in stock",
        question: "Seat covers in stock?",
        section: "Operations",
        type: "text",
        placeholder: "e.g. 200-250",
    },
    {
        key: "products_stocked",
        label: "Products stocked",
        question: "Which products do you stock?",
        section: "Operations",
        type: "multi",
        options: [
            { id: "sound_security", title: "Sound & Security" },
            { id: "light_utility", title: "Light & Utility" },
            { id: "care_fragrance", title: "Care & Fragrance" },
            { id: "seat_covers", title: "Seat Covers" },
            { id: "mats", title: "Mats" },
            { id: "accessories", title: "Accessories" },
        ],
    },
    {
        key: "last_month_business",
        label: "Last month business",
        question: "Last month's AFAC business?",
        section: "Business",
        type: "text",
        placeholder: "e.g. 2.5 Lakh",
    },
    {
        key: "staff_training",
        label: "Staff training",
        question: "Do staff need training?",
        section: "Staff",
        type: "single",
        options: [
            { id: "already_trained", title: "Already Trained" },
            { id: "training_required", title: "Training Required" },
            { id: "not_required", title: "Not Required" },
        ],
    },
    {
        key: "warranty_registration",
        label: "Warranty registration",
        question: "Online Warranty Registration?",
        section: "Warranty",
        type: "single",
        options: [
            { id: "yes", title: "Yes" },
            { id: "no", title: "No" },
        ],
    },
    {
        key: "support_needed",
        label: "Support needed",
        question: "Any issue or support needed?",
        section: "Feedback & Support",
        type: "single",
        options: [
            { id: "no", title: "No" },
            { id: "yes", title: "Yes" },
        ],
    },
    {
        key: "support_details",
        label: "Issue details",
        question: "Please describe the issue",
        section: "Feedback & Support",
        type: "longtext",
        placeholder: "Product, fitting, warranty, quality, delayed service, etc.",
        showWhen: { key: "support_needed", equals: "yes" },
    },
];

export const AUDIT_SECTIONS: AuditSection[] =
    Array.from(new Set(AUDIT_QUESTIONS.map(q => q.section)));

/**
 * Fields the Flow carries in but never asks — passed through from the store's
 * record when the audit is sent. asm, brands and category have no home in
 * vendor_details, so the audit is the only place the portal holds them.
 */
export const AUDIT_CONTEXT_FIELDS = [
    { key: "audit_date", label: "Audit date" },
    { key: "franchise_name", label: "Franchise" },
    { key: "store_contact_no", label: "Store contact" },
    { key: "contact_person", label: "Contact person" },
    { key: "city", label: "City" },
    { key: "state", label: "State" },
    // Zone is not tracked: nothing populates it, and it carries no meaning for
    // the business. ASM is the territory field that does. The database column
    // stays so the one historical value is not destroyed.
    { key: "asm", label: "ASM" },
    { key: "brands", label: "Brands" },
    { key: "category", label: "Category" },
] as const;

/** Option id → human title, for display. Falls back to the raw id. */
export function auditLabel(key: AuditFieldKey, value: string | null | undefined): string {
    if (!value) return "";
    const q = AUDIT_QUESTIONS.find(x => x.key === key);
    if (!q?.options) return value;
    // Multi-selects arrive comma-joined; map each part.
    return value
        .split(",")
        .map(v => v.trim())
        .filter(Boolean)
        .map(v => q.options!.find(o => o.id === v)?.title || v)
        .join(", ");
}
