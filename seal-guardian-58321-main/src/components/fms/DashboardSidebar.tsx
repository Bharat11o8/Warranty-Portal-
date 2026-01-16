import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    ShieldCheck,
    ShoppingBag,
    LifeBuoy,
    Users,
    Gift,
    Box,
    Bell,
    ClipboardCheck,
    Target,
    Image as ImageIcon,
    ChevronRight,
    LogOut
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export type FmsModule =
    | 'overview'
    | 'warranty'
    | 'orders'
    | 'grievances'
    | 'manpower'
    | 'offers'
    | 'catalogue'
    | 'news'
    | 'audit'
    | 'targets'
    | 'posm';

interface SidebarItemProps {
    icon: any;
    label: string;
    active?: boolean;
    onClick: () => void;
    badge?: string;
    comingSoon?: boolean;
}

const SidebarItem = ({ icon: Icon, label, active, onClick, badge, comingSoon }: SidebarItemProps) => (
    <button
        onClick={onClick}
        disabled={comingSoon}
        className={cn(
            "w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all group",
            active
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            comingSoon && "opacity-50 cursor-not-allowed filter grayscale"
        )}
    >
        <div className="flex items-center gap-3">
            <Icon className={cn("h-5 w-5 transition-transform group-hover:scale-110", active ? "text-primary-foreground" : "text-muted-foreground")} />
            <span className="font-medium text-sm">{label}</span>
            {comingSoon && (
                <span className="text-[10px] bg-muted-foreground/20 px-1.5 py-0.5 rounded uppercase font-bold tracking-tight">Soon</span>
            )}
        </div>
        {badge && !comingSoon && (
            <span className="bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                {badge}
            </span>
        )}
        {active && !comingSoon && <ChevronRight className="h-4 w-4 opacity-50" />}
    </button>
);

interface DashboardSidebarProps {
    activeModule: FmsModule;
    onModuleChange: (module: FmsModule) => void;
}

export const DashboardSidebar = ({ activeModule, onModuleChange }: DashboardSidebarProps) => {
    const { logout, user } = useAuth();

    const menuGroups = [
        {
            label: "Core",
            items: [
                { id: 'overview' as const, label: "Overview", icon: LayoutDashboard },
                { id: 'warranty' as const, label: "Warranty Mgmt", icon: ShieldCheck },
            ]
        },
        {
            label: "Operations",
            items: [
                { id: 'orders' as const, label: "Order Mgmt", icon: ShoppingBag, comingSoon: true },
                { id: 'posm' as const, label: "POSM Requirements", icon: ImageIcon },
                { id: 'audit' as const, label: "Audit & Compliance", icon: ClipboardCheck },
            ]
        },
        {
            label: "Team & Performance",
            items: [
                { id: 'manpower' as const, label: "Manpower", icon: Users },
                { id: 'targets' as const, label: "Targets & Achiev.", icon: Target },
            ]
        },
        {
            label: "Growth & Products",
            items: [
                { id: 'offers' as const, label: "Offers & Schemes", icon: Gift },
                { id: 'catalogue' as const, label: "Product Catalogue", icon: Box },
            ]
        },
        {
            label: "Support",
            items: [
                { id: 'news' as const, label: "News & Alerts", icon: Bell, badge: "New" },
                { id: 'grievances' as const, label: "Grievances", icon: LifeBuoy },
            ]
        }
    ];

    return (
        <aside className="w-64 border-r bg-card flex flex-col h-screen overflow-hidden shrink-0">
            {/* Brand Logo */}
            <div className="p-6 border-b">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground font-bold text-xl shadow-lg ring-4 ring-primary/10">
                        S
                    </div>
                    <div>
                        <h1 className="font-bold text-lg leading-tight tracking-tight">Franchise</h1>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest opacity-70">Management System</p>
                    </div>
                </div>
            </div>

            {/* Nav Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
                {menuGroups.map((group) => (
                    <div key={group.label} className="space-y-1">
                        <h2 className="px-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-2">
                            {group.label}
                        </h2>
                        {group.items.map((item) => (
                            <SidebarItem
                                key={item.id}
                                icon={item.icon}
                                label={item.label}
                                active={activeModule === item.id}
                                onClick={() => onModuleChange(item.id)}
                                badge={item.badge}
                                comingSoon={item.comingSoon}
                            />
                        ))}
                    </div>
                ))}
            </div>

            {/* Footer / User Profile */}
            <div className="p-4 border-t bg-muted/20">
                <div className="flex items-center gap-3 p-2 rounded-lg bg-background/50 border mb-4">
                    <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center text-xs font-bold ring-2 ring-primary/10">
                        {user?.name?.substring(0, 2).toUpperCase() || "FR"}
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-bold truncate leading-none">{user?.name || "Franchise Partner"}</p>
                        <p className="text-[10px] text-muted-foreground truncate mt-1">Authorized Partner</p>
                    </div>
                </div>
                <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-colors group"
                >
                    <LogOut className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                    Logout
                </button>
            </div>
        </aside>
    );
};
