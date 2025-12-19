import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, Plus, ArrowLeft, Edit, FileText, Eye, Download, Search, Loader2, X } from "lucide-react";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { getWarrantyExpiration, cn } from "@/lib/utils";
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
        return <div>Loading...</div>;
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
            <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
                <Header />
                <main className="container mx-auto px-4 py-8">
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
                </main>
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
                {items.map((warranty) => {
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
                    const { daysLeft, isExpired } = getWarrantyExpiration(warranty.created_at);

                    return (
                        <div key={warranty.id} className="group flex flex-col">
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
                                        src={warranty.product_type === 'seat-cover' ? "/icons/seat-cover.png" : "/icons/ppf.png"}
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
                                        {productName.replace(/-/g, ' ')} • <span className="text-xs opacity-70">{new Date(warranty.created_at).toLocaleDateString()}</span>
                                    </p>
                                </div>

                                {/* Status Indicator (Right aligned pill) */}
                                <div className="shrink-0 flex flex-col items-end gap-1">
                                    <div className={cn(
                                        "w-3 h-3 rounded-full shadow-sm",
                                        warranty.status === 'validated' ? "bg-green-500 shadow-green-500/50" :
                                            warranty.status === 'pending' ? "bg-amber-500 shadow-amber-500/50" :
                                                warranty.status === 'pending_vendor' ? "bg-blue-500 shadow-blue-500/50" :
                                                    "bg-red-500 shadow-red-500/50"
                                    )} />
                                    <span className="text-[10px] font-medium text-muted-foreground capitalize">
                                        {warranty.status === 'pending_vendor' ? 'In Review' : warranty.status}
                                    </span>
                                </div>
                            </div>

                            {/* Rejection Reason & Action */}
                            {showReason && (
                                <div className="relative mx-1 p-3 bg-red-500/5 rounded-b-xl border border-t-0 border-red-500/10 text-sm animate-in slide-in-from-top-1 z-0">
                                    <p className="text-red-600 mb-2 font-medium flex items-start gap-2">
                                        <span className="shrink-0 pt-0.5">•</span>
                                        {warranty.rejection_reason || "Check details and resubmit."}
                                    </p>
                                    <Button size="sm" variant="outline" className="w-full border-red-200 text-red-700 hover:bg-red-50 h-8" onClick={(e) => {
                                        e.preventDefault();
                                        setEditingWarranty(warranty);
                                    }}>
                                        <Edit className="w-3 h-3 mr-2" /> Edit & Resubmit
                                    </Button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <main className="container mx-auto px-4 py-6 max-w-2xl">
                {/* Max-w-2xl keeps it mobile-app like on desktop */}

                {/* Header Section */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">My Garage</h1>
                        <p className="text-sm text-muted-foreground">Manage your protected vehicles</p>
                    </div>
                </div>

                {/* New Warranty Actions */}
                <div className="grid grid-cols-2 gap-3 mb-8">
                    <button
                        onClick={() => setCreatingWarranty('seat-cover')}
                        className="flex flex-col items-center justify-center p-4 rounded-xl border border-border/50 bg-card hover:bg-accent/5 transition-all group active:scale-[0.98]"
                    >
                        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                            <img src="/icons/seat-cover.png" className="w-5 h-5 opacity-80" alt="Seat Cover" />
                        </div>
                        <span className="text-xs font-semibold">Add Seat Cover</span>
                    </button>
                    <button
                        onClick={() => setCreatingWarranty('ppf')}
                        className="flex flex-col items-center justify-center p-4 rounded-xl border border-border/50 bg-card hover:bg-accent/5 transition-all group active:scale-[0.98]"
                    >
                        <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                            <img src="/icons/ppf.png" className="w-5 h-5 opacity-80" alt="PPF" />
                        </div>
                        <span className="text-xs font-semibold">Add PPF</span>
                    </button>
                </div>

                {/* Search Bar */}
                <div className="sticky top-4 z-30 mb-6">
                    <div className="relative shadow-sm rounded-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search your warranties..."
                            className="w-full pl-11 pr-4 py-3 rounded-full border-0 bg-background/80 backdrop-blur-md ring-1 ring-border/50 focus:ring-2 focus:ring-primary/20 text-sm shadow-lg shadow-black/5 transition-all"
                            value={warrantySearch}
                            onChange={(e) => setWarrantySearch(e.target.value)}
                        />
                    </div>
                </div>

                {/* Filters */}
                {(warrantyDateFrom || warrantyDateTo) && (
                    <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                        <Badge variant="secondary" className="bg-muted text-muted-foreground flex gap-1 items-center whitespace-nowrap">
                            Date Filter Active <X className="h-3 w-3 cursor-pointer" onClick={() => { setWarrantyDateFrom(''); setWarrantyDateTo('') }} />
                        </Badge>
                    </div>
                )}

                {/* Tabs */}
                <Tabs defaultValue="approved" className="space-y-6">
                    <TabsList className="w-full bg-muted/20 p-1 rounded-lg h-auto grid grid-cols-3">
                        <TabsTrigger value="approved" className="rounded-md py-2 text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm text-green-700 data-[state=active]:text-green-800">
                            Approved ({approvedWarranties.length})
                        </TabsTrigger>
                        <TabsTrigger value="pending" className="rounded-md py-2 text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm text-amber-700 data-[state=active]:text-amber-800">
                            Pending ({pendingWarranties.length})
                        </TabsTrigger>
                        <TabsTrigger value="rejected" className="rounded-md py-2 text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm text-red-700 data-[state=active]:text-red-800">
                            Rejected ({rejectedWarranties.length})
                        </TabsTrigger>
                    </TabsList>

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

            </main>
        </div>
    );
};

export default CustomerDashboard;
