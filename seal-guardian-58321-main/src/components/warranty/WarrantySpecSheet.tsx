import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Download, FileText, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, getWarrantyExpiration } from "@/lib/utils";

interface WarrantySpecSheetProps {
    isOpen: boolean;
    onClose: () => void;
    warranty: any;
    isMobile?: boolean;
}

export const WarrantySpecSheet = ({ isOpen, onClose, warranty }: WarrantySpecSheetProps) => {
    if (!warranty) return null;

    const productDetails = typeof warranty.product_details === 'string'
        ? JSON.parse(warranty.product_details || '{}')
        : warranty.product_details || {};

    const productNameMapping: Record<string, string> = {
        'paint-protection': 'Paint Protection Films',
        'sun-protection': 'Sun Protection Films',
    };

    const rawProductName = productDetails.product || productDetails.productName || warranty.product_type;
    const productName = productNameMapping[rawProductName] || rawProductName;

    // Helper for Data Rows
    const SpecRow = ({ label, value, mono = false }: { label: string, value: string | React.ReactNode, mono?: boolean }) => (
        <div className="flex justify-between items-center py-3 border-b border-border/50 last:border-0 hover:bg-muted/30 px-2 rounded-sm transition-colors">
            <span className="text-sm text-muted-foreground font-medium">{label}</span>
            <span className={cn("text-sm text-foreground text-right", mono && "font-mono tracking-tight")}>{value || "N/A"}</span>
        </div>
    );

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent side="bottom" className="h-[85vh] rounded-t-[20px] p-0 overflow-hidden flex flex-col bg-background/95 backdrop-blur-xl border-t border-white/10">
                {/* Header Section */}
                <div className="p-6 pb-4 border-b border-border/40 bg-muted/20">
                    <div className="w-12 h-1 bg-muted-foreground/20 rounded-full mx-auto mb-6" /> {/* Drag Handle */}
                    <SheetHeader className="text-left space-y-1">
                        <div className="flex items-center justify-between">
                            <Badge variant="outline" className="uppercase tracking-widest text-[10px] py-0.5 px-2 border-primary/20 text-primary/80 bg-primary/5">
                                Warranty Details
                            </Badge>
                            <Badge variant={warranty.status === 'validated' ? 'default' : 'secondary'} className={cn(
                                "capitalize shadow-sm",
                                warranty.status === 'validated' && "bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20 shadow-green-500/5",
                                (warranty.status === 'pending' || warranty.status === 'pending_vendor') && "bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20 border-yellow-500/20 shadow-yellow-500/5",
                                warranty.status === 'rejected' && "bg-red-500/10 text-red-600 hover:bg-red-500/20 border-red-500/20 shadow-red-500/5"
                            )}>
                                {warranty.status === 'validated' ? 'Approved' :
                                    warranty.status === 'pending_vendor' ? 'Pending' :
                                        warranty.status === 'pending' ? 'Pending' :
                                            warranty.status}
                            </Badge>
                        </div>
                        <SheetTitle className="text-2xl font-bold tracking-tight text-foreground/90">
                            {productName.replace(/-/g, ' ')}
                        </SheetTitle>
                        <SheetDescription className="text-muted-foreground font-medium">
                            {warranty.warranty_type} Warranty • {warranty.car_make} {warranty.car_model}
                        </SheetDescription>
                    </SheetHeader>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                    {/* Product & Car Details */}
                    <div className="space-y-1">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3 pl-1">Vehicle & Product</h4>
                        <div className="bg-muted/20 rounded-lg p-2 border border-border/40">
                            <SpecRow label="Make & Model" value={`${warranty.car_make} ${warranty.car_model}`} />
                            <SpecRow label="Product Name" value={productName} />
                            <SpecRow label="Warranty Type" value={warranty.warranty_type} />

                            {/* Seat Cover Specific Fields */}
                            {warranty.product_type === 'seat-cover' && (
                                <>
                                    <SpecRow label="UID" value={warranty.uid || productDetails.uid || "N/A"} mono />
                                </>
                            )}

                            {/* EV/PPF Specific Fields */}
                            {warranty.product_type === 'ev-products' && (
                                <>
                                    <SpecRow label="Lot Number" value={productDetails.lotNumber || "N/A"} mono />
                                    <SpecRow label="Roll Number" value={productDetails.rollNumber || "N/A"} mono />
                                    <SpecRow label="Installation Area" value={productDetails.installArea || "N/A"} />
                                    <SpecRow label="Vehicle Registration" value={productDetails.carRegistration || warranty.registration_number || "N/A"} mono />
                                </>
                            )}
                        </div>
                    </div>

                    {/* Customer Details */}
                    <div className="space-y-1">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3 pl-1">Customer Details</h4>
                        <div className="bg-muted/20 rounded-lg p-2 border border-border/40">
                            <SpecRow label="Customer Name" value={warranty.customer_name || productDetails.customerName || "N/A"} />
                            <SpecRow label="Customer Email" value={warranty.customer_email || productDetails.customerEmail || "N/A"} />
                            <SpecRow label="Customer Phone" value={warranty.customer_phone || productDetails.customerPhone || "N/A"} />
                        </div>
                    </div>

                    {/* Key Dates */}
                    <div className="space-y-1">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3 pl-1">Important Dates</h4>
                        <div className="bg-muted/20 rounded-lg p-2 border border-border/40">
                            <SpecRow label="Purchase Date" value={new Date(warranty.purchase_date).toLocaleDateString()} />
                            <SpecRow label="Registered Date" value={new Date(warranty.created_at).toLocaleDateString()} />
                            {warranty.status === 'validated' && (
                                <>
                                    {warranty.validated_at && (
                                        <SpecRow label="Approved Date" value={new Date(warranty.validated_at).toLocaleDateString()} />
                                    )}
                                    <SpecRow
                                        label="Expiration Date"
                                        value={getWarrantyExpiration(warranty.validated_at || warranty.created_at, warranty.warranty_type).expirationDate?.toLocaleDateString() || "N/A"}
                                    />
                                    <div className="flex justify-between items-center py-3 px-2 rounded-sm bg-green-500/5 mt-1 border border-green-500/10">
                                        <span className="text-sm text-green-700 font-medium">Days Remaining</span>
                                        <span className="text-sm text-green-700 font-bold">
                                            {getWarrantyExpiration(warranty.validated_at || warranty.created_at, warranty.warranty_type).daysLeft} Days
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Store / Installer Info */}
                    <div className="space-y-1">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3 pl-1">Installer Details</h4>
                        <div className="bg-muted/20 rounded-lg p-2 border border-border/40">
                            <SpecRow label="Store Name" value={productDetails.storeName || warranty.installer_name} />
                            <SpecRow
                                label="Store Email"
                                value={productDetails.storeEmail || (warranty.installer_contact?.includes('|') ? warranty.installer_contact.split('|')[0].trim() : warranty.installer_contact) || "N/A"}
                            />
                            <SpecRow
                                label="Store Phone"
                                value={productDetails.dealerMobile || (warranty.installer_contact?.includes('|') ? warranty.installer_contact.split('|')[1].trim() : "") || "N/A"}
                            />
                            <SpecRow label="Applicator" value={productDetails.manpowerName || warranty.manpower_name_from_db || "Standard"} />
                        </div>
                    </div>

                    {/* EV/PPF: Dealer Address */}
                    {warranty.product_type === 'ev-products' && productDetails.dealerAddress && (
                        <div className="space-y-1">
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3 pl-1">Dealer Information</h4>
                            <div className="bg-muted/20 rounded-lg p-3 border border-border/40">
                                <p className="text-sm text-foreground">{productDetails.dealerAddress}</p>
                            </div>
                        </div>
                    )}

                    {/* Documents Section - Seat Cover: Invoice */}
                    {warranty.product_type === 'seat-cover' && productDetails.invoiceFileName && (
                        <div className="space-y-1">
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3 pl-1">Documentation</h4>
                            <Button variant="outline" className="w-full justify-between h-12 bg-background/50 hover:bg-blue-50 hover:border-blue-200 border-input/50 transition-colors" onClick={() => {
                                const url = typeof productDetails.invoiceFileName === 'string' && productDetails.invoiceFileName.startsWith('http')
                                    ? productDetails.invoiceFileName
                                    : `http://localhost:3000/uploads/${productDetails.invoiceFileName}`;
                                window.open(url, '_blank');
                            }}>
                                <span className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-blue-600" />
                                    <span className="text-blue-700">View Invoice / MRP Sticker</span>
                                </span>
                                <ExternalLink className="h-4 w-4 text-blue-500" />
                            </Button>
                        </div>
                    )}

                    {/* Documents Section - EV/PPF: Photo Links */}
                    {warranty.product_type === 'ev-products' && productDetails.photos && (
                        <div className="space-y-1">
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3 pl-1">Installation Photos</h4>
                            <div className="grid grid-cols-2 gap-2">
                                {productDetails.photos.lhs && (
                                    <Button variant="outline" size="sm" className="justify-between h-10 bg-background/50 hover:bg-blue-50 hover:border-blue-200 border-input/50 transition-colors" onClick={() => window.open(productDetails.photos.lhs, '_blank')}>
                                        <span className="flex items-center gap-2">
                                            <FileText className="h-3 w-3 text-blue-600" />
                                            <span className="text-blue-700 text-xs">LHS View</span>
                                        </span>
                                        <ExternalLink className="h-3 w-3 text-blue-500" />
                                    </Button>
                                )}
                                {productDetails.photos.rhs && (
                                    <Button variant="outline" size="sm" className="justify-between h-10 bg-background/50 hover:bg-blue-50 hover:border-blue-200 border-input/50 transition-colors" onClick={() => window.open(productDetails.photos.rhs, '_blank')}>
                                        <span className="flex items-center gap-2">
                                            <FileText className="h-3 w-3 text-blue-600" />
                                            <span className="text-blue-700 text-xs">RHS View</span>
                                        </span>
                                        <ExternalLink className="h-3 w-3 text-blue-500" />
                                    </Button>
                                )}
                                {productDetails.photos.frontReg && (
                                    <Button variant="outline" size="sm" className="justify-between h-10 bg-background/50 hover:bg-blue-50 hover:border-blue-200 border-input/50 transition-colors" onClick={() => window.open(productDetails.photos.frontReg, '_blank')}>
                                        <span className="flex items-center gap-2">
                                            <FileText className="h-3 w-3 text-blue-600" />
                                            <span className="text-blue-700 text-xs">Front Reg</span>
                                        </span>
                                        <ExternalLink className="h-3 w-3 text-blue-500" />
                                    </Button>
                                )}
                                {productDetails.photos.backReg && (
                                    <Button variant="outline" size="sm" className="justify-between h-10 bg-background/50 hover:bg-blue-50 hover:border-blue-200 border-input/50 transition-colors" onClick={() => window.open(productDetails.photos.backReg, '_blank')}>
                                        <span className="flex items-center gap-2">
                                            <FileText className="h-3 w-3 text-blue-600" />
                                            <span className="text-blue-700 text-xs">Back Reg</span>
                                        </span>
                                        <ExternalLink className="h-3 w-3 text-blue-500" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Documentation Section - EV/PPF: Invoice */}
                    {warranty.product_type === 'ev-products' && productDetails.photos?.warranty && (
                        <div className="space-y-1">
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3 pl-1">Documentation</h4>
                            <Button variant="outline" className="w-full justify-between h-12 bg-background/50 hover:bg-blue-50 hover:border-blue-200 border-input/50 transition-colors" onClick={() => window.open(productDetails.photos.warranty, '_blank')}>
                                <span className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-blue-600" />
                                    <span className="text-blue-700">View Invoice</span>
                                </span>
                                <ExternalLink className="h-4 w-4 text-blue-500" />
                            </Button>
                        </div>
                    )}

                </div>
                {/* Footer Area (Close) */}
                <div className="p-6 border-t border-border/40 bg-background/95 backdrop-blur">
                    <Button className="w-full h-12 text-base font-medium border-2 hover:bg-muted/50 transition-all" onClick={onClose} variant="outline">Close</Button>
                </div>
            </SheetContent>
        </Sheet>
    );
};
