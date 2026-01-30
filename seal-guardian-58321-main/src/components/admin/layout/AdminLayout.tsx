import { useState } from "react";
import { AdminSidebar, SidebarContent, AdminModule } from "./AdminSidebar";
import { AdminModuleLayout } from "./AdminModuleLayout";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Loader2, Menu, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

import Profile from "@/pages/Profile";

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
import { AdminPOSM } from "../modules/AdminPOSM";
import { AdminCommandPalette } from "../AdminCommandPalette";

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
            case 'posm':
                return <AdminPOSM />;
            case 'profile': return <Profile embedded={true} />;
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
            'posm': 'POSM Requirements',
            'profile': 'My Profile'
        };
        return titles[activeModule];
    };

    return (
        <div className="flex flex-col md:flex-row h-screen bg-[#fffaf5] overflow-hidden">
            {/* Mobile Menu Sheet */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
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
                    onMenuToggle={() => setIsMobileMenuOpen(true)}
                    onProfileClick={() => setActiveModule('profile')}
                >
                    {renderModule()}
                </AdminModuleLayout>
            </div>
        </div>
    );
};
