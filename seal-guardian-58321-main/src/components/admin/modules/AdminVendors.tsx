import { useState, useEffect } from "react";
import api from "@/lib/api";
import { downloadCSV } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
    Search,
    Download,
    Loader2,
    Check,
    X,
    Trash2,
    Eye,
    Store,
    MapPin,
    Phone,
    Mail
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import { AdminVendorDetails } from "./AdminVendorDetails";

export const AdminVendors = () => {
    const { toast } = useToast();
    const [vendors, setVendors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");
    const [search, setSearch] = useState("");
    const [sortField, setSortField] = useState("created_at");
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Processing states
    const [processingVendor, setProcessingVendor] = useState<string | null>(null);
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [selectedVendor, setSelectedVendor] = useState<any>(null);
    const [rejectReason, setRejectReason] = useState("");

    // View state
    const [viewingVendor, setViewingVendor] = useState<any>(null);

    useEffect(() => {
        fetchVendors();
    }, []);

    // Reset pagination
    useEffect(() => {
        setCurrentPage(1);
    }, [filter, search]);

    const fetchVendors = async () => {
        setLoading(true);
        try {
            const response = await api.get("/admin/vendors");
            if (response.data.success) {
                const parsedVendors = response.data.vendors.map((v: any) => ({
                    ...v,
                    manpower_count: Number(v.manpower_count || 0)
                }));
                setVendors(parsedVendors);
            }
        } catch (error) {
            console.error("Failed to fetch vendors:", error);
            toast({
                title: "Franchise Fetch Failed",
                description: "Failed to fetch franchises",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
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
                    title: isVerified ? "Franchise Approved" : "Franchise Disapproved",
                    description: response.data.message,
                    variant: isVerified ? "default" : "destructive"
                });
                fetchVendors();
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
            setRejectDialogOpen(false);
            setRejectReason("");
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
                    title: "Franchise Deleted",
                    description: "Franchise deleted successfully",
                });
                setVendors(vendors.filter(v => v.id !== vendorId));
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

    const handleExportVendors = () => {
        try {
            if (filteredVendors.length === 0) {
                toast({ description: "No franchises to export", variant: "destructive" });
                return;
            }

            const exportData = filteredVendors.map(v => ({
                "Store Name": v.store_name,
                "Store Email": v.store_email,
                "Contact Person": v.contact_name,
                "Phone": v.phone_number,
                "Email": v.email,
                "City": v.city,
                "State": v.state,
                "Address": v.full_address,
                "Pincode": v.pincode,
                "Status": v.is_verified ? "Active" : v.verified_at ? "Rejected" : "Pending",
                "Verified At": v.verified_at ? new Date(v.verified_at).toLocaleDateString() : "N/A",
                "Manpower Count": v.manpower_count || 0,
                "Team Members": v.manpower_names || "",
                "Total Warranties": v.total_warranties || 0,
                "Approved Warranties": v.validated_warranties || 0,
                "Pending Warranties": v.pending_warranties || 0,
                "Rejected Warranties": v.rejected_warranties || 0
            }));

            // Use the utility from lib/utils (need to ensure it's imported, but I see it in imports list in step 8152? No wait, step 8143 doesn't show it imported)
            // I need to update imports first if downloadCSV isn't imported.
            // Wait, step 8143 imports are: import { cn } from "@/lib/utils"; is NOT there.
            // Actually Step 8143 file content lines 1-38 do NOT show "downloadCSV".
            // I will implement the functionality assuming I can add the import.
            // Since replace_file_content is single block, I should check if I can modify imports too. 
            // Or just inline the logic if it's cleaner than multiple edits. 
            // But reuse is better.

            // Let's assume I'll add the import in a separate call or use a multi-replace.
            // For this specific block replacement, I'll call `downloadCSV`.
            downloadCSV(exportData, `franchises_${new Date().toISOString().split('T')[0]}.csv`);

        } catch (error) {
            console.error("Export error:", error);
            toast({
                title: "Export Failed",
                description: "Failed to export vendor data",
                variant: "destructive"
            });
        }
    };

    const handleViewVendor = (vendor: any) => {
        setViewingVendor(vendor);
    };

    const filteredVendors = vendors
        .filter((vendor) => {
            if (filter === 'approved') return vendor.is_verified;
            if (filter === 'disapproved') return !vendor.is_verified && vendor.verified_at; // Assuming verified_at + !is_verified = rejected
            if (filter === 'pending') return !vendor.is_verified && !vendor.verified_at;
            return true;
        })
        .filter((vendor) => {
            if (!search) return true;
            const term = search.toLowerCase();
            return (
                vendor.store_name?.toLowerCase().includes(term) ||
                vendor.contact_name?.toLowerCase().includes(term) ||
                vendor.store_email?.toLowerCase().includes(term) ||
                vendor.phone_number?.includes(term) ||
                vendor.city?.toLowerCase().includes(term)
            );
        })
        .sort((a, b) => {
            let aVal = a[sortField];
            let bVal = b[sortField];
            if (sortField === 'created_at') {
                aVal = new Date(aVal).getTime();
                bVal = new Date(bVal).getTime();
            } else {
                aVal = (aVal || '').toString().toLowerCase();
                bVal = (bVal || '').toString().toLowerCase();
            }
            return sortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
        });

    // Pagination Calculation
    const totalPages = Math.ceil(filteredVendors.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedVendors = filteredVendors.slice(startIndex, startIndex + itemsPerPage);

    if (viewingVendor) {
        return <AdminVendorDetails vendor={viewingVendor} onBack={() => { setViewingVendor(null); fetchVendors(); }} />;
    }

    return (
        <div className="space-y-6">
            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <Tabs value={filter} onValueChange={setFilter} className="w-full md:w-auto">
                    <TabsList className="grid w-full grid-cols-4 md:inline-flex bg-white/50 border border-orange-100 p-1 h-auto">
                        <TabsTrigger value="all" className="gap-2">
                            All
                            <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none px-1.5 py-0 h-4 text-[10px] font-bold">
                                {vendors.length}
                            </Badge>
                        </TabsTrigger>
                        <TabsTrigger value="approved" className="gap-2 data-[state=active]:bg-green-50 data-[state=active]:text-green-700">
                            Approved
                            <Badge variant="secondary" className="bg-green-100/50 text-green-700 border-none px-1.5 py-0 h-4 text-[10px] font-bold">
                                {vendors.filter(v => v.is_verified).length}
                            </Badge>
                        </TabsTrigger>
                        <TabsTrigger value="pending" className="gap-2 data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700">
                            Pending
                            <Badge variant="secondary" className="bg-amber-100/50 text-amber-700 border-none px-1.5 py-0 h-4 text-[10px] font-bold">
                                {vendors.filter(v => !v.is_verified && !v.verified_at).length}
                            </Badge>
                        </TabsTrigger>
                        <TabsTrigger value="disapproved" className="gap-2 data-[state=active]:bg-red-50 data-[state=active]:text-red-700">
                            Rejected
                            <Badge variant="secondary" className="bg-red-100/50 text-red-700 border-none px-1.5 py-0 h-4 text-[10px] font-bold">
                                {vendors.filter(v => !v.is_verified && v.verified_at).length}
                            </Badge>
                        </TabsTrigger>
                    </TabsList>
                </Tabs>

                <div className="flex w-full md:w-auto gap-2">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search franchises..."
                            className="pl-10 bg-white border-orange-100 focus:border-orange-300 focus:ring-orange-200"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" size="icon" onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}>
                        <span className="sr-only">Sort</span>
                        {sortOrder === 'asc' ? "↑" : "↓"}
                    </Button>
                    <Button variant="outline" onClick={handleExportVendors} className="hidden md:flex gap-2 text-slate-600">
                        <Download className="h-4 w-4" />
                        <span className="hidden sm:inline">Export</span>
                    </Button>
                </div>
            </div>

            {/* Content */}
            <Card className="border-orange-100 shadow-sm overflow-hidden">
                <CardHeader className="bg-orange-50/30 border-b border-orange-50 pb-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg font-bold text-slate-800">Registered Franchises</CardTitle>
                            <CardDescription>Manage your network partners</CardDescription>
                        </div>
                        <Badge variant="outline" className="bg-white text-slate-600 font-mono">
                            {filteredVendors.length} Total
                        </Badge>
                    </div>
                </CardHeader>
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
                        </div>
                    ) : paginatedVendors.length === 0 ? (
                        <div className="text-center py-16 text-slate-400">
                            <Store className="h-12 w-12 mx-auto mb-3 opacity-20" />
                            <p>No franchises found matching your criteria</p>
                        </div>
                    ) : (
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4">Store Details</th>
                                    <th className="px-6 py-4">Contact</th>
                                    <th className="px-6 py-4">Location</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                    <th className="px-6 py-4 text-center">Stats</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {paginatedVendors.map((vendor) => (
                                    <tr key={vendor.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-800">{vendor.store_name}</div>
                                            <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                                                <Mail className="h-3 w-3" /> {vendor.store_email}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-700">{vendor.contact_name}</div>
                                            <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                                                <Phone className="h-3 w-3" /> {vendor.phone_number}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1 text-slate-700">
                                                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                                                {vendor.city}
                                            </div>
                                            <div className="text-xs text-slate-400 ml-4.5">{vendor.state}</div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {vendor.is_verified ? (
                                                <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">Active</Badge>
                                            ) : vendor.verified_at ? (
                                                <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200">Rejected</Badge>
                                            ) : (
                                                <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200">Pending</Badge>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center gap-3 text-xs font-medium">
                                                <div className="text-center">
                                                    <div className="text-green-600">{vendor.validated_warranties || 0}</div>
                                                    <div className="text-[10px] text-slate-400">Approved</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-red-600">{vendor.rejected_warranties || 0}</div>
                                                    <div className="text-[10px] text-slate-400">Rejected</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-amber-600">{vendor.pending_warranties || 0}</div>
                                                    <div className="text-[10px] text-slate-400">Pending</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-slate-700">{vendor.total_warranties || 0}</div>
                                                    <div className="text-[10px] text-slate-400">Total</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end items-center gap-2">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-full"
                                                    onClick={() => handleViewVendor(vendor)}
                                                    title="View Details"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>

                                                {!vendor.is_verified && (
                                                    <>
                                                        <Button
                                                            size="icon"
                                                            className="h-8 w-8 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-sm"
                                                            onClick={() => handleVendorVerification(vendor.id, true)}
                                                            title="Approve"
                                                        >
                                                            <Check className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            size="icon"
                                                            variant="destructive"
                                                            className="h-8 w-8 rounded-full shadow-sm"
                                                            onClick={() => {
                                                                setSelectedVendor(vendor);
                                                                setRejectDialogOpen(true);
                                                            }}
                                                            title="Reject"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </>
                                                )}

                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full"
                                                    onClick={() => handleDeleteVendor(vendor.id)}
                                                    title="Delete"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </Card>

            {totalPages > 1 && (
                <Pagination>
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                aria-disabled={currentPage === 1}
                                className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                            />
                        </PaginationItem>

                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter(page => {
                                return page === 1 ||
                                    page === totalPages ||
                                    Math.abs(page - currentPage) <= 1;
                            })
                            .map((page, index, array) => {
                                if (index > 0 && array[index - 1] !== page - 1) {
                                    return (
                                        <div key={`ellipsis-${page}`} className="flex items-center">
                                            <PaginationEllipsis />
                                            <PaginationItem>
                                                <PaginationLink
                                                    isActive={currentPage === page}
                                                    onClick={() => setCurrentPage(page)}
                                                    className="cursor-pointer"
                                                >
                                                    {page}
                                                </PaginationLink>
                                            </PaginationItem>
                                        </div>
                                    );
                                }

                                return (
                                    <PaginationItem key={page}>
                                        <PaginationLink
                                            isActive={currentPage === page}
                                            onClick={() => setCurrentPage(page)}
                                            className="cursor-pointer"
                                        >
                                            {page}
                                        </PaginationLink>
                                    </PaginationItem>
                                );
                            })}

                        <PaginationItem>
                            <PaginationNext
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                aria-disabled={currentPage === totalPages}
                                className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                            />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            )}

            <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Franchise Application</DialogTitle>
                        <DialogDescription>
                            Please provide a reason for rejecting {selectedVendor?.store_name}.
                            An email will be sent to the vendor.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="reason" className="mb-2 block">Rejection Reason</Label>
                        <Textarea
                            id="reason"
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Enter detailed reason..."
                            className="h-32"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
                        <Button
                            variant="destructive"
                            onClick={() => handleVendorVerification(selectedVendor.id, false, rejectReason)}
                            disabled={!rejectReason}
                        >
                            Confirm Rejection
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
