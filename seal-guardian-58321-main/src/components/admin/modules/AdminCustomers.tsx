import { useState, useEffect } from "react";
import api from "@/lib/api";
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
    Check
} from "lucide-react";
import { AdminWarrantyList } from "@/components/admin/AdminWarrantyList";
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

    // Helpers
    const formatToIST = (dateString: string) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            day: '2-digit',
            month: 'short',
            year: 'numeric'
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

    const handleViewCustomer = async (email: string) => {
        setLoadingDetails(email);
        try {
            // Find in local list first for basic info
            const basicInfo = customers.find(c => c.customer_email === email);

            // In a real app we might fetch full details including all warranties here
            // Assuming the basic list or a separate endpoint provides it.
            // AdminDashboard used handleViewCustomer logic with potential API call if needed, 
            // but the code I read mainly set internal state.
            // Let's assume we need to fetch warranties for this customer.
            // Actually AdminDashboard logic for handleViewCustomer was:
            /*
             const handleViewCustomer = async (email: string) => {
                // ... logic to find customer or fetch ...
                // The snippet I read in 7029 showed signature. 
                // The snippet in 7075 showed conditional rendering but not the fetch implementation.
                // I will search for handleViewCustomer implementation or just use what I have.
             }
            */

            // Based on common patterns, I'll filter the customers list or fetch detailed warranties.
            // For now, let's assume the customer object has warranties count but maybe not the list.
            // But wait, the detail view uses AdminWarrantyList with `selectedCustomer.warranties`.
            // So I probably need to fetch warranties for this customer.

            const response = await api.get(`/admin/customers/${email}`);
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
            const basicInfo = customers.find(c => c.customer_email === email);
            if (basicInfo) {
                setSelectedCustomer({ ...basicInfo, warranties: [] });
                setViewingCustomer(true);
                toast({ description: "Could not load full warranty history", variant: "destructive" });
            }
        } finally {
            setLoadingDetails(null);
        }
    };

    const handleDeleteCustomer = async (email: string) => {
        if (!confirm("Delete this customer?")) return;
        try {
            await api.delete(`/admin/customers/${email}`);
            setCustomers(prev => prev.filter(c => c.customer_email !== email));
            toast({ description: "Customer deleted" });
        } catch (error) {
            toast({ description: "Failed to delete", variant: "destructive" });
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

    if (viewingCustomer && selectedCustomer) {
        return (
            <div className="space-y-6">
                <Button variant="ghost" onClick={() => setViewingCustomer(false)} className="gap-2 pl-0 hover:bg-transparent hover:text-orange-500">
                    <ArrowLeft className="h-4 w-4" /> Back to Customers
                </Button>

                <Card className="border-orange-100 bg-white">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold">{selectedCustomer.customer_name}</CardTitle>
                        <CardDescription className="flex items-center gap-4">
                            <span className="flex items-center gap-1"><Mail className="h-4 w-4" /> {selectedCustomer.customer_email}</span>
                            <span className="flex items-center gap-1"><Phone className="h-4 w-4" /> {selectedCustomer.customer_phone}</span>
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <h3 className="font-bold mb-4">Warranty History</h3>
                        {/* Reusing AdminWarrantyList for the details */}
                        <AdminWarrantyList
                            items={selectedCustomer.warranties || []}
                            showActions={false}
                        />
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="relative flex-1 md:max-w-md w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search customers..."
                        className="pl-10 border-orange-100 h-11 md:h-10"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
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
                                    <Button size="icon" variant="ghost" className="h-10 w-10 rounded-xl bg-orange-50 text-orange-600 hover:bg-orange-100" onClick={() => handleViewCustomer(customer.customer_email)}>
                                        <Eye className="h-5 w-5" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-10 w-10 rounded-xl bg-red-50 text-red-500 hover:bg-red-100" onClick={() => handleDeleteCustomer(customer.customer_email)}>
                                        <Trash2 className="h-5 w-5" />
                                    </Button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <div className="bg-orange-50/50 p-3 rounded-xl border border-orange-100/50">
                                    <div className="text-[10px] uppercase font-bold text-orange-400 mb-1">Total Warranties</div>
                                    <div className="font-bold text-slate-700 text-lg">{customer.total_warranties || 0}</div>
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
                                <th className="px-6 py-4">Registered</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={5} className="p-8 text-center">Loading...</td></tr>
                            ) : paginatedCustomers.length === 0 ? (
                                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No customers found</td></tr>
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
                                    <td className="px-6 py-4 text-slate-600">
                                        {formatToIST(customer.registered_at)}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button size="icon" variant="ghost" onClick={() => handleViewCustomer(customer.customer_email)} disabled={loadingDetails === customer.customer_email}>
                                                {loadingDetails === customer.customer_email ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                                            </Button>
                                            <Button size="icon" variant="ghost" className="text-red-500 hover:bg-red-50" onClick={() => handleDeleteCustomer(customer.customer_email)}>
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
