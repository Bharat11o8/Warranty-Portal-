import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, Plus, ArrowLeft, Edit, FileText, Eye, Download, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import EVProductsForm from "@/components/warranty/EVProductsForm";
import SeatCoverForm from "@/components/warranty/SeatCoverForm";
import { Pagination } from "@/components/Pagination";

const CustomerDashboard = () => {
    const { user, loading } = useAuth();
    const [warranties, setWarranties] = useState<any[]>([]);
    const [loadingWarranties, setLoadingWarranties] = useState(false);
    const [editingWarranty, setEditingWarranty] = useState<any>(null);
    const [warrantyPagination, setWarrantyPagination] = useState({ currentPage: 1, totalPages: 1, totalCount: 0, limit: 30, hasNextPage: false, hasPrevPage: false });

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

    if (editingWarranty) {
        const FormComponent = editingWarranty.product_type === "seat-cover"
            ? SeatCoverForm
            : EVProductsForm;

        return (
            <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
                <Header />
                <main className="container mx-auto px-4 py-8">
                    <Button
                        variant="ghost"
                        onClick={() => setEditingWarranty(null)}
                        className="mb-6"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                    </Button>
                    <FormComponent
                        initialData={editingWarranty}
                        warrantyId={editingWarranty.id}
                        onSuccess={() => {
                            setEditingWarranty(null);
                            fetchWarranties();
                        }}
                    />
                </main>
            </div>
        );
    }

    const pendingWarranties = warranties.filter(w => w.status === 'pending');
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

    const WarrantyList = ({ items, showReason = false }: { items: any[], showReason?: boolean }) => {
        if (items.length === 0) {
            return (
                <Card className="border-dashed">
                    <CardHeader>
                        <div className="flex items-center justify-center h-32 text-muted-foreground">
                            <Package className="h-16 w-16" />
                        </div>
                        <CardTitle className="text-center">No Warranties Found</CardTitle>
                        <CardDescription className="text-center">
                            No warranties in this category
                        </CardDescription>
                    </CardHeader>
                </Card>
            );
        }

        return (
            <div className="grid gap-4">
                {items.map((warranty) => {
                    // Handle product_details - it might be a string or already an object
                    const productDetails = typeof warranty.product_details === 'string'
                        ? JSON.parse(warranty.product_details)
                        : warranty.product_details || {};
                    const productNameMapping: Record<string, string> = {
                        'paint-protection': 'Paint Protection Films',
                        'sun-protection': 'Sun Protection Films',
                    };

                    const rawProductName = productDetails.product || productDetails.productName || warranty.product_type;
                    const productName = productNameMapping[rawProductName] || rawProductName;

                    return (
                        <Card key={warranty.uid || warranty.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="pt-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1">
                                        {/* Product Name (Bold, Uppercase) and Product Type (Small, Normal) */}
                                        <div className="flex items-baseline gap-2 mb-1">
                                            <h3 className="text-lg font-bold uppercase tracking-wide">
                                                {productName.replace(/-/g, ' ')}
                                            </h3>
                                            <span className="text-sm text-muted-foreground normal-case">
                                                {warranty.product_type}
                                            </span>
                                        </div>

                                        {/* Registered Date */}
                                        <p className="text-sm text-muted-foreground">
                                            Registered on {new Date(warranty.created_at).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </p>
                                    </div>

                                    {/* Status Badge */}
                                    <Badge variant={
                                        warranty.status === 'validated' ? 'default' :
                                            warranty.status === 'rejected' ? 'destructive' : 'secondary'
                                    } className={warranty.status === 'validated' ? 'bg-green-600' : ''}>
                                        {warranty.status === 'validated' ? 'Approved' : warranty.status === 'rejected' ? 'Disapproved' : warranty.status}
                                    </Badge>
                                </div>

                                {/* Warranty Details Grid */}
                                <div className={`grid grid-cols-2 ${warranty.product_type === 'ev-products' ? 'md:grid-cols-6' : warranty.product_type === 'seat-cover' ? 'md:grid-cols-5' : 'md:grid-cols-4'} gap-4 mt-4 pt-4 border-t`}>
                                    {/* UID - Only for seat-cover */}
                                    {warranty.product_type === 'seat-cover' && (
                                        <div>
                                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">UID</p>
                                            <p className="font-mono text-sm font-semibold">{warranty.uid || productDetails.uid || 'N/A'}</p>
                                        </div>
                                    )}

                                    {/* EV Product Identifiers */}
                                    {warranty.product_type === 'ev-products' && (
                                        <>
                                            <div>
                                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Lot Number</p>
                                                <p className="font-mono text-sm font-semibold">{productDetails.lotNumber || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Roll Number</p>
                                                <p className="font-mono text-sm font-semibold">{productDetails.rollNumber || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Vehicle Reg</p>
                                                <p className="font-mono text-sm font-semibold">{productDetails.carRegistration || warranty.car_reg || 'N/A'}</p>
                                            </div>
                                        </>
                                    )}

                                    {/* Warranty Type */}
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Warranty Type</p>
                                        <p className="text-sm font-medium">
                                            <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
                                                {warranty.warranty_type || '1 Year'}
                                            </span>
                                        </p>
                                    </div>

                                    {/* Vehicle */}
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Vehicle</p>
                                        <p className="text-sm font-medium">{warranty.car_make} {warranty.car_model}</p>
                                        {warranty.car_year && (
                                            <p className="text-xs text-muted-foreground">{warranty.car_year}</p>
                                        )}
                                    </div>

                                    {/* Invoice */}
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Invoice</p>
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button variant="outline" size="sm" className="h-8 w-full">
                                                    <FileText className="h-3 w-3 mr-1" />
                                                    View
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                                                <DialogHeader>
                                                    <DialogTitle>Invoice Document</DialogTitle>
                                                    <DialogDescription>
                                                        Uploaded invoice for {productName.replace(/-/g, ' ')}
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <div className="mt-4">
                                                    {(() => {
                                                        const invoiceFile = warranty.product_type === 'ev-products'
                                                            ? productDetails.photos?.warranty
                                                            : productDetails.invoiceFileName;

                                                        if (invoiceFile) {
                                                            return (
                                                                <div className="space-y-4">
                                                                    <div className="border rounded-lg p-4 bg-muted/50">
                                                                        <img
                                                                            src={(invoiceFile as string).startsWith('http') ? invoiceFile : `http://localhost:3000/uploads/${invoiceFile}`}
                                                                            alt="Invoice"
                                                                            className="w-full h-auto rounded"
                                                                            onError={(e) => {
                                                                                e.currentTarget.style.display = 'none';
                                                                                const nextEl = e.currentTarget.nextElementSibling as HTMLElement;
                                                                                if (nextEl) nextEl.classList.remove('hidden');
                                                                            }}
                                                                        />
                                                                        <div className="hidden text-center py-8 text-muted-foreground">
                                                                            <FileText className="h-16 w-16 mx-auto mb-2" />
                                                                            <p>Preview not available (PDF or other format)</p>
                                                                        </div>
                                                                    </div>
                                                                    <Button
                                                                        className="w-full"
                                                                        onClick={() => {
                                                                            const fileUrl = (invoiceFile as string).startsWith('http') ? invoiceFile : `http://localhost:3000/uploads/${invoiceFile}`;

                                                                            fetch(fileUrl)
                                                                                .then(res => res.blob())
                                                                                .then(blob => {
                                                                                    const blobUrl = window.URL.createObjectURL(blob);
                                                                                    const link = document.createElement("a");
                                                                                    link.href = blobUrl;
                                                                                    link.download = invoiceFile; // forces proper filename
                                                                                    document.body.appendChild(link);
                                                                                    link.click();
                                                                                    link.remove();
                                                                                    window.URL.revokeObjectURL(blobUrl);
                                                                                })
                                                                                .catch(err => console.error("Download failed", err));
                                                                        }}
                                                                    >
                                                                        <Download className="h-4 w-4 mr-2" />
                                                                        Download Document
                                                                    </Button>

                                                                </div>
                                                            );
                                                        } else {
                                                            return (
                                                                <div className="text-center py-8 text-muted-foreground">
                                                                    <FileText className="h-16 w-16 mx-auto mb-2" />
                                                                    <p>No invoice uploaded</p>
                                                                </div>
                                                            );
                                                        }
                                                    })()}
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    </div>

                                    {/* View Details */}
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Details</p>
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button variant="outline" size="sm" className="h-8 w-full">
                                                    <Eye className="h-3 w-3 mr-1" />
                                                    View
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                                                <DialogHeader>
                                                    <DialogTitle className="text-2xl">Warranty Registration Details</DialogTitle>
                                                    <DialogDescription>
                                                        Complete information for {productName.replace(/-/g, ' ')}
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <div className="mt-6 space-y-6">
                                                    {/* Product Information */}
                                                    <div>
                                                        <h3 className="text-lg font-semibold mb-3 pb-2 border-b">Product Information</h3>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <p className="text-sm text-muted-foreground">Product Name</p>
                                                                <p className="font-medium">{productName.replace(/-/g, ' ').toUpperCase()}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-sm text-muted-foreground">Product Type</p>
                                                                <p className="font-medium">{warranty.product_type}</p>
                                                            </div>
                                                            {warranty.product_type === 'ev-products' ? (
                                                                <>
                                                                    <div>
                                                                        <p className="text-sm text-muted-foreground">Lot Number</p>
                                                                        <p className="font-mono font-medium">{productDetails.lotNumber || 'N/A'}</p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-sm text-muted-foreground">Roll Number</p>
                                                                        <p className="font-mono font-medium">{productDetails.rollNumber || 'N/A'}</p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-sm text-muted-foreground">Vehicle Reg</p>
                                                                        <p className="font-mono font-medium">{productDetails.carRegistration || warranty.car_reg || 'N/A'}</p>
                                                                    </div>
                                                                </>
                                                            ) : (
                                                                <div>
                                                                    <p className="text-sm text-muted-foreground">UID</p>
                                                                    <p className="font-mono font-medium">{warranty.uid || productDetails.uid || 'N/A'}</p>
                                                                </div>
                                                            )}
                                                            <div>
                                                                <p className="text-sm text-muted-foreground">Warranty Type</p>
                                                                <p className="font-medium">{warranty.warranty_type || '1 Year'}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-sm text-muted-foreground">Purchase Date</p>
                                                                <p className="font-medium">{new Date(warranty.purchase_date).toLocaleDateString()}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-sm text-muted-foreground">Registration Date</p>
                                                                <p className="font-medium">{new Date(warranty.created_at).toLocaleDateString()}</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* EV Product Photos */}
                                                    {warranty.product_type === 'ev-products' && productDetails.photos && (
                                                        <div>
                                                            <h3 className="text-lg font-semibold mb-3 pb-2 border-b">Photo Documentation</h3>
                                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                                {Object.entries(productDetails.photos as Record<string, string>).map(([key, filename]) => {
                                                                    const labels: Record<string, string> = {
                                                                        lhs: 'Left Hand Side',
                                                                        rhs: 'Right Hand Side',
                                                                        frontReg: 'Front with Reg No.',
                                                                        backReg: 'Back with Reg No.',
                                                                        warranty: 'Warranty Card'
                                                                    };
                                                                    if (!filename) return null;
                                                                    const imgSrc = filename.startsWith('http') ? filename : `http://localhost:3000/uploads/${filename}`;
                                                                    return (
                                                                        <div key={key} className="space-y-2">
                                                                            <p className="text-sm font-medium text-muted-foreground">{labels[key] || key}</p>
                                                                            <div className="border rounded-lg overflow-hidden bg-muted/50 aspect-video relative group">
                                                                                <img
                                                                                    src={imgSrc}
                                                                                    alt={labels[key]}
                                                                                    className="w-full h-full object-cover"
                                                                                />
                                                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                                    <a
                                                                                        href={imgSrc}
                                                                                        target="_blank"
                                                                                        rel="noopener noreferrer"
                                                                                        className="text-white text-xs bg-black/50 px-2 py-1 rounded hover:bg-black/70"
                                                                                    >
                                                                                        View Full
                                                                                    </a>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Seat Cover Documentation */}
                                                    {warranty.product_type === 'seat-cover' && productDetails.invoiceFileName && (
                                                        <div>
                                                            <h3 className="text-lg font-semibold mb-3 pb-2 border-b">Documentation</h3>
                                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                                <div className="space-y-2">
                                                                    <p className="text-sm font-medium text-muted-foreground">Invoice / MRP Sticker</p>
                                                                    <div className="border rounded-lg overflow-hidden bg-muted/50 aspect-video relative group">
                                                                        <img
                                                                            src={(productDetails.invoiceFileName as string).startsWith('http') ? productDetails.invoiceFileName : `http://localhost:3000/uploads/${productDetails.invoiceFileName}`}
                                                                            alt="Invoice"
                                                                            className="w-full h-full object-cover"
                                                                        />
                                                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                            <a
                                                                                href={(productDetails.invoiceFileName as string).startsWith('http') ? productDetails.invoiceFileName : `http://localhost:3000/uploads/${productDetails.invoiceFileName}`}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="text-white text-xs bg-black/50 px-2 py-1 rounded hover:bg-black/70"
                                                                            >
                                                                                View Full
                                                                            </a>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Customer Information */}
                                                    <div>
                                                        <h3 className="text-lg font-semibold mb-3 pb-2 border-b">Customer Information</h3>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <p className="text-sm text-muted-foreground">Name</p>
                                                                <p className="font-medium">{warranty.customer_name}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-sm text-muted-foreground">Email</p>
                                                                <p className="font-medium">{warranty.customer_email}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-sm text-muted-foreground">Phone</p>
                                                                <p className="font-medium">{warranty.customer_phone}</p>
                                                            </div>
                                                            <div className="col-span-2">
                                                                <p className="text-sm text-muted-foreground">Address</p>
                                                                <p className="font-medium">{warranty.customer_address}</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Vehicle Information */}
                                                    <div>
                                                        <h3 className="text-lg font-semibold mb-3 pb-2 border-b">Vehicle Information</h3>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <p className="text-sm text-muted-foreground">Make</p>
                                                                <p className="font-medium">{warranty.car_make}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-sm text-muted-foreground">Model</p>
                                                                <p className="font-medium">{warranty.car_model}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-sm text-muted-foreground">Year</p>
                                                                <p className="font-medium">{warranty.car_year}</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Installer Information */}
                                                    {warranty.installer_name && (
                                                        <div>
                                                            <h3 className="text-lg font-semibold mb-3 pb-2 border-b">Installer Information</h3>
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div>
                                                                    <p className="text-sm text-muted-foreground">Store Name</p>
                                                                    <p className="font-medium">{productDetails.storeName || warranty.installer_name}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm text-muted-foreground">Store Email</p>
                                                                    <p className="font-medium">{productDetails.storeEmail || warranty.installer_contact}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm text-muted-foreground">Purchase Date</p>
                                                                    <p className="font-medium">{new Date(warranty.purchase_date).toLocaleDateString()}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm text-muted-foreground">Manpower (Installer)</p>
                                                                    <p className="font-medium">
                                                                        {productDetails.manpowerName ||
                                                                            warranty.manpower_name_from_db ||
                                                                            productDetails.installerName ||
                                                                            (warranty.manpower_id ? `ID: ${warranty.manpower_id}` : 'N/A')}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Status */}
                                                    <div>
                                                        <h3 className="text-lg font-semibold mb-3 pb-2 border-b">Status</h3>
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant={
                                                                warranty.status === 'validated' ? 'default' :
                                                                    warranty.status === 'rejected' ? 'destructive' : 'secondary'
                                                            } className={warranty.status === 'validated' ? 'bg-green-600' : ''}>
                                                                {warranty.status === 'validated' ? 'APPROVED' : warranty.status === 'rejected' ? 'DISAPPROVED' : warranty.status.toUpperCase()}
                                                            </Badge>
                                                            {warranty.rejection_reason && (
                                                                <p className="text-sm text-destructive">Reason: {warranty.rejection_reason}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                </div>

                                {/* Rejection Reason */}
                                {showReason && warranty.rejection_reason && (
                                    <div className="mt-4 p-3 bg-destructive/10 rounded-md text-destructive">
                                        <p className="font-semibold mb-1 text-sm">Reason for Rejection:</p>
                                        <p className="text-sm">{warranty.rejection_reason}</p>
                                    </div>
                                )}

                                {/* Edit Button for Rejected Warranties */}
                                {warranty.status === 'rejected' && (
                                    <Button
                                        onClick={() => setEditingWarranty(warranty)}
                                        variant="outline"
                                        className="w-full mt-4"
                                    >
                                        <Edit className="mr-2 h-4 w-4" /> Edit & Resubmit
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div >
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
            <Header />

            <main className="container mx-auto px-4 py-8">
                {/* Page Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-2">My Warranties</h1>
                    <p className="text-muted-foreground">
                        View and manage your registered product warranties
                    </p>
                </div>

                {/* Action Bar */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <Link to="/warranty" className="flex-1 sm:flex-initial">
                        <Button className="w-full sm:w-auto">
                            <Plus className="mr-2 h-4 w-4" />
                            Register New Product
                        </Button>
                    </Link>
                </div>

                {/* Search & Sort Controls */}
                <div className="flex flex-wrap gap-4 mb-6">
                    <div className="flex-1 min-w-[200px]">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search by UID, product, car..."
                                className="w-full pl-10 pr-4 py-2 rounded-md border border-input bg-background text-sm"
                                value={warrantySearch}
                                onChange={(e) => setWarrantySearch(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <select
                            className="px-3 py-2 rounded-md border border-input bg-background text-sm"
                            value={warrantySortField}
                            onChange={(e) => setWarrantySortField(e.target.value as any)}
                        >
                            <option value="created_at">Sort by Date</option>
                            <option value="product_type">Sort by Product</option>
                            <option value="status">Sort by Status</option>
                        </select>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setWarrantySortOrder(warrantySortOrder === 'asc' ? 'desc' : 'asc')}
                        >
                            {warrantySortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
                        </Button>
                        {warrantySearch && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setWarrantySearch('')}
                            >
                                Clear
                            </Button>
                        )}
                    </div>
                </div>

                {/* Date Range Filter */}
                <div className="flex flex-wrap items-center gap-4 mb-6">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">From:</span>
                        <input
                            type="date"
                            className="px-3 py-2 rounded-md border border-input bg-background text-sm"
                            value={warrantyDateFrom}
                            onChange={(e) => setWarrantyDateFrom(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">To:</span>
                        <input
                            type="date"
                            className="px-3 py-2 rounded-md border border-input bg-background text-sm"
                            value={warrantyDateTo}
                            onChange={(e) => setWarrantyDateTo(e.target.value)}
                        />
                    </div>
                    {(warrantyDateFrom || warrantyDateTo) && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setWarrantyDateFrom(''); setWarrantyDateTo(''); }}
                        >
                            Clear Dates
                        </Button>
                    )}
                </div>

                <Tabs defaultValue="all" className="space-y-4">
                    <TabsList className="grid w-full grid-cols-2 h-auto md:inline-flex md:w-auto md:h-10">
                        <TabsTrigger value="all" className="relative">
                            All Warranties
                            <Badge variant="secondary" className="ml-2 px-1.5 py-0 h-5 text-xs">
                                {warranties.length}
                            </Badge>
                        </TabsTrigger>
                        <TabsTrigger value="approved" className="relative">
                            Approved
                            <Badge variant="secondary" className="ml-2 px-1.5 py-0 h-5 text-xs bg-green-600/10 text-green-700 hover:bg-green-600/20">
                                {approvedWarranties.length}
                            </Badge>
                        </TabsTrigger>
                        <TabsTrigger value="disapproved" className="relative">
                            Disapproved
                            <Badge variant="secondary" className="ml-2 px-1.5 py-0 h-5 text-xs bg-red-600/10 text-red-700 hover:bg-red-600/20">
                                {rejectedWarranties.length}
                            </Badge>
                        </TabsTrigger>
                        <TabsTrigger value="pending" className="relative">
                            Pending
                            <Badge variant="secondary" className="ml-2 px-1.5 py-0 h-5 text-xs bg-yellow-600/10 text-yellow-700 hover:bg-yellow-600/20">
                                {pendingWarranties.length}
                            </Badge>
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="all">
                        <WarrantyList items={filterAndSortWarranties(warranties)} />
                    </TabsContent>
                    <TabsContent value="approved">
                        <WarrantyList items={filterAndSortWarranties(approvedWarranties)} />
                    </TabsContent>
                    <TabsContent value="disapproved">
                        <WarrantyList items={filterAndSortWarranties(rejectedWarranties)} showReason={true} />
                    </TabsContent>
                    <TabsContent value="pending">
                        <WarrantyList items={filterAndSortWarranties(pendingWarranties)} />
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
            </main>
        </div>
    );
};

export default CustomerDashboard;
