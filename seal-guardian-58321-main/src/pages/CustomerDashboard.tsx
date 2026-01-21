import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, ArrowLeft, Edit, Search, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { getWarrantyExpiration, cn, formatToIST } from "@/lib/utils";
import EVProductsForm from "@/components/warranty/EVProductsForm";
import SeatCoverForm from "@/components/warranty/SeatCoverForm";
import { Pagination } from "@/components/Pagination";
import { WarrantySpecSheet } from "@/components/warranty/WarrantySpecSheet";

const CustomerDashboard = () => {
    const { user, loading } = useAuth();
    const [warranties, setWarranties] = useState<any[]>([]);
    const [loadingWarranties, setLoadingWarranties] = useState(false);
    const [editingWarranty, setEditingWarranty] = useState<any>(null);
    const [creatingWarranty, setCreatingWarranty] = useState<'seat-cover' | 'ppf' | null>(null);
    const [warrantyPagination, setWarrantyPagination] = useState({ currentPage: 1, totalPages: 1, totalCount: 0, limit: 30, hasNextPage: false, hasPrevPage: false });

    // Spec Sheet State
    const [specSheetData, setSpecSheetData] = useState<any | null>(null);

    // Search & Sort State
    const [warrantySearch, setWarrantySearch] = useState('');
    const [warrantySortField, setWarrantySortField] = useState<'created_at' | 'product_type' | 'status'>('created_at');
    const [warrantySortOrder, setWarrantySortOrder] = useState<'asc' | 'desc'>('desc');
    const [warrantyDateFrom, setWarrantyDateFrom] = useState('');
    const [warrantyDateTo, setWarrantyDateTo] = useState('');

    useEffect(() => {
        if (user?.role === "customer") {
            fetchWarranties();
        }
    }, [user]);

    const fetchWarranties = async (page = 1) => {
        setLoadingWarranties(true);
        try {
            const response = await api.get(`/warranty?page=${page}&limit=30`);
            if (response.data.success) {
                setWarranties(response.data.warranties);
                if (response.data.pagination) {
                    setWarrantyPagination(response.data.pagination);
                }
            }
        } catch (error) {
            console.error("Failed to fetch warranties", error);
        } finally {
            setLoadingWarranties(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-12 w-12 text-primary animate-spin" />
                    <p className="text-muted-foreground font-medium animate-pulse">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login?role=customer" replace />;
    }

    if (user.role !== "customer") {
        return <Navigate to="/warranty" replace />;
    }

    if (editingWarranty || creatingWarranty) {
        const isEditing = !!editingWarranty;
        const productType = isEditing
            ? editingWarranty.product_type
            : (creatingWarranty === 'ppf' ? 'ev-products' : 'seat-cover');

        const FormComponent = productType === "seat-cover"
            ? SeatCoverForm
            : EVProductsForm;

        return (
            <div className="bg-gradient-to-b from-background to-muted/30">
                <div className="container mx-auto px-4 py-8">
                    <Button
                        variant="ghost"
                        onClick={() => {
                            setEditingWarranty(null);
                            setCreatingWarranty(null);
                        }}
                        className="mb-6"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                    </Button>
                    <FormComponent
                        initialData={editingWarranty}
                        warrantyId={editingWarranty?.id}
                        onSuccess={() => {
                            setEditingWarranty(null);
                            setCreatingWarranty(null);
                            fetchWarranties();
                        }}
                    />
                </div>
            </div>
        );
    }

    const pendingWarranties = warranties.filter(w => ['pending', 'pending_vendor'].includes(w.status));
    const approvedWarranties = warranties.filter(w => w.status === 'validated');
    const rejectedWarranties = warranties.filter(w => w.status === 'rejected');

    // Filter and Sort Helper
    const filterAndSortWarranties = (items: any[]) => {
        return items
            .filter((warranty: any) => {
                // Date range filter
                if (warrantyDateFrom || warrantyDateTo) {
                    const warrantyDate = new Date(warranty.created_at);
                    warrantyDate.setHours(0, 0, 0, 0);
                    if (warrantyDateFrom) {
                        const fromDate = new Date(warrantyDateFrom);
                        fromDate.setHours(0, 0, 0, 0);
                        if (warrantyDate < fromDate) return false;
                    }
                    if (warrantyDateTo) {
                        const toDate = new Date(warrantyDateTo);
                        toDate.setHours(23, 59, 59, 999);
                        if (warrantyDate > toDate) return false;
                    }
                }

                if (!warrantySearch) return true;
                const search = warrantySearch.toLowerCase();
                // Parse product_details to get product name
                const productDetails = typeof warranty.product_details === 'string'
                    ? JSON.parse(warranty.product_details || '{}')
                    : warranty.product_details || {};
                // Map product names to display names for search
                const productNameMapping: Record<string, string> = {
                    'paint-protection': 'Paint Protection Films',
                    'sun-protection': 'Sun Protection Films',
                };
                const rawProductName = productDetails.product || productDetails.productName || '';
                const displayProductName = productNameMapping[rawProductName] || rawProductName;
                // Handle specific search term mappings
                if (search === 'ppf') {
                    if (
                        warranty.product_type?.toLowerCase().includes('paint-protection') ||
                        rawProductName.toLowerCase().includes('paint-protection') ||
                        displayProductName.toLowerCase().includes('paint protection films') ||
                        rawProductName.toLowerCase().includes('ppf')
                    ) {
                        return true;
                    }
                }

                return (
                    warranty.uid?.toLowerCase().includes(search) ||
                    warranty.product_type?.toLowerCase().includes(search) ||
                    warranty.car_make?.toLowerCase().includes(search) ||
                    warranty.car_model?.toLowerCase().includes(search) ||
                    rawProductName.toLowerCase().includes(search) ||
                    displayProductName.toLowerCase().includes(search) ||
                    warranty.warranty_type?.toLowerCase().includes(search)
                );
            })
            .sort((a: any, b: any) => {
                let aVal = a[warrantySortField];
                let bVal = b[warrantySortField];
                if (warrantySortField === 'created_at') {
                    aVal = new Date(aVal).getTime();
                    bVal = new Date(bVal).getTime();
                } else {
                    aVal = (aVal || '').toString().toLowerCase();
                    bVal = (bVal || '').toString().toLowerCase();
                }
                return warrantySortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
            });
    };

    // List Component
    const WarrantyList = ({ items, showReason = false }: { items: any[], showReason?: boolean }) => {
        if (items.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center py-16 text-center border rounded-xl border-dashed bg-muted/10">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                        <Package className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                    <h3 className="text-lg font-medium">No Warranties Found</h3>
                    <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
                        Your registered warranties will appear here.
                    </p>
                </div>
            );
        }

        return (
            <div className="space-y-3">
                {items.map((warranty, index) => {
                    const productDetails = typeof warranty.product_details === 'string'
                        ? JSON.parse(warranty.product_details || '{}')
                        : warranty.product_details || {};

                    const productNameMapping: Record<string, string> = {
                        'paint-protection': 'Paint Protection Films',
                        'sun-protection': 'Sun Protection Films',
                    };

                    const rawProductName = productDetails.product || productDetails.productName || warranty.product_type;
                    const productName = productNameMapping[rawProductName] || rawProductName;

                    // Expiration Logic
                    const { daysLeft, isExpired } = getWarrantyExpiration(warranty.created_at, warranty.warranty_type);

                    return (
                        <div key={warranty.id || index} className="group flex flex-col">
                            <div
                                onClick={() => setSpecSheetData(warranty)}
                                className={cn(
                                    "relative flex items-center gap-4 p-4 bg-card hover:bg-accent/5 transition-all rounded-xl border border-border/50 shadow-sm cursor-pointer active:scale-[0.99] z-10",
                                    showReason && "rounded-b-none border-b-0"
                                )}
                            >
                                {/* Icon */}
                                <div className={cn(
                                    "h-12 w-12 rounded-full flex items-center justify-center shrink-0 border",
                                    warranty.product_type === 'seat-cover' ? "bg-blue-500/10 border-blue-500/20 text-blue-600" : "bg-purple-500/10 border-purple-500/20 text-purple-600"
                                )}>
                                    <img
                                        src={warranty.product_type === 'seat-cover' ? "/seat-cover-icon.png" : "/ppf-icon.png"}
                                        alt="Icon"
                                        className="w-6 h-6 object-contain opacity-80 group-hover:opacity-100 transition-opacity"
                                    />
                                </div>

                                {/* Main Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <h4 className="font-semibold text-base truncate pr-2">
                                            {warranty.car_make} {warranty.car_model}
                                        </h4>
                                        {warranty.status === 'validated' && (
                                            <Badge variant="outline" className={cn(
                                                "h-5 text-[10px] px-1.5 uppercase tracking-wide border-0",
                                                isExpired ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"
                                            )}>
                                                {isExpired ? 'Expired' : 'Active'}
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground truncate">
                                        {productName.replace(/-/g, ' ')} • <span className="text-xs opacity-70">{formatToIST(warranty.created_at)}</span>
                                        {warranty.product_type !== 'seat-cover' && (
                                            <span className="ml-2">• <span className="font-mono ml-1">Serial: {productDetails.serialNumber || warranty.uid}</span></span>
                                        )}
                                    </p>
                                </div>

                                {/* Status Indicator (Right aligned) */}
                                <div className="shrink-0 flex flex-col items-end gap-1">
                                    {/* Show days remaining for approved warranties */}
                                    {warranty.status === 'validated' && (
                                        <span className={cn(
                                            "text-xs font-semibold",
                                            isExpired ? "text-red-600" : "text-green-600"
                                        )}>
                                            {isExpired ? "Expired" : `${daysLeft} days`}
                                        </span>
                                    )}
                                    <div className="flex items-center gap-1.5">
                                        <div className={cn(
                                            "w-2.5 h-2.5 rounded-full shadow-sm",
                                            warranty.status === 'validated' ? "bg-green-500 shadow-green-500/50" :
                                                warranty.status === 'pending' ? "bg-amber-500 shadow-amber-500/50" :
                                                    warranty.status === 'pending_vendor' ? "bg-blue-500 shadow-blue-500/50" :
                                                        "bg-red-500 shadow-red-500/50"
                                        )} />
                                        <span className="text-[10px] font-medium text-muted-foreground capitalize">
                                            {warranty.status === 'pending_vendor' ? 'In Review' : warranty.status === 'validated' ? 'Approved' : warranty.status}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Rejection Reason & Action */}
                            {showReason && (
                                <div className="relative mx-1 p-3 bg-red-500/5 rounded-b-xl border border-t-0 border-red-500/10 text-sm animate-in slide-in-from-top-1 z-0">
                                    <p className="text-red-600 mb-2 font-medium flex items-start gap-2">
                                        <span className="shrink-0 pt-0.5">•</span>
                                        {warranty.rejection_reason || "Check details and resubmit."}
                                    </p>

                                    {(productDetails.retryCount || 0) >= 1 ? (
                                        <div className="mt-2 text-xs text-red-500 font-semibold bg-red-100/50 p-2 rounded border border-red-100">
                                            Max resubmission limit reached. Please register as a new warranty.
                                        </div>
                                    ) : (
                                        <Button size="sm" variant="outline" className="w-full border-red-200 text-red-700 hover:bg-red-50 h-8" onClick={(e) => {
                                            e.preventDefault();
                                            setEditingWarranty(warranty);
                                        }}>
                                            <Edit className="w-3 h-3 mr-2" /> Edit & Resubmit
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="container mx-auto px-4 md:px-8 py-8">
            {/* Header Section */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">My Garage</h1>
                    <p className="text-sm text-muted-foreground">Manage your protected vehicles</p>
                </div>
            </div>

            {/* New Warranty Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                <button
                    onClick={() => setCreatingWarranty('seat-cover')}
                    className="relative flex flex-col items-center justify-center p-6 md:p-8 min-h-[200px] rounded-3xl border border-red-50 bg-gradient-to-b from-red-50/50 to-white hover:from-red-50 hover:to-white transition-all group active:scale-[0.99] shadow-sm hover:shadow-xl hover:shadow-red-500/5 overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-28 h-28 bg-red-500/5 rounded-bl-[80px] -mr-6 -mt-6 transition-transform group-hover:scale-110" />
                    <div className="relative w-16 h-16 mb-4 group-hover:scale-110 transition-transform duration-300 drop-shadow-sm flex items-center justify-center bg-red-100/50 rounded-2xl p-3">
                        <img src="/seat-cover-icon.png" className="w-full h-full object-contain" alt="Seat Cover" />
                    </div>
                    <div className="text-center relative z-10">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">Add Seat Cover Warranty</h3>
                        <p className="text-sm text-gray-500">Protect your vehicle interiors</p>
                    </div>
                </button>
                <button
                    onClick={() => setCreatingWarranty('ppf')}
                    className="relative flex flex-col items-center justify-center p-6 md:p-8 min-h-[200px] rounded-3xl border border-blue-50 bg-gradient-to-b from-blue-50/50 to-white hover:from-blue-50 hover:to-white transition-all group active:scale-[0.99] shadow-sm hover:shadow-xl hover:shadow-blue-500/5 overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-28 h-28 bg-blue-500/5 rounded-bl-[80px] -mr-6 -mt-6 transition-transform group-hover:scale-110" />
                    <div className="relative w-16 h-16 mb-4 group-hover:scale-110 transition-transform duration-300 drop-shadow-sm flex items-center justify-center bg-blue-100/50 rounded-2xl p-3">
                        <img src="/ppf-icon.png" className="w-full h-full object-contain" alt="PPF" />
                    </div>
                    <div className="text-center relative z-10">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">Add PPF Warranty</h3>
                        <p className="text-sm text-gray-500">Premium paint protection</p>
                    </div>
                </button>
            </div>

            {/* Tabs & Search Section */}
            <Tabs defaultValue="approved" className="space-y-6">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6 sticky top-20 md:top-4 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-2">
                    {/* Search Bar */}
                    <div className="relative shadow-sm rounded-full w-full md:max-w-xl">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search your warranties..."
                            className="w-full pl-11 pr-4 py-2.5 rounded-full border border-input bg-white ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-sm transition-all shadow-sm"
                            value={warrantySearch}
                            onChange={(e) => setWarrantySearch(e.target.value)}
                        />
                    </div>

                    {/* Filter Tabs */}
                    <div className="w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-none">
                        <TabsList className="bg-muted/50 p-1 rounded-full h-9 md:h-11 w-full md:w-auto grid grid-cols-3 md:inline-flex">
                            <TabsTrigger
                                value="approved"
                                className="rounded-full px-1 md:px-5 py-1 md:py-2 text-[10px] sm:text-xs md:text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all flex items-center justify-center gap-1 md:gap-2 whitespace-nowrap"
                            >
                                Approved
                                <span className="ml-1 md:ml-1.5 py-0.5 px-1.5 md:px-2 rounded-full bg-green-100 text-green-700 text-[9px] md:text-[10px] font-bold">
                                    {approvedWarranties.length}
                                </span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="pending"
                                className="rounded-full px-1 md:px-5 py-1 md:py-2 text-[10px] sm:text-xs md:text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all flex items-center justify-center gap-1 md:gap-2 whitespace-nowrap"
                            >
                                Pending
                                <span className="ml-1 md:ml-1.5 py-0.5 px-1.5 md:px-2 rounded-full bg-amber-100 text-amber-700 text-[9px] md:text-[10px] font-bold">
                                    {pendingWarranties.length}
                                </span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="rejected"
                                className="rounded-full px-1 md:px-5 py-1 md:py-2 text-[10px] sm:text-xs md:text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all flex items-center justify-center gap-1 md:gap-2 whitespace-nowrap"
                            >
                                Rejected
                                <span className="ml-1 md:ml-1.5 py-0.5 px-1.5 md:px-2 rounded-full bg-red-100 text-red-700 text-[9px] md:text-[10px] font-bold">
                                    {rejectedWarranties.length}
                                </span>
                            </TabsTrigger>
                        </TabsList>
                    </div>
                </div>

                <TabsContent value="approved" className="outline-none animate-in fade-in slide-in-from-bottom-2 duration-500">
                    {loadingWarranties ? (
                        <div className="py-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                    ) : (
                        <WarrantyList items={filterAndSortWarranties(approvedWarranties)} />
                    )}
                </TabsContent>
                <TabsContent value="pending" className="outline-none animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <WarrantyList items={filterAndSortWarranties(pendingWarranties)} />
                </TabsContent>
                <TabsContent value="rejected" className="outline-none animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <WarrantyList items={filterAndSortWarranties(rejectedWarranties)} showReason={true} />
                </TabsContent>
            </Tabs>

            {/* Pagination */}
            <div className="mt-8">
                <Pagination
                    currentPage={warrantyPagination.currentPage}
                    totalPages={warrantyPagination.totalPages}
                    totalCount={warrantyPagination.totalCount}
                    limit={warrantyPagination.limit}
                    onPageChange={(page) => fetchWarranties(page)}
                />
            </div>

            {/* The Spec Sheet Component */}
            <WarrantySpecSheet
                isOpen={!!specSheetData}
                onClose={() => setSpecSheetData(null)}
                warranty={specSheetData}
            />

            {/* Create Warranty Dialogs */}
            <Dialog open={creatingWarranty === 'seat-cover'} onOpenChange={(open) => !open && setCreatingWarranty(null)}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Register Seat Cover Warranty</DialogTitle>
                        <DialogDescription>Enter the details for your new seat cover warranty.</DialogDescription>
                    </DialogHeader>
                    <SeatCoverForm
                        onSuccess={() => {
                            setCreatingWarranty(null);
                            fetchWarranties();
                        }}
                    />
                </DialogContent>
            </Dialog>

            <Dialog open={creatingWarranty === 'ppf'} onOpenChange={(open) => !open && setCreatingWarranty(null)}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Register PPF Warranty</DialogTitle>
                        <DialogDescription>Enter the details for your new paint protection film warranty.</DialogDescription>
                    </DialogHeader>
                    <EVProductsForm
                        isUniversal={false}
                        onSuccess={() => {
                            setCreatingWarranty(null);
                            fetchWarranties();
                        }}
                    />
                </DialogContent>
            </Dialog>

            {/* Edit Warranty Dialog */}
            <Dialog open={!!editingWarranty} onOpenChange={(open) => !open && setEditingWarranty(null)}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Warranty</DialogTitle>
                        <DialogDescription>Update the details for your rejected warranty.</DialogDescription>
                    </DialogHeader>
                    {editingWarranty?.product_type === 'seat-cover' ? (
                        <SeatCoverForm
                            initialData={editingWarranty}
                            isEditing={true}
                            onSuccess={() => {
                                setEditingWarranty(null);
                                fetchWarranties();
                            }}
                        />
                    ) : (
                        <EVProductsForm
                            initialData={editingWarranty}
                            isEditing={true}
                            isUniversal={false}
                            onSuccess={() => {
                                setEditingWarranty(null);
                                fetchWarranties();
                            }}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default CustomerDashboard;
