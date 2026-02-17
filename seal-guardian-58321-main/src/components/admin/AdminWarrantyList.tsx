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
                    <Card key={warranty.uid || warranty.id} className="hover:shadow-sm transition-shadow border-slate-200">
                        <CardContent className="p-3 md:p-4">
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
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-base md:text-lg font-bold uppercase tracking-wide">
                                                    {productName.replace(/-/g, ' ')}
                                                </h3>
                                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] px-2 py-0.5 h-5 whitespace-nowrap">
                                                    {warranty.warranty_type || '1 Year'}
                                                </Badge>
                                            </div>
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
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-3 pt-3 border-t hidden md:grid">
                                {/* Desktop Grid Content (Unchanged) */}

                                <div>
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Customer</p>
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
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
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
                                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Serial Number</p>
                                        <p className="font-mono text-sm font-semibold">{warranty.uid || productDetails.uid || 'N/A'}</p>
                                    </div>
                                )}

                                {warranty.product_type !== 'seat-cover' && (
                                    <div>
                                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Serial Number</p>
                                        <p className="font-mono text-sm font-semibold">{productDetails.serialNumber || warranty.uid || 'N/A'}</p>
                                    </div>
                                )}







                                <div>
                                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Invoice</p>
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" size="sm" className="h-7 text-xs w-full border-slate-200">
                                                <FileText className="h-3 w-3 mr-1.5" />
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
                                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Details</p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-xs w-full border-slate-200"
                                        onClick={() => setSelectedWarranty(warranty)}
                                    >
                                        <Eye className="h-3 w-3 mr-1.5" />
                                        View
                                    </Button>
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


            {/* Details Sheet (Desktop & Mobile) */}
            <WarrantySpecSheet
                isOpen={!!selectedWarranty}
                onClose={() => setSelectedWarranty(null)}
                warranty={selectedWarranty}
                isMobile={false} // Adapted for unified view
            />
        </div >
    );
};
