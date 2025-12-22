import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Package, Plus, Search, Filter, CheckCircle, Clock, XCircle, Users, User, Trash2, Edit2, X, Check, ArrowLeft, Edit, FileText, Eye, Download, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { downloadCSV, getWarrantyExpiration, cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import EVProductsForm from "@/components/warranty/EVProductsForm";
import SeatCoverForm from "@/components/warranty/SeatCoverForm";
import { Pagination } from "@/components/Pagination";

// WarrantyList Component
const WarrantyList = ({ items, showReason = false, user, onEditWarranty, onVerify, onReject, isPendingVerification = false }: {
    items: any[],
    showReason?: boolean,
    user: any,
    onVerify?: (warranty: any) => void,
    onReject?: (warranty: any) => void,
    onEditWarranty?: (warranty: any) => void,
    isPendingVerification?: boolean
}) => {
    if (items.length === 0) {
        return (
            <div className="text-center py-12 border rounded-lg border-dashed">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Warranties Found</h3>
                <p className="text-muted-foreground mb-4">No warranties in this category</p>
                {items.length === 0 && (
                    <p className="text-sm text-muted-foreground mt-2">Waiting for customer registrations</p>
                )}
            </div>
        );
    }

    return (
        <div className="grid gap-4">
            {items.map((warranty, index) => {
                const productDetails = typeof warranty.product_details === 'string'
                    ? JSON.parse(warranty.product_details)
                    : warranty.product_details || {};
                const productNameMapping: Record<string, string> = {
                    'paint-protection': 'Paint Protection Films',
                    'sun-protection': 'Sun Protection Films',
                };
                const rawProductName = productDetails.product || productDetails.productName || warranty.product_type;
                const productName = productNameMapping[rawProductName] || rawProductName;


                // Calculate warranty expiration
                const { expirationDate, daysLeft, isExpired } = getWarrantyExpiration(warranty.created_at, warranty.warranty_type);

                return (
                    <Card key={warranty.id || warranty.uid || `warranty-${index}`} className="hover:shadow-md transition-shadow">
                        <CardContent className="pt-6">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">

                                    <div className="flex items-baseline gap-2 mb-1">
                                        <h3 className="text-lg font-bold uppercase tracking-wide">
                                            {productName.replace(/-/g, ' ')}
                                        </h3>
                                        <span className="text-sm text-muted-foreground normal-case">
                                            {warranty.product_type}
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Registered on {new Date(warranty.created_at).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </p>
                                    {warranty.status === 'validated' && expirationDate && (
                                        <p className="text-sm text-muted-foreground mt-0.5">
                                            Expires on {expirationDate.toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </p>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    {warranty.status === 'validated' && expirationDate && (
                                        <span className={cn("text-sm font-medium", isExpired ? "text-destructive" : "text-green-600")}>
                                            {isExpired ? "Expired" : `${daysLeft} days left`}
                                        </span>
                                    )}
                                    <Badge variant={
                                        warranty.status === 'validated' ? 'default' :
                                            warranty.status === 'rejected' ? 'destructive' : 'secondary'
                                    } className={warranty.status === 'validated' ? 'bg-green-600' : ''}>
                                        {warranty.status === 'validated' ? 'Approved' : warranty.status === 'rejected' ? 'Disapproved' : warranty.status}
                                    </Badge>
                                </div>
                            </div>
                            {isPendingVerification && (
                                <div className="flex gap-2 mb-4">
                                    <Button
                                        className="bg-green-600 hover:bg-green-700 text-white flex-1"
                                        onClick={() => onVerify && onVerify(warranty)}
                                    >
                                        <CheckCircle className="mr-2 h-4 w-4" /> Approve Installation
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        className="flex-1"
                                        onClick={() => onReject && onReject(warranty)}
                                    >
                                        <XCircle className="mr-2 h-4 w-4" /> Reject
                                    </Button>
                                </div>
                            )}
                            <div className={`grid grid-cols-2 ${warranty.product_type === 'ev-products' ? 'lg:grid-cols-6 md:grid-cols-3' : warranty.product_type === 'seat-cover' ? 'lg:grid-cols-5 md:grid-cols-3' : 'lg:grid-cols-4 md:grid-cols-2'} gap-4 mt-4 pt-4 border-t`}>
                                {warranty.product_type === 'seat-cover' && (
                                    <>
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1">Customer</p>
                                            <h3 className="text-sm font-medium flex items-center gap-1">
                                                👤 {warranty.customer_name}
                                            </h3>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">UID</p>
                                            <p className="font-mono text-sm font-semibold">{warranty.uid || productDetails.uid || 'N/A'}</p>
                                        </div>


                                    </>
                                )}
                                {warranty.product_type === 'ev-products' && (
                                    <>
                                        {/* ADD CUSTOMER NAME HERE - BEFORE LOT NUMBER */}
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1">Customer</p>
                                            <h3 className="text-sm font-medium flex items-center gap-1">
                                                👤 {warranty.customer_name}
                                            </h3>
                                        </div>

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
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Warranty Type</p>
                                    <p className="text-sm font-medium">
                                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
                                            {warranty.warranty_type || '1 Year'}
                                        </span>
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Vehicle</p>
                                    <p className="text-sm font-medium">{warranty.car_make} {warranty.car_model}</p>
                                    {warranty.car_year && (
                                        <p className="text-xs text-muted-foreground">{warranty.car_year}</p>
                                    )}
                                </div>
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
                                                        const imgSrc = typeof invoiceFile === 'string' && invoiceFile.startsWith('http')
                                                            ? invoiceFile
                                                            : `http://localhost:3000/uploads/${invoiceFile}`;
                                                        return (
                                                            <div className="space-y-4">
                                                                <div className="border rounded-lg p-4 bg-muted/50">
                                                                    <img
                                                                        src={imgSrc}
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
                                                                        fetch(imgSrc)
                                                                            .then(res => res.blob())
                                                                            .then(blob => {
                                                                                const blobUrl = window.URL.createObjectURL(blob);
                                                                                const link = document.createElement("a");
                                                                                link.href = blobUrl;
                                                                                link.download = typeof invoiceFile === 'string' ? invoiceFile : 'invoice';
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
                                                {warranty.product_type === 'ev-products' && productDetails.photos && (
                                                    <div>
                                                        <h3 className="text-lg font-semibold mb-3 pb-2 border-b">Photo Documentation</h3>
                                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                            {Object.entries(productDetails.photos).map(([key, filename]) => {
                                                                const labels: Record<string, string> = {
                                                                    lhs: 'Left Hand Side',
                                                                    rhs: 'Right Hand Side',
                                                                    frontReg: 'Front with Reg No.',
                                                                    backReg: 'Back with Reg No.',
                                                                    warranty: 'Warranty Card'
                                                                };
                                                                if (!filename) return null;
                                                                return (
                                                                    <div key={key} className="space-y-2">
                                                                        <p className="text-sm font-medium text-muted-foreground">{labels[key] || key}</p>
                                                                        <div className="border rounded-lg overflow-hidden bg-muted/50 aspect-video relative group">
                                                                            <img
                                                                                src={typeof filename === 'string' && filename.startsWith('http') ? filename : `http://localhost:3000/uploads/${filename}`}
                                                                                alt={labels[key]}
                                                                                className="w-full h-full object-cover"
                                                                            />
                                                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                                <a
                                                                                    href={typeof filename === 'string' && filename.startsWith('http') ? filename : `http://localhost:3000/uploads/${filename}`}
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
                                                {warranty.product_type === 'seat-cover' && productDetails.invoiceFileName && (
                                                    <div>
                                                        <h3 className="text-lg font-semibold mb-3 pb-2 border-b">Documentation</h3>
                                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                            <div className="space-y-2">
                                                                <p className="text-sm font-medium text-muted-foreground">Invoice / MRP Sticker</p>
                                                                <div className="border rounded-lg overflow-hidden bg-muted/50 aspect-video relative group">
                                                                    <img
                                                                        src={typeof productDetails.invoiceFileName === 'string' && productDetails.invoiceFileName.startsWith('http') ? productDetails.invoiceFileName : `http://localhost:3000/uploads/${productDetails.invoiceFileName}`}
                                                                        alt="Invoice"
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                        <a
                                                                            href={typeof productDetails.invoiceFileName === 'string' && productDetails.invoiceFileName.startsWith('http') ? productDetails.invoiceFileName : `http://localhost:3000/uploads/${productDetails.invoiceFileName}`}
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
                            {showReason && warranty.rejection_reason && (
                                <div className="mt-4 p-3 bg-destructive/10 rounded-md text-destructive">
                                    <p className="font-semibold mb-1 text-sm">Reason for Rejection:</p>
                                    <p className="text-sm">{warranty.rejection_reason}</p>
                                </div>
                            )}
                            {showReason && warranty.status === 'rejected' && (
                                <div className="mt-4 text-xs text-muted-foreground text-center italic">
                                    Contact support or customer to correct this registration.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
};

const VendorDashboard = () => {
    const { user, loading } = useAuth();
    const { toast } = useToast();
    const [warranties, setWarranties] = useState<any[]>([]);
    const [loadingWarranties, setLoadingWarranties] = useState(false);
    const [warrantyPagination, setWarrantyPagination] = useState({ currentPage: 1, totalPages: 1, totalCount: 0, limit: 30, hasNextPage: false, hasPrevPage: false });

    // Manpower state
    const [manpowerList, setManpowerList] = useState<any[]>([]); // Active manpower
    const [pastManpowerList, setPastManpowerList] = useState<any[]>([]); // Inactive manpower
    const [loadingManpower, setLoadingManpower] = useState(false);
    const [newManpowerName, setNewManpowerName] = useState("");
    const [newManpowerPhone, setNewManpowerPhone] = useState("");
    const [newManpowerType, setNewManpowerType] = useState("seat_cover");
    const [newManpowerId, setNewManpowerId] = useState("");
    const [addingManpower, setAddingManpower] = useState(false);
    const [manpowerTab, setManpowerTab] = useState("current"); // 'current' or 'past'

    // Edit state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");
    const [editPhone, setEditPhone] = useState("");
    const [editType, setEditType] = useState("");
    const [updatingManpower, setUpdatingManpower] = useState(false);

    // Verify/Reject Handlers
    const handleVerifyWarranty = async (warranty: any) => {
        try {
            const response = await api.post(`/vendor/warranty/${warranty.uid}/approve`);
            if (response.data.success) {
                toast({
                    title: "Warranty Approved",
                    description: "Installation status updated to Pending Admin Approval.",
                });
                fetchWarranties(); // Refresh list
            }
        } catch (error: any) {
            console.error("Verification failed", error);
            toast({
                title: "Action Failed",
                description: error.response?.data?.error || "Could not approve warranty",
                variant: "destructive",
            });
        }
    };

    const handleRejectWarranty = async (warranty: any) => {
        // Prompt for reason? For now simple prompt or we can add a Dialog. 
        // Let's use a simple prompt for speed, or better, a reason dialog state.
        const reason = prompt("Please enter the reason for rejection:");
        if (!reason) return;

        try {
            const response = await api.post(`/vendor/warranty/${warranty.uid}/reject`, { reason });
            if (response.data.success) {
                toast({
                    title: "Warranty Rejected",
                    description: "Status updated to Rejected.",
                    variant: "destructive"
                });
                fetchWarranties();
            }
        } catch (error: any) {
            console.error("Rejection failed", error);
            toast({
                title: "Action Failed",
                description: error.response?.data?.error || "Could not reject warranty",
                variant: "destructive",
            });
        }
    };

    // Manpower Warranty Details Dialog
    const [manpowerWarrantyDialogOpen, setManpowerWarrantyDialogOpen] = useState(false);
    const [manpowerWarrantyDialogData, setManpowerWarrantyDialogData] = useState<{ member: any; status: 'validated' | 'pending' | 'rejected'; warranties: any[] }>({ member: null, status: 'validated', warranties: [] });

    // Helper to show manpower warranties dialog
    const showManpowerWarranties = (member: any, status: 'validated' | 'pending' | 'rejected') => {
        // Filter warranties for this manpower by status
        const manpowerWarranties = warranties.filter((w: any) =>
            w.manpower_id === member.id && w.status === status
        );
        setManpowerWarrantyDialogData({ member, status, warranties: manpowerWarranties });
        setManpowerWarrantyDialogOpen(true);
    };
    // Warranty stats
    const pendingVendorWarranties = warranties.filter(w => w.status === 'pending_vendor');
    const pendingWarranties = warranties.filter(w => w.status === 'pending');
    const approvedWarranties = warranties.filter(w => w.status === 'validated');
    const rejectedWarranties = warranties.filter(w => w.status === 'rejected');

    // Search & Sort State - Warranties
    const [warrantySearch, setWarrantySearch] = useState('');
    const [warrantySortField, setWarrantySortField] = useState<'created_at' | 'customer_name' | 'status' | 'product_type'>('created_at');
    const [warrantySortOrder, setWarrantySortOrder] = useState<'asc' | 'desc'>('desc');
    const [warrantyDateFrom, setWarrantyDateFrom] = useState('');
    const [warrantyDateTo, setWarrantyDateTo] = useState('');

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

                return (
                    warranty.customer_name?.toLowerCase().includes(search) ||
                    warranty.customer_phone?.includes(search) ||
                    warranty.uid?.toLowerCase().includes(search) ||
                    warranty.car_make?.toLowerCase().includes(search) ||
                    warranty.car_model?.toLowerCase().includes(search) ||
                    warranty.product_type?.toLowerCase().includes(search) ||
                    warranty.manpower_name?.toLowerCase().includes(search)
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

    const handleExport = () => {
        const filteredData = filterAndSortWarranties(warranties);
        const exportData = filteredData.map(w => {
            const productDetails = typeof w.product_details === 'string'
                ? JSON.parse(w.product_details)
                : w.product_details || {};
            const rawProductName = productDetails.product || productDetails.productName || w.product_type;
            const productNameMapping: Record<string, string> = {
                'paint-protection': 'Paint Protection Films',
                'sun-protection': 'Sun Protection Films',
            };
            const productName = (productNameMapping[rawProductName] || rawProductName)?.toUpperCase() || w.product_type;

            return {
                Date: new Date(w.created_at).toLocaleDateString(),
                'Product': productName,
                'Product Type': w.product_type,
                'Customer': w.customer_name,
                'Phone': w.customer_phone,
                'UID/Lot': w.uid || productDetails.lotNumber || 'N/A',
                'Roll No': productDetails.rollNumber || 'N/A',
                'Vehicle': `${w.car_make || ''} ${w.car_model || ''} (${w.car_year || ''})`.trim(),
                'Registration': w.registration_number || productDetails.carRegistration || w.car_reg || 'N/A',
                'Status': w.status.toUpperCase(),
                'Installer Name': productDetails.storeName || w.installer_name || 'N/A',
                'Manpower': w.manpower_name || productDetails.manpowerName || 'N/A',
                'Purchase Date': w.purchase_date ? new Date(w.purchase_date).toLocaleDateString() : 'N/A'
            };
        });
        downloadCSV(exportData, `my_warranties_export_${new Date().toISOString().split('T')[0]}.csv`);
        toast({
            title: "Export Successful",
            description: `${exportData.length} warranties exported to CSV.`,
        });
    };

    // Fetch warranties
    async function fetchWarranties(page = 1, background = false) {
        if (!background) setLoadingWarranties(true);
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
            toast({
                title: "Failed to fetch warranties",
                variant: "destructive",
            });
        } finally {
            if (!background) setLoadingWarranties(false);
        }
    }

    // Fetch manpower
    async function fetchManpower(active: string = 'true') {
        setLoadingManpower(true);
        try {
            const response = await api.get(`/vendor/manpower?active=${active}`);
            if (response.data.success) {
                if (active === 'true') {
                    setManpowerList(response.data.manpower);
                } else if (active === 'false') {
                    setPastManpowerList(response.data.manpower);
                }
            }
        } catch (error) {
            console.error("Failed to fetch manpower", error);
        } finally {
            setLoadingManpower(false);
        }
    }

    // Handle tab switching for manpower
    useEffect(() => {
        if (manpowerTab === 'past' && pastManpowerList.length === 0) {
            fetchManpower('false');
        }
    }, [manpowerTab]);

    // Initial data fetch
    useEffect(() => {
        if (user?.role === "vendor") {
            fetchManpower('true');  // Fetch active manpower
            fetchWarranties();
        }
    }, [user]);

    // Auto-generate Manpower ID when name or phone changes
    useEffect(() => {
        const namePart = newManpowerName.slice(0, 3).toUpperCase();
        const phonePart = newManpowerPhone.slice(-4);
        setNewManpowerId((namePart && phonePart) ? `${namePart}${phonePart}` : "");
    }, [newManpowerName, newManpowerPhone]);

    // Manpower handlers
    const handleAddManpower = async (e: React.FormEvent) => {
        e.preventDefault();
        setAddingManpower(true);
        try {
            const response = await api.post("/vendor/manpower", {
                name: newManpowerName,
                phoneNumber: newManpowerPhone,
                applicatorType: newManpowerType
            });

            if (response.data.success) {
                toast({
                    title: "Manpower Added",
                    description: "New team member added successfully.",
                });
                setManpowerList([...manpowerList, response.data.manpower]);
                setNewManpowerName("");
                setNewManpowerPhone("");
                setNewManpowerType("seat_cover");
                setNewManpowerId("");
            }
        } catch (error: any) {
            toast({
                title: "Addition Failed",
                description: error.response?.data?.error || "Could not add manpower",
                variant: "destructive",
            });
        } finally {
            setAddingManpower(false);
        }
    };

    const handleDeleteManpower = async (id: string) => {
        try {
            const response = await api.delete(`/vendor/manpower/${id}`);
            if (response.data.success) {
                toast({
                    title: "Manpower Removed",
                    description: "Team member removed successfully.",
                });
                setManpowerList(manpowerList.filter(m => m.id !== id));
            }
        } catch (error: any) {
            toast({
                title: "Removal Failed",
                description: error.response?.data?.error || "Could not remove manpower",
                variant: "destructive",
            });
        }
    };

    const handleEditManpower = (member: any) => {
        setEditingId(member.id);
        setEditName(member.name);
        setEditPhone(member.phone_number);
        setEditType(member.applicator_type);
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditName("");
        setEditPhone("");
        setEditType("");
    };

    const handleUpdateManpower = async (id: string) => {
        setUpdatingManpower(true);
        try {
            const response = await api.put(`/vendor/manpower/${id}`, {
                name: editName,
                phoneNumber: editPhone,
                applicatorType: editType
            });

            if (response.data.success) {
                toast({
                    title: "Manpower Updated",
                    description: "Team member updated successfully.",
                });
                setManpowerList(manpowerList.map(m =>
                    m.id === id ? response.data.manpower : m
                ));
                handleCancelEdit();
            }
        } catch (error: any) {
            toast({
                title: "Update Failed",
                description: error.response?.data?.error || "Could not update manpower",
                variant: "destructive",
            });
        } finally {
            setUpdatingManpower(false);
        }
    };

    // Loading and auth checks
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
        return <Navigate to="/login" />;
    }

    if (user.role !== "vendor") {
        return <Navigate to="/" />;
    }



    // Main dashboard view
    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
            <Header />
            <main className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-2">Franchise Dashboard</h1>
                    <p className="text-muted-foreground">
                        Manage customer warranty registrations for your store
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 grid-cols-1 md:grid-cols-4 mb-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Warranties</CardTitle>
                            <Package className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{warranties.length}</div>
                            <p className="text-xs text-muted-foreground">All registered products</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Approved</CardTitle>
                            <CheckCircle className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{approvedWarranties.length}</div>
                            <p className="text-xs text-muted-foreground">Verified warranties</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pending</CardTitle>
                            <Clock className="h-4 w-4 text-yellow-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{pendingWarranties.length}</div>
                            <p className="text-xs text-muted-foreground">Awaiting verification</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Disapproved</CardTitle>
                            <XCircle className="h-4 w-4 text-red-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{rejectedWarranties.length}</div>
                            <p className="text-xs text-muted-foreground">Rejected warranties</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Action Bar & Filters */}
                <div className="flex flex-col gap-4 mb-6">
                    <div className="flex flex-col sm:flex-row gap-4">


                        {/* Search */}
                        <div className="flex-1 min-w-[200px] relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search by customer, phone, car, UID..."
                                className="w-full pl-10 pr-4 py-2 rounded-md border border-input bg-background text-sm"
                                value={warrantySearch}
                                onChange={(e) => setWarrantySearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                        {/* Date Range & Export */}
                        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground whitespace-nowrap">From:</span>
                                <input
                                    type="date"
                                    className="px-3 py-2 rounded-md border border-input bg-background text-sm w-full md:w-auto"
                                    value={warrantyDateFrom}
                                    onChange={(e) => setWarrantyDateFrom(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground whitespace-nowrap">To:</span>
                                <input
                                    type="date"
                                    className="px-3 py-2 rounded-md border border-input bg-background text-sm w-full md:w-auto"
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
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleExport}
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Export CSV
                            </Button>
                        </div>

                        {/* Sort */}
                        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
                            <select
                                className="px-3 py-2 rounded-md border border-input bg-background text-sm flex-1 md:flex-none"
                                value={warrantySortField}
                                onChange={(e) => setWarrantySortField(e.target.value as any)}
                            >
                                <option value="created_at">Sort by Date</option>
                                <option value="customer_name">Sort by Customer</option>
                                <option value="status">Sort by Status</option>
                                <option value="product_type">Sort by Product</option>
                            </select>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setWarrantySortOrder(warrantySortOrder === 'asc' ? 'desc' : 'asc')}
                            >
                                {warrantySortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Warranty Entries with Tabs */}
                <Tabs defaultValue="pending_verification" className="space-y-4">
                    <TabsList className="flex flex-wrap h-auto gap-2 bg-transparent p-0">
                        <TabsTrigger value="pending_verification" className="relative">
                            Pending Verification
                            <Badge variant="secondary" className="ml-2 px-1.5 py-0 h-5 text-xs bg-orange-600/10 text-orange-700 hover:bg-orange-600/20">
                                {pendingVendorWarranties.length}
                            </Badge>
                        </TabsTrigger>
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
                            Pending Admin
                            <Badge variant="secondary" className="ml-2 px-1.5 py-0 h-5 text-xs bg-yellow-600/10 text-yellow-700 hover:bg-yellow-600/20">
                                {pendingWarranties.length}
                            </Badge>
                        </TabsTrigger>
                        <TabsTrigger value="manpower" className="relative">
                            Manpower
                            <Badge variant="secondary" className="ml-2 px-1.5 py-0 h-5 text-xs">
                                {manpowerList.length}
                            </Badge>
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="pending_verification" className="space-y-4">
                        <WarrantyList
                            items={filterAndSortWarranties(pendingVendorWarranties)}
                            user={user}
                            onVerify={handleVerifyWarranty}
                            onReject={handleRejectWarranty}
                            isPendingVerification={true}
                        />
                    </TabsContent>

                    <TabsContent value="all" className="space-y-4">
                        {loadingWarranties ? (
                            <div className="text-center py-4 text-muted-foreground">Loading warranties...</div>
                        ) : (
                            <WarrantyList
                                items={filterAndSortWarranties(warranties)}
                                user={user}
                            />
                        )}
                    </TabsContent>

                    <TabsContent value="approved" className="space-y-4">
                        <WarrantyList
                            items={filterAndSortWarranties(approvedWarranties)}
                            user={user}
                        />
                    </TabsContent>

                    <TabsContent value="disapproved" className="space-y-4">
                        <WarrantyList
                            items={filterAndSortWarranties(rejectedWarranties)}
                            showReason={true}
                            user={user}
                        />
                    </TabsContent>

                    <TabsContent value="pending" className="space-y-4">
                        <WarrantyList
                            items={filterAndSortWarranties(pendingWarranties)}
                            user={user}
                        />
                    </TabsContent>

                    <TabsContent value="manpower" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Manpower Management</CardTitle>
                                        <CardDescription>Manage your team members and applicators</CardDescription>
                                    </div>
                                    <div className="h-10 w-10 rounded-full bg-secondary/20 flex items-center justify-center">
                                        <Users className="h-5 w-5 text-secondary-foreground" />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {/* Tabs for Current vs Past Team */}
                                <Tabs value={manpowerTab} onValueChange={setManpowerTab} className="space-y-6">
                                    <TabsList className="grid w-full grid-cols-2">
                                        <TabsTrigger value="current">
                                            Current Team ({manpowerList.length})
                                        </TabsTrigger>
                                        <TabsTrigger value="past">
                                            Past/Ex Team ({pastManpowerList.length})
                                        </TabsTrigger>
                                    </TabsList>

                                    {/* CURRENT TEAM TAB */}
                                    <TabsContent value="current" className="space-y-6">
                                        {/* Add New Manpower Form */}
                                        <form onSubmit={handleAddManpower} className="p-4 border rounded-lg bg-muted/30 space-y-4">
                                            <h3 className="font-medium text-sm">Add New Team Member</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                <Input
                                                    placeholder="Name"
                                                    value={newManpowerName}
                                                    onChange={(e) => setNewManpowerName(e.target.value)}
                                                    required
                                                />
                                                <Input
                                                    placeholder="Phone Number"
                                                    value={newManpowerPhone}
                                                    onChange={(e) => setNewManpowerPhone(e.target.value)}
                                                    required
                                                />
                                                <Input
                                                    placeholder="Manpower ID"
                                                    value={newManpowerId}
                                                    readOnly
                                                    className="bg-muted font-mono text-sm"
                                                />
                                                <div className="flex gap-2">
                                                    <select
                                                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                        value={newManpowerType}
                                                        onChange={(e) => setNewManpowerType(e.target.value)}
                                                    >
                                                        <option value="seat_cover">Seat Cover Applicator</option>
                                                        <option value="ppf_spf">PPF/SPF Applicator</option>
                                                        <option value="ev">EV Applicator</option>
                                                    </select>
                                                    <Button type="submit" size="icon" disabled={addingManpower}>
                                                        {addingManpower ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <Plus className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                        </form>

                                        {/* Current Team List */}
                                        <div className="space-y-4">
                                            {loadingManpower ? (
                                                <div className="text-center py-4 text-muted-foreground">Loading...</div>
                                            ) : manpowerList.length === 0 ? (
                                                <div className="text-center py-8 border rounded-lg border-dashed text-muted-foreground">
                                                    No team members added yet.
                                                </div>
                                            ) : (
                                                <div className="grid gap-4">
                                                    {manpowerList.map((member) => (
                                                        <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/5 transition-colors">
                                                            {editingId === member.id ? (
                                                                // Edit Mode
                                                                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                                                                    <Input
                                                                        placeholder="Name"
                                                                        value={editName}
                                                                        onChange={(e) => setEditName(e.target.value)}
                                                                    />
                                                                    <Input
                                                                        placeholder="Phone"
                                                                        value={editPhone}
                                                                        onChange={(e) => setEditPhone(e.target.value)}
                                                                    />
                                                                    <select
                                                                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                                        value={editType}
                                                                        onChange={(e) => setEditType(e.target.value)}
                                                                    >
                                                                        <option value="seat_cover">Seat Cover</option>
                                                                        <option value="ppf_spf">PPF/SPF</option>
                                                                        <option value="ev">EV</option>
                                                                    </select>
                                                                    <div className="flex gap-2">
                                                                        <Button
                                                                            size="sm"
                                                                            onClick={() => handleUpdateManpower(member.id)}
                                                                            disabled={updatingManpower}
                                                                        >
                                                                            {updatingManpower ? (
                                                                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                                                            ) : (
                                                                                <Check className="h-4 w-4 mr-1" />
                                                                            )}
                                                                            Save
                                                                        </Button>
                                                                        <Button
                                                                            size="sm"
                                                                            variant="outline"
                                                                            onClick={handleCancelEdit}
                                                                        >
                                                                            <X className="h-4 w-4 mr-1" /> Cancel
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                // View Mode
                                                                <>
                                                                    <div className="flex items-center gap-4">
                                                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                                            <User className="h-5 w-5 text-primary" />
                                                                        </div>
                                                                        <div>
                                                                            <p className="font-medium">{member.name}</p>
                                                                            <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2 text-sm text-muted-foreground">
                                                                                <span>{member.phone_number}</span>
                                                                                <span className="hidden md:inline">•</span>
                                                                                <span className="font-mono text-xs bg-muted px-1 py-0.5 rounded">{member.manpower_id}</span>
                                                                                <span className="hidden md:inline">•</span>
                                                                                <Badge variant="outline" className="text-xs capitalize">
                                                                                    {member.applicator_type?.replace('_', ' ')} Applicator
                                                                                </Badge>
                                                                                <span className="hidden md:inline">•</span>
                                                                                <button
                                                                                    onClick={() => showManpowerWarranties(member, 'validated')}
                                                                                    className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800 hover:bg-green-200 cursor-pointer transition-colors"
                                                                                >
                                                                                    {member.validated_count || 0} Approved
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => showManpowerWarranties(member, 'pending')}
                                                                                    className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-800 hover:bg-yellow-200 cursor-pointer transition-colors"
                                                                                >
                                                                                    {member.pending_count || 0} Pending
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => showManpowerWarranties(member, 'rejected')}
                                                                                    className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800 hover:bg-red-200 cursor-pointer transition-colors"
                                                                                >
                                                                                    {member.rejected_count || 0} Disapproved
                                                                                </button>
                                                                                <span className="hidden md:inline">•</span>
                                                                                <span className="font-medium text-muted-foreground">
                                                                                    {member.total_count || 0} Total
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex gap-2">
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            onClick={() => handleEditManpower(member)}
                                                                        >
                                                                            <Edit2 className="h-4 w-4" />
                                                                        </Button>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                                            onClick={() => handleDeleteManpower(member.id)}
                                                                        >
                                                                            <Trash2 className="h-4 w-4" />
                                                                        </Button>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </TabsContent>

                                    {/* PAST TEAM TAB */}
                                    <TabsContent value="past" className="space-y-4">
                                        <div className="p-4 bg-muted/30 rounded-lg border border-dashed">
                                            <p className="text-sm text-muted-foreground">
                                                This section shows archived team members. Their points are preserved for future rewards.
                                            </p>
                                        </div>
                                        {loadingManpower ? (
                                            <div className="text-center py-4 text-muted-foreground">Loading...</div>
                                        ) : pastManpowerList.length === 0 ? (
                                            <div className="text-center py-8 border rounded-lg border-dashed text-muted-foreground">
                                                No past team members.
                                            </div>
                                        ) : (
                                            <div className="grid gap-4">
                                                {pastManpowerList.map((member) => (
                                                    <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                                                        <div className="flex items-center gap-4">
                                                            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                                                                <User className="h-5 w-5 text-gray-500" />
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-muted-foreground">{member.name}</p>
                                                                <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2 text-sm text-muted-foreground">
                                                                    <span>{member.phone_number}</span>
                                                                    <span className="hidden md:inline">•</span>
                                                                    <span className="font-mono text-xs bg-muted px-1 py-0.5 rounded">{member.manpower_id}</span>
                                                                    <span className="hidden md:inline">•</span>
                                                                    <Badge variant="outline" className="text-xs capitalize">
                                                                        {member.applicator_type?.replace('_', ' ')}
                                                                    </Badge>
                                                                    <span className="hidden md:inline">•</span>
                                                                    <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">
                                                                        {member.validated_count || 0} Approved
                                                                    </span>
                                                                    <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-800">
                                                                        {member.pending_count || 0} Pending
                                                                    </span>
                                                                    <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800">
                                                                        {member.rejected_count || 0} Disapproved
                                                                    </span>
                                                                    <span className="hidden md:inline">•</span>
                                                                    {member.removed_at && (
                                                                        <>
                                                                            <span className="text-xs">
                                                                                Removed: {new Date(member.removed_at).toLocaleDateString()}
                                                                            </span>
                                                                            <span className="hidden md:inline">•</span>
                                                                        </>
                                                                    )}
                                                                    <span className="font-medium">
                                                                        {member.total_count || 0} Total Points
                                                                    </span>
                                                                </div>
                                                                {member.removed_reason && (
                                                                    <p className="text-xs text-muted-foreground mt-1">
                                                                        Reason: {member.removed_reason}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </TabsContent>
                                </Tabs>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Manpower Warranty Details Dialog */}
                <Dialog open={manpowerWarrantyDialogOpen} onOpenChange={setManpowerWarrantyDialogOpen}>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>
                                {manpowerWarrantyDialogData.member?.name} - {manpowerWarrantyDialogData.status === 'validated' ? 'Approved' : manpowerWarrantyDialogData.status === 'rejected' ? 'Disapproved' : 'Pending'} Warranties
                            </DialogTitle>
                            <DialogDescription>
                                {manpowerWarrantyDialogData.warranties.length} warranty registrations
                            </DialogDescription>
                        </DialogHeader>
                        <div className="mt-4 space-y-3">
                            {manpowerWarrantyDialogData.warranties.length === 0 ? (
                                <p className="text-center py-8 text-muted-foreground">No warranties found</p>
                            ) : (
                                manpowerWarrantyDialogData.warranties.map((w: any, index: number) => {
                                    const pd = typeof w.product_details === 'string' ? JSON.parse(w.product_details) : w.product_details || {};
                                    const productNameMapping: Record<string, string> = {
                                        'paint-protection': 'PPF',
                                        'sun-protection': 'Tint',
                                        'seat-cover': 'Seat Cover',
                                        'ev-products': 'EV Product'
                                    };
                                    return (
                                        <div key={w.id || index} className="p-3 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <p className="font-medium">{w.customer_name}</p>
                                                    <p className="text-xs text-muted-foreground">{w.customer_phone}</p>
                                                </div>
                                                <Badge variant={
                                                    w.status === 'validated' ? 'default' :
                                                        w.status === 'rejected' ? 'destructive' : 'secondary'
                                                } className={w.status === 'validated' ? 'bg-green-600' : ''}>
                                                    {productNameMapping[w.product_type] || w.product_type}
                                                </Badge>
                                            </div>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Vehicle</p>
                                                    <p>{w.car_make} {w.car_model}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Product</p>
                                                    <p>{pd.productName || pd.product || w.product_type}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground">UID/Lot</p>
                                                    <p className="font-mono text-xs">{w.uid || pd.lotNumber || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Registered</p>
                                                    <p>{new Date(w.created_at).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            </main>
        </div>
    );
};

export default VendorDashboard;