import { useState } from "react";
import { AdminSidebar, SidebarContent, AdminModule } from "./AdminSidebar";
import { AdminModuleLayout } from "./AdminModuleLayout";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Loader2, Menu, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

// Modules
import { AdminHome } from "../modules/AdminHome";
import { AdminWarranties } from "../modules/AdminWarranties";
import { AdminVendors } from "../modules/AdminVendors";
import { AdminCustomers } from "../modules/AdminCustomers";
import { AdminAdmins } from "../modules/AdminAdmins";
import { AdminActivityLogs } from "../modules/AdminActivityLogs";
import { AdminGrievances } from "../modules/AdminGrievances";
import { AdminProducts } from "../modules/AdminProducts";
import { AdminTerms } from "../modules/AdminTerms";
import { AdminWarrantyForm } from "../modules/AdminWarrantyForm";
import { AdminAnnouncements } from "../modules/AdminAnnouncements";
import { AdminOldWarranties } from "../modules/AdminOldWarranties";
import { AdminWarrantyProducts } from "../modules/AdminWarrantyProducts";
import { AdminCommandPalette } from "../AdminCommandPalette";

// Placeholder for now
const AdminProfile = () => <div>Profile Settings (Coming Soon)</div>;

export const AdminLayout = () => {
    const { user, loading } = useAuth();
    const [activeModule, setActiveModule] = useState<AdminModule>('overview');
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#fffaf5]">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            </div>
        );
    }

    if (!user || user.role !== 'admin') {
        return <Navigate to="/login" replace />;
    }

    const renderModule = () => {
        switch (activeModule) {
            case 'overview': return <AdminHome />;
            case 'warranties': return <AdminWarranties />;
            case 'vendors': return <AdminVendors />;
            case 'customers': return <AdminCustomers />;
            case 'warranty-products': return <AdminWarrantyProducts />;
            case 'old-warranties': return <AdminOldWarranties />;
            case 'admins': return <AdminAdmins />;
            case 'activity-logs': return <AdminActivityLogs />;
            case 'grievances': return <AdminGrievances />;
            case 'products':
                return <AdminProducts />;
            case 'terms':
                return <AdminTerms />;
            case 'warranty-form':
                return <AdminWarrantyForm />;
            case 'announcements':
                return <AdminAnnouncements />;
            case 'profile': return <AdminProfile />;
            default: return <AdminHome />;
        }
    };

    const getModuleTitle = () => {
        const titles: Record<AdminModule, string> = {
            'overview': 'Dashboard Overview',
            'warranties': 'Warranty Management',
            'old-warranties': 'Archived Records',
            'vendors': 'Franchise Network',
            'customers': 'Customer Database',
            'admins': 'Access Control',
            'activity-logs': 'System Audit',
            'grievances': 'Grievance Management',
            'products': 'Product Catalog',
            'warranty-products': 'Warranty Products List',
            'terms': 'Terms & Conditions',
            'warranty-form': 'Manual Registration',
            'announcements': 'Broadcast & Announcements',
            'profile': 'My Profile'
        };
        return titles[activeModule];
    };

    return (
        <div className="flex flex-col md:flex-row h-screen bg-[#fffaf5] overflow-hidden">
            {/* Mobile Header */}
            <div className="md:hidden h-16 bg-white border-b border-orange-50 flex items-center justify-between px-4 shrink-0 relative">
                {/* Left: Hamburger */}
                <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="-ml-2">
                            <Menu className="h-6 w-6 text-slate-600" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 w-72 border-r-orange-100 bg-white">
                        <SidebarContent
                            activeModule={activeModule}
                            onModuleChange={(module) => {
                                setActiveModule(module);
                                setIsMobileMenuOpen(false);
                            }}
                            isCollapsed={false}
                        />
                    </SheetContent>
                </Sheet>

                {/* Center: Logo */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                    <img src="/autoform-logo.png" alt="Autoform" className="h-8 w-auto" />
                </div>

                {/* Right: Profile */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="-mr-2 text-slate-600"
                    onClick={() => setActiveModule('profile')}
                >
                    <User className="h-5 w-5" />
                </Button>
            </div>

            {/* Desktop Sidebar */}
            <AdminSidebar
                activeModule={activeModule}
                onModuleChange={setActiveModule}
                isCollapsed={isCollapsed}
                onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
            />

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full overflow-hidden w-full">
                <AdminModuleLayout
                    title={getModuleTitle()}
                    description={`Managed by ${user.name}`}
                    actions={
                        <AdminCommandPalette onNavigate={setActiveModule} />
                    }
                >
                    {renderModule()}
                </AdminModuleLayout>
            </div>
        </div>
    );
};
