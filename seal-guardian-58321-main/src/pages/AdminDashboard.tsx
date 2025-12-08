import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
    Package,
    Search,
    Filter,
    Users,
    User,
    Store,
    ShieldCheck,
    AlertCircle,
    TrendingUp,
    Trash2,
    Check,
    X,
    FileText,
    Eye,
    Download
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { downloadCSV } from "@/lib/utils";

const AdminWarrantyList = ({
    items,
    showRejectionReason = false,
    showActions = true,
    processingWarranty,
    onApprove,
    onReject
}: {
    items: any[],
    showRejectionReason?: boolean,
    showActions?: boolean,
    processingWarranty: string | null,
    onApprove: (warrantyId: string) => void,
    onReject: (warrantyId: string) => void
}) => {
    if (items.length === 0) {
        return (
            <div className="text-center py-12 border rounded-lg border-dashed">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Warranties Found</h3>
                <p className="text-muted-foreground mb-4">No warranties in this category</p>
            </div>
        );
    }

    return (
        <div className="grid gap-4">
            {items.map((warranty) => {
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
                                </div>
                                <Badge variant={
                                    warranty.status === 'validated' ? 'default' :
                                        warranty.status === 'rejected' ? 'destructive' : 'secondary'
                                } className={warranty.status === 'validated' ? 'bg-green-600' : ''}>
                                    {warranty.status}
                                </Badge>
                            </div>

                            <div className={`grid grid-cols-2 ${warranty.product_type === 'ev-products'
                                ? (showRejectionReason ? 'md:grid-cols-9' : 'md:grid-cols-8')
                                : (showRejectionReason ? 'md:grid-cols-8' : 'md:grid-cols-7')
                                } gap-4 mt-4 pt-4 border-t`}>

                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">Customer</p>
                                    <h3 className="text-sm font-medium flex items-center gap-1">
                                        👤 {warranty.customer_name}
                                    </h3>
                                </div>

                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">Submitted By</p>
                                    <div className="text-sm">
                                        <p className="font-medium">{warranty.submitted_by_role === 'vendor' ? '🏪' : '👤'} {warranty.submitted_by_name || 'N/A'}</p>
                                        {warranty.submitted_by_role && (
                                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium mt-1 ${warranty.submitted_by_role === 'customer'
                                                ? 'bg-blue-100 text-blue-800'
                                                : warranty.submitted_by_role === 'vendor'
                                                    ? 'bg-purple-100 text-purple-800'
                                                    : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {warranty.submitted_by_role.charAt(0).toUpperCase() + warranty.submitted_by_role.slice(1)}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {warranty.product_type === 'seat-cover' && (
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">UID</p>
                                        <p className="font-mono text-sm font-semibold">{warranty.uid || productDetails.uid || 'N/A'}</p>
                                    </div>
                                )}

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
                                                        return (
                                                            <div className="space-y-4">
                                                                <div className="border rounded-lg p-4 bg-muted/50">
                                                                    <img
                                                                        src={`http://localhost:3000/uploads/${invoiceFile}`}
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
                                                                        const fileUrl = `http://localhost:3000/uploads/${invoiceFile}`;
                                                                        fetch(fileUrl)
                                                                            .then(res => res.blob())
                                                                            .then(blob => {
                                                                                const blobUrl = window.URL.createObjectURL(blob);
                                                                                const link = document.createElement("a");
                                                                                link.href = blobUrl;
                                                                                link.download = invoiceFile;
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
                                                                                src={`http://localhost:3000/uploads/${filename}`}
                                                                                alt={labels[key]}
                                                                                className="w-full h-full object-cover"
                                                                            />
                                                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                                <a
                                                                                    href={`http://localhost:3000/uploads/${filename}`}
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
                                                                        src={`http://localhost:3000/uploads/${productDetails.invoiceFileName}`}
                                                                        alt="Invoice"
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                        <a
                                                                            href={`http://localhost:3000/uploads/${productDetails.invoiceFileName}`}
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
                                                    <h3 className="text-lg font-semibold mb-3 pb-2 border-b">Submitted By</h3>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <p className="text-sm text-muted-foreground">Name</p>
                                                            <p className="font-medium">{warranty.submitted_by_name || 'N/A'}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-muted-foreground">Email</p>
                                                            <p className="font-medium">{warranty.submitted_by_email || 'N/A'}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-muted-foreground">Role</p>
                                                            <p className="font-medium capitalize">{warranty.submitted_by_role || 'N/A'}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-semibold mb-3 pb-2 border-b">Status</h3>
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant={
                                                            warranty.status === 'validated' ? 'default' :
                                                                warranty.status === 'rejected' ? 'destructive' : 'secondary'
                                                        } className={warranty.status === 'validated' ? 'bg-green-600' : ''}>
                                                            {warranty.status.toUpperCase()}
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

                                {showRejectionReason && (
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Rejection Reason</p>
                                        <p className="text-sm text-red-600">{warranty.rejection_reason || 'N/A'}</p>
                                    </div>
                                )}
                                {showActions && (
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Actions</p>
                                        <div className="flex gap-2">
                                            {warranty.status === 'pending' && (
                                                <>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                                        onClick={() => onApprove(warranty.uid || warranty.id)}
                                                        disabled={processingWarranty === (warranty.uid || warranty.id)}
                                                    >
                                                        <Check className="h-3 w-3" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        onClick={() => onReject(warranty.uid || warranty.id)}
                                                        disabled={processingWarranty === (warranty.uid || warranty.id)}
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                </>
                                            )}
                                            {warranty.status === 'validated' && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => onReject(warranty.uid || warranty.id)}
                                                    disabled={processingWarranty === (warranty.uid || warranty.id)}
                                                >
                                                    <X className="h-3 w-3 mr-1" />
                                                    Reject
                                                </Button>
                                            )}
                                            {warranty.status === 'rejected' && (
                                                <span className="text-xs text-muted-foreground">Must be resubmitted</span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
};

const AdminDashboard = () => {
    const { user, loading } = useAuth();
    const { toast } = useToast();
    const [stats, setStats] = useState({
        totalWarranties: 0,
        totalVendors: 0,
        totalCustomers: 0,
        pendingApprovals: 0,
        validatedWarranties: 0,
        rejectedWarranties: 0,
    });
    const [activeTab, setActiveTab] = useState("overview");
    const [warrantyFilter, setWarrantyFilter] = useState<'all' | 'validated' | 'rejected' | 'pending'>('all');
    const [vendorFilter, setVendorFilter] = useState<'all' | 'approved' | 'disapproved' | 'pending'>('all');
    const [vendors, setVendors] = useState<any[]>([]);
    const [loadingVendors, setLoadingVendors] = useState(false);
    const [selectedVendor, setSelectedVendor] = useState<any>(null);
    const [viewingVendor, setViewingVendor] = useState(false);
    const [customers, setCustomers] = useState<any[]>([]);
    const [loadingCustomers, setLoadingCustomers] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [viewingCustomer, setViewingCustomer] = useState(false);
    const [warranties, setWarranties] = useState<any[]>([]);
    const [loadingWarranties, setLoadingWarranties] = useState(false);
    const [processingWarranty, setProcessingWarranty] = useState<string | null>(null);
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [selectedWarrantyId, setSelectedWarrantyId] = useState<string | null>(null);

    // Vendor Verification State
    const [vendorRejectDialogOpen, setVendorRejectDialogOpen] = useState(false);
    const [vendorRejectReason, setVendorRejectReason] = useState("");
    const [processingVendor, setProcessingVendor] = useState<string | null>(null);
    const [vendorWarrantyFilter, setVendorWarrantyFilter] = useState<'all' | 'validated' | 'rejected' | 'pending'>('all');
    const [customerWarrantyFilter, setCustomerWarrantyFilter] = useState<'all' | 'validated' | 'rejected' | 'pending'>('all');

    // Admin Management State
    const [admins, setAdmins] = useState<any[]>([]);
    const [loadingAdmins, setLoadingAdmins] = useState(false);
    const [addingAdmin, setAddingAdmin] = useState(false);
    const [newAdminForm, setNewAdminForm] = useState({ name: '', email: '', phone: '' });

    // Activity Log State
    const [activityLogs, setActivityLogs] = useState<any[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(false);

    // Search & Sort State - Warranties
    const [warrantySearch, setWarrantySearch] = useState('');
    const [warrantySortField, setWarrantySortField] = useState<'created_at' | 'customer_name' | 'status' | 'product_type'>('created_at');
    const [warrantySortOrder, setWarrantySortOrder] = useState<'asc' | 'desc'>('desc');
    const [warrantyDateFrom, setWarrantyDateFrom] = useState('');
    const [warrantyDateTo, setWarrantyDateTo] = useState('');

    // Search & Sort State - Vendors
    const [vendorSearch, setVendorSearch] = useState('');
    const [vendorSortField, setVendorSortField] = useState<'created_at' | 'store_name' | 'city'>('created_at');
    const [vendorSortOrder, setVendorSortOrder] = useState<'asc' | 'desc'>('desc');
    const [vendorDateFrom, setVendorDateFrom] = useState('');
    const [vendorDateTo, setVendorDateTo] = useState('');

    // Search & Sort State - Customers
    const [customerSearch, setCustomerSearch] = useState('');
    const [customerSortField, setCustomerSortField] = useState<'created_at' | 'customer_name' | 'warranty_count'>('created_at');
    const [customerSortOrder, setCustomerSortOrder] = useState<'asc' | 'desc'>('desc');
    const [customerDateFrom, setCustomerDateFrom] = useState('');
    const [customerDateTo, setCustomerDateTo] = useState('');

    // --- Vendor Detail View State ---
    // Warranties
    const [vendorDetailWarrantySearch, setVendorDetailWarrantySearch] = useState('');
    const [vendorDetailWarrantySortField, setVendorDetailWarrantySortField] = useState<'created_at' | 'customer_name' | 'status' | 'product_type'>('created_at');
    const [vendorDetailWarrantySortOrder, setVendorDetailWarrantySortOrder] = useState<'asc' | 'desc'>('desc');
    const [vendorDetailWarrantyDateFrom, setVendorDetailWarrantyDateFrom] = useState('');
    const [vendorDetailWarrantyDateTo, setVendorDetailWarrantyDateTo] = useState('');

    // Manpower
    const [vendorDetailManpowerSearch, setVendorDetailManpowerSearch] = useState('');
    const [vendorDetailManpowerSortField, setVendorDetailManpowerSortField] = useState<'name' | 'points' | 'total_applications'>('name');
    const [vendorDetailManpowerSortOrder, setVendorDetailManpowerSortOrder] = useState<'asc' | 'desc'>('asc');

    // --- Customer Detail View State ---
    // Warranties
    const [customerDetailWarrantySearch, setCustomerDetailWarrantySearch] = useState('');
    const [customerDetailWarrantySortField, setCustomerDetailWarrantySortField] = useState<'created_at' | 'product_type' | 'status'>('created_at');
    const [customerDetailWarrantySortOrder, setCustomerDetailWarrantySortOrder] = useState<'asc' | 'desc'>('desc');
    const [customerDetailWarrantyDateFrom, setCustomerDetailWarrantyDateFrom] = useState('');
    const [customerDetailWarrantyDateTo, setCustomerDetailWarrantyDateTo] = useState('');

    // Export Handlers
    const handleExportWarranties = () => {
        const filteredData = warranties.filter((warranty: any) => {
            // Status filter
            if (warrantyFilter !== 'all' && warranty.status !== warrantyFilter) return false;
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
            // Search filter
            if (warrantySearch) {
                const search = warrantySearch.toLowerCase();
                return (
                    warranty.customer_name?.toLowerCase().includes(search) ||
                    warranty.customer_email?.toLowerCase().includes(search) ||
                    warranty.customer_phone?.includes(search) ||
                    warranty.uid?.toLowerCase().includes(search) ||
                    warranty.car_make?.toLowerCase().includes(search) ||
                    warranty.car_model?.toLowerCase().includes(search) ||
                    warranty.product_type?.toLowerCase().includes(search)
                );
            }
            return true;
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

        const exportData = filteredData.map(w => {
            const productDetails = typeof w.product_details === 'string'
                ? JSON.parse(w.product_details)
                : w.product_details || {};
            const rawProductName = productDetails.product || productDetails.productName || w.product_type;
            const productName = rawProductName?.replace(/-/g, ' ').toUpperCase() || w.product_type;

            return {
                Date: new Date(w.created_at).toLocaleDateString(),
                'Product Name': productName,
                'Product Type': w.product_type,
                'UID/Lot': w.uid || productDetails.lotNumber || 'N/A',
                'Customer Name': w.customer_name,
                'Customer Phone': w.customer_phone,
                'Vehicle': `${w.car_make || ''} ${w.car_model || ''} (${w.car_year || ''})`.trim(),
                'Vehicle Reg': w.registration_number || productDetails.carRegistration || 'N/A',
                'Installer Store': productDetails.storeName || w.installer_name || 'N/A',
                'Installer Manpower': w.manpower_name || 'N/A',
                'Status': w.status.toUpperCase(),
                'Purchase Date': w.purchase_date ? new Date(w.purchase_date).toLocaleDateString() : 'N/A'
            };
        });

        downloadCSV(exportData, `warranties_export_${new Date().toISOString().split('T')[0]}.csv`);
    };

    const handleExportVendors = () => {
        const filteredData = vendors.filter((vendor: any) => {
            // Status filter (logic from render)
            if (vendorFilter === 'approved') {
                if (!vendor.is_verified) return false;
            } else if (vendorFilter === 'disapproved') {
                if (!((!vendor.is_verified) && vendor.verified_at != null)) return false;
            } else if (vendorFilter === 'pending') {
                if (!((!vendor.is_verified) && (vendor.verified_at == null || vendor.verified_at === undefined))) return false;
            }

            // Date range filter
            if (vendorDateFrom || vendorDateTo) {
                const vendorDate = new Date(vendor.created_at);
                vendorDate.setHours(0, 0, 0, 0);
                if (vendorDateFrom) {
                    const fromDate = new Date(vendorDateFrom);
                    fromDate.setHours(0, 0, 0, 0);
                    if (vendorDate < fromDate) return false;
                }
                if (vendorDateTo) {
                    const toDate = new Date(vendorDateTo);
                    toDate.setHours(23, 59, 59, 999);
                    if (vendorDate > toDate) return false;
                }
            }
            // Search filter
            if (vendorSearch) {
                const search = vendorSearch.toLowerCase();
                return (
                    vendor.store_name?.toLowerCase().includes(search) ||
                    vendor.vendor_name?.toLowerCase().includes(search) ||
                    vendor.email?.toLowerCase().includes(search) ||
                    vendor.phone_number?.includes(search) ||
                    vendor.city?.toLowerCase().includes(search) ||
                    vendor.state?.toLowerCase().includes(search)
                );
            }
            return true;
        })
            .sort((a: any, b: any) => {
                let aVal = a[vendorSortField];
                let bVal = b[vendorSortField];
                if (vendorSortField === 'created_at') {
                    aVal = new Date(aVal).getTime();
                    bVal = new Date(bVal).getTime();
                } else {
                    aVal = (aVal || '').toString().toLowerCase();
                    bVal = (bVal || '').toString().toLowerCase();
                }
                return vendorSortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
            });

        const exportData = filteredData.map(v => ({
            'Store Name': v.store_name,
            'Contact Person': v.contact_name || v.vendor_name, // Fallback if one is missing, UI usually shows contact_name
            'Email': v.email || v.store_email,
            'Phone': v.phone_number,
            'Manpower Count': v.manpower_count || 0,
            'City': v.city,
            'State': v.state,
            'Address': v.full_address || v.address || 'N/A',
            'Pincode': v.pincode || 'N/A',
            'Status': v.is_verified ? 'Approved' : (v.verified_at ? 'Disapproved' : 'Pending'),
            'Validated Warranties': v.validated_warranties || 0,
            'Pending Warranties': v.pending_warranties || 0,
            'Rejected Warranties': v.rejected_warranties || 0,
            'Total Warranties': v.total_warranties || 0,
            'Joined Date': new Date(v.created_at).toLocaleDateString()
        }));

        downloadCSV(exportData, `vendors_export_${new Date().toISOString().split('T')[0]}.csv`);
    };

    const handleExportCustomers = () => {
        const filteredData = customers.filter((customer: any) => {
            // Date range filter
            if (customerDateFrom || customerDateTo) {
                const customerDate = new Date(customer.created_at);
                customerDate.setHours(0, 0, 0, 0);
                if (customerDateFrom) {
                    const fromDate = new Date(customerDateFrom);
                    fromDate.setHours(0, 0, 0, 0);
                    if (customerDate < fromDate) return false;
                }
                if (customerDateTo) {
                    const toDate = new Date(customerDateTo);
                    toDate.setHours(23, 59, 59, 999);
                    if (customerDate > toDate) return false;
                }
            }

            if (!customerSearch) return true;
            const search = customerSearch.toLowerCase();
            return (
                customer.customer_name?.toLowerCase().includes(search) ||
                customer.customer_email?.toLowerCase().includes(search) ||
                customer.customer_phone?.includes(search)
            );
        })
            .sort((a: any, b: any) => {
                let aVal = a[customerSortField];
                let bVal = b[customerSortField];
                if (customerSortField === 'created_at') {
                    aVal = new Date(aVal).getTime();
                    bVal = new Date(bVal).getTime();
                } else if (customerSortField === 'warranty_count') {
                    aVal = Number(aVal) || 0;
                    bVal = Number(bVal) || 0;
                } else {
                    aVal = (aVal || '').toString().toLowerCase();
                    bVal = (bVal || '').toString().toLowerCase();
                }
                return customerSortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
            });

        const exportData = filteredData.map(c => ({
            'Customer Name': c.customer_name,
            'Email': c.customer_email,
            'Phone': c.customer_phone,
            'Address': c.customer_address || 'N/A',
            'Validated Warranties': c.validated_warranties || 0,
            'Rejected Warranties': c.rejected_warranties || 0,
            'Pending Warranties': c.pending_warranties || 0,
            'Total Warranties': c.total_warranties || 0,
            'Registered Date': new Date(c.created_at).toLocaleDateString()
        }));

        downloadCSV(exportData, `customers_export_${new Date().toISOString().split('T')[0]}.csv`);
    };

    const handleExportVendorDetailWarranties = (filteredWarranties: any[]) => {
        const exportData = filteredWarranties.map(w => {
            const productDetails = typeof w.product_details === 'string'
                ? JSON.parse(w.product_details)
                : w.product_details || {};
            const rawProductName = productDetails.product || productDetails.productName || w.product_type;
            const productName = rawProductName?.replace(/-/g, ' ').toUpperCase() || w.product_type;

            return {
                Date: new Date(w.created_at).toLocaleDateString(),
                'Product Name': productName,
                'Product Type': w.product_type,
                'UID/Lot': w.uid || productDetails.lotNumber || 'N/A',
                'Customer Name': w.customer_name,
                'Customer Phone': w.customer_phone,
                'Vehicle': `${w.car_make || ''} ${w.car_model || ''} (${w.car_year || ''})`.trim(),
                'Vehicle Reg': w.registration_number || productDetails.carRegistration || 'N/A',
                'Status': w.status.toUpperCase(),
                'Purchase Date': w.purchase_date ? new Date(w.purchase_date).toLocaleDateString() : 'N/A'
            };
        });
        downloadCSV(exportData, `vendor_warranties_export_${new Date().toISOString().split('T')[0]}.csv`);
    };

    const handleExportVendorDetailManpower = (filteredManpower: any[]) => {
        const exportData = filteredManpower.map(m => ({
            Name: m.name,
            Phone: m.phone_number,
            'Manpower ID': m.manpower_id,
            'Role': m.applicator_type.replace('_', ' ').toUpperCase(),
            'Status': m.is_active ? 'Active' : 'Inactive',
            'Validated Points': m.points || 0,
            'Pending Points': m.pending_points || 0,
            'Rejected Points': m.rejected_points || 0,
            'Total Applications': m.total_applications || 0,
            'Joined Date': new Date(m.created_at).toLocaleDateString()
        }));
        downloadCSV(exportData, `vendor_manpower_export_${new Date().toISOString().split('T')[0]}.csv`);
    };

    const handleExportCustomerDetailWarranties = (filteredWarranties: any[]) => {
        const exportData = filteredWarranties.map(w => {
            const productDetails = typeof w.product_details === 'string'
                ? JSON.parse(w.product_details)
                : w.product_details || {};
            const rawProductName = productDetails.product || productDetails.productName || w.product_type;
            const productName = rawProductName?.replace(/-/g, ' ').toUpperCase() || w.product_type;

            return {
                Date: new Date(w.created_at).toLocaleDateString(),
                'Product Name': productName,
                'Product Type': w.product_type,
                'UID/Lot': w.uid || productDetails.lotNumber || 'N/A',
                'Vehicle': `${w.car_make || ''} ${w.car_model || ''} (${w.car_year || ''})`.trim(),
                'Vehicle Reg': w.registration_number || productDetails.carRegistration || 'N/A',
                'Installer Store': productDetails.storeName || w.installer_name || 'N/A',
                'Status': w.status.toUpperCase(),
            };
        });
        downloadCSV(exportData, `customer_warranties_export_${new Date().toISOString().split('T')[0]}.csv`);
    };

    useEffect(() => {
        if (user?.role === "admin") {
            fetchStats();
        }
    }, [user]);

    useEffect(() => {
        if (activeTab === "vendors" && !viewingVendor) {
            fetchVendors(vendors.length > 0);
        } else if (activeTab === "customers" && !viewingCustomer) {
            fetchCustomers(customers.length > 0);
        } else if (activeTab === "warranties") {
            fetchWarranties(warranties.length > 0);
        } else if (activeTab === "admins") {
            fetchAdmins();
        } else if (activeTab === "activity-logs") {
            fetchActivityLogs();
        }
    }, [activeTab, viewingVendor, viewingCustomer]);

    const fetchAdmins = async () => {
        setLoadingAdmins(true);
        try {
            const response = await api.get("/admin/admins");
            if (response.data.success) {
                setAdmins(response.data.admins);
            }
        } catch (error) {
            console.error("Failed to fetch admins:", error);
            toast({
                title: "Error",
                description: "Failed to fetch admin list",
                variant: "destructive"
            });
        } finally {
            setLoadingAdmins(false);
        }
    };

    const handleCreateAdmin = async () => {
        if (!newAdminForm.name || !newAdminForm.email || !newAdminForm.phone) {
            toast({
                title: "Validation Error",
                description: "Please fill in all fields",
                variant: "destructive"
            });
            return;
        }

        setAddingAdmin(true);
        try {
            const response = await api.post("/admin/admins", newAdminForm);
            if (response.data.success) {
                toast({
                    title: "Admin Created",
                    description: "Admin invitation email has been sent successfully"
                });
                setNewAdminForm({ name: '', email: '', phone: '' });
                fetchAdmins();
            }
        } catch (error: any) {
            console.error("Failed to create admin:", error);
            toast({
                title: "Error",
                description: error.response?.data?.error || "Failed to create admin",
                variant: "destructive"
            });
        } finally {
            setAddingAdmin(false);
        }
    };

    const fetchActivityLogs = async () => {
        setLoadingLogs(true);
        try {
            const response = await api.get("/admin/activity-logs?limit=100");
            if (response.data.success) {
                setActivityLogs(response.data.logs);
            }
        } catch (error) {
            console.error("Failed to fetch activity logs:", error);
            toast({
                title: "Error",
                description: "Failed to fetch activity logs",
                variant: "destructive"
            });
        } finally {
            setLoadingLogs(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await api.get("/admin/stats");
            if (response.data.success) {
                setStats(response.data.stats);
            }
        } catch (error) {
            console.error("Failed to fetch stats", error);
            toast({
                title: "Stats Fetch Failed",
                description: "Failed to fetch statistics",
                variant: "destructive"
            });
        }
    };

    const fetchWarranties = async (background = false) => {
        if (!background) setLoadingWarranties(true);
        try {
            const response = await api.get("/admin/warranties");
            if (response.data.success) {
                setWarranties(response.data.warranties);
            }
        } catch (error) {
            console.error("Failed to fetch warranties", error);
            toast({
                title: "Warranty Fetch Failed",
                description: "Failed to fetch warranties",
                variant: "destructive"
            });
        } finally {
            if (!background) setLoadingWarranties(false);
        }
    };

    const fetchVendors = async (background = false) => {
        if (!background) setLoadingVendors(true);
        try {
            const response = await api.get("/admin/vendors");
            if (response.data.success) {
                setVendors(response.data.vendors);
            }
        } catch (error) {
            console.error("Failed to fetch vendors:", error);
            toast({
                title: "Vendor Fetch Failed",
                description: "Failed to fetch vendors",
                variant: "destructive"
            });
        } finally {
            if (!background) setLoadingVendors(false);
        }
    };

    const fetchCustomers = async (background = false) => {
        if (!background) setLoadingCustomers(true);
        try {
            const response = await api.get("/admin/customers");
            if (response.data.success) {
                setCustomers(response.data.customers);
            }
        } catch (error) {
            console.error("Failed to fetch customers:", error);
            toast({
                title: "Customer Fetch Failed",
                description: "Failed to fetch customers",
                variant: "destructive"
            });
        } finally {
            if (!background) setLoadingCustomers(false);
        }
    };

    const handleUpdateStatus = async (warrantyId: string, status: 'validated' | 'rejected', reason?: string) => {
        setProcessingWarranty(warrantyId);
        try {
            const response = await api.put(`/admin/warranties/${warrantyId}/status`, {
                status,
                rejectionReason: reason
            });

            if (response.data.success) {
                toast({
                    title: `Warranty ${status === 'validated' ? 'Approved' : 'Rejected'}`,
                    description: response.data.message,
                    variant: status === 'validated' ? "default" : "destructive"
                });

                // Update local state for all views
                const updateWarrantyInList = (list: any[]) =>
                    list.map((w: any) =>
                        (w.uid === warrantyId || w.id === warrantyId)
                            ? { ...w, status, rejection_reason: reason }
                            : w
                    );

                // Update main warranties list
                setWarranties(prev => updateWarrantyInList(prev));

                // Update selectedVendor if active
                if (selectedVendor) {
                    setSelectedVendor(prev => ({
                        ...prev,
                        warranties: updateWarrantyInList(prev.warranties)
                    }));
                }

                // Update selectedCustomer if active
                if (selectedCustomer) {
                    setSelectedCustomer(prev => ({
                        ...prev,
                        warranties: updateWarrantyInList(prev.warranties)
                    }));
                }

                // Refresh stats in background
                fetchStats();

                // Refresh main list in background if needed (to ensure consistency)
                if (activeTab === "warranties") {
                    fetchWarranties(true);
                }

                // Refresh related lists in background
                if (selectedVendor) {
                    fetchVendors(); // This one doesn't have background support yet, but it's less critical as we updated local state
                }
            }
        } catch (error: any) {
            toast({
                title: "Update Failed",
                description: error.response?.data?.error || "Failed to update warranty status",
                variant: "destructive"
            });
        } finally {
            setProcessingWarranty(null);
            setRejectDialogOpen(false);
            setRejectReason("");
            setSelectedWarrantyId(null);
        }
    };

    const handleWarrantyAction = async (warrantyId: string, status: 'validated' | 'rejected', reason?: string) => {
        if (status === 'rejected' && !reason) {
            setSelectedWarrantyId(warrantyId);
            setRejectDialogOpen(true);
            return;
        }
        await handleUpdateStatus(warrantyId, status, reason);
    };

    const handleViewVendor = async (vendorId: string) => {
        try {
            const response = await api.get(`/admin/vendors/${vendorId}`);
            if (response.data.success) {
                setSelectedVendor({
                    ...response.data.vendor,
                    manpower: response.data.manpower,
                    warranties: response.data.warranties
                });
                setViewingVendor(true);
            }
        } catch (error) {
            console.error("Failed to fetch vendor details:", error);
            toast({
                title: "Vendor Details Fetch Failed",
                description: "Failed to fetch vendor details",
                variant: "destructive"
            });
        }
    };

    const handleVendorVerification = async (vendorId: string, isVerified: boolean, reason?: string) => {
        setProcessingVendor(vendorId);
        try {
            const response = await api.put(`/admin/vendors/${vendorId}/verification`, {
                is_verified: isVerified,
                rejection_reason: reason
            });

            if (response.data.success) {
                toast({
                    title: isVerified ? "Vendor Approved" : "Vendor Rejected",
                    description: response.data.message,
                    variant: isVerified ? "default" : "destructive"
                });
                fetchVendors(); // Refresh list
                fetchStats(); // Refresh stats
            }
        } catch (error: any) {
            console.error("Vendor verification error:", error);
            toast({
                title: "Verification Update Failed",
                description: error.response?.data?.error || "Failed to update vendor status",
                variant: "destructive"
            });
        } finally {
            setProcessingVendor(null);
            setVendorRejectDialogOpen(false);
            setVendorRejectReason("");
            setSelectedVendor(null);
        }
    };

    const handleDeleteVendor = async (vendorId: string) => {
        if (!confirm("Are you sure you want to delete this vendor? This action cannot be undone.")) {
            return;
        }

        try {
            const response = await api.delete(`/admin/vendors/${vendorId}`);
            if (response.data.success) {
                toast({
                    title: "Vendor Deleted",
                    description: "Vendor deleted successfully",
                });
                setVendors(vendors.filter(v => v.id !== vendorId));
                fetchStats();
            }
        } catch (error) {
            console.error("Failed to delete vendor:", error);
            toast({
                title: "Deletion Failed",
                description: "Failed to delete vendor",
                variant: "destructive"
            });
        }
    };

    // Detailed Customer View
    if (viewingCustomer && selectedCustomer) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
                <Header />
                <main className="container mx-auto px-4 py-8">
                    <Button
                        variant="ghost"
                        onClick={() => setViewingCustomer(false)}
                        className="mb-6"
                    >
                        ← Back to Customers
                    </Button>

                    <div className="mb-8">
                        <h1 className="text-3xl font-bold mb-2">{selectedCustomer.customer_name}</h1>
                        <div className="flex gap-4 text-muted-foreground">
                            <div>{selectedCustomer.customer_email}</div>
                            <span>•</span>
                            <div>{selectedCustomer.customer_phone}</div>
                        </div>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Warranty Registrations ({selectedCustomer.warranties?.length || 0})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Tabs value={customerWarrantyFilter} onValueChange={(value: any) => setCustomerWarrantyFilter(value)} className="mb-4">
                                <TabsList>
                                    <TabsTrigger value="all">All ({selectedCustomer.warranties?.length || 0})</TabsTrigger>
                                    <TabsTrigger value="validated">Approved ({selectedCustomer.warranties?.filter((w: any) => w.status === 'validated').length || 0})</TabsTrigger>
                                    <TabsTrigger value="rejected">Disapproved ({selectedCustomer.warranties?.filter((w: any) => w.status === 'rejected').length || 0})</TabsTrigger>
                                    <TabsTrigger value="pending">Pending ({selectedCustomer.warranties?.filter((w: any) => w.status === 'pending').length || 0})</TabsTrigger>
                                </TabsList>
                            </Tabs>


                            {/* Controls */}
                            <div className="flex flex-col gap-4 mb-4">
                                {/* Date Range & Export */}
                                <div className="flex flex-wrap items-center gap-4 justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-muted-foreground">From:</span>
                                            <input
                                                type="date"
                                                className="px-3 py-2 rounded-md border border-input bg-background text-sm"
                                                value={customerDetailWarrantyDateFrom}
                                                onChange={(e) => setCustomerDetailWarrantyDateFrom(e.target.value)}
                                            />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-muted-foreground">To:</span>
                                            <input
                                                type="date"
                                                className="px-3 py-2 rounded-md border border-input bg-background text-sm"
                                                value={customerDetailWarrantyDateTo}
                                                onChange={(e) => setCustomerDetailWarrantyDateTo(e.target.value)}
                                            />
                                        </div>
                                        {(customerDetailWarrantyDateFrom || customerDetailWarrantyDateTo) && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => { setCustomerDetailWarrantyDateFrom(''); setCustomerDetailWarrantyDateTo(''); }}
                                            >
                                                Clear Dates
                                            </Button>
                                        )}
                                    </div>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleExportCustomerDetailWarranties(
                                            (selectedCustomer.warranties || []).filter((warranty: any) => {
                                                if (customerWarrantyFilter !== 'all' && warranty.status !== customerWarrantyFilter) return false;
                                                if (customerDetailWarrantyDateFrom || customerDetailWarrantyDateTo) {
                                                    const warrantyDate = new Date(warranty.created_at);
                                                    warrantyDate.setHours(0, 0, 0, 0);
                                                    if (customerDetailWarrantyDateFrom) {
                                                        const fromDate = new Date(customerDetailWarrantyDateFrom);
                                                        fromDate.setHours(0, 0, 0, 0);
                                                        if (warrantyDate < fromDate) return false;
                                                    }
                                                    if (customerDetailWarrantyDateTo) {
                                                        const toDate = new Date(customerDetailWarrantyDateTo);
                                                        toDate.setHours(23, 59, 59, 999);
                                                        if (warrantyDate > toDate) return false;
                                                    }
                                                }
                                                if (customerDetailWarrantySearch) {
                                                    const search = customerDetailWarrantySearch.toLowerCase();
                                                    return (
                                                        warranty.product_type?.toLowerCase().includes(search) ||
                                                        warranty.uid?.toLowerCase().includes(search) ||
                                                        (warranty.installer_name?.toLowerCase() || '').includes(search)
                                                    );
                                                }
                                                return true;
                                            })
                                                .sort((a: any, b: any) => {
                                                    let aVal = a[customerDetailWarrantySortField];
                                                    let bVal = b[customerDetailWarrantySortField];
                                                    if (customerDetailWarrantySortField === 'created_at') {
                                                        aVal = new Date(aVal).getTime();
                                                        bVal = new Date(bVal).getTime();
                                                    } else {
                                                        aVal = (aVal || '').toString().toLowerCase();
                                                        bVal = (bVal || '').toString().toLowerCase();
                                                    }
                                                    return customerDetailWarrantySortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
                                                })
                                        )}
                                    >
                                        <Download className="h-4 w-4 mr-2" />
                                        Export CSV
                                    </Button>
                                </div>

                                {/* Search & Sort */}
                                <div className="flex flex-wrap items-center gap-4">
                                    <div className="flex-1 min-w-[200px] relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <input
                                            type="text"
                                            placeholder="Search warranties..."
                                            className="w-full pl-10 pr-4 py-2 rounded-md border border-input bg-background text-sm"
                                            value={customerDetailWarrantySearch}
                                            onChange={(e) => setCustomerDetailWarrantySearch(e.target.value)}
                                        />
                                    </div>
                                    <select
                                        className="px-3 py-2 rounded-md border border-input bg-background text-sm"
                                        value={customerDetailWarrantySortField}
                                        onChange={(e) => setCustomerDetailWarrantySortField(e.target.value as any)}
                                    >
                                        <option value="created_at">Date</option>
                                        <option value="product_type">Product</option>
                                        <option value="status">Status</option>
                                    </select>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCustomerDetailWarrantySortOrder(customerDetailWarrantySortOrder === 'asc' ? 'desc' : 'asc')}
                                    >
                                        {customerDetailWarrantySortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
                                    </Button>
                                </div>
                            </div>

                            {(!selectedCustomer.warranties || selectedCustomer.warranties.length === 0) ? (
                                <div className="text-center py-8 text-muted-foreground">No warranties found.</div>
                            ) : (
                                <AdminWarrantyList
                                    key={`${customerWarrantyFilter}-${customerDetailWarrantySearch}-${customerDetailWarrantySortField}-${customerDetailWarrantySortOrder}`}
                                    items={(selectedCustomer.warranties || [])
                                        .filter((warranty: any) => {
                                            if (customerWarrantyFilter !== 'all' && warranty.status !== customerWarrantyFilter) return false;

                                            // Date range filter
                                            if (customerDetailWarrantyDateFrom || customerDetailWarrantyDateTo) {
                                                const warrantyDate = new Date(warranty.created_at);
                                                warrantyDate.setHours(0, 0, 0, 0);
                                                if (customerDetailWarrantyDateFrom) {
                                                    const fromDate = new Date(customerDetailWarrantyDateFrom);
                                                    fromDate.setHours(0, 0, 0, 0);
                                                    if (warrantyDate < fromDate) return false;
                                                }
                                                if (customerDetailWarrantyDateTo) {
                                                    const toDate = new Date(customerDetailWarrantyDateTo);
                                                    toDate.setHours(23, 59, 59, 999);
                                                    if (warrantyDate > toDate) return false;
                                                }
                                            }

                                            // Search filter
                                            if (customerDetailWarrantySearch) {
                                                const search = customerDetailWarrantySearch.toLowerCase();
                                                return (
                                                    warranty.product_type?.toLowerCase().includes(search) ||
                                                    warranty.uid?.toLowerCase().includes(search) ||
                                                    (warranty.installer_name?.toLowerCase() || '').includes(search)
                                                );
                                            }
                                            return true;
                                        })
                                        .sort((a: any, b: any) => {
                                            let aVal = a[customerDetailWarrantySortField];
                                            let bVal = b[customerDetailWarrantySortField];
                                            if (customerDetailWarrantySortField === 'created_at') {
                                                aVal = new Date(aVal).getTime();
                                                bVal = new Date(bVal).getTime();
                                            } else {
                                                aVal = (aVal || '').toString().toLowerCase();
                                                bVal = (bVal || '').toString().toLowerCase();
                                            }
                                            return customerDetailWarrantySortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
                                        })
                                    }
                                    showRejectionReason={customerWarrantyFilter === 'rejected'}
                                    showActions={customerWarrantyFilter === 'validated' || customerWarrantyFilter === 'pending'}
                                    processingWarranty={processingWarranty}
                                    onApprove={(id) => handleUpdateStatus(id, 'validated')}
                                    onReject={(id) => openRejectDialog(id)}
                                />
                            )}
                        </CardContent>
                    </Card>
                </main>
            </div>
        );
    }

    const handleViewCustomer = async (email: string) => {
        try {
            const response = await api.get(`/admin/customers/${encodeURIComponent(email)}`);
            if (response.data.success) {
                setSelectedCustomer({
                    ...response.data.customer,
                    warranties: response.data.warranties
                });
                setViewingCustomer(true);
            }
        } catch (error) {
            console.error("Failed to fetch customer details:", error);
            toast({
                title: "Error",
                description: "Failed to fetch customer details",
                variant: "destructive"
            });
        }
    };

    const handleDeleteCustomer = async (email: string) => {
        if (!confirm("Are you sure you want to delete this customer? This will permanently remove all their warranty registrations.")) {
            return;
        }

        try {
            const response = await api.delete(`/admin/customers/${encodeURIComponent(email)}`);
            if (response.data.success) {
                toast({
                    title: "Success",
                    description: "Customer deleted successfully",
                });
                setCustomers(customers.filter(c => c.customer_email !== email));
                fetchStats();
            }
        } catch (error) {
            console.error("Failed to delete customer:", error);
            toast({
                title: "Error",
                description: "Failed to delete customer",
                variant: "destructive"
            });
        }
    };

    const openRejectDialog = (warrantyId: string) => {
        setSelectedWarrantyId(warrantyId);
        setRejectDialogOpen(true);
    };

    // Calculate vendor counts for sub-tabs based on their warranty statuses
    const approvedVendorsCount = vendors.filter(vendor => vendor.is_verified).length;
    const disapprovedVendorsCount = vendors.filter(vendor =>
        !vendor.is_verified && vendor.verified_at != null
    ).length;
    const pendingVendorsCount = vendors.filter(vendor =>
        !vendor.is_verified && (vendor.verified_at == null || vendor.verified_at === undefined)
    ).length;

    // Debug logging for vendor filtering
    console.log('[AdminDashboard] Vendor counts:', {
        total: vendors.length,
        approved: approvedVendorsCount,
        disapproved: disapprovedVendorsCount,
        pending: pendingVendorsCount
    });

    // Filter, search, and sort vendors
    const filteredVendors = vendors
        .filter(vendor => {
            // Status filter
            if (vendorFilter === 'approved') {
                if (!vendor.is_verified) return false;
            } else if (vendorFilter === 'disapproved') {
                if (!((!vendor.is_verified) && vendor.verified_at != null)) return false;
            } else if (vendorFilter === 'pending') {
                if (!((!vendor.is_verified) && (vendor.verified_at == null || vendor.verified_at === undefined))) return false;
            }
            // Date range filter
            if (vendorDateFrom || vendorDateTo) {
                const vendorDate = new Date(vendor.created_at);
                vendorDate.setHours(0, 0, 0, 0);
                if (vendorDateFrom) {
                    const fromDate = new Date(vendorDateFrom);
                    fromDate.setHours(0, 0, 0, 0);
                    if (vendorDate < fromDate) return false;
                }
                if (vendorDateTo) {
                    const toDate = new Date(vendorDateTo);
                    toDate.setHours(23, 59, 59, 999);
                    if (vendorDate > toDate) return false;
                }
            }
            // Search filter
            if (vendorSearch) {
                const search = vendorSearch.toLowerCase();
                return (
                    vendor.store_name?.toLowerCase().includes(search) ||
                    vendor.name?.toLowerCase().includes(search) ||
                    vendor.email?.toLowerCase().includes(search) ||
                    vendor.phone_number?.includes(search) ||
                    vendor.city?.toLowerCase().includes(search) ||
                    vendor.state?.toLowerCase().includes(search)
                );
            }
            return true;
        })
        .sort((a: any, b: any) => {
            let aVal = a[vendorSortField];
            let bVal = b[vendorSortField];
            if (vendorSortField === 'created_at') {
                aVal = new Date(aVal).getTime();
                bVal = new Date(bVal).getTime();
            } else {
                aVal = (aVal || '').toString().toLowerCase();
                bVal = (bVal || '').toString().toLowerCase();
            }
            return vendorSortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
        });
    if (loading) return <div>Loading...</div>;
    if (!user) return <Navigate to="/login?role=admin" replace />;
    if (user.role !== "admin") return <Navigate to="/warranty" replace />;

    // Detailed Vendor View
    if (viewingVendor && selectedVendor) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
                <Header />
                <main className="container mx-auto px-4 py-8">
                    <Button
                        variant="ghost"
                        onClick={() => setViewingVendor(false)}
                        className="mb-6"
                    >
                        ← Back to Vendors
                    </Button>

                    <div className="mb-8">
                        <h1 className="text-3xl font-bold mb-2">{selectedVendor.store_name}</h1>
                        <div className="flex gap-4 text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                {selectedVendor.contact_name}
                            </div>
                            <div className="flex items-center gap-2">
                                <Store className="h-4 w-4" />
                                {selectedVendor.city}, {selectedVendor.state}
                            </div>
                        </div>
                    </div>

                    <Tabs defaultValue="warranties" className="space-y-4">
                        <TabsList>
                            <TabsTrigger value="warranties">Warranties ({selectedVendor.warranties?.length || 0})</TabsTrigger>
                            <TabsTrigger value="manpower">Manpower ({selectedVendor.manpower?.length || 0})</TabsTrigger>
                        </TabsList>

                        <TabsContent value="warranties">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Warranty Registrations</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Tabs value={vendorWarrantyFilter} onValueChange={(value: any) => setVendorWarrantyFilter(value)} className="mb-4">
                                        <TabsList>
                                            <TabsTrigger value="all">All ({selectedVendor.warranties?.length || 0})</TabsTrigger>
                                            <TabsTrigger value="validated">Approved ({selectedVendor.warranties?.filter((w: any) => w.status === 'validated').length || 0})</TabsTrigger>
                                            <TabsTrigger value="rejected">Disapproved ({selectedVendor.warranties?.filter((w: any) => w.status === 'rejected').length || 0})</TabsTrigger>
                                            <TabsTrigger value="pending">Pending ({selectedVendor.warranties?.filter((w: any) => w.status === 'pending').length || 0})</TabsTrigger>
                                        </TabsList>
                                    </Tabs>


                                    {/* Sub-tab Controls */}
                                    <div className="flex flex-col gap-4 mb-4">
                                        {/* Date Range & Export */}
                                        <div className="flex flex-wrap items-center gap-4 justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-muted-foreground">From:</span>
                                                    <input
                                                        type="date"
                                                        className="px-3 py-2 rounded-md border border-input bg-background text-sm"
                                                        value={vendorDetailWarrantyDateFrom}
                                                        onChange={(e) => setVendorDetailWarrantyDateFrom(e.target.value)}
                                                    />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-muted-foreground">To:</span>
                                                    <input
                                                        type="date"
                                                        className="px-3 py-2 rounded-md border border-input bg-background text-sm"
                                                        value={vendorDetailWarrantyDateTo}
                                                        onChange={(e) => setVendorDetailWarrantyDateTo(e.target.value)}
                                                    />
                                                </div>
                                                {(vendorDetailWarrantyDateFrom || vendorDetailWarrantyDateTo) && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => { setVendorDetailWarrantyDateFrom(''); setVendorDetailWarrantyDateTo(''); }}
                                                    >
                                                        Clear Dates
                                                    </Button>
                                                )}
                                            </div>

                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleExportVendorDetailWarranties(
                                                    (selectedVendor.warranties || []).filter((warranty: any) => {
                                                        if (vendorWarrantyFilter !== 'all' && warranty.status !== vendorWarrantyFilter) return false;
                                                        if (vendorDetailWarrantyDateFrom || vendorDetailWarrantyDateTo) {
                                                            const warrantyDate = new Date(warranty.created_at);
                                                            warrantyDate.setHours(0, 0, 0, 0);
                                                            if (vendorDetailWarrantyDateFrom) {
                                                                const fromDate = new Date(vendorDetailWarrantyDateFrom);
                                                                fromDate.setHours(0, 0, 0, 0);
                                                                if (warrantyDate < fromDate) return false;
                                                            }
                                                            if (vendorDetailWarrantyDateTo) {
                                                                const toDate = new Date(vendorDetailWarrantyDateTo);
                                                                toDate.setHours(23, 59, 59, 999);
                                                                if (warrantyDate > toDate) return false;
                                                            }
                                                        }
                                                        if (vendorDetailWarrantySearch) {
                                                            const search = vendorDetailWarrantySearch.toLowerCase();
                                                            return (
                                                                warranty.customer_name?.toLowerCase().includes(search) ||
                                                                warranty.customer_phone?.includes(search) ||
                                                                warranty.product_type?.toLowerCase().includes(search) ||
                                                                warranty.uid?.toLowerCase().includes(search)
                                                            );
                                                        }
                                                        return true;
                                                    })
                                                        .sort((a: any, b: any) => {
                                                            let aVal = a[vendorDetailWarrantySortField];
                                                            let bVal = b[vendorDetailWarrantySortField];
                                                            if (vendorDetailWarrantySortField === 'created_at') {
                                                                aVal = new Date(aVal).getTime();
                                                                bVal = new Date(bVal).getTime();
                                                            } else {
                                                                aVal = (aVal || '').toString().toLowerCase();
                                                                bVal = (bVal || '').toString().toLowerCase();
                                                            }
                                                            return vendorDetailWarrantySortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
                                                        })
                                                )}
                                            >
                                                <Download className="h-4 w-4 mr-2" />
                                                Export CSV
                                            </Button>
                                        </div>

                                        {/* Search & Sort */}
                                        <div className="flex flex-wrap items-center gap-4">
                                            <div className="flex-1 min-w-[200px] relative">
                                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <input
                                                    type="text"
                                                    placeholder="Search warranties..."
                                                    className="w-full pl-10 pr-4 py-2 rounded-md border border-input bg-background text-sm"
                                                    value={vendorDetailWarrantySearch}
                                                    onChange={(e) => setVendorDetailWarrantySearch(e.target.value)}
                                                />
                                            </div>
                                            <select
                                                className="px-3 py-2 rounded-md border border-input bg-background text-sm"
                                                value={vendorDetailWarrantySortField}
                                                onChange={(e) => setVendorDetailWarrantySortField(e.target.value as any)}
                                            >
                                                <option value="created_at">Date</option>
                                                <option value="customer_name">Customer</option>
                                                <option value="product_type">Product</option>
                                                <option value="status">Status</option>
                                            </select>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setVendorDetailWarrantySortOrder(vendorDetailWarrantySortOrder === 'asc' ? 'desc' : 'asc')}
                                            >
                                                {vendorDetailWarrantySortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
                                            </Button>
                                        </div>
                                    </div>

                                    {(!selectedVendor.warranties || selectedVendor.warranties.length === 0) ? (
                                        <div className="text-center py-8 text-muted-foreground">No warranties registered yet.</div>
                                    ) : (
                                        <AdminWarrantyList
                                            key={`${vendorWarrantyFilter}-${vendorDetailWarrantySearch}-${vendorDetailWarrantySortField}-${vendorDetailWarrantySortOrder}`}
                                            items={(selectedVendor.warranties || [])
                                                .filter((warranty: any) => {
                                                    if (vendorWarrantyFilter !== 'all' && warranty.status !== vendorWarrantyFilter) return false;

                                                    // Date range filter
                                                    if (vendorDetailWarrantyDateFrom || vendorDetailWarrantyDateTo) {
                                                        const warrantyDate = new Date(warranty.created_at);
                                                        warrantyDate.setHours(0, 0, 0, 0);
                                                        if (vendorDetailWarrantyDateFrom) {
                                                            const fromDate = new Date(vendorDetailWarrantyDateFrom);
                                                            fromDate.setHours(0, 0, 0, 0);
                                                            if (warrantyDate < fromDate) return false;
                                                        }
                                                        if (vendorDetailWarrantyDateTo) {
                                                            const toDate = new Date(vendorDetailWarrantyDateTo);
                                                            toDate.setHours(23, 59, 59, 999);
                                                            if (warrantyDate > toDate) return false;
                                                        }
                                                    }

                                                    // Search filter
                                                    if (vendorDetailWarrantySearch) {
                                                        const search = vendorDetailWarrantySearch.toLowerCase();
                                                        return (
                                                            warranty.customer_name?.toLowerCase().includes(search) ||
                                                            warranty.customer_email?.toLowerCase().includes(search) ||
                                                            warranty.customer_phone?.includes(search) ||
                                                            warranty.uid?.toLowerCase().includes(search) ||
                                                            warranty.product_type?.toLowerCase().includes(search)
                                                        );
                                                    }
                                                    return true;
                                                })
                                                .sort((a: any, b: any) => {
                                                    let aVal = a[vendorDetailWarrantySortField];
                                                    let bVal = b[vendorDetailWarrantySortField];
                                                    if (vendorDetailWarrantySortField === 'created_at') {
                                                        aVal = new Date(aVal).getTime();
                                                        bVal = new Date(bVal).getTime();
                                                    } else {
                                                        aVal = (aVal || '').toString().toLowerCase();
                                                        bVal = (bVal || '').toString().toLowerCase();
                                                    }
                                                    return vendorDetailWarrantySortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
                                                })
                                            }
                                            showRejectionReason={vendorWarrantyFilter === 'rejected'}
                                            showActions={vendorWarrantyFilter === 'validated' || vendorWarrantyFilter === 'pending'}
                                            processingWarranty={processingWarranty}
                                            onApprove={(id) => handleUpdateStatus(id, 'validated')}
                                            onReject={(id) => openRejectDialog(id)}
                                        />
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="manpower">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Manpower List</CardTitle>
                                </CardHeader>

                                <CardContent>
                                    {/* Manpower Controls */}
                                    <div className="flex flex-wrap items-center gap-4 mb-6 justify-between">
                                        <div className="flex flex-wrap items-center gap-4 flex-1">
                                            <div className="relative min-w-[200px]">
                                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <input
                                                    type="text"
                                                    placeholder="Search manpower..."
                                                    className="w-full pl-10 pr-4 py-2 rounded-md border border-input bg-background text-sm"
                                                    value={vendorDetailManpowerSearch}
                                                    onChange={(e) => setVendorDetailManpowerSearch(e.target.value)}
                                                />
                                            </div>
                                            <select
                                                className="px-3 py-2 rounded-md border border-input bg-background text-sm"
                                                value={vendorDetailManpowerSortField}
                                                onChange={(e) => setVendorDetailManpowerSortField(e.target.value as any)}
                                            >
                                                <option value="name">Name</option>
                                                <option value="points">Points</option>
                                                <option value="total_applications">Total Applications</option>
                                            </select>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setVendorDetailManpowerSortOrder(vendorDetailManpowerSortOrder === 'asc' ? 'desc' : 'asc')}
                                            >
                                                {vendorDetailManpowerSortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
                                            </Button>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleExportVendorDetailManpower(
                                                selectedVendor.manpower
                                                    .filter((m: any) => {
                                                        // Apply search filter regardless of active/inactive tab for export consistency, 
                                                        // OR we could export ALL matching the search.
                                                        // User likely wants what they see, but exporting active+inactive is safer if not specified.
                                                        // Let's filter by search only for the export data generally, or we could pass the currently visible set.
                                                        // To keep it simple and powerful, let's export ALL manpower matching search, 
                                                        // sorted as per selection.
                                                        if (vendorDetailManpowerSearch) {
                                                            const search = vendorDetailManpowerSearch.toLowerCase();
                                                            return (
                                                                m.name?.toLowerCase().includes(search) ||
                                                                m.phone_number?.includes(search) ||
                                                                (m.points?.toString() || '').includes(search)
                                                            );
                                                        }
                                                        return true;
                                                    })
                                                    .sort((a: any, b: any) => {
                                                        let aVal = a[vendorDetailManpowerSortField];
                                                        let bVal = b[vendorDetailManpowerSortField];
                                                        if (typeof aVal === 'string') {
                                                            aVal = aVal.toLowerCase();
                                                            bVal = (bVal || '').toString().toLowerCase();
                                                        }
                                                        return vendorDetailManpowerSortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
                                                    })
                                            )}
                                        >
                                            <Download className="h-4 w-4 mr-2" />
                                            Export CSV
                                        </Button>
                                    </div>

                                    <Tabs defaultValue="active" className="space-y-6">
                                        <TabsList className="grid w-full grid-cols-2">
                                            <TabsTrigger value="active">
                                                Current Team (
                                                {selectedVendor.manpower.filter((m: any) => m.is_active).length}
                                                )
                                            </TabsTrigger>

                                            <TabsTrigger value="inactive">
                                                Ex Team (
                                                {selectedVendor.manpower.filter((m: any) => !m.is_active).length}
                                                )
                                            </TabsTrigger>
                                        </TabsList>

                                        {/* CURRENT TEAM */}
                                        <TabsContent value="active">
                                            {selectedVendor.manpower.filter((m: any) => m.is_active).length === 0 ? (
                                                <div className="text-center py-8 text-muted-foreground">No active manpower.</div>
                                            ) : (
                                                <div className="grid gap-4">
                                                    {selectedVendor.manpower
                                                        .filter((m: any) => {
                                                            if (!m.is_active) return false;
                                                            if (vendorDetailManpowerSearch) {
                                                                const search = vendorDetailManpowerSearch.toLowerCase();
                                                                return (
                                                                    m.name?.toLowerCase().includes(search) ||
                                                                    m.phone_number?.includes(search) ||
                                                                    (m.points?.toString() || '').includes(search)
                                                                );
                                                            }
                                                            return true;
                                                        })
                                                        .sort((a: any, b: any) => {
                                                            let aVal = a[vendorDetailManpowerSortField];
                                                            let bVal = b[vendorDetailManpowerSortField];
                                                            if (typeof aVal === 'string') {
                                                                aVal = aVal.toLowerCase();
                                                                bVal = (bVal || '').toString().toLowerCase();
                                                            }
                                                            return vendorDetailManpowerSortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
                                                        })
                                                        .map((member: any) => (
                                                            <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                                        <User className="h-5 w-5 text-primary" />
                                                                    </div>

                                                                    <div>
                                                                        <p className="font-medium">{member.name}</p>
                                                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                                            <span>{member.phone_number}</span>
                                                                            <span>•</span>
                                                                            <span className="font-mono text-xs bg-muted px-1 py-0.5 rounded">{member.manpower_id}</span>
                                                                            <span>•</span>
                                                                            <span className="capitalize">{member.applicator_type.replace('_', ' ')}</span>
                                                                            <span>•</span>

                                                                            <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">
                                                                                {member.points || 0} Validated
                                                                            </span>

                                                                            <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-800">
                                                                                {member.pending_points || 0} Pending
                                                                            </span>

                                                                            <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800">
                                                                                {member.rejected_points || 0} Rejected
                                                                            </span>

                                                                            <span>•</span>
                                                                            <span className="font-medium">{member.total_applications || 0} Total</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                </div>
                                            )}
                                        </TabsContent>

                                        {/* PAST / EX TEAM */}
                                        <TabsContent value="inactive">
                                            {selectedVendor.manpower.filter((m: any) => !m.is_active).length === 0 ? (
                                                <div className="text-center py-8 text-muted-foreground">No ex team members.</div>
                                            ) : (
                                                <div className="grid gap-4">
                                                    {selectedVendor.manpower
                                                        .filter((m: any) => {
                                                            if (m.is_active) return false;
                                                            if (vendorDetailManpowerSearch) {
                                                                const search = vendorDetailManpowerSearch.toLowerCase();
                                                                return (
                                                                    m.name?.toLowerCase().includes(search) ||
                                                                    m.phone_number?.includes(search) ||
                                                                    (m.points?.toString() || '').includes(search)
                                                                );
                                                            }
                                                            return true;
                                                        })
                                                        .sort((a: any, b: any) => {
                                                            let aVal = a[vendorDetailManpowerSortField];
                                                            let bVal = b[vendorDetailManpowerSortField];
                                                            if (typeof aVal === 'string') {
                                                                aVal = aVal.toLowerCase();
                                                                bVal = (bVal || '').toString().toLowerCase();
                                                            }
                                                            return vendorDetailManpowerSortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
                                                        })
                                                        .map((member: any) => (
                                                            <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                                                                        <User className="h-5 w-5 text-gray-500" />
                                                                    </div>

                                                                    <div>
                                                                        <p className="font-medium text-muted-foreground">{member.name}</p>
                                                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                                            <span>{member.phone_number}</span>
                                                                            <span>•</span>
                                                                            <span className="font-mono text-xs bg-muted px-1 py-0.5 rounded">{member.manpower_id}</span>
                                                                            <span>•</span>
                                                                            <span className="capitalize">{member.applicator_type.replace('_', ' ')}</span>
                                                                            <span>•</span>

                                                                            <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">
                                                                                {member.points || 0} Validated
                                                                            </span>

                                                                            <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-800">
                                                                                {member.pending_points || 0} Pending
                                                                            </span>

                                                                            <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800">
                                                                                {member.rejected_points || 0} Rejected
                                                                            </span>

                                                                            <span>•</span>
                                                                            <span className="font-medium">{member.total_applications || 0} Total</span>

                                                                            {member.removed_at && (
                                                                                <>
                                                                                    <span>•</span>
                                                                                    <span className="text-xs">Removed: {new Date(member.removed_at).toLocaleDateString()}</span>
                                                                                </>
                                                                            )}
                                                                        </div>
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

                    {/* Rejection Dialog */}
                    {rejectDialogOpen && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                            <div className="bg-background p-6 rounded-lg w-full max-w-md shadow-lg">
                                <h3 className="text-lg font-semibold mb-4">Reject Warranty</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Please provide a reason for rejecting this warranty registration.
                                </p>
                                <textarea
                                    className="w-full min-h-[100px] p-3 rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="Reason for rejection..."
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                />
                                <div className="flex justify-end gap-2 mt-4">
                                    <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        onClick={() => selectedWarrantyId && handleUpdateStatus(selectedWarrantyId, 'rejected', rejectReason)}
                                        disabled={!rejectReason.trim()}
                                    >
                                        Reject Warranty
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
            <Header />

            <main className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
                    <p className="text-muted-foreground">
                        System-wide warranty management and user administration
                    </p>
                </div>

                {/* Stats Cards - Dynamic based on active tab */}
                <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4 mb-6">
                    {/* Warranties Tab Cards */}
                    {activeTab === 'warranties' && (
                        <>
                            <Card
                                className={`cursor-pointer transition-colors ${warrantyFilter === 'all' ? 'border-primary bg-accent/50' : 'hover:bg-accent/50'}`}
                                onClick={() => setWarrantyFilter('all')}
                            >
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Warranties</CardTitle>
                                    <Package className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stats.totalWarranties}</div>
                                    <p className="text-xs text-muted-foreground">All registered products</p>
                                </CardContent>
                            </Card>

                            <Card
                                className={`cursor-pointer transition-colors ${warrantyFilter === 'validated' ? 'border-green-500 bg-green-50' : 'hover:bg-accent/50'}`}
                                onClick={() => setWarrantyFilter('validated')}
                            >
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-green-700">Approved</CardTitle>
                                    <ShieldCheck className="h-4 w-4 text-green-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-green-700">{stats.validatedWarranties}</div>
                                    <p className="text-xs text-green-600">Validated warranties</p>
                                </CardContent>
                            </Card>

                            <Card
                                className={`cursor-pointer transition-colors ${warrantyFilter === 'rejected' ? 'border-red-500 bg-red-50' : 'hover:bg-accent/50'}`}
                                onClick={() => setWarrantyFilter('rejected')}
                            >
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-red-700">Disapproved</CardTitle>
                                    <X className="h-4 w-4 text-red-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-red-700">{stats.rejectedWarranties}</div>
                                    <p className="text-xs text-red-600">Rejected warranties</p>
                                </CardContent>
                            </Card>

                            <Card
                                className={`cursor-pointer transition-colors ${warrantyFilter === 'pending' ? 'border-yellow-500 bg-yellow-50' : 'hover:bg-accent/50'}`}
                                onClick={() => setWarrantyFilter('pending')}
                            >
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-yellow-700">Pending</CardTitle>
                                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-yellow-700">{stats.pendingApprovals}</div>
                                    <p className="text-xs text-yellow-600">Awaiting approval</p>
                                </CardContent>
                            </Card>
                        </>
                    )}

                    {/* Vendors Tab Cards */}
                    {activeTab === 'vendors' && (
                        <>
                            <Card
                                className={`cursor-pointer transition-colors ${vendorFilter === 'all' ? 'border-primary bg-accent/50' : 'hover:bg-accent/50'}`}
                                onClick={() => setVendorFilter('all')}
                            >
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Vendors</CardTitle>
                                    <Store className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stats.totalVendors}</div>
                                    <p className="text-xs text-muted-foreground">All registered vendors</p>
                                </CardContent>
                            </Card>

                            <Card
                                className={`cursor-pointer transition-colors ${vendorFilter === 'approved' ? 'border-green-500 bg-green-50' : 'hover:bg-accent/50'}`}
                                onClick={() => setVendorFilter('approved')}
                            >
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-green-700">Approved</CardTitle>
                                    <ShieldCheck className="h-4 w-4 text-green-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-green-700">{approvedVendorsCount}</div>
                                    <p className="text-xs text-green-600">Verified vendors</p>
                                </CardContent>
                            </Card>

                            <Card
                                className={`cursor-pointer transition-colors ${vendorFilter === 'disapproved' ? 'border-red-500 bg-red-50' : 'hover:bg-accent/50'}`}
                                onClick={() => setVendorFilter('disapproved')}
                            >
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-red-700">Disapproved</CardTitle>
                                    <X className="h-4 w-4 text-red-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-red-700">{disapprovedVendorsCount}</div>
                                    <p className="text-xs text-red-600">Rejected vendors</p>
                                </CardContent>
                            </Card>

                            <Card
                                className={`cursor-pointer transition-colors ${vendorFilter === 'pending' ? 'border-yellow-500 bg-yellow-50' : 'hover:bg-accent/50'}`}
                                onClick={() => setVendorFilter('pending')}
                            >
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-yellow-700">Pending</CardTitle>
                                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-yellow-700">{pendingVendorsCount}</div>
                                    <p className="text-xs text-yellow-600">Awaiting approval</p>
                                </CardContent>
                            </Card>
                        </>
                    )}

                    {/* Customers Tab Cards */}
                    {activeTab === 'customers' && (
                        <>
                            <Card className="hover:bg-accent/50">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stats.totalCustomers}</div>
                                    <p className="text-xs text-muted-foreground">All registered customers</p>
                                </CardContent>
                            </Card>

                            <Card className="hover:bg-accent/50">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Warranties</CardTitle>
                                    <Package className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stats.totalWarranties}</div>
                                    <p className="text-xs text-muted-foreground">All customer warranties</p>
                                </CardContent>
                            </Card>

                            <Card className="hover:bg-accent/50">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-green-700">Approved Warranties</CardTitle>
                                    <ShieldCheck className="h-4 w-4 text-green-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-green-700">{stats.validatedWarranties}</div>
                                    <p className="text-xs text-green-600">Validated warranties</p>
                                </CardContent>
                            </Card>

                            <Card className="hover:bg-accent/50">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-red-700">Disapproved Warranties</CardTitle>
                                    <X className="h-4 w-4 text-red-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-red-700">{stats.rejectedWarranties}</div>
                                    <p className="text-xs text-red-600">Rejected warranties</p>
                                </CardContent>
                            </Card>
                        </>
                    )}

                    {/* Overview Tab Cards - Show summary */}
                    {activeTab === 'overview' && (
                        <>
                            <Card
                                className="cursor-pointer hover:bg-accent/50"
                                onClick={() => setActiveTab('warranties')}
                            >
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Warranties</CardTitle>
                                    <Package className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stats.totalWarranties}</div>
                                    <p className="text-xs text-muted-foreground">Click to view all</p>
                                </CardContent>
                            </Card>

                            <Card
                                className="cursor-pointer hover:bg-accent/50"
                                onClick={() => setActiveTab('vendors')}
                            >
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Vendors</CardTitle>
                                    <Store className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stats.totalVendors}</div>
                                    <p className="text-xs text-muted-foreground">Click to manage</p>
                                </CardContent>
                            </Card>

                            <Card
                                className="cursor-pointer hover:bg-accent/50"
                                onClick={() => setActiveTab('customers')}
                            >
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Customers</CardTitle>
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stats.totalCustomers}</div>
                                    <p className="text-xs text-muted-foreground">Click to view all</p>
                                </CardContent>
                            </Card>

                            <Card className="hover:bg-accent/50">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-yellow-700">Pending</CardTitle>
                                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-yellow-700">{stats.pendingApprovals}</div>
                                    <p className="text-xs text-yellow-600">Needs attention</p>
                                </CardContent>
                            </Card>
                        </>
                    )}
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                    <TabsList className="grid grid-cols-4 mb-8">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="warranties">Warranties</TabsTrigger>
                        <TabsTrigger value="vendors">Vendors</TabsTrigger>
                        <TabsTrigger value="customers">Customers</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-center">System Overview</CardTitle>
                                <CardDescription className="text-center">
                                    Select a category above to manage records
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    </TabsContent>

                    <TabsContent value="warranties" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Warranty Management</CardTitle>
                                        <CardDescription>View and manage all warranty requests</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {/* Filter Tabs */}
                                <Tabs value={warrantyFilter} onValueChange={(value: any) => setWarrantyFilter(value)} className="mb-4">
                                    <TabsList>
                                        <TabsTrigger value="all">All ({stats.totalWarranties})</TabsTrigger>
                                        <TabsTrigger value="validated">Approved ({stats.validatedWarranties})</TabsTrigger>
                                        <TabsTrigger value="rejected">Disapproved ({stats.rejectedWarranties})</TabsTrigger>
                                        <TabsTrigger value="pending">Pending ({stats.pendingApprovals})</TabsTrigger>
                                    </TabsList>
                                </Tabs>

                                {/* Search & Sort Controls */}
                                <div className="flex flex-wrap gap-4 mb-4">
                                    <div className="flex-1 min-w-[200px]">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <input
                                                type="text"
                                                placeholder="Search by name, email, phone, UID, car..."
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
                                            <option value="customer_name">Sort by Name</option>
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
                                <div className="flex flex-wrap items-center gap-4 mb-4">
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
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="ml-auto"
                                        onClick={handleExportWarranties}
                                    >
                                        <Download className="h-4 w-4 mr-2" />
                                        Export CSV
                                    </Button>
                                </div>

                                {loadingWarranties ? (
                                    <div className="text-center py-8">Loading warranties...</div>
                                ) : warranties.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">No warranties found.</div>
                                ) : (
                                    <AdminWarrantyList
                                        key={warrantyFilter + warrantySearch + warrantySortField + warrantySortOrder}
                                        items={warranties
                                            .filter((warranty: any) => {
                                                // Status filter
                                                if (warrantyFilter !== 'all' && warranty.status !== warrantyFilter) return false;
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
                                                // Search filter
                                                if (warrantySearch) {
                                                    const search = warrantySearch.toLowerCase();
                                                    return (
                                                        warranty.customer_name?.toLowerCase().includes(search) ||
                                                        warranty.customer_email?.toLowerCase().includes(search) ||
                                                        warranty.customer_phone?.includes(search) ||
                                                        warranty.uid?.toLowerCase().includes(search) ||
                                                        warranty.car_make?.toLowerCase().includes(search) ||
                                                        warranty.car_model?.toLowerCase().includes(search) ||
                                                        warranty.product_type?.toLowerCase().includes(search)
                                                    );
                                                }
                                                return true;
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
                                                if (warrantySortOrder === 'asc') {
                                                    return aVal > bVal ? 1 : -1;
                                                } else {
                                                    return aVal < bVal ? 1 : -1;
                                                }
                                            })
                                        }
                                        showRejectionReason={warrantyFilter === 'rejected'}
                                        showActions={warrantyFilter === 'validated' || warrantyFilter === 'pending'}
                                        processingWarranty={processingWarranty}
                                        onApprove={(id) => handleUpdateStatus(id, 'validated')}
                                        onReject={(id) => openRejectDialog(id)}
                                    />
                                )}
                            </CardContent >
                        </Card >
                    </TabsContent >

                    <TabsContent value="vendors" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Vendor Management</CardTitle>
                                        <CardDescription>Manage registered vendors and their data</CardDescription>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm">
                                            <Search className="mr-2 h-4 w-4" />
                                            Search
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {/* Vendor Filter Tabs */}
                                <Tabs value={vendorFilter} onValueChange={(value: any) => setVendorFilter(value)} className="mb-4">
                                    <TabsList>
                                        <TabsTrigger value="all">All ({vendors.length})</TabsTrigger>
                                        <TabsTrigger value="approved">Approved ({approvedVendorsCount})</TabsTrigger>
                                        <TabsTrigger value="disapproved">Disapproved ({disapprovedVendorsCount})</TabsTrigger>
                                        <TabsTrigger value="pending">Pending ({pendingVendorsCount})</TabsTrigger>
                                    </TabsList>
                                </Tabs>

                                {/* Search & Sort Controls */}
                                <div className="flex flex-wrap gap-4 mb-4">
                                    <div className="flex-1 min-w-[200px]">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <input
                                                type="text"
                                                placeholder="Search by store, vendor, email, phone, city..."
                                                className="w-full pl-10 pr-4 py-2 rounded-md border border-input bg-background text-sm"
                                                value={vendorSearch}
                                                onChange={(e) => setVendorSearch(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <select
                                            className="px-3 py-2 rounded-md border border-input bg-background text-sm"
                                            value={vendorSortField}
                                            onChange={(e) => setVendorSortField(e.target.value as any)}
                                        >
                                            <option value="created_at">Sort by Date</option>
                                            <option value="store_name">Sort by Store</option>
                                            <option value="city">Sort by City</option>
                                        </select>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setVendorSortOrder(vendorSortOrder === 'asc' ? 'desc' : 'asc')}
                                        >
                                            {vendorSortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
                                        </Button>
                                        {vendorSearch && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setVendorSearch('')}
                                            >
                                                Clear
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {/* Date Range Filter */}
                                <div className="flex flex-wrap items-center gap-4 mb-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-muted-foreground">From:</span>
                                        <input
                                            type="date"
                                            className="px-3 py-2 rounded-md border border-input bg-background text-sm"
                                            value={vendorDateFrom}
                                            onChange={(e) => setVendorDateFrom(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-muted-foreground">To:</span>
                                        <input
                                            type="date"
                                            className="px-3 py-2 rounded-md border border-input bg-background text-sm"
                                            value={vendorDateTo}
                                            onChange={(e) => setVendorDateTo(e.target.value)}
                                        />
                                    </div>
                                    {(vendorDateFrom || vendorDateTo) && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => { setVendorDateFrom(''); setVendorDateTo(''); }}
                                        >
                                            Clear Dates
                                        </Button>
                                    )}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="ml-auto"
                                        onClick={handleExportVendors}
                                    >
                                        <Download className="h-4 w-4 mr-2" />
                                        Export CSV
                                    </Button>
                                </div>

                                {loadingVendors ? (
                                    <div className="text-center py-8">Loading vendors...</div>
                                ) : filteredVendors.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">No vendors found.</div>
                                ) : (
                                    <div className="relative w-full overflow-auto">
                                        <table className="w-full caption-bottom text-sm">
                                            <thead className="[&_tr]:border-b">
                                                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                                    {vendorFilter === 'pending' || vendorFilter === 'disapproved' || vendorFilter === 'all' ? (
                                                        <>
                                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">S.No</th>
                                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Store Name</th>
                                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Contact Person</th>
                                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Store Email</th>
                                                            {vendorFilter === 'all' && (
                                                                <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">Status</th>
                                                            )}
                                                            <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">Manpower</th>
                                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Location</th>
                                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Address</th>
                                                            <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">S.No</th>
                                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Store Name</th>
                                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Contact Person</th>
                                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Store Email</th>
                                                            <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">Manpower</th>
                                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Location</th>
                                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Address</th>
                                                            <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">Validated</th>
                                                            <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">Pending</th>
                                                            <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">Rejected</th>
                                                            <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">Total</th>
                                                            <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
                                                        </>
                                                    )}
                                                </tr>
                                            </thead>
                                            <tbody className="[&_tr:last-child]:border-0">
                                                {filteredVendors.map((vendor, index) => (
                                                    <tr key={vendor.id} className="border-b transition-colors hover:bg-muted/50">
                                                        {vendorFilter === 'pending' || vendorFilter === 'disapproved' || vendorFilter === 'all' ? (
                                                            <>
                                                                <td className="p-4 align-middle">{index + 1}</td>
                                                                <td className="p-4 align-middle font-medium">{vendor.store_name || 'N/A'}</td>
                                                                <td className="p-4 align-middle">
                                                                    <div>{vendor.contact_name}</div>
                                                                    <div className="text-xs text-muted-foreground">{vendor.phone_number}</div>
                                                                </td>
                                                                <td className="p-4 align-middle">{vendor.store_email || 'N/A'}</td>
                                                                {vendorFilter === 'all' && (
                                                                    <td className="p-4 align-middle text-center">
                                                                        {vendor.is_verified ? (
                                                                            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
                                                                                Approved
                                                                            </span>
                                                                        ) : vendor.verified_at ? (
                                                                            <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800">
                                                                                Disapproved
                                                                            </span>
                                                                        ) : (
                                                                            <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-semibold text-yellow-800">
                                                                                Pending
                                                                            </span>
                                                                        )}
                                                                    </td>
                                                                )}
                                                                <td className="p-4 align-middle text-center">
                                                                    <div>{vendor.manpower_count}</div>
                                                                    <div className="text-xs text-muted-foreground">{vendor.manpower_names || 'No manpower'}</div>
                                                                </td>
                                                                <td className="p-4 align-middle">
                                                                    <div>{vendor.city}</div>
                                                                    <div className="text-xs text-muted-foreground">{vendor.state}</div>
                                                                </td>
                                                                <td className="p-4 align-middle">
                                                                    <div className="max-w-[200px] truncate" title={vendor.full_address}>
                                                                        {vendor.full_address || 'N/A'}
                                                                    </div>
                                                                    <div className="text-xs text-muted-foreground">{vendor.pincode}</div>
                                                                </td>
                                                                <td className="p-4 align-middle text-right">
                                                                    <div className="flex justify-end gap-2">
                                                                        {vendorFilter === 'pending' ? (
                                                                            <>
                                                                                <Button
                                                                                    size="sm"
                                                                                    className="bg-green-600 hover:bg-green-700 h-8 px-2"
                                                                                    onClick={() => handleVendorVerification(vendor.id, true)}
                                                                                    disabled={processingVendor === vendor.id}
                                                                                >
                                                                                    <Check className="h-4 w-4 mr-1" /> Approve
                                                                                </Button>
                                                                                <Button
                                                                                    size="sm"
                                                                                    variant="destructive"
                                                                                    className="h-8 px-2"
                                                                                    onClick={() => {
                                                                                        setSelectedVendor(vendor);
                                                                                        setVendorRejectDialogOpen(true);
                                                                                    }}
                                                                                    disabled={processingVendor === vendor.id}
                                                                                >
                                                                                    <X className="h-4 w-4 mr-1" /> Reject
                                                                                </Button>
                                                                            </>
                                                                        ) : vendorFilter === 'disapproved' ? (
                                                                            <>
                                                                                <Button
                                                                                    size="sm"
                                                                                    className="bg-green-600 hover:bg-green-700 h-8 px-2"
                                                                                    onClick={() => handleVendorVerification(vendor.id, true)}
                                                                                    disabled={processingVendor === vendor.id}
                                                                                >
                                                                                    <Check className="h-4 w-4 mr-1" /> Re-approve
                                                                                </Button>
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="icon"
                                                                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                                                    onClick={() => handleDeleteVendor(vendor.id)}
                                                                                    title="Delete Vendor"
                                                                                >
                                                                                    <Trash2 className="h-4 w-4" />
                                                                                </Button>
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="icon"
                                                                                    onClick={() => handleViewVendor(vendor.id)}
                                                                                    title="View Details"
                                                                                >
                                                                                    <Users className="h-4 w-4" />
                                                                                </Button>
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="icon"
                                                                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                                                    onClick={() => handleDeleteVendor(vendor.id)}
                                                                                    title="Delete Vendor"
                                                                                >
                                                                                    <Trash2 className="h-4 w-4" />
                                                                                </Button>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <td className="p-4 align-middle">{index + 1}</td>
                                                                <td className="p-4 align-middle font-medium">{vendor.store_name || 'N/A'}</td>
                                                                <td className="p-4 align-middle">
                                                                    <div>{vendor.contact_name}</div>
                                                                    <div className="text-xs text-muted-foreground">{vendor.phone_number}</div>
                                                                </td>
                                                                <td className="p-4 align-middle">{vendor.store_email || 'N/A'}</td>
                                                                <td className="p-4 align-middle text-center">
                                                                    <div>{vendor.manpower_count}</div>
                                                                    <div className="text-xs text-muted-foreground">{vendor.manpower_names || 'No manpower'}</div>
                                                                </td>
                                                                <td className="p-4 align-middle">
                                                                    <div>{vendor.city}</div>
                                                                    <div className="text-xs text-muted-foreground">{vendor.state}</div>
                                                                </td>
                                                                <td className="p-4 align-middle">
                                                                    <div className="max-w-[200px] truncate" title={vendor.full_address}>
                                                                        {vendor.full_address || 'N/A'}
                                                                    </div>
                                                                    <div className="text-xs text-muted-foreground">{vendor.pincode}</div>
                                                                </td>
                                                                <td className="p-4 align-middle text-center text-green-600 font-medium">{vendor.validated_warranties}</td>
                                                                <td className="p-4 align-middle text-center text-yellow-600 font-medium">{vendor.pending_warranties}</td>
                                                                <td className="p-4 align-middle text-center text-red-600 font-medium">{vendor.rejected_warranties || 0}</td>
                                                                <td className="p-4 align-middle text-center font-bold">{vendor.total_warranties}</td>
                                                                <td className="p-4 align-middle text-right">
                                                                    <div className="flex justify-end gap-2">
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            onClick={() => handleViewVendor(vendor.id)}
                                                                            title="View Details"
                                                                        >
                                                                            <Users className="h-4 w-4" />
                                                                        </Button>
                                                                        <Button
                                                                            size="sm"
                                                                            variant="destructive"
                                                                            className="h-8 px-2"
                                                                            onClick={() => {
                                                                                setSelectedVendor(vendor);
                                                                                setVendorRejectDialogOpen(true);
                                                                            }}
                                                                            disabled={processingVendor === vendor.id}
                                                                            title="Reject Vendor"
                                                                        >
                                                                            <X className="h-4 w-4 mr-1" /> Reject
                                                                        </Button>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                                            onClick={() => handleDeleteVendor(vendor.id)}
                                                                            title="Delete Vendor"
                                                                        >
                                                                            <Trash2 className="h-4 w-4" />
                                                                        </Button>
                                                                    </div>
                                                                </td>
                                                            </>
                                                        )}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="customers" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Customer Management</CardTitle>
                                        <CardDescription>
                                            View and manage all customers and their warranty registrations
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {/* Search & Sort Controls */}
                                <div className="flex flex-wrap gap-4 mb-4">
                                    <div className="flex-1 min-w-[200px]">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <input
                                                type="text"
                                                placeholder="Search by name, email, phone..."
                                                className="w-full pl-10 pr-4 py-2 rounded-md border border-input bg-background text-sm"
                                                value={customerSearch}
                                                onChange={(e) => setCustomerSearch(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <select
                                            className="px-3 py-2 rounded-md border border-input bg-background text-sm"
                                            value={customerSortField}
                                            onChange={(e) => setCustomerSortField(e.target.value as any)}
                                        >
                                            <option value="created_at">Sort by Date</option>
                                            <option value="customer_name">Sort by Name</option>
                                            <option value="warranty_count">Sort by Warranties</option>
                                        </select>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCustomerSortOrder(customerSortOrder === 'asc' ? 'desc' : 'asc')}
                                        >
                                            {customerSortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
                                        </Button>
                                        {customerSearch && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setCustomerSearch('')}
                                            >
                                                Clear
                                            </Button>
                                        )}
                                    </div>
                                </div>


                                {/* Date Range Filter */}
                                <div className="flex flex-wrap items-center gap-4 mb-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-muted-foreground">From:</span>
                                        <input
                                            type="date"
                                            className="px-3 py-2 rounded-md border border-input bg-background text-sm"
                                            value={customerDateFrom}
                                            onChange={(e) => setCustomerDateFrom(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-muted-foreground">To:</span>
                                        <input
                                            type="date"
                                            className="px-3 py-2 rounded-md border border-input bg-background text-sm"
                                            value={customerDateTo}
                                            onChange={(e) => setCustomerDateTo(e.target.value)}
                                        />
                                    </div>
                                    {(customerDateFrom || customerDateTo) && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => { setCustomerDateFrom(''); setCustomerDateTo(''); }}
                                        >
                                            Clear Dates
                                        </Button>
                                    )}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="ml-auto"
                                        onClick={handleExportCustomers}
                                    >
                                        <Download className="h-4 w-4 mr-2" />
                                        Export CSV
                                    </Button>
                                </div>

                                {loadingCustomers ? (
                                    <div className="text-center py-8">Loading customers...</div>
                                ) : customers
                                    .filter((customer: any) => {
                                        if (!customerSearch) return true;
                                        const search = customerSearch.toLowerCase();
                                        return (
                                            customer.customer_name?.toLowerCase().includes(search) ||
                                            customer.customer_email?.toLowerCase().includes(search) ||
                                            customer.customer_phone?.includes(search)
                                        );
                                    })
                                    .sort((a: any, b: any) => {
                                        let aVal = a[customerSortField];
                                        let bVal = b[customerSortField];
                                        if (customerSortField === 'created_at') {
                                            aVal = new Date(aVal).getTime();
                                            bVal = new Date(bVal).getTime();
                                        } else if (customerSortField === 'warranty_count') {
                                            aVal = Number(aVal) || 0;
                                            bVal = Number(bVal) || 0;
                                        } else {
                                            aVal = (aVal || '').toString().toLowerCase();
                                            bVal = (bVal || '').toString().toLowerCase();
                                        }
                                        return customerSortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
                                    }).length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">No customers found.</div>
                                ) : (
                                    <div className="relative w-full overflow-auto">
                                        <table className="w-full caption-bottom text-sm">
                                            <thead className="[&_tr]:border-b">
                                                <tr className="border-b transition-colors hover:bg-muted/50">
                                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">S.No</th>
                                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Customer Name</th>
                                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Email</th>
                                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Phone</th>
                                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Address</th>
                                                    <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">Validated</th>
                                                    <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">Rejected</th>
                                                    <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">Pending</th>
                                                    <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">Total</th>
                                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Registered</th>
                                                    <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="[&_tr:last-child]:border-0">
                                                {customers
                                                    .filter((customer: any) => {
                                                        if (!customerSearch) return true;
                                                        const search = customerSearch.toLowerCase();
                                                        return (
                                                            customer.customer_name?.toLowerCase().includes(search) ||
                                                            customer.customer_email?.toLowerCase().includes(search) ||
                                                            customer.customer_phone?.includes(search)
                                                        );
                                                    })
                                                    .sort((a: any, b: any) => {
                                                        let aVal = a[customerSortField];
                                                        let bVal = b[customerSortField];
                                                        if (customerSortField === 'created_at') {
                                                            aVal = new Date(aVal).getTime();
                                                            bVal = new Date(bVal).getTime();
                                                        } else if (customerSortField === 'warranty_count') {
                                                            aVal = Number(aVal) || 0;
                                                            bVal = Number(bVal) || 0;
                                                        } else {
                                                            aVal = (aVal || '').toString().toLowerCase();
                                                            bVal = (bVal || '').toString().toLowerCase();
                                                        }
                                                        return customerSortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
                                                    })
                                                    .map((customer: any, index: number) => (
                                                        <tr key={customer.customer_email} className="border-b transition-colors hover:bg-muted/50">
                                                            <td className="p-4 align-middle font-medium">{index + 1}</td>
                                                            <td className="p-4 align-middle">{customer.customer_name}</td>
                                                            <td className="p-4 align-middle">
                                                                <div className="text-sm">{customer.customer_email}</div>
                                                            </td>
                                                            <td className="p-4 align-middle">{customer.customer_phone}</td>
                                                            <td className="p-4 align-middle">
                                                                <div className="text-sm max-w-[200px] truncate" title={customer.customer_address}>
                                                                    {customer.customer_address || 'N/A'}
                                                                </div>
                                                            </td>
                                                            <td className="p-4 align-middle text-center">
                                                                <span className="inline-flex items-center justify-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
                                                                    {customer.validated_warranties || 0}
                                                                </span>
                                                            </td>
                                                            <td className="p-4 align-middle text-center">
                                                                <span className="inline-flex items-center justify-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800">
                                                                    {customer.rejected_warranties || 0}
                                                                </span>
                                                            </td>
                                                            <td className="p-4 align-middle text-center">
                                                                <span className="inline-flex items-center justify-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-semibold text-yellow-800">
                                                                    {customer.pending_warranties || 0}
                                                                </span>
                                                            </td>
                                                            <td className="p-4 align-middle text-center">
                                                                <span className="inline-flex items-center justify-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
                                                                    {customer.total_warranties || 0}
                                                                </span>
                                                            </td>
                                                            <td className="p-4 align-middle">
                                                                <div className="text-sm">
                                                                    {customer.first_warranty_date ? new Date(customer.first_warranty_date).toLocaleDateString() : 'N/A'}
                                                                </div>
                                                                <div className="text-xs text-muted-foreground">
                                                                    {customer.first_warranty_date ? new Date(customer.first_warranty_date).toLocaleTimeString() : ''}
                                                                </div>
                                                            </td>
                                                            <td className="p-4 align-middle text-right">
                                                                <div className="flex justify-end gap-2">
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        onClick={() => handleViewCustomer(customer.customer_email)}
                                                                    >
                                                                        View
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="destructive"
                                                                        onClick={() => handleDeleteCustomer(customer.customer_email)}
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Admin Management Tab */}
                    <TabsContent value="admins" className="space-y-4">
                        <div className="grid gap-6 md:grid-cols-2">
                            {/* Add New Admin Card */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Add New Administrator</CardTitle>
                                    <CardDescription>
                                        Invite a new administrator to the system. They will receive an email with login instructions.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Full Name</label>
                                        <input
                                            type="text"
                                            className="w-full p-2 rounded-md border border-input bg-background"
                                            placeholder="John Doe"
                                            value={newAdminForm.name}
                                            onChange={(e) => setNewAdminForm({ ...newAdminForm, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Email Address</label>
                                        <input
                                            type="email"
                                            className="w-full p-2 rounded-md border border-input bg-background"
                                            placeholder="admin@example.com"
                                            value={newAdminForm.email}
                                            onChange={(e) => setNewAdminForm({ ...newAdminForm, email: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Phone Number</label>
                                        <input
                                            type="tel"
                                            className="w-full p-2 rounded-md border border-input bg-background"
                                            placeholder="9876543210"
                                            value={newAdminForm.phone}
                                            onChange={(e) => setNewAdminForm({ ...newAdminForm, phone: e.target.value })}
                                        />
                                    </div>
                                    <Button
                                        className="w-full mt-4"
                                        onClick={handleCreateAdmin}
                                        disabled={addingAdmin}
                                    >
                                        {addingAdmin ? 'Sending Invitation...' : 'Send Invitation'}
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Existing Admins List Card */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Current Administrators</CardTitle>
                                    <CardDescription>
                                        List of all administrators with access to this portal
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {loadingAdmins ? (
                                        <div className="text-center py-8">Loading admins...</div>
                                    ) : admins.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground">No admins found.</div>
                                    ) : (
                                        <div className="space-y-4">
                                            {admins.map((admin: any, index: number) => (
                                                <div key={admin.id} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-semibold">
                                                            {admin.name?.charAt(0)?.toUpperCase() || 'A'}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium">{admin.name}</p>
                                                            <p className="text-sm text-muted-foreground">{admin.email}</p>
                                                            <p className="text-xs text-muted-foreground">{admin.phone_number}</p>
                                                        </div>
                                                    </div>
                                                    <Badge variant="outline" className="text-green-600 border-green-600">
                                                        Active
                                                    </Badge>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="mt-4">
                            <CardContent className="pt-6">
                                <div className="flex items-start gap-3 text-sm text-muted-foreground">
                                    <AlertCircle className="h-5 w-5 mt-0.5 text-yellow-600" />
                                    <div>
                                        <p className="font-medium text-foreground">Admin Policy</p>
                                        <p>Administrators cannot be edited or deleted by other administrators. Only new admins can be added. Contact the system owner for admin account modifications.</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Activity Logs Tab */}
                    <TabsContent value="activity-logs" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Activity Logs</CardTitle>
                                <CardDescription>
                                    Track all administrative actions performed in the system
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {loadingLogs ? (
                                    <div className="text-center py-8">Loading activity logs...</div>
                                ) : activityLogs.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">No activity logs found.</div>
                                ) : (
                                    <div className="relative w-full overflow-auto">
                                        <table className="w-full caption-bottom text-sm">
                                            <thead className="[&_tr]:border-b">
                                                <tr className="border-b transition-colors hover:bg-muted/50">
                                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Date & Time</th>
                                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Admin</th>
                                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Action</th>
                                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Target</th>
                                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Details</th>
                                                </tr>
                                            </thead>
                                            <tbody className="[&_tr:last-child]:border-0">
                                                {activityLogs.map((log: any) => (
                                                    <tr key={log.id} className="border-b transition-colors hover:bg-muted/50">
                                                        <td className="p-4 align-middle">
                                                            <div className="text-sm">{new Date(log.created_at).toLocaleDateString()}</div>
                                                            <div className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleTimeString()}</div>
                                                        </td>
                                                        <td className="p-4 align-middle">
                                                            <div className="font-medium">{log.admin_name || 'Unknown'}</div>
                                                            <div className="text-xs text-muted-foreground">{log.admin_email}</div>
                                                        </td>
                                                        <td className="p-4 align-middle">
                                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${log.action_type.includes('APPROVED') || log.action_type.includes('CREATED')
                                                                ? 'bg-green-100 text-green-800'
                                                                : log.action_type.includes('REJECTED')
                                                                    ? 'bg-red-100 text-red-800'
                                                                    : log.action_type.includes('DELETED')
                                                                        ? 'bg-gray-100 text-gray-800'
                                                                        : 'bg-blue-100 text-blue-800'
                                                                }`}>
                                                                {log.action_type.replace(/_/g, ' ')}
                                                            </span>
                                                        </td>
                                                        <td className="p-4 align-middle">
                                                            <div className="text-sm">{log.target_type}</div>
                                                            <div className="text-xs text-muted-foreground">{log.target_name || log.target_id || 'N/A'}</div>
                                                        </td>
                                                        <td className="p-4 align-middle">
                                                            {log.details && typeof log.details === 'object' ? (
                                                                <div className="text-xs text-muted-foreground max-w-[200px] truncate">
                                                                    {log.details.rejection_reason || log.details.product_type || JSON.stringify(log.details)}
                                                                </div>
                                                            ) : (
                                                                <span className="text-muted-foreground">-</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs >

                {/* Rejection Dialog for Warranties Tab */}
                {
                    rejectDialogOpen && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                            <div className="bg-background p-6 rounded-lg w-full max-w-md shadow-lg">
                                <h3 className="text-lg font-semibold mb-4">Reject Warranty</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Please provide a reason for rejecting this warranty registration.
                                </p>
                                <textarea
                                    className="w-full min-h-[100px] p-3 rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="Reason for rejection..."
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                />
                                <div className="flex justify-end gap-2 mt-4">
                                    <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        onClick={() => selectedWarrantyId && handleWarrantyAction(selectedWarrantyId, 'rejected', rejectReason)}
                                        disabled={!rejectReason.trim()}
                                    >
                                        Reject Warranty
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )
                }
                {/* Rejection Dialog for Vendors Tab */}
                {
                    vendorRejectDialogOpen && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                            <div className="bg-background p-6 rounded-lg w-full max-w-md shadow-lg">
                                <h3 className="text-lg font-semibold mb-4">Reject Vendor Application</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Please provide a reason for rejecting this vendor application. This will be sent to the vendor via email.
                                </p>
                                <textarea
                                    className="w-full min-h-[100px] p-3 rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="Reason for rejection..."
                                    value={vendorRejectReason}
                                    onChange={(e) => setVendorRejectReason(e.target.value)}
                                />
                                <div className="flex justify-end gap-2 mt-4">
                                    <Button variant="outline" onClick={() => setVendorRejectDialogOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        onClick={() => selectedVendor && handleVendorVerification(selectedVendor.id, false, vendorRejectReason)}
                                        disabled={!vendorRejectReason.trim() || processingVendor === selectedVendor?.id}
                                    >
                                        Reject Application
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )
                }
            </main >
        </div >
    );
};

export default AdminDashboard;
