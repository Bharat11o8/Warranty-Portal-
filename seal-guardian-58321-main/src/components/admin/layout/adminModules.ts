import type { LucideIcon } from "lucide-react";
import {
    Archive,
    BellRing,
    BookOpen,
    Building2,
    ClipboardCheck,
    FileText,
    Layers,
    LayoutDashboard,
    MapPin,
    Megaphone,
    MessageSquare,
    Network,
    Package,
    PenTool,
    ShieldCheck,
    Store,
    UserCog,
    Users
} from "lucide-react";

export type AdminModule =
    | 'overview'
    | 'vendors'
    | 'distributors'
    | 'manpower'
    | 'customers'
    | 'products'
    | 'warranty-products'
    | 'warranties'
    | 'old-warranties'
    | 'admins'
    | 'activity-logs'
    | 'grievances'
    | 'terms'
    | 'content-manager'
    | 'warranty-form'
    | 'announcements'
    | 'notification-settings'
    | 'posm'
    | 'uid-management'
    | 'ppf-rolls'
    | 'ecatalogue'
    | 'analytics'
    | 'order-management'
    | 'franchise-distributor-map'
    | 'audits'
    | 'leads'
    | 'profile';

// Maps sidebar module IDs to permission keys
const moduleToPermKey: Record<string, string> = {
    'overview': 'overview',
    'warranties': 'warranties',
    'warranty-products': 'warranty_products',
    'uid-management': 'uid_management',
    // Roll usage is warranty data, so it follows the warranties permission
    // rather than introducing a key nobody has been granted yet.
    'ppf-rolls': 'warranties',
    'warranty-form': 'warranty_form',
    'vendors': 'vendors',
    'manpower': 'vendors',
    'customers': 'customers',
    'products': 'products',
    'announcements': 'announcements',
    'notification-settings': 'announcements',
    'grievances': 'grievances',
    'posm': 'posm',
    'ecatalogue': 'ecatalogue',
    'terms': 'terms',
    'old-warranties': 'old_warranties',
    'activity-logs': 'activity_logs',
    'admins': 'admins',   // Super Admin only
    'analytics': 'analytics',
    'distributors': 'distributors',
    'content-manager': 'content_manager',
    'order-management': 'order_management',
    'franchise-distributor-map': 'distributors',
    'audits': 'audits',
    'leads': 'leads',
    'profile': 'profile',  // Always visible
};

export interface AdminMenuItem {
    id: AdminModule;
    label: string;
    icon: LucideIcon;
    /** Extra words the command palette matches on, beyond the label. */
    keywords?: string[];
}

/*
 * The one list of admin modules. The sidebar renders it, and the Ctrl+K
 * command palette searches it — the palette used to keep its own copy, which
 * fell a dozen modules behind and showed modules the admin had no access to.
 * A new module added here appears in both.
 */
export const ADMIN_MENU_GROUPS: { label: string; items: AdminMenuItem[] }[] = [
    {
        label: "Insights",
        items: [
            { id: 'overview', label: "Overview", icon: LayoutDashboard, keywords: ['dashboard', 'home'] },
            { id: 'analytics', label: "Deep Analytics", icon: MessageSquare, keywords: ['reports', 'charts', 'leaderboard'] },
        ]
    },
    {
        label: "Warranty Operations",
        items: [
            { id: 'warranties', label: "Warranty Management", icon: ShieldCheck, keywords: ['warranties', 'claims', 'approve', 'reject', 'resubmission'] },
            { id: 'warranty-products', label: "Warranty Products", icon: Store },
            { id: 'uid-management', label: "UID Management", icon: Package, keywords: ['uid', 'serial', 'codes'] },
            { id: 'ppf-rolls', label: "Serial Number Management", icon: Layers, keywords: ['ppf', 'rolls', 'serials', 'sqft'] },
            { id: 'warranty-form', label: "New Registration", icon: PenTool, keywords: ['register', 'add warranty', 'form'] },
            { id: 'old-warranties', label: "Old Warranties", icon: Archive, keywords: ['legacy', 'archive'] },
        ]
    },
    {
        label: "Network & Orders",
        items: [
            { id: 'vendors', label: "Franchises", icon: Store, keywords: ['vendors', 'stores', 'dealers'] },
            { id: 'distributors', label: "Distributors", icon: Building2 },
            { id: 'manpower', label: "Manpower", icon: Users, keywords: ['staff', 'installers', 'team'] },
            { id: 'customers', label: "Customers", icon: Users },
            { id: 'order-management', label: "Order Management", icon: Network, keywords: ['orders', 'b2b', 'invoices'] },
            { id: 'franchise-distributor-map', label: "Sourcing Map", icon: Layers, keywords: ['mapping', 'franchise distributor'] },
            { id: 'audits', label: "Audit & Compliance", icon: ClipboardCheck, keywords: ['store audit', 'compliance'] },
            { id: 'leads', label: "Lead Management", icon: MapPin, keywords: ['leads', 'enquiries', 'asm', 'instagram'] },
        ]
    },
    {
        label: "Engagement",
        items: [
            { id: 'announcements', label: "Announcements", icon: Megaphone, keywords: ['broadcast', 'campaign'] },
            { id: 'notification-settings', label: "WhatsApp Messages", icon: BellRing, keywords: ['notifications', 'templates', 'reminders'] },
            { id: 'grievances', label: "Grievances", icon: MessageSquare, keywords: ['complaints', 'tickets'] },
            { id: 'posm', label: "POSM Requirements", icon: Package, keywords: ['marketing material', 'branding'] },
        ]
    },
    {
        label: "Catalogue & Content",
        items: [
            { id: 'products', label: "Product Catalogue", icon: Package, keywords: ['products'] },
            { id: 'ecatalogue', label: "E-Catalogue CMS", icon: BookOpen, keywords: ['flipbook', 'catalogue'] },
            { id: 'content-manager', label: "Form Content", icon: FileText, keywords: ['terms', 'conditions', 'disclaimer', 'claim process'] },
        ]
    },
    {
        label: "Administration",
        items: [
            { id: 'activity-logs', label: "Activity Logs", icon: FileText, keywords: ['audit trail', 'history'] },
            { id: 'admins', label: "Admin Access", icon: UserCog, keywords: ['admin users', 'permissions'] },
        ]
    }
];

/** Can this admin open the module? Shared by the sidebar and the command palette. */
export const canSeeAdminModule = (
    moduleId: AdminModule,
    user: { isSuperAdmin?: boolean } | null | undefined,
    hasPermission: (module: string, action: 'read' | 'write') => boolean
): boolean => {
    if (moduleId === 'profile') return true;      // always visible
    if (moduleId === 'admins') return !!user?.isSuperAdmin; // Super Admin only
    if (user?.isSuperAdmin) return true;          // super admin sees all
    const permKey = moduleToPermKey[moduleId];
    if (!permKey) return true;
    return hasPermission(permKey, 'read');
};
