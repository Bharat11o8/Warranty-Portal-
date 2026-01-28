import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { MapPin, User, Mail, Phone, Download, Search, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AdminWarrantyList } from "@/components/admin/AdminWarrantyList";
import { formatWarrantyForExport, formatManpowerForExport } from "@/lib/adminExports";
import { downloadCSV, formatToIST, cn } from "@/lib/utils";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface AdminVendorDetailsProps {
    vendor: any;
    onBack: () => void;
}

export const AdminVendorDetails = ({ vendor: initialVendor, onBack }: AdminVendorDetailsProps) => {
    const { toast } = useToast();
    const [vendor, setVendor] = useState(initialVendor);
    const [activeTab, setActiveTab] = useState<'warranties' | 'manpower'>('warranties');
    const [isLoadingDetails, setIsLoadingDetails] = useState(true);

    // Fetch full details on mount
    useEffect(() => {
        const fetchDetails = async () => {
            setIsLoadingDetails(true);
            try {
                // Ensure we use the correct ID - relying on vendor.id (user_id) from the list
                const response = await api.get(`/admin/vendors/${initialVendor.id}`);
                if (response.data.success) {
                    setVendor(prev => ({
                        ...prev,
                        ...response.data.vendor,
                        warranties: response.data.warranties || [],
                        manpower: response.data.manpower || []
                    }));
                }
            } catch (error) {
                console.error("Failed to fetch vendor details:", error);
                toast({
                    title: "Error",
                    description: "Failed to load complete vendor details",
                    variant: "destructive"
                });
            } finally {
                setIsLoadingDetails(false);
            }
        };

        if (initialVendor?.id) {
            fetchDetails();
        }
    }, [initialVendor.id]);

    // Derived states
    const warranties = vendor.warranties || [];
    const manpowerList = vendor.manpower || [];

    // Warranties State
    const [warrantyFilter, setWarrantyFilter] = useState<'all' | 'validated' | 'rejected' | 'pending'>('all');
    const [warrantySearch, setWarrantySearch] = useState('');
    const [warrantySortField, setWarrantySortField] = useState<'created_at' | 'customer_name' | 'status' | 'product_type'>('created_at');
    const [warrantySortOrder, setWarrantySortOrder] = useState<'asc' | 'desc'>('desc');
    const [warrantyDateFrom, setWarrantyDateFrom] = useState('');
    const [warrantyDateTo, setWarrantyDateTo] = useState('');

    // Manpower State
    const [manpowerSearch, setManpowerSearch] = useState('');
    const [manpowerSortField, setManpowerSortField] = useState<'name' | 'points' | 'total_applications'>('name');
    const [manpowerSortOrder, setManpowerSortOrder] = useState<'asc' | 'desc'>('asc');

    // Processing State
    const [processingWarranty, setProcessingWarranty] = useState<string | null>(null);
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [selectedWarrantyId, setSelectedWarrantyId] = useState<string | null>(null);

    // Manpower Dialog State
    const [manpowerWarrantyDialogOpen, setManpowerWarrantyDialogOpen] = useState(false);
    const [manpowerWarrantyDialogData, setManpowerWarrantyDialogData] = useState<{ member: any; status: 'validated' | 'pending' | 'rejected'; warranties: any[] }>({ member: null, status: 'validated', warranties: [] });

    const handleUpdateStatus = async (warrantyId: string, status: 'validated' | 'rejected', reason?: string) => {
        setProcessingWarranty(warrantyId);
        try {
            const response = await api.put(`/admin/warranties/${warrantyId}/status`, {
                status,
                rejectionReason: reason
            });

            if (response.data.success) {
                toast({
                    title: `Warranty ${status === 'validated' ? 'Approved' : 'Disapproved'}`,
                    description: response.data.message,
                    variant: status === 'validated' ? "default" : "destructive"
                });

                // Update local state
                const updateWarrantyInList = (list: any[]) =>
                    list.map((w: any) =>
                        (w.uid === warrantyId || w.id === warrantyId)
                            ? { ...w, status, rejection_reason: reason }
                            : w
                    );

                setVendor(prev => ({
                    ...prev,
                    warranties: updateWarrantyInList(prev.warranties || [])
                }));
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

    const handleExportWarranties = (filteredWarranties: any[]) => {
        const exportData = filteredWarranties.map(formatWarrantyForExport);
        downloadCSV(exportData, `vendor_warranties_export_${new Date().toISOString().split('T')[0]}.csv`);
    };

    const handleExportManpower = (filteredManpower: any[]) => {
        const exportData = filteredManpower.map(formatManpowerForExport);
        downloadCSV(exportData, `vendor_manpower_export_${new Date().toISOString().split('T')[0]}.csv`);
    };

    const showManpowerWarranties = (member: any, status: 'validated' | 'pending' | 'rejected') => {
        const manpowerWarranties = (vendor.warranties || []).filter((w: any) =>
            w.manpower_id === member.id && w.status === status
        );
        setManpowerWarrantyDialogData({ member, status, warranties: manpowerWarranties });
        setManpowerWarrantyDialogOpen(true);
    };

    const openRejectDialog = (warrantyId: string) => {
        setSelectedWarrantyId(warrantyId);
        setRejectDialogOpen(true);
    };

    return (
        <div className="bg-gradient-to-b from-background to-muted/30 min-h-screen">
            <div className="mb-6">
                <Button variant="ghost" onClick={onBack} className="gap-2">
                    ← Back to Franchises
                </Button>
            </div>

            {/* Enhanced Vendor Header */}
            <Card className="mb-6 overflow-hidden border-orange-100 shadow-md">
                <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-8 text-white">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                        <div>
                            <h1 className="text-3xl font-bold mb-2 tracking-tight">{vendor.store_name}</h1>
                            <div className="flex items-center gap-2 text-slate-300">
                                <MapPin className="h-4 w-4 text-orange-400" />
                                <span>{vendor.address}, {vendor.city}, {vendor.state}</span>
                            </div>
                        </div>
                        <Badge
                            className={cn(
                                "text-sm px-4 py-1.5 h-auto",
                                vendor.is_verified
                                    ? "bg-emerald-500 hover:bg-emerald-600 border-0"
                                    : "bg-amber-500 hover:bg-amber-600 text-black border-0"
                            )}
                        >
                            {vendor.is_verified ? 'Verified Franchise' : 'Pending Verification'}
                        </Badge>
                    </div>
                </div>
                <CardContent className="p-6 bg-white">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                            <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                                <User className="h-6 w-6 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Contact Person</p>
                                <p className="font-semibold text-slate-700">{vendor.contact_name || 'N/A'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                                <Mail className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Email</p>
                                <p className="font-semibold text-slate-700 break-all">{vendor.email || vendor.contact_email || 'N/A'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                            <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                                <Phone className="h-6 w-6 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Phone</p>
                                <p className="font-semibold text-slate-700">{vendor.phone_number || vendor.phone || 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 h-auto p-1 bg-slate-100 rounded-lg">
                    <TabsTrigger value="warranties" className="py-2.5">Warranties ({vendor.warranties?.length || 0})</TabsTrigger>
                    <TabsTrigger value="manpower" className="py-2.5">Manpower ({vendor.manpower?.length || 0})</TabsTrigger>
                </TabsList>

                <TabsContent value="warranties">
                    <Card className="border-orange-100 shadow-sm">
                        <CardHeader>
                            <CardTitle>Warranty Registrations</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Tabs value={warrantyFilter} onValueChange={(value: any) => setWarrantyFilter(value)} className="mb-6">
                                <TabsList className="grid w-full grid-cols-4 lg:w-auto h-auto bg-white border">
                                    <TabsTrigger value="all" className="data-[state=active]:bg-slate-100">All</TabsTrigger>
                                    <TabsTrigger value="validated" className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700">Approved</TabsTrigger>
                                    <TabsTrigger value="rejected" className="data-[state=active]:bg-red-50 data-[state=active]:text-red-700">Rejected</TabsTrigger>
                                    <TabsTrigger value="pending" className="data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700">Pending</TabsTrigger>
                                </TabsList>
                            </Tabs>

                            <div className="flex flex-col gap-4 mb-6">
                                <div className="flex flex-wrap items-center gap-4 justify-between">
                                    <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-medium text-slate-500">From:</span>
                                            <input
                                                type="date"
                                                className="px-2 py-1 rounded border text-sm"
                                                value={warrantyDateFrom}
                                                onChange={(e) => setWarrantyDateFrom(e.target.value)}
                                            />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-medium text-slate-500">To:</span>
                                            <input
                                                type="date"
                                                className="px-2 py-1 rounded border text-sm"
                                                value={warrantyDateTo}
                                                onChange={(e) => setWarrantyDateTo(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    {/* Search & Sort */}
                                    <div className="flex flex-1 items-center gap-4 min-w-[300px]">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                                            <Input
                                                placeholder="Search customer, product, UID..."
                                                className="pl-10"
                                                value={warrantySearch}
                                                onChange={(e) => setWarrantySearch(e.target.value)}
                                            />
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => setWarrantySortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                                        >
                                            {warrantySortOrder === 'asc' ? "↑" : "↓"}
                                        </Button>
                                    </div>

                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            // Logic mirrors render filter
                                            const filtered = (vendor.warranties || []).filter((w: any) => {
                                                if (warrantyFilter !== 'all' && w.status !== warrantyFilter) return false;
                                                return true;
                                                // (Simplified for export handler call, actual filtering happens in render)
                                            });
                                            handleExportWarranties(filtered);
                                        }}
                                    >
                                        <Download className="h-4 w-4 mr-2" />
                                        Export
                                    </Button>
                                </div>
                            </div>

                            {(!vendor.warranties || vendor.warranties.length === 0) ? (
                                <div className="text-center py-12 bg-slate-50 rounded-lg border border-dashed text-slate-400">
                                    No warranties registered yet.
                                </div>
                            ) : (
                                <AdminWarrantyList
                                    items={(vendor.warranties || [])
                                        .filter((w: any) => {
                                            if (warrantyFilter !== 'all' && w.status !== warrantyFilter) return false;
                                            if (warrantyDateFrom || warrantyDateTo) {
                                                const d = new Date(w.created_at);
                                                d.setHours(0, 0, 0, 0);
                                                if (warrantyDateFrom && d < new Date(warrantyDateFrom)) return false;
                                                // Fix date to inclusive end of day
                                                const endDate = new Date(warrantyDateTo);
                                                endDate.setHours(23, 59, 59, 999);
                                                if (warrantyDateTo && d > endDate) return false;
                                            }
                                            if (warrantySearch) {
                                                const s = warrantySearch.toLowerCase();
                                                const pd = typeof w.product_details === 'string' ? JSON.parse(w.product_details || '{}') : w.product_details || {};
                                                const pName = pd.product || pd.productName || w.product_type || '';
                                                return (
                                                    w.customer_name?.toLowerCase().includes(s) ||
                                                    w.customer_phone?.includes(s) ||
                                                    w.uid?.toLowerCase().includes(s) ||
                                                    pName.toLowerCase().includes(s)
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
                                        })
                                    }
                                    processingWarranty={processingWarranty}
                                    onApprove={(id) => handleUpdateStatus(id, 'validated')}
                                    onReject={(id) => openRejectDialog(id)}
                                    showActions={true}
                                    showRejectionReason={true}
                                />
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="manpower">
                    <Card className="border-orange-100 shadow-sm">
                        <CardHeader>
                            <CardTitle>Manpower List</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap items-center gap-4 mb-6">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        placeholder="Search manpower..."
                                        className="pl-10"
                                        value={manpowerSearch}
                                        onChange={(e) => setManpowerSearch(e.target.value)}
                                    />
                                </div>
                                <Button
                                    variant="outline"
                                    onClick={() => handleExportManpower(vendor.manpower || [])}
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Export
                                </Button>
                            </div>

                            <Tabs defaultValue="active" className="space-y-6">
                                <TabsList className="w-full justify-start p-0 bg-transparent border-b h-auto rounded-none">
                                    <TabsTrigger value="active" className="data-[state=active]:border-b-2 data-[state=active]:border-orange-500 rounded-none px-6 py-3">
                                        Current Team ({vendor.manpower?.filter((m: any) => Boolean(m.is_active)).length || 0})
                                    </TabsTrigger>
                                    <TabsTrigger value="inactive" className="data-[state=active]:border-b-2 data-[state=active]:border-orange-500 rounded-none px-6 py-3">
                                        Ex-Team ({vendor.manpower?.filter((m: any) => !Boolean(m.is_active)).length || 0})
                                    </TabsTrigger>
                                </TabsList>

                                {['active', 'inactive'].map((status) => (
                                    <TabsContent key={status} value={status}>
                                        <div className="space-y-4">
                                            {vendor.manpower
                                                ?.filter((m: any) => {
                                                    const isActive = status === 'active';
                                                    if (Boolean(m.is_active) !== isActive) return false;
                                                    if (manpowerSearch) {
                                                        const s = manpowerSearch.toLowerCase();
                                                        return m.name?.toLowerCase().includes(s) || m.phone_number?.includes(s);
                                                    }
                                                    return true;
                                                })
                                                .map((member: any) => (
                                                    <div key={member.id} className="flex items-center justify-between p-4 border rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors">
                                                        <div className="flex items-center gap-4">
                                                            <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
                                                                {member.name.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-slate-800">{member.name}</p>
                                                                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-1">
                                                                    <span className="font-mono bg-white border px-1.5 py-0.5 rounded">{member.phone_number}</span>
                                                                    <span>•</span>
                                                                    <span className="capitalize">{member.applicator_type?.replace('_', ' ')}</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => showManpowerWarranties(member, 'validated')}
                                                                className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold hover:bg-emerald-200 transition-colors"
                                                            >
                                                                {member.points || 0} Approved
                                                            </button>
                                                            <button
                                                                onClick={() => showManpowerWarranties(member, 'pending')}
                                                                className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold hover:bg-amber-200 transition-colors"
                                                            >
                                                                {member.pending_points || 0} Pending
                                                            </button>
                                                            <button
                                                                onClick={() => showManpowerWarranties(member, 'rejected')}
                                                                className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold hover:bg-red-200 transition-colors"
                                                            >
                                                                {member.rejected_points || 0} Rejected
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            {vendor.manpower?.filter((m: any) => Boolean(m.is_active) === (status === 'active')).length === 0 && (
                                                <div className="text-center py-8 text-slate-400 italic">No {status} team members found.</div>
                                            )}
                                        </div>
                                    </TabsContent>
                                ))}
                            </Tabs>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Rejection Dialog */}
            <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Warranty</DialogTitle>
                        <DialogDescription>Please provide a reason for rejection.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <textarea
                            className="w-full p-2 border rounded-md h-24"
                            placeholder="Reason..."
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
                        <Button
                            variant="destructive"
                            onClick={() => selectedWarrantyId && handleUpdateStatus(selectedWarrantyId, 'rejected', rejectReason)}
                            disabled={!rejectReason || !!processingWarranty}
                        >
                            {processingWarranty ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Rejection"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Manpower Warranty Details Dialog */}
            <Dialog open={manpowerWarrantyDialogOpen} onOpenChange={setManpowerWarrantyDialogOpen}>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {manpowerWarrantyDialogData.member?.name} - {manpowerWarrantyDialogData.status} Warranties
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        {manpowerWarrantyDialogData.warranties.length === 0 ? (
                            <p className="text-center text-slate-500">No warranties found.</p>
                        ) : (
                            manpowerWarrantyDialogData.warranties.map((w: any) => (
                                <div key={w.id} className="flex justify-between items-start p-3 border rounded-lg bg-slate-50">
                                    <div>
                                        <p className="font-semibold">{w.customer_name}</p>
                                        <p className="text-xs text-slate-500">{w.car_make} {w.car_model} - {w.product_type}</p>
                                        <p className="text-xs font-mono text-slate-400 mt-1">UID: {w.uid}</p>
                                    </div>
                                    <div className="text-right">
                                        <Badge>{formatToIST(w.created_at)}</Badge>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};
