import { useState, useEffect } from "react";
import api, { getErrorMessage } from "@/lib/api";
import { downloadCSV } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Search,
    Download,
    Loader2,
    Trash2,
    Eye,
    Phone,
    Mail,
    ArrowLeft,
    ArrowUpDown,
    Check,
    SlidersHorizontal
} from "lucide-react";
import { AdminWarrantyList } from "@/components/admin/AdminWarrantyList";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";

export const AdminCustomers = () => {
    const { toast } = useToast();
    const [customers, setCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [sortField, setSortField] = useState("created_at");
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Detail View State
    const [viewingCustomer, setViewingCustomer] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [loadingDetails, setLoadingDetails] = useState<string | null>(null);
    const [limitDialogOpen, setLimitDialogOpen] = useState(false);
    const [limitCustomer, setLimitCustomer] = useState<any>(null);
    const [limitPhone, setLimitPhone] = useState("");
    const [allowedRegistrations, setAllowedRegistrations] = useState("1");
    const [limitReason, setLimitReason] = useState("");
    const [savingLimit, setSavingLimit] = useState(false);

    // Helpers
    const formatToIST = (dateString: string) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    // Reset pagination on search
    useEffect(() => {
        setCurrentPage(1);
    }, [search]);

    const fetchCustomers = async () => {
        setLoading(true);
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
            setLoading(false);
        }
    };

    // Customers without an email (e.g. fallback-UID submissions) are looked up
    // by phone instead, since the backend identifier is "email OR phone".
    const getCustomerIdentifier = (customer: any) => customer.customer_email || customer.customer_phone;

    const handleViewCustomer = async (customer: any) => {
        const identifier = getCustomerIdentifier(customer);
        if (!identifier) return;

        setLoadingDetails(identifier);
        try {
            const basicInfo = customers.find(c => getCustomerIdentifier(c) === identifier);

            const response = await api.get(`/admin/customers/${identifier}`);
            if (response.data.success) {
                setSelectedCustomer({ ...basicInfo, warranties: response.data.warranties });
                setViewingCustomer(true);
            } else {
                // Fallback: use basic info if endpoint fails or doesn't exist
                setSelectedCustomer({ ...basicInfo, warranties: [] });
                setViewingCustomer(true);
            }

        } catch (error) {
            console.error("Failed to fetch customer details", error);
            // Fallback to local data
            const basicInfo = customers.find(c => getCustomerIdentifier(c) === identifier);
            if (basicInfo) {
                setSelectedCustomer({ ...basicInfo, warranties: [] });
                setViewingCustomer(true);
                toast({ description: "Could not load full warranty history", variant: "destructive" });
            }
        } finally {
            setLoadingDetails(null);
        }
    };

    const handleDeleteCustomer = async (customer: any) => {
        const identifier = getCustomerIdentifier(customer);
        if (!identifier) return;
        if (!confirm("Delete this customer?")) return;
        try {
            await api.delete(`/admin/customers/${identifier}`);
            setCustomers(prev => prev.filter(c => getCustomerIdentifier(c) !== identifier));
            toast({ description: "Customer deleted" });
        } catch (error) {
            toast({ description: "Failed to delete", variant: "destructive" });
        }
    };

    const openLimitDialog = (customer: any) => {
        setLimitCustomer(customer);
        setLimitPhone(customer.customer_phone || "");
        setAllowedRegistrations(String(customer.mobile_allowed_registrations || 1));
        setLimitReason("");
        setLimitDialogOpen(true);
    };

    const openManualLimitDialog = () => {
        setLimitCustomer(null);
        setLimitPhone(search.replace(/\D/g, "").slice(0, 10));
        setAllowedRegistrations("2");
        setLimitReason("");
        setLimitDialogOpen(true);
    };

    const handleSaveMobileLimit = async () => {
        const phone = limitPhone.replace(/\D/g, "").slice(0, 10);
        if (!phone) {
            toast({ description: "Enter a customer mobile number.", variant: "destructive" });
            return;
        }

        const limit = Number(allowedRegistrations);
        if (!Number.isInteger(limit) || limit < 1) {
            toast({ description: "Enter a valid whole number.", variant: "destructive" });
            return;
        }

        setSavingLimit(true);
        try {
            const response = await api.put(`/admin/customers/mobile-limits/${encodeURIComponent(phone)}`, {
                allowedRegistrations: limit,
                reason: limitReason.trim() || undefined
            });

            if (response.data.success) {
                const updated = response.data.limit;
                const applyLimit = (customer: any) => ({
                    ...customer,
                    mobile_allowed_registrations: updated.allowedCount,
                    mobile_used_registrations: updated.usedCount,
                    mobile_remaining_registrations: updated.remainingCount,
                    mobile_limit_override: updated.hasOverride
                });

                setCustomers(prev => prev.map(customer => (
                    customer.customer_phone === phone ? applyLimit(customer) : customer
                )));
                setSelectedCustomer((prev: any) => (
                    prev?.customer_phone === phone ? applyLimit(prev) : prev
                ));
                toast({ description: "Mobile submission limit updated" });
                setLimitDialogOpen(false);
            }
        } catch (error: any) {
            toast({
                description: getErrorMessage(error, "Failed to update mobile limit"),
                variant: "destructive"
            });
        } finally {
            setSavingLimit(false);
        }
    };

    const handleExportCustomers = () => {
        try {
            if (filteredCustomers.length === 0) {
                toast({ description: "No customers to export", variant: "destructive" });
                return;
            }

            const exportData = filteredCustomers.map(c => ({
                "Customer Name": c.customer_name,
                "Email": c.customer_email,
                "Phone": c.customer_phone,
                "Address": c.customer_address || "N/A",
                "Total Warranties": c.total_warranties || 0,
                "Mobile Limit": `${c.mobile_used_registrations || 0}/${c.mobile_allowed_registrations || 1}`,
                "Approved Warranties": c.validated_warranties || 0,
                "Pending Warranties": c.pending_warranties || 0,
                "Rejected Warranties": c.rejected_warranties || 0,
                "First Purchase": c.first_warranty_date ? new Date(c.first_warranty_date).toLocaleDateString() : "N/A",
                "Last Purchase": c.last_warranty_date ? new Date(c.last_warranty_date).toLocaleDateString() : "N/A"
            }));

            downloadCSV(exportData, `customers_${new Date().toISOString().split('T')[0]}.csv`);
        } catch (e) {
            console.error("Export error:", e);
            toast({ description: "Export failed", variant: "destructive" });
        }
    };

    // Filter Logic
    const filteredCustomers = customers.filter(c => {
        if (!search) return true;
        const term = search.toLowerCase();
        return c.customer_name?.toLowerCase().includes(term) || c.customer_email?.toLowerCase().includes(term) || c.customer_phone?.includes(term);
    }).sort((a, b) => {
        let aVal = a[sortField];
        let bVal = b[sortField];

        // Map sort field to data field if necessary
        if (sortField === 'created_at' || sortField === 'first_warranty_date' || sortField === 'registered_at') {
            aVal = new Date(a.registered_at || a.first_warranty_date || 0).getTime();
            bVal = new Date(b.registered_at || b.first_warranty_date || 0).getTime();
        } else if (sortField === 'total_warranties' || sortField === 'warranty_count') {
            aVal = Number(a.total_warranties) || 0;
            bVal = Number(b.total_warranties) || 0;
        } else {
            aVal = (aVal || '').toString().toLowerCase();
            bVal = (bVal || '').toString().toLowerCase();
        }

        if (aVal === bVal) return 0;
        const result = aVal > bVal ? 1 : -1;
        return sortOrder === 'asc' ? result : -result;
    });

    // Pagination Calculation
    const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedCustomers = filteredCustomers.slice(startIndex, startIndex + itemsPerPage);

    const renderLimitDialog = () => (
        <Dialog open={limitDialogOpen} onOpenChange={setLimitDialogOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Set Mobile Submission Limit</DialogTitle>
                    <DialogDescription>
                        Allow this mobile number to submit warranties up to the defined total count.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                        <div className="font-semibold text-slate-900">{limitPhone || "New mobile limit"}</div>
                        <div className="text-slate-500 mt-1">
                            Used {limitCustomer?.mobile_used_registrations || 0} of {limitCustomer?.mobile_allowed_registrations || 1} allowed submissions
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="limitPhone">Mobile number</Label>
                        <Input
                            id="limitPhone"
                            inputMode="numeric"
                            maxLength={10}
                            placeholder="9876543210"
                            value={limitPhone}
                            onChange={(event) => setLimitPhone(event.target.value.replace(/\D/g, "").slice(0, 10))}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="allowedRegistrations">Allowed submissions</Label>
                        <Input
                            id="allowedRegistrations"
                            type="number"
                            min={1}
                            max={50}
                            value={allowedRegistrations}
                            onChange={(event) => setAllowedRegistrations(event.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="limitReason">Reason</Label>
                        <Input
                            id="limitReason"
                            placeholder="Store owner requested customer re-submission"
                            value={limitReason}
                            onChange={(event) => setLimitReason(event.target.value)}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setLimitDialogOpen(false)} disabled={savingLimit}>
                        Cancel
                    </Button>
                    <Button onClick={handleSaveMobileLimit} disabled={savingLimit}>
                        {savingLimit ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                        Save Limit
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );

    if (viewingCustomer && selectedCustomer) {
        return (
            <div className="space-y-6">
                {renderLimitDialog()}
                <Button variant="ghost" onClick={() => setViewingCustomer(false)} className="gap-2 pl-0 hover:bg-transparent hover:text-orange-500">
                    <ArrowLeft className="h-4 w-4" /> Back to Customers
                </Button>

                <Card className="border-orange-100 bg-white">
                    <CardHeader>
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div>
                                <CardTitle className="text-2xl font-bold">{selectedCustomer.customer_name}</CardTitle>
                                <CardDescription className="flex flex-wrap items-center gap-4 mt-2">
                                    <span className="flex items-center gap-1"><Mail className="h-4 w-4" /> {selectedCustomer.customer_email}</span>
                                    <span className="flex items-center gap-1"><Phone className="h-4 w-4" /> {selectedCustomer.customer_phone}</span>
                                    <span className="font-semibold text-slate-700">
                                        Mobile limit: {selectedCustomer.mobile_used_registrations || 0}/{selectedCustomer.mobile_allowed_registrations || 1}
                                    </span>
                                </CardDescription>
                            </div>
                            <Button variant="outline" className="gap-2 border-orange-100" onClick={() => openLimitDialog(selectedCustomer)}>
                                <SlidersHorizontal className="h-4 w-4" />
                                Set Limit
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <h3 className="font-bold mb-4">Warranty History</h3>
                        {/* Reusing AdminWarrantyList for the details */}
                        <AdminWarrantyList
                            items={selectedCustomer.warranties || []}
                            showActions={true}
                            onApprove={(id) => {
                                api.put(`/admin/warranties/${id}/status`, { status: 'validated' })
                                    .then(() => {
                                        toast({ title: "Approved", className: "bg-green-600 text-white" });
                                        handleViewCustomer(selectedCustomer);
                                    });
                            }}
                            onReject={(id) => {
                                api.put(`/admin/warranties/${id}/status`, { status: 'rejected', rejectionReason: 'Admin Override' })
                                    .then(() => {
                                        toast({ title: "Rejected", className: "bg-red-600 text-white" });
                                        handleViewCustomer(selectedCustomer);
                                    });
                            }}
                            onMoveToPending={(id) => {
                                api.put(`/admin/warranties/${id}/status`, { status: 'pending' })
                                    .then(() => {
                                        toast({ title: "Moved to Pending", className: "bg-orange-600 text-white" });
                                        handleViewCustomer(selectedCustomer);
                                    });
                            }}
                        />
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {renderLimitDialog()}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="relative flex-1 md:max-w-md w-full flex items-center gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search customers..."
                            className="pl-10 border-orange-100 h-11 md:h-10 w-full"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Badge variant="outline" className="h-10 md:h-10 px-4 border-orange-200 bg-orange-50 text-orange-700 font-bold whitespace-nowrap rounded-xl shadow-sm border-2">
                        Total: {customers.length}
                    </Badge>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <Button variant="outline" onClick={openManualLimitDialog} className="flex-1 md:flex-none h-11 md:h-10 gap-2 border-blue-100 text-blue-700 hover:bg-blue-50">
                        <SlidersHorizontal className="h-4 w-4" />
                        Set Limit
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="flex-1 md:flex-none flex items-center gap-2 border-orange-100 h-11 md:h-10">
                                <ArrowUpDown className="h-4 w-4 text-orange-500" />
                                {sortField === 'customer_name' ? 'Name' : sortField === 'total_warranties' ? 'Stats' : 'Date'}
                                {sortOrder === 'asc' ? '↑' : '↓'}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="rounded-2xl border-orange-100 shadow-xl p-2 w-48">
                            <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-slate-400 px-3 py-2">Sort By</DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-orange-50" />
                            <DropdownMenuItem
                                onClick={() => { setSortField('first_warranty_date'); }}
                                className="flex items-center justify-between text-xs font-bold py-3 px-3 rounded-xl cursor-pointer hover:bg-orange-50 focus:bg-orange-50 group"
                            >
                                Registered Date {sortField === 'first_warranty_date' && <Check className="h-4 w-4 text-orange-500" />}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => { setSortField('customer_name'); }}
                                className="flex items-center justify-between text-xs font-bold py-3 px-3 rounded-xl cursor-pointer hover:bg-orange-50 focus:bg-orange-50 group"
                            >
                                Customer Name {sortField === 'customer_name' && <Check className="h-4 w-4 text-orange-500" />}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => { setSortField('total_warranties'); }}
                                className="flex items-center justify-between text-xs font-bold py-3 px-3 rounded-xl cursor-pointer hover:bg-orange-50 focus:bg-orange-50 group"
                            >
                                Total Warranties {sortField === 'total_warranties' && <Check className="h-4 w-4 text-orange-500" />}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-orange-50" />
                            <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-slate-400 px-3 py-2">Order</DropdownMenuLabel>
                            <DropdownMenuItem
                                onClick={() => setSortOrder('desc')}
                                className="flex items-center justify-between text-xs font-bold py-3 px-3 rounded-xl cursor-pointer hover:bg-orange-50 focus:bg-orange-50 group"
                            >
                                Newest/Highest First {sortOrder === 'desc' && <Check className="h-4 w-4 text-orange-500" />}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => setSortOrder('asc')}
                                className="flex items-center justify-between text-xs font-bold py-3 px-3 rounded-xl cursor-pointer hover:bg-orange-50 focus:bg-orange-50 group"
                            >
                                Oldest/Lowest First {sortOrder === 'asc' && <Check className="h-4 w-4 text-orange-500" />}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button variant="outline" onClick={handleExportCustomers} className="flex-1 md:flex-none h-11 md:h-10">
                        <Download className="h-4 w-4 mr-2" />
                        <span className="md:inline">Export</span>
                    </Button>
                </div>
            </div>

            {/* Mobile View: Cards */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
                {loading ? (
                    <div className="flex justify-center p-8 bg-white rounded-2xl border border-orange-100">
                        <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
                    </div>
                ) : paginatedCustomers.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 bg-white rounded-2xl border border-orange-100">No customers found</div>
                ) : paginatedCustomers.map((customer) => (
                    <Card key={customer.customer_email} className="border-orange-100 shadow-sm overflow-hidden rounded-2xl">
                        <div className="p-5 space-y-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="font-bold text-slate-900 text-lg leading-tight mb-1">{customer.customer_name}</div>
                                    <div className="text-sm text-slate-500 flex items-center gap-1.5">
                                        <Mail className="h-3.5 w-3.5" /> {customer.customer_email}
                                    </div>
                                    <div className="text-sm text-slate-500 flex items-center gap-1.5 mt-1">
                                        <Phone className="h-3.5 w-3.5" /> {customer.customer_phone}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button size="icon" variant="ghost" className="h-10 w-10 rounded-xl bg-orange-50 text-orange-600 hover:bg-orange-100" onClick={() => handleViewCustomer(customer)}>
                                        <Eye className="h-5 w-5" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100" onClick={() => openLimitDialog(customer)}>
                                        <SlidersHorizontal className="h-5 w-5" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-10 w-10 rounded-xl bg-red-50 text-red-500 hover:bg-red-100" onClick={() => handleDeleteCustomer(customer)}>
                                        <Trash2 className="h-5 w-5" />
                                    </Button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <div className="bg-orange-50/50 p-3 rounded-xl border border-orange-100/50">
                                    <div className="text-[10px] uppercase font-bold text-orange-400 mb-1">Total Warranties</div>
                                    <div className="font-bold text-slate-700 text-lg">{customer.total_warranties || 0}</div>
                                </div>
                                <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                                    <div className="text-[10px] uppercase font-bold text-blue-400 mb-1">Mobile Limit</div>
                                    <div className="font-bold text-slate-700 text-lg">{customer.mobile_used_registrations || 0}/{customer.mobile_allowed_registrations || 1}</div>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Registered</div>
                                    <div className="font-bold text-slate-600 truncate">{formatToIST(customer.registered_at)}</div>
                                </div>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Desktop View: Table */}
            <Card className="border-orange-100 shadow-sm hidden md:block">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4">Customer</th>
                                <th className="px-6 py-4">Contact</th>
                                <th className="px-6 py-4">Total Warranties</th>
                                <th className="px-6 py-4">Mobile Limit</th>
                                <th className="px-6 py-4">Registered</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={6} className="p-8 text-center">Loading...</td></tr>
                            ) : paginatedCustomers.length === 0 ? (
                                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No customers found</td></tr>
                            ) : paginatedCustomers.map((customer) => (
                                <tr key={customer.customer_email} className="hover:bg-slate-50/50">
                                    <td className="px-6 py-4 font-medium text-slate-900">{customer.customer_name}</td>
                                    <td className="px-6 py-4 text-slate-600">
                                        <div>{customer.customer_email}</div>
                                        <div className="text-xs text-slate-400">{customer.customer_phone}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-semibold text-slate-700 pl-4">{customer.total_warranties || 0}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge variant="outline" className={customer.mobile_limit_override ? "border-blue-200 bg-blue-50 text-blue-700" : "border-slate-200 bg-slate-50 text-slate-600"}>
                                            {customer.mobile_used_registrations || 0}/{customer.mobile_allowed_registrations || 1}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">
                                        {formatToIST(customer.registered_at)}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button size="icon" variant="ghost" onClick={() => handleViewCustomer(customer)} disabled={loadingDetails === getCustomerIdentifier(customer)}>
                                                {loadingDetails === getCustomerIdentifier(customer) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                                            </Button>
                                            <Button size="icon" variant="ghost" className="text-blue-600 hover:bg-blue-50" onClick={() => openLimitDialog(customer)}>
                                                <SlidersHorizontal className="h-4 w-4" />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="text-red-500 hover:bg-red-50" onClick={() => handleDeleteCustomer(customer)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
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
        </div>
    );
};
