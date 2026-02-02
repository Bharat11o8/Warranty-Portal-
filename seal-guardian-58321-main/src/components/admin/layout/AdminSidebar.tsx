import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    ShieldCheck,
    Store,
    Users,
    UserCog,
    Archive,
    LogOut,
    ChevronRight,
    ChevronLeft,
    User,
    Settings,
    MessageSquare,
    Package,
    PenTool,
    FileText,
    Megaphone
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { Button } from "@/components/ui/button";

export type AdminModule =
    | 'overview'
    | 'vendors'
    | 'customers'
    | 'products'
    | 'warranty-products'
    | 'warranties'
    | 'old-warranties'
    | 'admins'
    | 'activity-logs'
    | 'grievances'
    | 'products'
    | 'terms'
    | 'warranty-form'
    | 'announcements'
    | 'posm'
    | 'profile';

interface SidebarItemProps {
    icon: any;
    label: string;
    active?: boolean;
    onClick: () => void;
    badge?: string;
    isCollapsed?: boolean;
}

const SidebarItem = ({ icon: Icon, label, active, onClick, badge, isCollapsed }: SidebarItemProps) => (
    <button
        onClick={onClick}
        className={cn(
            "w-full flex items-center transition-all duration-300 group relative",
            isCollapsed ? "h-12 px-0 justify-center rounded-2xl" : "h-11 px-3 gap-3 rounded-[32px] hover:translate-x-1",
            active
                ? "text-orange-600 bg-orange-50 border border-orange-100"
                : "text-slate-500 hover:bg-slate-50 border border-transparent"
        )}
    >
        <div className={cn(
            "flex items-center justify-center shrink-0 transition-all duration-300",
            isCollapsed ? "h-10 w-10 rounded-xl" : "h-9 w-9 rounded-xl",
            active
                ? "bg-orange-100 border border-orange-200 text-orange-600"
                : "bg-slate-100 text-slate-400 group-hover:text-orange-500 group-hover:bg-orange-50"
        )}>
            <Icon className={cn("transition-transform duration-300", isCollapsed ? "h-5 w-5" : "h-4 w-4", "group-hover:scale-110")} />
        </div>

        {!isCollapsed && (
            <div className="flex-1 flex items-center justify-between min-w-0">
                <span className="font-bold text-xs tracking-tight truncate">{label}</span>
                {badge && (
                    <div className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-black text-white shadow-sm ring-2 ring-white">
                        {badge}
                    </div>
                )}
            </div>
        )}

        {isCollapsed && (
            <>
                {badge && (
                    <div className="absolute top-1 right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-orange-500 text-[8px] font-black text-white shadow-sm ring-1 ring-white">
                        {badge}
                    </div>
                )}
                {/* Floating Tooltip/Label on Hover */}
                <div className="absolute left-[calc(100%+16px)] px-4 py-2 bg-white text-slate-700 text-[10px] font-bold uppercase tracking-widest rounded-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-300 whitespace-nowrap z-[100] shadow-[0_10px_40px_rgba(0,0,0,0.08)] border border-orange-100 translate-x-1 group-hover:translate-x-0">
                    {label}
                    <div className="absolute right-full top-1/2 -translate-y-1/2 border-[6px] border-transparent border-r-white filter drop-shadow-[-1px_0_0_rgb(255,237,213)]" />
                </div>
            </>
        )}
    </button>
);

interface AdminSidebarProps {
    activeModule: AdminModule;
    onModuleChange: (module: AdminModule) => void;
    isCollapsed: boolean;
    onToggleCollapse?: () => void;
}

// Extracted Sidebar Content for reuse in Mobile Sheet
export const SidebarContent = ({
    activeModule,
    onModuleChange,
    isCollapsed = false,
    onToggleCollapse
}: AdminSidebarProps) => {
    const { logout, user } = useAuth();
    const { notifications } = useNotifications();

    // Calculate Section Updates from notifications (Hidden for Phase 1)
    const dashboardUpdates = 0; // notifications.filter(n => !n.is_read && n.type === 'warranty').length;
    const termsUpdates = 0; // notifications.filter(n => ... ).length;

    // Define menu items inside the component or outside if static
    const menuGroups = [
        {
            label: "Dashboard",
            items: [
                { id: 'overview' as const, label: "Overview", icon: LayoutDashboard },
            ]
        },
        {
            label: "Warranty Management",
            items: [
                {
                    id: 'warranties' as const,
                    label: "Warranty Management",
                    icon: ShieldCheck,
                    // badge: unreadWarranties > 0 ? unreadWarranties.toString() : undefined
                },

                { id: 'warranty-products' as const, label: "Warranty Products", icon: Store },
                // { id: 'announcements' as const, label: "Announcements", icon: Megaphone },
                { id: 'warranty-form' as const, label: "New Registration", icon: PenTool },
            ]
        },
        {
            label: "Store & Partners",
            items: [
                { id: 'vendors' as const, label: "Franchises", icon: Store },
                { id: 'customers' as const, label: "Customers", icon: Users },
                { id: 'products' as const, label: "Product Catalogue", icon: Package },
            ]
        },
        {
            label: "Communication",
            items: [
                /* { id: 'announcements' as const, label: "Announcements", icon: Megaphone }, */
                {
                    id: 'grievances' as const,
                    label: "Grievances",
                    icon: MessageSquare,
                    // badge: unreadGrievances > 0 ? unreadGrievances.toString() : undefined
                },
                { id: 'posm' as const, label: "POSM Requirements", icon: Package },
                { id: 'terms' as const, label: "Terms & Conditions", icon: FileText },
            ]
        },
        {
            label: "System",
            items: [
                { id: 'old-warranties' as const, label: "Old Warranties", icon: Archive },
                { id: 'activity-logs' as const, label: "Activity Logs", icon: FileText },
                { id: 'admins' as const, label: "Admin Access", icon: UserCog },
            ]
        }
    ];

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Brand Logo & Collapse Toggle */}
            <div className="flex h-24 items-center px-6 border-b border-orange-50 justify-between shrink-0">
                {!isCollapsed && (
                    <div className="flex items-center gap-3 animate-in-fade">
                        <img
                            src="/autoform-logo.png"
                            alt="Autoform"
                            className="h-12 w-auto object-contain"
                        />
                        <div className="min-w-0 hidden">
                            <h1 className="font-black text-lg leading-tight tracking-tight text-slate-800 truncate">Autoform</h1>
                            <p className="text-[10px] uppercase font-bold text-orange-500 tracking-widest leading-none">Admin</p>
                        </div>
                    </div>
                )}

                {onToggleCollapse && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onToggleCollapse}
                        className={cn(
                            "h-10 w-10 bg-slate-50 text-slate-400 hover:text-orange-500 transition-all rounded-xl",
                            isCollapsed && "mx-auto"
                        )}
                    >
                        {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
                    </Button>
                )}
            </div>

            {/* Nav Items */}
            <nav className={cn(
                "flex-1 px-4 py-8 space-y-10",
                isCollapsed ? "overflow-visible" : "overflow-y-auto custom-scrollbar"
            )}>
                {menuGroups.map((group) => (
                    <div key={group.label} className="space-y-4">
                        {!isCollapsed && (
                            <h2 className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 animate-in-fade">
                                {group.label}
                            </h2>
                        )}
                        <div className="space-y-2">
                            {group.items.map((item: any) => (
                                <SidebarItem
                                    key={item.id}
                                    icon={item.icon}
                                    label={item.label}
                                    active={activeModule === item.id}
                                    onClick={() => onModuleChange(item.id)}
                                    isCollapsed={isCollapsed}
                                    badge={item.badge}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Profile Section */}
            <div className="p-3 border-t border-orange-50 space-y-2 shrink-0 overflow-visible">
                <div
                    onClick={() => onModuleChange('profile')}
                    className={cn(
                        "flex items-center rounded-2xl bg-slate-50 border border-slate-100 transition-all duration-300 hover:border-orange-200 hover:bg-orange-50 cursor-pointer group relative",
                        isCollapsed ? "p-2 justify-center" : "p-3 gap-3"
                    )}
                >
                    <div className="w-10 h-10 shrink-0 rounded-xl bg-slate-900 flex items-center justify-center text-white border border-slate-700">
                        <User className="h-5 w-5" />
                    </div>
                    {!isCollapsed && (
                        <div className="flex-1 min-w-0 animate-in-fade">
                            <p className="text-xs font-black text-slate-800 truncate uppercase mt-0.5">{user?.name || "Administrator"}</p>
                            <p className="text-[10px] font-bold text-orange-500 tracking-tighter truncate uppercase leading-none">Super Admin</p>
                        </div>
                    )}
                </div>

                <Button
                    variant="ghost"
                    className={cn(
                        "w-full h-10 transition-all text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl group relative",
                        isCollapsed ? "justify-center px-0" : "justify-start gap-3 px-4"
                    )}
                    onClick={logout}
                >
                    <LogOut className="h-5 w-5" />
                    {!isCollapsed && <span className="font-bold text-xs">Sign Out</span>}

                    {isCollapsed && (
                        <div className="absolute left-[calc(100%+16px)] px-4 py-2 bg-white text-red-600 text-[10px] font-bold uppercase tracking-widest rounded-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-300 whitespace-nowrap z-[100] shadow-[0_10px_40px_rgba(220,38,38,0.08)] border border-red-100 translate-x-1 group-hover:translate-x-0">
                            Sign Out
                            <div className="absolute right-full top-1/2 -translate-y-1/2 border-[6px] border-transparent border-r-white filter drop-shadow-[-1px_0_0_rgb(fee2e2)]" />
                        </div>
                    )}
                </Button>
            </div>
        </div>
    );
};

export const AdminSidebar = (props: AdminSidebarProps) => {
    return (
        <aside
            className={cn(
                "hidden md:flex border border-orange-100 flex-col transition-all duration-500 ease-in-out z-40 h-[calc(100vh-2rem)] md:h-[calc(100vh-3rem)] ml-4 md:ml-6 my-4 md:my-6 mr-0 rounded-[40px] shadow-[0_15px_50px_rgba(0,0,0,0.03)] overflow-hidden",
                props.isCollapsed ? "w-24" : "w-72"
            )}
        >
            <SidebarContent {...props} />
        </aside>
    );
};
