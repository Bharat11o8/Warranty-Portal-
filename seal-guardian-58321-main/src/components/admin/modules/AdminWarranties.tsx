import { useState, useEffect, useMemo } from "react";
import api from "@/lib/api";
import { downloadCSV, cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
    Card,
    CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
    Search,
    Download,
    Filter,
    RefreshCw,
    Calendar as CalendarIcon,
    ArrowUpDown,
    Check,
    X
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel
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
import { format, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { DateRange } from "react-day-picker";
import { AdminWarrantyList } from "@/components/admin/AdminWarrantyList";

export const AdminWarranties = () => {
    const { toast } = useToast();
    const [warranties, setWarranties] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Filters
    const [statusFilter, setStatusFilter] = useState("all");
    const [showFilters, setShowFilters] = useState(false);

    // Advanced Filter State
    const [productTypeFilter, setProductTypeFilter] = useState("all");
    const [selectedMake, setSelectedMake] = useState<string>('all');
    const [selectedModel, setSelectedModel] = useState<string>('all');
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [search, setSearch] = useState("");

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Sort State
    const [sortConfig, setSortConfig] = useState<{ field: string; order: 'asc' | 'desc' }>({
        field: 'created_at',
        order: 'desc'
    });

    // Action State
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [exportDialogOpen, setExportDialogOpen] = useState(false);

    const toTitleCase = (str: string) => {
        if (!str) return str;
        return str.replace(/[_-]/g, ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
    };

    // Derived Data for Filters
    const uniqueMakes = useMemo(() => {
        const makes = Array.from(new Set(warranties.map(w => w.car_make).filter(Boolean)));
        return makes.sort();
    }, [warranties]);

    const uniqueModels = useMemo(() => {
        const models = Array.from(new Set(
            warranties
                .filter(w => selectedMake === 'all' || w.car_make === selectedMake)
                .map(w => w.car_model)
                .filter(Boolean)
        ));
        return models.sort();
    }, [warranties, selectedMake]);

    const clearFilters = () => {
        setProductTypeFilter('all');
        setSelectedMake('all');
        setSelectedModel('all');
        setDateRange(undefined);
        setSearch("");
        setCurrentPage(1);
    };

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [statusFilter, productTypeFilter, selectedMake, selectedModel, dateRange, search]);

    const handleExportByType = (type: 'Seat Cover' | 'PPF') => {
        try {
            // Filter by selected type - allow partial matches (e.g. "Seat Cover" matches "Seat Cover (2 Row)")
            const typeLower = type.toLowerCase();
            const exportItems = filteredWarranties.filter(w => {
                const pType = (w.product_type || "").toLowerCase();
                if (type === 'PPF') return pType.includes('ppf') || pType.includes('ev');
                return pType.includes('seat') || pType.includes('cover');
            });

            if (exportItems.length === 0) {
                toast({ description: `No ${type} warranties found to export`, variant: "destructive" });
                return;
            }

            const exportData = exportItems.map(w => {
                let details: any = {};
                try {
                    if (typeof w.product_details === 'string') {
                        details = JSON.parse(w.product_details);
                    } else if (typeof w.product_details === 'object' && w.product_details) {
                        details = w.product_details;
                    }
                } catch (err) { /* ignore */ }

                return {
                    "UID": w.uid,
                    "Status": w.status,
                    "Customer Name": w.customer_name,
                    "Customer Phone": w.customer_phone,
                    "Customer Email": w.customer_email,
                    "Product Type": w.product_type,
                    "Product Name": details.product || details.productName || w.product_name || "N/A", // Fixed fallback order
                    "Make": (w.car_make || details.selectedMake || "N/A").charAt(0).toUpperCase() + (w.car_make || details.selectedMake || "N/A").slice(1),  // Added Make with capitalization
                    "Model": w.car_model || details.selectedModel || "N/A",
                    "Year": w.car_year || details.selectedYear || "N/A",
                    "Vehicle Reg": w.car_reg || details.carRegistration || "N/A", // Added Reg number
                    "Franchise Name": w.vendor_store_name || details.storeName || w.store_name || "N/A",
                    "Store Email": w.vendor_store_email || details.storeEmail || w.installer_contact || "N/A",
                    "Installer": w.manpower_name_from_db || details.manpowerName || details.installerName || "N/A",
                    "Date": w.created_at ? new Date(w.created_at).toLocaleDateString() : "N/A",
                    "Images": type === 'PPF'
                        ? (details.photos ? Object.values(details.photos).filter(Boolean).join(", ") : "N/A")
                        : (details.invoiceFileName || "N/A"),
                    "Rejection Reason": w.rejection_reason || ""
                };
            });

            downloadCSV(exportData, `${type.replace(' ', '_')}_Warranties_${new Date().toISOString().split('T')[0]}.csv`);
            setExportDialogOpen(false);
            toast({ title: "Export Successful", description: `Exported ${exportItems.length} records` });
        } catch (error) {
            console.error("Export failed:", error);
            toast({ title: "Export Failed", variant: "destructive" });
        }
    };

    useEffect(() => {
        fetchWarranties();
    }, []);

    const fetchWarranties = async (isRefresh = false) => {
        if (isRefresh) setIsRefreshing(true);
        else setLoading(true);

        try {
            const response = await api.get("/admin/warranties"); // Assuming this endpoint exists based on AdminDashboard
            if (response.data.success) {
                setWarranties(response.data.warranties);
                if (isRefresh) {
                    toast({ description: "Warranties refreshed" });
                }
            }
        } catch (error) {
            console.error("Failed to fetch warranties", error);
            toast({ variant: "destructive", description: "Failed to refresh" });
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    };

    const handleUpdateStatus = async (id: string, status: 'validated' | 'rejected', reason?: string) => {
        setProcessingId(id);
        try {
            const response = await api.put(`/admin/warranties/${id}/status`, { status, rejectionReason: reason });
            if (response.data.success) {
                toast({ title: status === 'validated' ? "Approved" : "Rejected", className: status === 'validated' ? "bg-green-600 text-white" : "bg-red-600 text-white" });
                // Optimistic update
                setWarranties(prev => prev.map(w => w.id === id || w.uid === id ? { ...w, status, rejection_reason: reason } : w));
            }
        } catch (error) {
            toast({ title: "Update Failed", variant: "destructive" });
        } finally {
            setProcessingId(null);
        }
    };

    // Filter & Sort Logic
    const filteredWarranties = useMemo(() => {
        let items = warranties.filter(w => {
            if (statusFilter !== 'all' && w.status !== statusFilter) return false;

            // Product Type Filter
            if (productTypeFilter !== 'all') {
                const pType = (w.product_type || "").toLowerCase();
                if (productTypeFilter === 'ppf') {
                    if (!(pType.includes('ppf') || pType.includes('ev'))) return false;
                } else if (productTypeFilter === 'seat-cover') {
                    if (!(pType.includes('seat') || pType.includes('cover'))) return false;
                }
            }

            // Make Filter
            if (selectedMake !== 'all') {
                if (w.car_make !== selectedMake) return false;
            }

            // Model Filter
            if (selectedModel !== 'all') {
                if (w.car_model !== selectedModel) return false;
            }

            // Date Range Filter
            if (dateRange?.from) {
                const wDate = new Date(w.created_at);
                const rangeEnd = dateRange.to || dateRange.from;
                if (!isWithinInterval(wDate, {
                    start: startOfDay(dateRange.from),
                    end: endOfDay(rangeEnd)
                })) return false;
            }

            // Search
            if (search) {
                const s = search.toLowerCase();
                let productName = w.product_type;
                try {
                    if (w.product_details) {
                        const details = typeof w.product_details === 'string' ? JSON.parse(w.product_details) : w.product_details;
                        productName = details.productName || w.product_type;
                    }
                } catch (e) { /* ignore parse error */ }
                const product = productName;
                return (
                    w.customer_name?.toLowerCase().includes(s) ||
                    w.customer_email?.toLowerCase().includes(s) ||
                    w.uid?.toLowerCase().includes(s) ||
                    product?.toLowerCase().includes(s) ||
                    (w.car_make && w.car_make.toLowerCase().includes(s)) ||
                    (w.car_model && w.car_model.toLowerCase().includes(s))
                );
            }
            return true;
        });

        // Sorting
        return items.sort((a, b) => {
            let valA: any = a[sortConfig.field as keyof typeof a];
            let valB: any = b[sortConfig.field as keyof typeof b];

            if (sortConfig.field === 'created_at') {
                valA = new Date(valA || 0).getTime();
                valB = new Date(valB || 0).getTime();
            }

            if (valA < valB) return sortConfig.order === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.order === 'asc' ? 1 : -1;
            return 0;
        });
    }, [warranties, statusFilter, productTypeFilter, selectedMake, selectedModel, dateRange, search, sortConfig]);

    // Pagination Calculation
    const totalPages = Math.ceil(filteredWarranties.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedWarranties = filteredWarranties.slice(startIndex, startIndex + itemsPerPage);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col xl:flex-row gap-4 justify-between xl:items-center">


                {/* Mobile Status Filter */}
                <div className="md:hidden w-full">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full h-11 bg-white border-orange-100 rounded-2xl font-bold shadow-sm">
                            <SelectValue placeholder="Filter by Status" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-orange-100 shadow-xl">
                            <SelectItem value="all">All Warranties</SelectItem>
                            <SelectItem value="validated">Approved</SelectItem>
                            <SelectItem value="pending">Pending Approval</SelectItem>
                            <SelectItem value="pending_vendor">Pending Vendor</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Desktop Status Tabs */}
                <Tabs value={statusFilter} onValueChange={setStatusFilter} className="hidden md:block w-full xl:w-auto">
                    <TabsList className="grid w-full grid-cols-5 xl:inline-flex h-auto bg-white border border-orange-100 p-1">
                        <TabsTrigger value="all" className="data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700 gap-2">
                            All
                            <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none px-1.5 py-0 h-4 text-[10px] font-bold">
                                {warranties.length}
                            </Badge>
                        </TabsTrigger>
                        <TabsTrigger value="validated" className="data-[state=active]:bg-green-50 data-[state=active]:text-green-700 gap-2">
                            Approved
                            <Badge variant="secondary" className="bg-green-100/50 text-green-700 border-none px-1.5 py-0 h-4 text-[10px] font-bold">
                                {warranties.filter(w => w.status === 'validated').length}
                            </Badge>
                        </TabsTrigger>
                        <TabsTrigger value="pending" className="data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700 gap-2">
                            Pending
                            <Badge variant="secondary" className="bg-amber-100/50 text-amber-700 border-none px-1.5 py-0 h-4 text-[10px] font-bold">
                                {warranties.filter(w => w.status === 'pending').length}
                            </Badge>
                        </TabsTrigger>
                        <TabsTrigger value="pending_vendor" className="data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700 gap-2">
                            Vendor
                            <Badge variant="secondary" className="bg-orange-100/50 text-orange-700 border-none px-1.5 py-0 h-4 text-[10px] font-bold">
                                {warranties.filter(w => w.status === 'pending_vendor').length}
                            </Badge>
                        </TabsTrigger>
                        <TabsTrigger value="rejected" className="data-[state=active]:bg-red-50 data-[state=active]:text-red-700 gap-2">
                            Rejected
                            <Badge variant="secondary" className="bg-red-100/50 text-red-700 border-none px-1.5 py-0 h-4 text-[10px] font-bold">
                                {warranties.filter(w => w.status === 'rejected').length}
                            </Badge>
                        </TabsTrigger>
                    </TabsList>
                </Tabs>

                <div className="flex w-full md:w-auto gap-2 items-center">
                    <div className="relative group flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="w-full pl-9 pr-4 py-2 rounded-full border border-slate-200 bg-white placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/20 focus-visible:border-orange-500/30 text-sm h-9 transition-all shadow-sm"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <Button
                        variant="outline"
                        onClick={() => setShowFilters(!showFilters)}
                        className={cn(
                            "h-9 w-9 p-0 rounded-full border-orange-100 transition-all shadow-sm flex items-center justify-center shrink-0",
                            showFilters ? "bg-orange-500 text-white border-orange-500 shadow-orange-500/20" : "bg-white text-slate-700 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200"
                        )}
                        title="Toggle Filters"
                    >
                        <div className="relative">
                            <Filter className={cn("h-4 w-4", showFilters ? "animate-pulse" : "")} />
                            {(productTypeFilter !== 'all' || selectedMake !== 'all' || selectedModel !== 'all' || dateRange) && (
                                <span className="absolute -top-1.5 -right-1.5 flex h-3 w-3 items-center justify-center rounded-full bg-red-500 border border-white">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                </span>
                            )}
                        </div>
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchWarranties(true)}
                        disabled={isRefreshing}
                        className="gap-2 text-[#f46617] border border-[#f46617]/20 hover:bg-orange-50 h-9 rounded-full px-3 md:px-4 font-bold shrink-0"
                    >
                        <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        <span className="hidden md:inline">Refresh</span>
                    </Button>

                    <Button
                        size="sm"
                        onClick={() => setExportDialogOpen(true)}
                        className="hidden md:flex gap-2 bg-[#f46617] hover:bg-[#d95512] text-white h-9 rounded-full px-4 font-bold shadow-lg shadow-orange-500/20"
                    >
                        <Download className="h-4 w-4" />
                        EXPORT DATA
                    </Button>
                </div>
            </div>

            {/* Advanced Filters Panel */}
            {showFilters && (
                <div className="flex flex-wrap gap-4 items-center p-6 bg-slate-50/50 rounded-[32px] border border-orange-100/50 animate-in slide-in-from-top-4 fade-in duration-500 mb-8 shadow-inner relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-orange-100/20 blur-3xl rounded-full -mr-32 -mt-32 pointer-events-none" />

                    <div className="flex items-center gap-2 mr-2 relative z-10">
                        <div className="w-1.5 h-6 bg-orange-500 rounded-full" />
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Advanced Filters</span>
                    </div>

                    {/* Product Type Filter */}
                    <div className="relative z-10">
                        <Select value={productTypeFilter} onValueChange={setProductTypeFilter}>
                            <SelectTrigger className="w-[180px] h-11 bg-white border-orange-100 rounded-2xl text-xs font-bold shadow-sm hover:border-orange-200 transition-colors focus:ring-orange-500/20">
                                <SelectValue placeholder="Product Type" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-orange-100 shadow-2xl p-1">
                                <SelectItem value="all" className="rounded-xl text-xs font-bold py-2.5">All Categories</SelectItem>
                                <SelectItem value="seat-cover" className="rounded-xl text-xs font-bold py-2.5">Seat Cover</SelectItem>
                                <SelectItem value="ppf" className="rounded-xl text-xs font-bold py-2.5">Paint Protection Film</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Make Filter */}
                    <div className="relative z-10">
                        <Select value={selectedMake} onValueChange={(val) => { setSelectedMake(val); setSelectedModel('all'); }}>
                            <SelectTrigger className="w-[180px] h-11 bg-white border-orange-100 rounded-2xl text-xs font-bold shadow-sm hover:border-orange-200 transition-colors focus:ring-orange-500/20">
                                <SelectValue placeholder="Vehicle Make" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-orange-100 shadow-2xl p-1">
                                <SelectItem value="all" className="rounded-xl text-xs font-bold py-2.5">All Makes</SelectItem>
                                {uniqueMakes.map(make => (
                                    <SelectItem key={make} value={make} className="rounded-xl text-xs font-bold py-2.5">{toTitleCase(make)}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Model Filter */}
                    <div className="relative z-10">
                        <Select value={selectedModel} onValueChange={setSelectedModel} disabled={selectedMake === 'all'}>
                            <SelectTrigger className="w-[180px] h-11 bg-white border-orange-100 rounded-2xl text-xs font-bold shadow-sm hover:border-orange-200 transition-colors focus:ring-orange-500/20 disabled:opacity-50">
                                <SelectValue placeholder="Vehicle Model" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-orange-100 shadow-2xl p-1">
                                <SelectItem value="all" className="rounded-xl text-xs font-bold py-2.5">All Models</SelectItem>
                                {uniqueModels.map(model => (
                                    <SelectItem key={model} value={model} className="rounded-xl text-xs font-bold py-2.5">{toTitleCase(model)}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Date Range Picker */}
                    <div className="relative z-10">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-[240px] h-11 justify-start text-left font-bold text-xs bg-white border-orange-100 rounded-2xl shadow-sm hover:bg-white hover:border-orange-200 transition-colors",
                                        !dateRange && "text-slate-400"
                                    )}
                                >
                                    <CalendarIcon className="mr-3 h-4 w-4 text-orange-500" />
                                    {dateRange?.from ? (
                                        dateRange.to ? (
                                            <span className="text-slate-700">
                                                {format(dateRange.from, "MMM dd, yyyy")} - {format(dateRange.to, "MMM dd, yyyy")}
                                            </span>
                                        ) : (
                                            <span className="text-slate-700">{format(dateRange.from, "MMM dd, yyyy")}</span>
                                        )
                                    ) : (
                                        <span>Filter by Date Range</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 rounded-[32px] border-orange-100 shadow-2xl overflow-hidden mt-2" align="start">
                                <Calendar
                                    initialFocus
                                    mode="range"
                                    defaultMonth={dateRange?.from}
                                    selected={dateRange}
                                    onSelect={setDateRange}
                                    numberOfMonths={2}
                                    className="p-4"
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* Sort & Tools */}
                    <div className="ml-auto flex items-center gap-4 relative z-10">
                        <div className="h-8 border-l border-orange-200 hidden md:block" />

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="h-11 px-5 rounded-2xl border-orange-100 text-xs font-bold bg-white shadow-sm hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 transition-all flex items-center gap-3">
                                    <ArrowUpDown className="h-4 w-4 text-orange-500" />
                                    Sort: {sortConfig.field === 'created_at' ? 'Latest' : sortConfig.field === 'customer_name' ? 'Customer' : toTitleCase(sortConfig.field)}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="rounded-2xl border-orange-100 shadow-2xl w-56 p-2 mt-2">
                                <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-slate-400 px-3 py-2">Sort By</DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-orange-50" />
                                <DropdownMenuItem onClick={() => setSortConfig({ ...sortConfig, field: 'created_at' })} className="flex items-center justify-between text-xs font-bold py-3 px-3 rounded-xl cursor-pointer hover:bg-orange-50 focus:bg-orange-50 group">
                                    Registration Date {sortConfig.field === 'created_at' && <Check className="h-4 w-4 text-orange-500" />}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setSortConfig({ ...sortConfig, field: 'purchase_date' })} className="flex items-center justify-between text-xs font-bold py-3 px-3 rounded-xl cursor-pointer hover:bg-orange-50 focus:bg-orange-50 group">
                                    Purchase Date {sortConfig.field === 'purchase_date' && <Check className="h-4 w-4 text-orange-500" />}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setSortConfig({ ...sortConfig, field: 'customer_name' })} className="flex items-center justify-between text-xs font-bold py-3 px-3 rounded-xl cursor-pointer hover:bg-orange-50 focus:bg-orange-50 group">
                                    Customer Name {sortConfig.field === 'customer_name' && <Check className="h-4 w-4 text-orange-500" />}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-orange-50" />
                                <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-slate-400 px-3 py-2">Order</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => setSortConfig({ ...sortConfig, order: 'desc' })} className="flex items-center justify-between text-xs font-bold py-3 px-3 rounded-xl cursor-pointer hover:bg-orange-50 focus:bg-orange-50 group">
                                    Newest First {sortConfig.order === 'desc' && <Check className="h-4 w-4 text-orange-500" />}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setSortConfig({ ...sortConfig, order: 'asc' })} className="flex items-center justify-between text-xs font-bold py-3 px-3 rounded-xl cursor-pointer hover:bg-orange-50 focus:bg-orange-50 group">
                                    Oldest First {sortConfig.order === 'asc' && <Check className="h-4 w-4 text-orange-500" />}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearFilters}
                            className="text-slate-400 hover:text-red-500 h-11 px-5 rounded-2xl hover:bg-red-50 font-bold text-xs transition-colors"
                        >
                            <X className="h-4 w-4 mr-2" /> Reset
                        </Button>
                    </div>
                </div>
            )}

            <Card className="border-orange-100 shadow-sm">
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-8 text-center text-slate-500">Loading warranties...</div>
                    ) : (
                        <AdminWarrantyList
                            items={paginatedWarranties}
                            showActions={statusFilter !== 'all'}
                            onApprove={(id) => handleUpdateStatus(id, 'validated')}
                            onReject={(id) => handleUpdateStatus(id, 'rejected', 'Rejected by Admin')}
                            processingWarranty={processingId}
                        />
                    )}
                </CardContent>
            </Card>

            {totalPages > 1 && (
                <Pagination className="mt-4">
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
                                // Show first, last, current, and adjacent pages
                                return page === 1 ||
                                    page === totalPages ||
                                    Math.abs(page - currentPage) <= 1;
                            })
                            .map((page, index, array) => {
                                // Add ellipsis
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

            <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Export Warranties</DialogTitle>
                        <DialogDescription>Select the product type to export</DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4 py-4">
                        <Button
                            variant="outline"
                            className="h-24 flex flex-col gap-2 hover:bg-orange-50 hover:border-orange-200"
                            onClick={() => handleExportByType('Seat Cover')}
                        >
                            <span className="text-2xl">💺</span>
                            <span className="font-semibold">Seat Covers</span>
                        </Button>
                        <Button
                            variant="outline"
                            className="h-24 flex flex-col gap-2 hover:bg-blue-50 hover:border-blue-200"
                            onClick={() => handleExportByType('PPF')}
                        >
                            <span className="text-2xl">🚙</span>
                            <span className="font-semibold">PPF (EV Products)</span>
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};
