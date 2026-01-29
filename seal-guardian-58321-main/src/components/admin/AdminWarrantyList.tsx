import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn, getWarrantyExpiration, formatToIST } from "@/lib/utils";
import { WarrantySpecSheet } from "@/components/warranty/WarrantySpecSheet";
import {
    Check,
    Download,
    Eye,
    FileText,
    Loader2,
    Mail,
    Package,
    Phone,
    Store,
    User,
    X
} from "lucide-react";

interface WarrantyDetailsViewProps {
    warranty: any;
    productName: string;
    productDetails: any;
}

const WarrantyDetailsView = ({ warranty, productName, productDetails }: WarrantyDetailsViewProps) => {
    return (
        <div className="mt-6 space-y-6">
            <div>
                <h3 className="text-lg font-semibold mb-3 pb-2 border-b">Product Information</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-muted-foreground">Product Name</p>
                        <p className="font-medium">{productName.replace(/-/g, ' ').toUpperCase()}</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant={
                                warranty.status === 'validated' ? 'default' :
                                    warranty.status === 'rejected' ? 'destructive' : 'secondary'
                            } className={cn("text-xs px-2 py-0.5", warranty.status === 'validated' && "bg-green-600 hover:bg-green-700")}>
                                {warranty.status === 'validated' ? 'APPROVED' : warranty.status === 'rejected' ? 'DISAPPROVED' : warranty.status.toUpperCase()}
                            </Badge>
                            {warranty.rejection_reason && (
                                <p className="text-xs text-destructive truncate max-w-[150px]" title={warranty.rejection_reason}>
                                    {warranty.rejection_reason}
                                </p>
                            )}
                        </div>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Product Type</p>
                        <p className="font-medium">{warranty.product_type}</p>
                    </div>
                    {warranty.product_type === 'ev-products' ? (
                        <>
                            <div>
                                <p className="text-sm text-muted-foreground">Serial Number</p>
                                <p className="font-mono font-medium">{productDetails.serialNumber || 'N/A'}</p>
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
                        <p className="font-medium">{formatToIST(warranty.purchase_date).split(',')[0]}</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Registration Date</p>
                        <p className="font-medium">{formatToIST(warranty.created_at).split(',')[0]}</p>
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
                                        <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10" id={`ev-photo-loader-${warranty.id}-${key}`}>
                                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                        </div>
                                        <img
                                            src={(typeof filename === 'string' && (filename as string).startsWith('http')) ? (filename as string) : `http://localhost:3000/uploads/${filename}`}
                                            alt={labels[key]}
                                            className="w-full h-full object-cover"
                                            onLoad={() => {
                                                const loader = document.getElementById(`ev-photo-loader-${warranty.id}-${key}`);
                                                if (loader) loader.style.display = 'none';
                                            }}
                                            onError={() => {
                                                const loader = document.getElementById(`ev-photo-loader-${warranty.id}-${key}`);
                                                if (loader) loader.style.display = 'none';
                                            }}
                                        />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
                                            <a
                                                href={(typeof filename === 'string' && (filename as string).startsWith('http')) ? (filename as string) : `http://localhost:3000/uploads/${filename}`}
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
                                <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10" id={`details-invoice-loader-${warranty.id}`}>
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                                <img
                                    src={(typeof productDetails.invoiceFileName === 'string' && productDetails.invoiceFileName.startsWith('http')) ? productDetails.invoiceFileName : `http://localhost:3000/uploads/${productDetails.invoiceFileName}`}
                                    alt="Invoice"
                                    className="w-full h-full object-cover"
                                    onLoad={() => {
                                        const loader = document.getElementById(`details-invoice-loader-${warranty.id}`);
                                        if (loader) loader.style.display = 'none';
                                    }}
                                    onError={() => {
                                        const loader = document.getElementById(`details-invoice-loader-${warranty.id}`);
                                        if (loader) loader.style.display = 'none';
                                    }}
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
                                    <a
                                        href={(typeof productDetails.invoiceFileName === 'string' && productDetails.invoiceFileName.startsWith('http')) ? productDetails.invoiceFileName : `http://localhost:3000/uploads/${productDetails.invoiceFileName}`}
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

                </div>
            </div>
            <div>
                <h3 className="text-lg font-semibold mb-3 pb-2 border-b">Vehicle Information</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-muted-foreground">Make</p>
                        <p className="font-medium capitalize">{warranty.car_make}</p>
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
                            <p className="font-medium break-all">{productDetails.storeEmail || warranty.installer_contact}</p>
                        </div>
                        <div className="hidden md:block">
                            <p className="text-sm text-muted-foreground">Store Phone</p>
                            <p className="font-medium">{productDetails.storePhone || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Applicator</p>
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

        </div>
    );
};

interface AdminWarrantyListProps {
    items: any[];
    showRejectionReason?: boolean;
    showActions?: boolean;
    processingWarranty?: string | null;
    onApprove?: (warrantyId: string) => void;
    onReject?: (warrantyId: string) => void;
}

export const AdminWarrantyList = ({
    items,
    showRejectionReason = false,
    showActions = true,
    processingWarranty,
    onApprove,
    onReject
}: AdminWarrantyListProps) => {
    const [selectedWarranty, setSelectedWarranty] = useState<any>(null);

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

                // Calculate warranty expiration
                const { expirationDate, daysLeft, isExpired } = getWarrantyExpiration(warranty.created_at, warranty.warranty_type);

                return (
                    <Card key={warranty.uid || warranty.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4 md:p-6">
                            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4 relative">
                                {/* Product Icon - Hidden on mobile */}
                                <div className={cn(
                                    "hidden md:flex h-12 w-12 rounded-full items-center justify-center shrink-0 border mr-4",
                                    warranty.product_type === 'seat-cover' ? "bg-blue-500/10 border-blue-500/20" : "bg-purple-500/10 border-purple-500/20"
                                )}>
                                    <img
                                        src={warranty.product_type === 'seat-cover' ? "/seat-cover-icon.png" : "/ppf-icon.png"}
                                        alt={warranty.product_type}
                                        className="w-6 h-6 object-contain"
                                    />
                                </div>
                                <div className="flex-1 w-full md:w-auto">
                                    <div className="flex items-start justify-between w-full">
                                        <div className="flex flex-col">
                                            <h3 className="text-base md:text-lg font-bold uppercase tracking-wide pr-8 md:pr-0">
                                                {productName.replace(/-/g, ' ')}
                                            </h3>
                                            {/* Mobile: Show Customer Name here */}
                                            <p className="md:hidden text-sm font-medium text-slate-700 mt-1 flex items-center gap-1">
                                                <User className="h-3 w-3" /> {warranty.customer_name}
                                            </p>
                                        </div>

                                        {/* Mobile Eye Button - Triggers details sheet */}
                                        <div className="md:hidden">
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-8 w-8 text-slate-500"
                                                onClick={() => setSelectedWarranty(warranty)}
                                            >
                                                <Eye className="h-5 w-5" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Desktop Dates */}
                                    <p className="hidden md:block text-sm text-muted-foreground mt-1">
                                        Registered on {formatToIST(warranty.created_at).split(',')[0]}
                                    </p>
                                    {warranty.status === 'validated' && expirationDate && (
                                        <p className="hidden md:block text-sm text-muted-foreground mt-0.5">
                                            Expires on {formatToIST(expirationDate).split(',')[0]}
                                        </p>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 mt-2 md:mt-0">
                                    {warranty.status === 'validated' && expirationDate && (
                                        <span className={cn("hidden md:inline text-sm font-medium", isExpired ? "text-destructive" : "text-green-600")}>
                                            {isExpired ? "Expired" : `${daysLeft} days left`}
                                        </span>
                                    )}
                                    <Badge variant={
                                        warranty.status === 'validated' ? 'default' :
                                            warranty.status === 'rejected' ? 'destructive' : 'secondary'
                                    } className={cn(
                                        "text-xs md:text-sm px-2 py-0.5 md:px-2.5 md:py-0.5",
                                        warranty.status === 'validated' && "bg-green-600 hover:bg-green-700",
                                        warranty.status === 'rejected' && "bg-red-600 hover:bg-red-700",
                                        warranty.status === 'pending' && "bg-yellow-600 hover:bg-yellow-700 text-white",
                                        warranty.status === 'pending_vendor' && "bg-orange-600 hover:bg-orange-700 text-white"
                                    )}>
                                        {warranty.status === 'validated' ? 'Approved' :
                                            warranty.status === 'rejected' ? 'Disapproved' :
                                                warranty.status === 'pending_vendor' ? 'Waiting Vendor' : 'Pending'}
                                    </Badge>
                                </div>
                            </div>

                            {/* Mobile: Grid is hidden or highly simplified. User said "Too detailed".
                                So on Mobile, we HIDE the entire grid below?
                                And rely ONLY on the Eye button?
                                YES. "Show only necessary details and show an eye button".
                            */}
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mt-4 pt-4 border-t hidden md:grid">
                                {/* Desktop Grid Content (Unchanged) */}

                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">Customer</p>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div className="cursor-pointer hover:bg-muted/50 p-1.5 -m-1.5 rounded-md transition-colors">
                                                    <h3 className="text-sm font-medium flex items-center gap-1">
                                                        <User className="h-4 w-4 text-blue-600" />
                                                        {warranty.customer_name}
                                                    </h3>
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent side="bottom" className="max-w-xs p-3">
                                                <div className="space-y-2">
                                                    <p className="font-semibold text-sm border-b pb-1">Customer Details</p>
                                                    <div className="text-xs space-y-1.5">
                                                        <div className="flex items-center gap-2">
                                                            <User className="h-3 w-3 text-muted-foreground" />
                                                            <span>{warranty.customer_name}</span>
                                                        </div>
                                                        {warranty.customer_email && (
                                                            <div className="flex items-center gap-2">
                                                                <Mail className="h-3 w-3 text-muted-foreground" />
                                                                <span>{warranty.customer_email}</span>
                                                            </div>
                                                        )}
                                                        {warranty.customer_phone && (
                                                            <div className="flex items-center gap-2">
                                                                <Phone className="h-3 w-3 text-muted-foreground" />
                                                                <span>{warranty.customer_phone}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>


                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">
                                        {warranty.status === 'pending_vendor' ? 'Installer' : 'Verified By'}
                                    </p>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div className="text-sm cursor-pointer hover:bg-muted/50 p-1.5 -m-1.5 rounded-md transition-colors">
                                                    <p className="font-medium flex items-center gap-1.5">
                                                        <Store className="h-4 w-4 text-purple-600" />
                                                        {warranty.vendor_store_name || productDetails.storeName || 'N/A'}
                                                    </p>
                                                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium mt-1 bg-purple-100 text-purple-800">
                                                        Franchise
                                                    </span>
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent side="bottom" className="max-w-xs p-3">
                                                <div className="space-y-2">
                                                    <p className="font-semibold text-sm border-b pb-1">
                                                        {warranty.status === 'pending_vendor' ? 'Installer Details' : 'Verified By Details'}
                                                    </p>
                                                    <div className="text-xs space-y-1.5">
                                                        <div className="flex items-center gap-2">
                                                            <User className="h-3 w-3 text-muted-foreground" />
                                                            <span>
                                                                {productDetails.manpowerName ||
                                                                    warranty.manpower_name_from_db ||
                                                                    productDetails.installerName ||
                                                                    'Not specified'}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Store className="h-3 w-3 text-muted-foreground" />
                                                            <span>{warranty.vendor_store_name || productDetails.storeName || 'N/A'}</span>
                                                        </div>
                                                        {(productDetails.storeEmail || warranty.installer_contact) && (
                                                            <div className="flex items-center gap-2">
                                                                <Mail className="h-3 w-3 text-muted-foreground" />
                                                                <span>{productDetails.storeEmail || warranty.installer_contact}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>

                                {warranty.product_type === 'seat-cover' && (
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Serial Number</p>
                                        <p className="font-mono text-sm font-semibold">{warranty.uid || productDetails.uid || 'N/A'}</p>
                                    </div>
                                )}

                                {warranty.product_type !== 'seat-cover' && (
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Serial Number</p>
                                        <p className="font-mono text-sm font-semibold">{productDetails.serialNumber || warranty.uid || 'N/A'}</p>
                                    </div>
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
                                    <p className="text-sm font-medium capitalize">{warranty.car_make} {warranty.car_model}</p>

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
                                                                <div className="border rounded-lg p-4 bg-muted/50 relative">
                                                                    <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-lg" id={`invoice-loader-${warranty.id}`}>
                                                                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                                                    </div>
                                                                    <img
                                                                        src={(typeof invoiceFile === 'string' && invoiceFile.startsWith('http')) ? invoiceFile : `http://localhost:3000/uploads/${invoiceFile}`}
                                                                        alt="Invoice"
                                                                        className="w-full h-auto rounded"
                                                                        onLoad={(e) => {
                                                                            const loader = document.getElementById(`invoice-loader-${warranty.id}`);
                                                                            if (loader) loader.style.display = 'none';
                                                                        }}
                                                                        onError={(e) => {
                                                                            const loader = document.getElementById(`invoice-loader-${warranty.id}`);
                                                                            if (loader) loader.style.display = 'none';
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
                                                                        const fileUrl = (typeof invoiceFile === 'string' && invoiceFile.startsWith('http')) ? invoiceFile : `http://localhost:3000/uploads/${invoiceFile}`;
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
                                            <WarrantyDetailsView
                                                warranty={warranty}
                                                productName={productName}
                                                productDetails={productDetails}
                                            />
                                        </DialogContent>
                                    </Dialog>
                                </div>
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
                                                    {processingWarranty === (warranty.uid || warranty.id) ? (
                                                        <Loader2 className="h-3 w-3 animate-spin" />
                                                    ) : (
                                                        <Check className="h-3 w-3" />
                                                    )}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => onReject(warranty.uid || warranty.id)}
                                                    disabled={processingWarranty === (warranty.uid || warranty.id)}
                                                >
                                                    {processingWarranty === (warranty.uid || warranty.id) ? (
                                                        <Loader2 className="h-3 w-3 animate-spin" />
                                                    ) : (
                                                        <X className="h-3 w-3" />
                                                    )}
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
                                                {processingWarranty === (warranty.uid || warranty.id) ? (
                                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                                ) : (
                                                    <X className="h-3 w-3 mr-1" />
                                                )}
                                                Reject
                                            </Button>
                                        )}
                                        {warranty.status === 'rejected' && (
                                            <span className="text-xs text-muted-foreground">Must be resubmitted</span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                );
            })}


            {/* Mobile Details Sheet */}
            <WarrantySpecSheet
                isOpen={!!selectedWarranty}
                onClose={() => setSelectedWarranty(null)}
                warranty={selectedWarranty}
                isMobile={true}
            />
        </div >
    );
};
