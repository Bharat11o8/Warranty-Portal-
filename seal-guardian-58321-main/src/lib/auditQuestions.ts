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

/* ------------------------------------------------------------------ *
 * Scoring
 *
 * Nine questions, 100 marks in total.
 *
 * Three have a defined right answer and score all-or-nothing: signage must be
 * installed AND working, warranty registration must be yes, and needing support
 * scores 0 because it means something is wrong.
 *
 * The other six score on whether the store answered at all. That is a
 * deliberate call, not a shortcut: footfall, stock and monthly business are
 * free text, and stores type "100k", "2.5", "2.5 lakh" and "Q180" for the same
 * kind of value. Ranking those against thresholds would invent a precision the
 * data does not have, so an answer earns the marks and a blank does not.
 * ------------------------------------------------------------------ */

/**
 * How one question earns its marks.
 *
 * `answered`  — any non-empty answer scores full marks.
 * `expected`  — only the listed option ids score; anything else is 0.
 */
type ScoreRule =
    | { mode: "answered"; marks: number }
    | { mode: "expected"; accept: string[]; marks: number };

/**
 * Seven questions at 10, and the two that matter most at 15 — 100 in total.
 *
 * Warranty registration and support carry the extra weight because they are the
 * two answers the business acts on: a store not registering warranties, or one
 * sitting on an unresolved issue, is worth more than a missing footfall figure.
 */
const SCORE_RULES: Partial<Record<AuditFieldKey, ScoreRule>> = {
    signage_status:        { mode: "expected", accept: ["installed_working"], marks: 10 },
    online_presence:       { mode: "answered", marks: 10 },
    footfall:              { mode: "answered", marks: 10 },
    seat_covers_stock:     { mode: "answered", marks: 10 },
    products_stocked:      { mode: "answered", marks: 10 },
    last_month_business:   { mode: "answered", marks: 10 },
    staff_training:        { mode: "answered", marks: 10 },
    warranty_registration: { mode: "expected", accept: ["yes"], marks: 15 },
    // Needing support is the negative answer here — "no issues" is what scores.
    support_needed:        { mode: "expected", accept: ["no"], marks: 15 },
};

/** Derived, so changing a rule above can never leave the total out of step. */
export const AUDIT_TOTAL_MARKS = Object.values(SCORE_RULES)
    .reduce((sum, rule) => sum + (rule?.marks ?? 0), 0);

/** The scored questions, in the order they are asked. */
export const SCORED_KEYS = AUDIT_QUESTIONS
    .filter(q => q.key in SCORE_RULES)
    .map(q => q.key);

export interface QuestionScore {
    key: AuditFieldKey;
    label: string;
    /** What the store answered, already mapped to titles. */
    answer: string;
    earned: number;
    marks: number;
    /** False when nothing was answered, so the UI can say so rather than imply a wrong answer. */
    answered: boolean;
}

export interface AuditScore {
    earned: number;
    total: number;
    percent: number;
    band: "excellent" | "good" | "fair" | "poor";
    breakdown: QuestionScore[];
    /** Questions left blank — the reason a score is low is usually here. */
    unanswered: number;
}

/**
 * Bands for the whole audit.
 *
 * Colour only, deliberately — the score is shown as a number and nothing else.
 * A word like "Poor" against a store's own audit reads as a judgement, and the
 * marks already say what the marks say.
 */
export function scoreBand(percent: number): AuditScore["band"] {
    if (percent >= 80) return "excellent";
    if (percent >= 60) return "good";
    if (percent >= 40) return "fair";
    return "poor";
}

export const BAND_META: Record<AuditScore["band"], { cls: string; dot: string }> = {
    excellent: { cls: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
    good:      { cls: "bg-blue-50 text-blue-700 border-blue-200",          dot: "bg-blue-500" },
    fair:      { cls: "bg-amber-50 text-amber-700 border-amber-200",       dot: "bg-amber-500" },
    poor:      { cls: "bg-rose-50 text-rose-700 border-rose-200",          dot: "bg-rose-500" },
};

/** True when a stored value counts as an answer at all. */
function hasAnswer(value: unknown): boolean {
    if (value === null || value === undefined) return false;
    return String(value).trim() !== "";
}

/**
 * Score one audit row.
 *
 * Takes anything with the answer fields on it, so the same function serves the
 * admin table, the franchise page and the call form preview.
 */
export function scoreAudit(row: Record<string, any>): AuditScore {
    const breakdown: QuestionScore[] = [];
    let earned = 0;
    let unanswered = 0;

    for (const question of AUDIT_QUESTIONS) {
        const rule = SCORE_RULES[question.key];
        if (!rule) continue;

        const raw = row[question.key];
        const answered = hasAnswer(raw);
        if (!answered) unanswered++;

        let got = 0;
        if (answered) {
            if (rule.mode === "answered") {
                got = rule.marks;
            } else {
                // Multi-selects arrive comma-joined, so accept a match on any part.
                const parts = String(raw).split(",").map(v => v.trim().toLowerCase()).filter(Boolean);
                got = parts.some(p => rule.accept.includes(p)) ? rule.marks : 0;
            }
        }

        earned += got;
        breakdown.push({
            key: question.key,
            label: question.label,
            answer: answered ? auditLabel(question.key, String(raw)) : "",
            earned: got,
            marks: rule.marks,
            answered,
        });
    }

    const percent = Math.round((earned / AUDIT_TOTAL_MARKS) * 100);
    return { earned, total: AUDIT_TOTAL_MARKS, percent, band: scoreBand(percent), breakdown, unanswered };
}
