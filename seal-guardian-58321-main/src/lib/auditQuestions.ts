/**
 * The 13 store audit questions.
 *
 * Single source of truth for both channels: the WhatsApp Flow renders these on
 * the store's phone, and the call form renders the same set for an auditor
 * filling them in during a call. Keeping one definition means the two can never
 * drift apart and produce answers that cannot be compared.
 *
 * Option strings are the approved spreadsheet wording verbatim — including the
 * "Yes-Regullar" spelling and the space in "Self -Handled" — so responses stay
 * comparable with historical audit data. Do not tidy them.
 */
export type AuditFieldKey =
    | "q1_signage"
    | "q2_digital_presence"
    | "q3_footfall"
    | "q4_has_complaint"
    | "q5_seat_cover_qty"
    | "q6_sound_security"
    | "q7_light_utility"
    | "q8_care_fragrance"
    | "q9_order_frequency"
    | "q10_last_month_business"
    | "q11_staff"
    | "q12_training"
    | "q13_feedback";

export interface AuditQuestion {
    key: AuditFieldKey;
    /** Shown in the table and detail view — short enough to scan. */
    label: string;
    /** Asked verbatim on a call, matching the Flow wording. */
    question: string;
    section: "Brand Standards" | "Customer Service" | "Operations" | "Business" | "Staff" | "Feedback";
    type: "single" | "multi" | "text" | "longtext";
    options?: string[];
    placeholder?: string;
}

export const AUDIT_QUESTIONS: AuditQuestion[] = [
    {
        key: "q1_signage",
        label: "Signage",
        question: "Is your glow sign board / signage installed and working?",
        section: "Brand Standards",
        type: "single",
        options: ["Installed and working", "Not installed", "Installed but not working"],
    },
    {
        key: "q2_digital_presence",
        label: "Online presence",
        question: "Where is your store present online?",
        section: "Brand Standards",
        type: "multi",
        options: ["Facebook", "Instagram", "Google", "YouTube", "WhatsApp Group", "Offline agent", "Offline", "Any other", "None"],
    },
    {
        key: "q3_footfall",
        label: "Monthly footfall",
        question: "What is your average monthly footfall?",
        section: "Customer Service",
        type: "text",
        placeholder: "e.g. 150+",
    },
    {
        key: "q4_has_complaint",
        label: "Customer complaint",
        question: "Do you have any customer complaint?",
        section: "Customer Service",
        type: "single",
        options: ["Yes", "No"],
    },
    {
        key: "q5_seat_cover_qty",
        label: "Seat covers in stock",
        question: "How many seat covers do you have in stock?",
        section: "Operations",
        type: "text",
        placeholder: "e.g. 200-250",
    },
    {
        key: "q6_sound_security",
        label: "Sound & security",
        question: "Which sound and security products do you stock?",
        section: "Operations",
        type: "multi",
        options: ["Amplifier", "Android (Head Unit)", "Damping (Sound Deadening)", "DVR (Dashcam)", "Fog Lamp", "Horn", "Speakers", "Subwoofer", "Any other", "None"],
    },
    {
        key: "q7_light_utility",
        label: "Light & utility",
        question: "Which light and utility products do you stock?",
        section: "Operations",
        type: "multi",
        options: ["Cable", "Charger", "LED", "Tyre Inflator", "Fog Light", "Ventilated seat", "Any other", "None"],
    },
    {
        key: "q8_care_fragrance",
        label: "Care & fragrance",
        question: "Which care and fragrance products do you stock?",
        section: "Operations",
        type: "multi",
        options: ["Microfiber", "PPF", "Vacuum Cleaner", "Car Perfume", "Any other", "None"],
    },
    {
        key: "q9_order_frequency",
        label: "Order frequency",
        question: "How often do you order from your distributor?",
        section: "Operations",
        type: "single",
        options: ["No-Sometime", "Yes-Regullar", "As per customer REQ.", "Distributor only"],
    },
    {
        key: "q10_last_month_business",
        label: "Last month business",
        question: "What was your business with Autoform last month?",
        section: "Business",
        type: "text",
        placeholder: "e.g. 2.5 lac",
    },
    {
        key: "q11_staff",
        label: "Staff",
        question: "Is your staff Old & experienced (3-5 years)?",
        section: "Staff",
        type: "single",
        options: ["New Staff", "Old Staff", "Self -Handled", "Relatives"],
    },
    {
        key: "q12_training",
        label: "Training",
        question: "Do your staff need training?",
        section: "Staff",
        type: "single",
        options: ["Already trained", "Training needed"],
    },
    {
        key: "q13_feedback",
        label: "Feedback",
        question: "Anything you would like to share with us?",
        section: "Feedback",
        type: "longtext",
        placeholder: "Optional - suggestions, problems, or anything we can help with",
    },
];

export const AUDIT_SECTIONS = Array.from(new Set(AUDIT_QUESTIONS.map(q => q.section)));
