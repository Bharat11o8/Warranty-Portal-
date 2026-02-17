import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Download, FileText, ExternalLink, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, getWarrantyExpiration, formatToIST } from "@/lib/utils";

interface WarrantySpecSheetProps {
    isOpen: boolean;
    onClose: () => void;
    warranty: any;
    isMobile?: boolean;
}

export const WarrantySpecSheet = ({ isOpen, onClose, warranty }: WarrantySpecSheetProps) => {
    if (!warranty) return null;

    const toTitleCase = (str: string) => {
        if (!str) return str;
        return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
    };

    const productDetails = typeof warranty.product_details === 'string'
        ? JSON.parse(warranty.product_details || '{}')
        : warranty.product_details || {};

    const productNameMapping: Record<string, string> = {
        'paint-protection': 'Paint Protection Films',
        'sun-protection': 'Sun Protection Films',
    };

    const rawProductName = productDetails.product || productDetails.productName || warranty.product_type;
    const productName = productNameMapping[rawProductName] || toTitleCase(rawProductName);

    // Helper for Data Rows
    const SpecRow = ({ label, value, mono = false }: { label: string, value: string | React.ReactNode, mono?: boolean }) => (
        <div className="flex justify-between items-center py-3 border-b border-orange-100 last:border-0 hover:bg-orange-50/50 px-3 rounded-lg transition-colors">
            <span className="text-sm text-muted-foreground font-medium">{label}</span>
            <span className={cn("text-sm text-foreground text-right", mono && "font-mono tracking-tight")}>{value || "N/A"}</span>
        </div>
    );

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent side="bottom" className="h-[85vh] rounded-t-[24px] p-0 overflow-hidden flex flex-col bg-white border-t border-orange-200">
                {/* Header Section */}
                <div className="p-6 pb-4 border-b border-orange-100 bg-gradient-to-r from-orange-50 to-white">
                    <div className="w-12 h-1.5 bg-orange-300 rounded-full mx-auto mb-6" /> {/* Drag Handle */}
                    <SheetHeader className="text-left space-y-1">
                        <div className="flex items-center justify-between">
                            <Badge variant="outline" className="uppercase tracking-widest text-[10px] py-0.5 px-2.5 border-orange-200 text-orange-600 bg-orange-50 font-semibold">
                                Warranty Details
                            </Badge>
                            <Badge variant={warranty.status === 'validated' ? 'default' : 'secondary'} className={cn(
                                "capitalize shadow-sm font-semibold",
                                warranty.status === 'validated' && "bg-green-100 text-green-700 hover:bg-green-100 border-green-200",
                                warranty.status === 'pending' && "bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200",
                                warranty.status === 'pending_vendor' && "bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200",
                                warranty.status === 'rejected' && "bg-red-100 text-red-700 hover:bg-red-100 border-red-200"
                            )}>
                                {warranty.status === 'validated' ? 'Approved' :
                                    warranty.status === 'pending_vendor' ? 'In Review' :
                                        warranty.status === 'pending' ? 'Pending' :
                                            warranty.status}
                            </Badge>
                        </div>
                        <SheetTitle className="text-2xl font-bold tracking-tight text-foreground/90">
                            {warranty.registration_number || productDetails.carRegistration || 'N/A'}
                        </SheetTitle>
                        <SheetDescription className="text-muted-foreground font-medium">
                            {productName.replace(/-/g, ' ')} • {warranty.warranty_type} Warranty
                        </SheetDescription>
                    </SheetHeader>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Rejection Reason - Highlighted at top if rejected */}
                    {warranty.status === 'rejected' && warranty.rejection_reason && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-500">
                            <h4 className="text-xs font-bold text-red-500 uppercase tracking-widest mb-3 pl-1 flex items-center gap-2">
                                <div className="w-1 h-4 bg-red-500 rounded-full" />
                                Rejection Information
                            </h4>
                            <div className="bg-red-50/50 border border-red-100 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
                                <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                                <div className="min-w-0">
                                    <p className="text-[10px] font-black text-red-700/50 uppercase tracking-widest mb-1">Reason for Rejection</p>
                                    <p className="text-sm font-bold text-red-600 italic leading-relaxed">{warranty.rejection_reason}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Product & Car Details */}
                    <div className="space-y-1">
                        <h4 className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-3 pl-1 flex items-center gap-2">
                            <div className="w-1 h-4 bg-gradient-to-b from-orange-500 to-orange-400 rounded-full" />
                            Vehicle & Product
                        </h4>
                        <div className="bg-white rounded-xl p-2 border border-orange-100 shadow-sm">
                            <SpecRow label="Registration Number" value={warranty.registration_number || productDetails.carRegistration || "N/A"} mono />
                            {(warranty.car_make && String(warranty.car_make).toLowerCase() !== 'null' || warranty.car_model && String(warranty.car_model).toLowerCase() !== 'null') && (
                                <SpecRow label="Make & Model" value={`${toTitleCase(warranty.car_make || '')} ${toTitleCase(warranty.car_model || '')}`} />
                            )}
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
                                    <SpecRow label="Serial Number" value={productDetails.serialNumber || warranty.uid || "N/A"} mono />
                                    <SpecRow label="Installation Area" value={productDetails.installArea || "N/A"} />
                                </>
                            )}
                        </div>
                    </div>

                    {/* Customer Details */}
                    <div className="space-y-1">
                        <h4 className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-3 pl-1 flex items-center gap-2">
                            <div className="w-1 h-4 bg-gradient-to-b from-orange-500 to-orange-400 rounded-full" />
                            Customer Details
                        </h4>
                        <div className="bg-white rounded-xl p-2 border border-orange-100 shadow-sm">
                            <SpecRow label="Customer Name" value={toTitleCase(warranty.customer_name || productDetails.customerName) || "N/A"} />
                            <SpecRow label="Customer Email" value={warranty.customer_email || productDetails.customerEmail || "N/A"} />
                            <SpecRow label="Customer Phone" value={warranty.customer_phone || productDetails.customerPhone || "N/A"} />
                        </div>
                    </div>

                    {/* Key Dates */}
                    <div className="space-y-1">
                        <h4 className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-3 pl-1 flex items-center gap-2">
                            <div className="w-1 h-4 bg-gradient-to-b from-orange-500 to-orange-400 rounded-full" />
                            Important Dates
                        </h4>
                        <div className="bg-white rounded-xl p-2 border border-orange-100 shadow-sm">
                            <SpecRow label="Purchase Date" value={formatToIST(warranty.purchase_date).split(',')[0]} />
                            <SpecRow label="Registered Date" value={formatToIST(warranty.created_at).split(',')[0]} />
                            {warranty.status === 'validated' && (
                                <>
                                    {warranty.validated_at && (
                                        <SpecRow label="Approved Date" value={formatToIST(warranty.validated_at).split(',')[0]} />
                                    )}
                                    <SpecRow
                                        label="Expiration Date"
                                        value={formatToIST(getWarrantyExpiration(warranty.validated_at || warranty.created_at, warranty.warranty_type).expirationDate).split(',')[0]}
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
                        <h4 className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-3 pl-1 flex items-center gap-2">
                            <div className="w-1 h-4 bg-gradient-to-b from-orange-500 to-orange-400 rounded-full" />
                            Installer Details
                        </h4>
                        <div className="bg-white rounded-xl p-2 border border-orange-100 shadow-sm">
                            <SpecRow label="Store Name" value={productDetails.storeName || warranty.installer_name} />
                            <SpecRow
                                label="Store Email"
                                value={productDetails.storeEmail || (warranty.installer_contact?.includes('|') ? warranty.installer_contact.split('|')[0].trim() : warranty.installer_contact) || "N/A"}
                            />
                            <div className="hidden md:block">
                                <SpecRow
                                    label="Store Phone"
                                    value={productDetails.storePhone || warranty.vendor_phone_number || 'N/A'}
                                />
                            </div>
                            <SpecRow label="Applicator" value={productDetails.manpowerName || warranty.manpower_name_from_db || "Standard"} />
                        </div>
                    </div>

                    {/* EV/PPF: Dealer Address */}
                    {warranty.product_type === 'ev-products' && productDetails.dealerAddress && (
                        <div className="space-y-1">
                            <h4 className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-3 pl-1 flex items-center gap-2">
                                <div className="w-1 h-4 bg-gradient-to-b from-orange-500 to-orange-400 rounded-full" />
                                Dealer Information
                            </h4>
                            <div className="bg-white rounded-xl p-3 border border-orange-100 shadow-sm">
                                <p className="text-sm text-foreground">{productDetails.dealerAddress}</p>
                            </div>
                        </div>
                    )}

                    {/* Documents Section - Seat Cover: Invoice */}
                    {warranty.product_type === 'seat-cover' && productDetails.invoiceFileName && (
                        <div className="space-y-1">
                            <h4 className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-3 pl-1 flex items-center gap-2">
                                <div className="w-1 h-4 bg-gradient-to-b from-orange-500 to-orange-400 rounded-full" />
                                Documentation
                            </h4>
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
                            <h4 className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-3 pl-1 flex items-center gap-2">
                                <div className="w-1 h-4 bg-gradient-to-b from-orange-500 to-orange-400 rounded-full" />
                                Installation Photos
                            </h4>
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
                <div className="p-6 border-t border-orange-100 bg-gradient-to-r from-orange-50/50 to-white">
                    <Button className="w-full h-12 text-base font-semibold border-2 border-orange-200 text-orange-600 bg-white hover:bg-orange-50 hover:border-orange-300 transition-all rounded-xl" onClick={onClose} variant="outline">Done</Button>
                </div>
            </SheetContent>
        </Sheet>
    );
};
