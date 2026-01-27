import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { Loader2, Plus, Download } from "lucide-react";
import { downloadCSV, cn, formatToIST } from "@/lib/utils";
import { fetchProducts, Product } from '@/lib/catalogService';
import { useNotifications } from "@/contexts/NotificationContext";

// Components
import { DashboardSidebar, FmsModule } from "@/components/fms/DashboardSidebar";
import { ModuleLayout } from "@/components/fms/ModuleLayout";
import { StatsOverview } from "@/components/fms/StatsOverview";
import { FranchiseHome } from "@/components/fms/FranchiseHome";
import { WarrantyManagement } from "@/components/fms/WarrantyManagement";
import { StaffManagement } from "@/components/fms/StaffManagement";
import VendorCatalog from "@/components/eshop/VendorCatalog";
import { NewsAlerts } from "@/components/fms/NewsAlerts";
import { ComingSoon } from "@/components/fms/ComingSoon";
import VendorGrievances from "@/components/fms/VendorGrievances";
import Profile from "./Profile";
import { Button } from "@/components/ui/button";

// Existing Components for Modals
import EVProductsForm from "@/components/warranty/EVProductsForm";
import SeatCoverForm from "@/components/warranty/SeatCoverForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { WarrantySpecSheet } from "@/components/warranty/WarrantySpecSheet";
import { Badge } from "@/components/ui/badge";

const FranchiseDashboard = () => {
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const { fullHistory } = useNotifications();
    const [activeModule, setActiveModule] = useState<FmsModule>('home');
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Data States
    const [warranties, setWarranties] = useState<any[]>([]);
    const [manpowerList, setManpowerList] = useState<any[]>([]);
    const [pastManpowerList, setPastManpowerList] = useState<any[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [warrantyPagination, setWarrantyPagination] = useState({ currentPage: 1, totalPages: 1, totalCount: 0, limit: 30, hasNextPage: false, hasPrevPage: false });

    // Search & Filter States
    const [warrantySearch, setWarrantySearch] = useState('');
    const [warrantySortField, setWarrantySortField] = useState<'created_at' | 'customer_name' | 'status' | 'product_type'>('created_at');
    const [warrantySortOrder, setWarrantySortOrder] = useState<'asc' | 'desc'>('desc');
    const [warrantyDateFrom, setWarrantyDateFrom] = useState('');
    const [warrantyDateTo, setWarrantyDateTo] = useState('');

    // Modal/Dialog States
    const [registrationType, setRegistrationType] = useState<'ev' | 'seat-cover' | null>(null);
    const [selectedWarranty, setSelectedWarranty] = useState<any | null>(null);
    const [manpowerWarrantyDialogOpen, setManpowerWarrantyDialogOpen] = useState(false);
    const [manpowerWarrantyDialogData, setManpowerWarrantyDialogData] = useState<{ member: any; status: 'validated' | 'pending' | 'rejected'; warranties: any[] }>({ member: null, status: 'validated', warranties: [] });

    // Manpower Form State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [addingManpower, setAddingManpower] = useState(false);
    const [updatingManpower, setUpdatingManpower] = useState(false);

    useEffect(() => {
        if (user?.role === "vendor") {
            fetchAllData();
        }
    }, [user]);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [warrantyRes, manpowerRes, pastManpowerRes, prods] = await Promise.all([
                api.get('/warranty?limit=100'),
                api.get('/vendor/manpower?active=true'),
                api.get('/vendor/manpower?active=false'),
                fetchProducts()
            ]);

            setProducts(prods);

            if (warrantyRes.data.success) {
                setWarranties(warrantyRes.data.warranties);
                if (warrantyRes.data.pagination) setWarrantyPagination(warrantyRes.data.pagination);
            }
            if (manpowerRes.data.success) setManpowerList(manpowerRes.data.manpower);
            if (pastManpowerRes.data.success) setPastManpowerList(pastManpowerRes.data.manpower);
        } catch (error) {
            console.error("Fetch failed", error);
            toast({ title: "Sync Failed", description: "Could not refresh dashboard data.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const fetchWarranties = async (page = 1, background = false) => {
        if (!background) setLoading(true);
        try {
            const response = await api.get(`/warranty?page=${page}&limit=100`);
            if (response.data.success) {
                setWarranties(response.data.warranties);
                if (response.data.pagination) setWarrantyPagination(response.data.pagination);
            }
        } catch (error) {
            console.error("Failed to fetch warranties", error);
        } finally {
            if (!background) setLoading(false);
        }
    };

    // Handlers ported from VendorDashboard
    const handleVerifyWarranty = async (warranty: any) => {
        try {
            const response = await api.post(`/vendor/warranty/${warranty.uid}/approve`);
            if (response.data.success) {
                toast({ title: "Warranty Approved", description: "Installation status updated." });
                fetchWarranties(warrantyPagination.currentPage, true);
            }
        } catch (error: any) {
            toast({ title: "Action Failed", description: error.response?.data?.error || "Could not approve", variant: "destructive" });
        }
    };

    const handleRejectWarranty = async (warranty: any) => {
        const reason = prompt("Please enter the reason for rejection:");
        if (!reason) return;
        try {
            const response = await api.post(`/vendor/warranty/${warranty.uid}/reject`, { reason });
            if (response.data.success) {
                toast({ title: "Warranty Rejected", variant: "destructive" });
                fetchWarranties(warrantyPagination.currentPage, true);
            }
        } catch (error: any) {
            toast({ title: "Action Failed", description: error.response?.data?.error || "Could not reject", variant: "destructive" });
        }
    };

    const handleAddManpower = async (data: any) => {
        setAddingManpower(true);
        try {
            const response = await api.post("/vendor/manpower", {
                name: data.name,
                phoneNumber: data.phone,
                applicatorType: data.type
            });
            if (response.data.success) {
                toast({ title: "Manpower Added" });
                setManpowerList([...manpowerList, response.data.manpower]);
                return true;
            }
        } catch (error: any) {
            toast({ title: "Addition Failed", description: error.response?.data?.error || "Could not add", variant: "destructive" });
        } finally {
            setAddingManpower(false);
        }
        return false;
    };

    const handleUpdateManpower = async (id: string, data: any) => {
        setUpdatingManpower(true);
        try {
            const response = await api.put(`/vendor/manpower/${id}`, {
                name: data.name,
                phoneNumber: data.phone,
                applicatorType: data.type
            });
            if (response.data.success) {
                toast({ title: "Manpower Updated" });
                setManpowerList(manpowerList.map(m => m.id === id ? response.data.manpower : m));
                setEditingId(null);
                return true;
            }
        } catch (error: any) {
            toast({ title: "Update Failed", description: error.response?.data?.error || "Could not update", variant: "destructive" });
        } finally {
            setUpdatingManpower(false);
        }
        return false;
    };

    const handleDeleteManpower = async (id: string) => {
        if (!confirm("Are you sure you want to remove this team member?")) return;
        try {
            const response = await api.delete(`/vendor/manpower/${id}`);
            if (response.data.success) {
                toast({ title: "Manpower Removed" });
                setManpowerList(manpowerList.filter(m => m.id !== id));
            }
        } catch (error: any) {
            toast({ title: "Removal Failed", description: error.response?.data?.error || "Could not remove", variant: "destructive" });
        }
    };

    const showManpowerWarranties = (member: any, status: 'validated' | 'pending' | 'rejected') => {
        const memberWarranties = warranties.filter((w: any) =>
            w.manpower_id === member.id && (
                status === 'pending'
                    ? (w.status === 'pending' || w.status === 'pending_vendor')
                    : w.status === status
            )
        );
        setManpowerWarrantyDialogData({ member, status, warranties: memberWarranties });
        setManpowerWarrantyDialogOpen(true);
    };

    const handleExportWarranties = () => {
        const exportData = warranties.map(w => {
            const productDetails = typeof w.product_details === 'string' ? JSON.parse(w.product_details) : w.product_details || {};
            return {
                Date: formatToIST(w.created_at),
                Product: w.product_type?.toUpperCase(),
                Customer: w.customer_name,
                Phone: w.customer_phone,
                Vehicle: `${w.car_make || ''} ${w.car_model || ''}`,
                Status: w.status.toUpperCase(),
                Installer: w.manpower_name || 'N/A'
            };
        });
        downloadCSV(exportData, `warranties_export_${new Date().toISOString().split('T')[0]}.csv`);
        toast({ title: "Export Successful" });
    };

    if (authLoading) return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-white gap-4">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest animate-pulse">Initializing FMS...</p>
        </div>
    );
    if (!user) return <Navigate to="/login" />;
    if (user.role !== "vendor") return <Navigate to="/" />;

    const renderModule = () => {
        // Pre-calculate data for Home module
        const homeStats = {
            total: warranties.length,
            approved: warranties.filter(w => w.status === 'validated').length,
            pending: warranties.filter(w => w.status === 'pending_vendor').length,
            manpower: manpowerList.length
        };

        const recentActivityData = warranties
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 5)
            .map(w => {
                const toTitleCase = (str: string) => {
                    if (!str) return str;
                    return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
                };
                return {
                    time: formatToIST(w.created_at),
                    action: w.status === 'validated' ? 'Warranty Approved' :
                        w.status === 'rejected' ? 'Warranty Rejected' : 'New Registration',
                    sub: `${toTitleCase(w.customer_name)} • ${toTitleCase(w.car_make)}`,
                    status: w.status === 'validated' ? 'success' :
                        w.status === 'rejected' ? 'warning' : 'primary'
                };
            });

        // New Arrivals: Latest 8 products
        const newProducts = [...products].sort((a, b) => b.id.localeCompare(a.id)).slice(0, 8);

        // Platform Updates: Latest 3 alert/system/product notifications
        const latestUpdates = fullHistory
            .filter(n => n.type === 'alert' || n.type === 'system' || n.type === 'product')
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 3);

        switch (activeModule) {
            case 'home':
                return <FranchiseHome
                    stats={homeStats}
                    recentActivity={recentActivityData}
                    onNavigate={setActiveModule}
                    newProducts={newProducts}
                    latestUpdates={latestUpdates}
                />;
            case 'warranty':
                return (
                    <WarrantyManagement
                        warranties={warranties}
                        onRegisterNew={setRegistrationType}
                        onExport={handleExportWarranties}
                        onSelect={setSelectedWarranty}
                        onVerify={handleVerifyWarranty}
                        onReject={handleRejectWarranty}
                        warrantySearch={warrantySearch}
                        setWarrantySearch={setWarrantySearch}
                    />
                );
            case 'manpower':
                return (
                    <StaffManagement
                        manpowerList={manpowerList}
                        pastManpowerList={pastManpowerList}
                        onAdd={handleAddManpower}
                        onEdit={handleUpdateManpower}
                        onDelete={handleDeleteManpower}
                        onShowWarranties={showManpowerWarranties}
                        editingId={editingId}
                        setEditingId={setEditingId}
                    />
                );
            case 'catalogue':
                return <VendorCatalog />;
            case 'news':
                return <NewsAlerts />;
            case 'grievances':
                return <VendorGrievances />;
            case 'profile':
                return <Profile embedded={true} />;
            case 'orders':
            case 'offers':
            case 'audit':
            case 'targets':
            case 'posm':
                return <ComingSoon title={activeModule.charAt(0).toUpperCase() + activeModule.slice(1)} />;
            default:
                return <FranchiseHome
                    stats={homeStats}
                    recentActivity={recentActivityData}
                    onNavigate={setActiveModule}
                    newProducts={newProducts}
                    latestUpdates={latestUpdates}
                />;
        }
    };

    const getModuleTitle = () => {
        const titles: Record<string, string> = {
            home: "Channel Partner Home",
            warranty: "Warranty Management",
            manpower: "Manpower Control",
            catalogue: "Product Catalogue",
            news: "News & Alerts",
            orders: "Order Management",
            grievances: "Grievance Redressal",
            offers: "Offers & Schemes",
            audit: "Audit & Compliance",
            targets: "Targets & Achievements",
            posm: "POSM Requirements",
            profile: "My Profile"
        };
        return titles[activeModule] || "Dashboard";
    };

    const getModuleActions = () => {
        // Registration buttons removed per requirements
        return null;
    };

    return (
        <div className="flex h-screen bg-[#fffaf5]">
            <DashboardSidebar
                activeModule={activeModule}
                onModuleChange={setActiveModule}
                isCollapsed={isCollapsed}
                onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
            />

            <div className="flex-1 flex flex-col overflow-hidden relative">
                <ModuleLayout
                    title={getModuleTitle()}
                    description={activeModule === 'home' ? `Welcome back, ${user.name}` : undefined}
                    isCollapsed={isCollapsed}
                    actions={getModuleActions()}
                >
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-[400px] gap-4">
                            <Loader2 className="h-8 w-8 text-primary animate-spin" />
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Synchronizing Module...</p>
                        </div>
                    ) : renderModule()}
                </ModuleLayout>

                {/* Modals for Registration */}
                <Dialog open={!!registrationType} onOpenChange={() => setRegistrationType(null)}>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold">
                                {registrationType === 'ev' ? 'PPF / EV Product Registration' : 'Seat Cover Registration'}
                            </DialogTitle>
                        </DialogHeader>
                        {registrationType === 'ev' ? (
                            <EVProductsForm onSuccess={() => { setRegistrationType(null); fetchAllData(); }} />
                        ) : (
                            <SeatCoverForm onSuccess={() => { setRegistrationType(null); fetchAllData(); }} />
                        )}
                    </DialogContent>
                </Dialog>

                {/* Spec Sheet Modal */}
                <Dialog open={!!selectedWarranty} onOpenChange={() => setSelectedWarranty(null)}>
                    <DialogContent className="max-w-4xl p-0 overflow-hidden border-0">
                        {selectedWarranty && (
                            <div className="max-h-[85vh] overflow-y-auto custom-scrollbar">
                                <WarrantySpecSheet
                                    warranty={selectedWarranty}
                                    isOpen={!!selectedWarranty}
                                    onClose={() => setSelectedWarranty(null)}
                                />
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Manpower Warranty Details Dialog */}
                <Dialog open={manpowerWarrantyDialogOpen} onOpenChange={setManpowerWarrantyDialogOpen}>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold">
                                {manpowerWarrantyDialogData.member?.name} - {manpowerWarrantyDialogData.status === 'validated' ? 'Approved' : manpowerWarrantyDialogData.status === 'rejected' ? 'Disapproved' : 'Pending'} Warranties
                            </DialogTitle>
                            <DialogDescription>
                                {manpowerWarrantyDialogData.warranties.length} entries found
                            </DialogDescription>
                        </DialogHeader>
                        <div className="mt-6 space-y-4">
                            {manpowerWarrantyDialogData.warranties.length === 0 ? (
                                <p className="text-center py-12 text-muted-foreground font-medium">No warranties found in this category.</p>
                            ) : (
                                manpowerWarrantyDialogData.warranties.map((w: any) => (
                                    <div key={w.id} className="p-4 border rounded-xl bg-muted/30 hover:bg-muted/50 transition-all group">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <p className="font-bold text-base group-hover:text-primary transition-colors">{w.customer_name}</p>
                                                <p className="text-xs text-muted-foreground font-medium">{w.customer_phone}</p>
                                            </div>
                                            <Badge variant="outline" className="bg-background/80 font-bold uppercase text-[10px]">
                                                {w.product_type}
                                            </Badge>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 text-xs">
                                            <div>
                                                <p className="text-muted-foreground mb-1 uppercase tracking-tighter font-bold">Vehicle</p>
                                                <p className="font-semibold">{w.car_make} {w.car_model}</p>
                                            </div>
                                            <div>
                                                <p className="text-muted-foreground mb-1 uppercase tracking-tighter font-bold">Date</p>
                                                <p className="font-semibold">{formatToIST(w.created_at)}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
};

export default FranchiseDashboard;
