import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Download, FileText, ExternalLink, XCircle, Loader2, Pencil, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, getWarrantyExpiration, formatToIST } from "@/lib/utils";
import { useState, useEffect, createContext, useContext } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface WarrantySpecSheetProps {
    isOpen: boolean;
    onClose: () => void;
    warranty: any;
    isMobile?: boolean;
    isAdmin?: boolean;
    onRefresh?: () => void;
}

const EditContext = createContext<any>(null);

const SpecRow = ({ label, value, mono = false, editField }: { label: string, value: string | React.ReactNode, mono?: boolean, editField?: string }) => {
    const { isEditing, editData, setEditData, products } = useContext(EditContext);
    
    return (
        <div className="flex justify-between items-center py-3 border-b border-orange-100 last:border-0 hover:bg-orange-50/50 px-3 rounded-lg transition-colors">
            <span className="text-sm text-muted-foreground font-medium whitespace-nowrap mr-4">{label}</span>
            {isEditing && editField ? (
                editField === 'product_name' ? (
                    <Select value={editData.product_name} onValueChange={(val) => {
                        const selected = products.find((p: any) => p.name === val);
                        setEditData({ ...editData, product_name: val, warranty_type: selected?.warranty_years || editData.warranty_type });
                    }}>
                        <SelectTrigger className="w-[200px] h-8 text-sm"><SelectValue placeholder="Select Product" /></SelectTrigger>
                        <SelectContent>
                            {products.map((p: any) => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                ) : editField === 'warranty_type' ? (
                    <span className={cn("text-sm text-foreground text-right", mono && "font-mono tracking-tight")}>{editData[editField] || "N/A"}</span>
                ) : (
                    <Input 
                        type={editField === 'purchase_date' ? 'date' : 'text'}
                        value={editData[editField] || ''} 
                        onChange={e => setEditData({ ...editData, [editField]: e.target.value })} 
                        className="w-[200px] h-8 text-sm text-right bg-white"
                    />
                )
            ) : (
                <span className={cn("text-sm text-foreground text-right", mono && "font-mono tracking-tight")}>{value || "N/A"}</span>
            )}
        </div>
    );
};

export const WarrantySpecSheet = ({ isOpen, onClose, warranty, isAdmin, onRefresh }: WarrantySpecSheetProps) => {
    const { toast } = useToast();
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [products, setProducts] = useState<any[]>([]);
    const [editData, setEditData] = useState<any>({});

    useEffect(() => {
        if (!isOpen) setIsEditing(false);
    }, [isOpen]);

    useEffect(() => {
        if (isEditing && products.length === 0) {
            api.get('/public/products').then(res => {
                if (res.data.success) setProducts(res.data.products);
            }).catch(err => console.error("Failed to load products", err));
        }
        if (isEditing && warranty) {
            const pd = typeof warranty.product_details === 'string'
                ? JSON.parse(warranty.product_details || '{}')
                : warranty.product_details || {};
            setEditData({
                customer_name: warranty.customer_name || pd.customerName || '',
                customer_email: warranty.customer_email || pd.customerEmail || '',
                customer_phone: warranty.customer_phone || pd.customerPhone || '',
                car_make: warranty.car_make || '',
                car_model: warranty.car_model || '',
                registration_number: warranty.registration_number || pd.carRegistration || '',
                product_name: pd.product || pd.productName || '',
                warranty_type: warranty.warranty_type || '',
                purchase_date: warranty.purchase_date ? new Date(warranty.purchase_date).toISOString().split('T')[0] : ''
            });
        }
    }, [isEditing, warranty]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await api.put(`/admin/warranties/${warranty.uid}/details`, editData);
            if (res.data.success) {
                toast({ title: "Success", description: "Warranty details updated" });
                setIsEditing(false);
                if (onRefresh) onRefresh();
            }
        } catch (err: any) {
            toast({ title: "Error", description: err.response?.data?.error || "Failed to update details", variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

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

    const rawProductName = isEditing ? editData.product_name : (productDetails.product || productDetails.productName || warranty.product_type);
    const productName = productNameMapping[rawProductName || ''] || toTitleCase(rawProductName || '') || 'Unknown Product';



    return (
        <EditContext.Provider value={{ isEditing, editData, setEditData, products }}>
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
                            <div className="flex items-center gap-2">
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
                                                warranty.status === 'rejected' ? 'Action Required' :
                                                    warranty.status}
                                </Badge>
                                {isAdmin && (
                                    <>
                                        {isEditing ? (
                                            <div className="flex gap-1 ml-2">
                                                <Button size="sm" variant="outline" className="h-6 px-2 text-[10px] uppercase font-bold" onClick={() => setIsEditing(false)}>Cancel</Button>
                                                <Button size="sm" className="h-6 px-2 text-[10px] uppercase font-bold bg-orange-600 hover:bg-orange-700" onClick={handleSave} disabled={saving}>
                                                    {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Save className="h-3 w-3 mr-1" />} Save
                                                </Button>
                                            </div>
                                        ) : warranty.status !== 'validated' ? (
                                            <Button size="sm" variant="outline" className="h-6 px-2 text-[10px] uppercase font-bold ml-2 text-orange-600 border-orange-200 hover:bg-orange-50" onClick={() => setIsEditing(true)}>
                                                <Pencil className="h-3 w-3 mr-1" /> Edit
                                            </Button>
                                        ) : null}
                                    </>
                                )}
                            </div>
                        </div>
                        <SheetTitle className="text-2xl font-bold tracking-tight text-foreground/90">
                            {warranty.registration_number || productDetails.carRegistration || 'N/A'}
                        </SheetTitle>
                        <SheetDescription className="text-muted-foreground font-medium">
                            {(productName || '').replace(/-/g, ' ')} • {warranty.warranty_type} Warranty
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
                                Action Required
                            </h4>
                            <div className="bg-red-50/50 border border-red-100 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
                                <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                                <div className="min-w-0">
                                    <p className="text-[10px] font-black text-red-700/50 uppercase tracking-widest mb-1">Reviewer Remarks / Feedback</p>
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
                            <SpecRow label="Registration Number" value={warranty.registration_number || productDetails.carRegistration || "N/A"} mono editField="registration_number" />
                            {(warranty.car_make && String(warranty.car_make).toLowerCase() !== 'null' || warranty.car_model && String(warranty.car_model).toLowerCase() !== 'null') && (
                                <>
                                    <SpecRow label="Car Make" value={toTitleCase(warranty.car_make || '')} editField="car_make" />
                                    <SpecRow label="Car Model" value={toTitleCase(warranty.car_model || '')} editField="car_model" />
                                </>
                            )}
                            {warranty.product_type !== 'seat-cover' && (warranty.car_year || productDetails.carYear) && (
                                <SpecRow label="Vehicle Year" value={warranty.car_year || productDetails.carYear} />
                            )}
                            <SpecRow label="Product Name" value={productName} editField="product_name" />
                            <SpecRow label="Warranty Type" value={isEditing ? editData.warranty_type : warranty.warranty_type} editField="warranty_type" />

                            {/* Seat Cover Specific Fields */}
                            {warranty.product_type === 'seat-cover' && (
                                <>
                                    <SpecRow label="UID" value={warranty.uid || productDetails.uid || "N/A"} mono />
                                </>
                            )}

                            {/* EV/PPF Specific Fields */}
                            {warranty.product_type !== 'seat-cover' && (
                                <>
                                    <SpecRow label="Serial Number" value={productDetails.serialNumber || warranty.uid || "N/A"} mono />
                                    {productDetails.installArea && (
                                        <SpecRow label="Installation Area" value={productDetails.installArea} />
                                    )}
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
                            <SpecRow label="Customer Name" value={toTitleCase(warranty.customer_name || productDetails.customerName) || "N/A"} editField="customer_name" />
                            <SpecRow label="Customer Email" value={warranty.customer_email || productDetails.customerEmail || "N/A"} editField="customer_email" />
                            <SpecRow label="Customer Phone" value={warranty.customer_phone || productDetails.customerPhone || "N/A"} editField="customer_phone" />
                        </div>
                    </div>

                    {/* Key Dates */}
                    <div className="space-y-1">
                        <h4 className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-3 pl-1 flex items-center gap-2">
                            <div className="w-1 h-4 bg-gradient-to-b from-orange-500 to-orange-400 rounded-full" />
                            Important Dates
                        </h4>
                        <div className="bg-white rounded-xl p-2 border border-orange-100 shadow-sm">
                            <SpecRow label="Purchase Date" value={formatToIST(warranty.purchase_date).split(',')[0]} editField="purchase_date" />
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
                            Store Details
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
                                    value={productDetails.storePhone || warranty.vendor_phone_number || productDetails.dealerMobile || 'N/A'}
                                />
                            </div>
                            <div className="md:hidden">
                                {(productDetails.storePhone || warranty.vendor_phone_number || productDetails.dealerMobile) && (
                                    <SpecRow
                                        label="Store Phone"
                                        value={productDetails.storePhone || warranty.vendor_phone_number || productDetails.dealerMobile}
                                    />
                                )}
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

                    {/* Documents & Photos Section - Seat Cover */}
                    {warranty.product_type === 'seat-cover' && (
                        <div className="space-y-4">
                            {/* Documentation */}
                            {(productDetails.invoiceFileName || productDetails.photos?.warranty) && (
                                <div className="space-y-1">
                                    <h4 className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-3 pl-1 flex items-center gap-2">
                                        <div className="w-1 h-4 bg-gradient-to-b from-orange-500 to-orange-400 rounded-full" />
                                        Documentation
                                    </h4>
                                    <Button variant="outline" className="w-full justify-between h-12 bg-background/50 hover:bg-blue-50 hover:border-blue-200 border-input/50 transition-colors" onClick={() => {
                                        const file = productDetails.invoiceFileName || productDetails.photos?.warranty;
                                        const url = typeof file === 'string' && file.startsWith('http')
                                            ? file
                                            : `http://localhost:3000/uploads/${file}`;
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

                            {/* Installation Photos */}
                            {productDetails.photos && (
                                <div className="space-y-1">
                                    <h4 className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-3 pl-1 flex items-center gap-2">
                                        <div className="w-1 h-4 bg-gradient-to-b from-orange-500 to-orange-400 rounded-full" />
                                        Installation Photos
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {productDetails.photos.vehicle && (
                                            <Button variant="outline" size="sm" className="justify-between h-10 bg-background/50 hover:bg-orange-50 hover:border-orange-200 border-input/50 transition-colors" onClick={() => {
                                                const url = typeof productDetails.photos.vehicle === 'string' && productDetails.photos.vehicle.startsWith('http') ? productDetails.photos.vehicle : `http://localhost:3000/uploads/${productDetails.photos.vehicle}`;
                                                window.open(url, '_blank');
                                            }}>
                                                <span className="flex items-center gap-2">
                                                    <ExternalLink className="h-3 w-3 text-orange-600" />
                                                    <span className="text-orange-700 text-xs">Car Exterior with Number Plate</span>
                                                </span>
                                                <ExternalLink className="h-3 w-3 text-orange-500" />
                                            </Button>
                                        )}
                                        {productDetails.photos.seatCover && (
                                            <Button variant="outline" size="sm" className="justify-between h-10 bg-background/50 hover:bg-orange-50 hover:border-orange-200 border-input/50 transition-colors" onClick={() => {
                                                const url = typeof productDetails.photos.seatCover === 'string' && productDetails.photos.seatCover.startsWith('http') ? productDetails.photos.seatCover : `http://localhost:3000/uploads/${productDetails.photos.seatCover}`;
                                                window.open(url, '_blank');
                                            }}>
                                                <span className="flex items-center gap-2">
                                                    <ExternalLink className="h-3 w-3 text-orange-600" />
                                                    <span className="text-orange-700 text-xs">Seat Cover</span>
                                                </span>
                                                <ExternalLink className="h-3 w-3 text-orange-500" />
                                            </Button>
                                        )}
                                        {productDetails.photos.carOuter && (
                                            <Button variant="outline" size="sm" className="justify-between h-10 bg-background/50 hover:bg-orange-50 hover:border-orange-200 border-input/50 transition-colors" onClick={() => {
                                                const url = typeof productDetails.photos.carOuter === 'string' && productDetails.photos.carOuter.startsWith('http') ? productDetails.photos.carOuter : `http://localhost:3000/uploads/${productDetails.photos.carOuter}`;
                                                window.open(url, '_blank');
                                            }}>
                                                <span className="flex items-center gap-2">
                                                    <ExternalLink className="h-3 w-3 text-orange-600" />
                                                    <span className="text-orange-700 text-xs">Car Exterior</span>
                                                </span>
                                                <ExternalLink className="h-3 w-3 text-orange-500" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Documents & Photos Section - EV/PPF */}
                    {warranty.product_type === 'ev-products' && productDetails.photos && (
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <h4 className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-3 pl-1 flex items-center gap-2">
                                    <div className="w-1 h-4 bg-gradient-to-b from-orange-500 to-orange-400 rounded-full" />
                                    Installation Photos
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {productDetails.photos.lhs && (
                                        <Button variant="outline" size="sm" className="justify-between h-10 bg-background/50 hover:bg-blue-50 hover:border-blue-200 border-input/50 transition-colors" onClick={() => {
                                            const url = typeof productDetails.photos.lhs === 'string' && productDetails.photos.lhs.startsWith('http') ? productDetails.photos.lhs : `http://localhost:3000/uploads/${productDetails.photos.lhs}`;
                                            window.open(url, '_blank');
                                        }}>
                                            <span className="flex items-center gap-2">
                                                <FileText className="h-3 w-3 text-blue-600" />
                                                <span className="text-blue-700 text-xs">LHS View</span>
                                            </span>
                                            <ExternalLink className="h-3 w-3 text-blue-500" />
                                        </Button>
                                    )}
                                    {productDetails.photos.rhs && (
                                        <Button variant="outline" size="sm" className="justify-between h-10 bg-background/50 hover:bg-blue-50 hover:border-blue-200 border-input/50 transition-colors" onClick={() => {
                                            const url = typeof productDetails.photos.rhs === 'string' && productDetails.photos.rhs.startsWith('http') ? productDetails.photos.rhs : `http://localhost:3000/uploads/${productDetails.photos.rhs}`;
                                            window.open(url, '_blank');
                                        }}>
                                            <span className="flex items-center gap-2">
                                                <FileText className="h-3 w-3 text-blue-600" />
                                                <span className="text-blue-700 text-xs">RHS View</span>
                                            </span>
                                            <ExternalLink className="h-3 w-3 text-blue-500" />
                                        </Button>
                                    )}
                                    {productDetails.photos.frontReg && (
                                        <Button variant="outline" size="sm" className="justify-between h-10 bg-background/50 hover:bg-blue-50 hover:border-blue-200 border-input/50 transition-colors" onClick={() => {
                                            const url = typeof productDetails.photos.frontReg === 'string' && productDetails.photos.frontReg.startsWith('http') ? productDetails.photos.frontReg : `http://localhost:3000/uploads/${productDetails.photos.frontReg}`;
                                            window.open(url, '_blank');
                                        }}>
                                            <span className="flex items-center gap-2">
                                                <FileText className="h-3 w-3 text-blue-600" />
                                                <span className="text-blue-700 text-xs">Front Reg</span>
                                            </span>
                                            <ExternalLink className="h-3 w-3 text-blue-500" />
                                        </Button>
                                    )}
                                    {productDetails.photos.backReg && (
                                        <Button variant="outline" size="sm" className="justify-between h-10 bg-background/50 hover:bg-blue-50 hover:border-blue-200 border-input/50 transition-colors" onClick={() => {
                                            const url = typeof productDetails.photos.backReg === 'string' && productDetails.photos.backReg.startsWith('http') ? productDetails.photos.backReg : `http://localhost:3000/uploads/${productDetails.photos.backReg}`;
                                            window.open(url, '_blank');
                                        }}>
                                            <span className="flex items-center gap-2">
                                                <FileText className="h-3 w-3 text-blue-600" />
                                                <span className="text-blue-700 text-xs">Back Reg</span>
                                            </span>
                                            <ExternalLink className="h-3 w-3 text-blue-500" />
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Documentation */}
                            {productDetails.photos?.warranty && (
                                <div className="space-y-1">
                                    <h4 className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-3 pl-1 flex items-center gap-2">
                                        <div className="w-1 h-4 bg-gradient-to-b from-orange-500 to-orange-400 rounded-full" />
                                        Documentation
                                    </h4>
                                    <Button variant="outline" className="w-full justify-between h-12 bg-background/50 hover:bg-blue-50 hover:border-blue-200 border-input/50 transition-colors" onClick={() => {
                                        const url = typeof productDetails.photos.warranty === 'string' && productDetails.photos.warranty.startsWith('http') ? productDetails.photos.warranty : `http://localhost:3000/uploads/${productDetails.photos.warranty}`;
                                        window.open(url, '_blank');
                                    }}>
                                        <span className="flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-blue-600" />
                                            <span className="text-blue-700">View Invoice</span>
                                        </span>
                                        <ExternalLink className="h-4 w-4 text-blue-500" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}

                </div>
                {/* Footer Area (Close) */}
                <div className="p-6 border-t border-orange-100 bg-gradient-to-r from-orange-50/50 to-white">
                    <Button className="w-full h-12 text-base font-semibold border-2 border-orange-200 text-orange-600 bg-white hover:bg-orange-50 hover:border-orange-300 transition-all rounded-xl" onClick={onClose} variant="outline">Done</Button>
                </div>
            </SheetContent>
        </Sheet>
        </EditContext.Provider>
    );
};
