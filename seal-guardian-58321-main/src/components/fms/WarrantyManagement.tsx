import { useState, useMemo } from "react";
import {
    Search,
    Plus,
    Download,
    CheckCircle,
    Clock,
    XCircle,
    ShieldCheck,
    FileText,
    Filter,
    ArrowUpRight,
    LayoutGrid,
    List,
    Eye,
    ChevronRight,
    Car,
    UserCircle,
    Calendar as CalendarIcon,
    ArrowUpDown,
    Check,
    X,
    RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { cn, formatToIST } from "@/lib/utils";
import { format, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { DateRange } from "react-day-picker";

interface WarrantyManagementProps {
    warranties: any[];
    onRegisterNew: (type: 'ev' | 'seat-cover') => void;
    onExport: () => void;
    onSelect: (warranty: any) => void;
    onVerify: (warranty: any) => void;
    onReject: (warranty: any) => void;
    warrantySearch: string;
    setWarrantySearch: (q: string) => void;
    onRefresh?: () => void;
    isRefreshing?: boolean;
}

export const WarrantyManagement = ({
    warranties,
    onRegisterNew,
    onExport,
    onSelect,
    onVerify,
    onReject,
    warrantySearch,
    setWarrantySearch,
    onRefresh,
    isRefreshing = false
}: WarrantyManagementProps) => {
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [showFilters, setShowFilters] = useState(false);

    // Filter States
    const [selectedProduct, setSelectedProduct] = useState<string>('all');
    const [selectedMake, setSelectedMake] = useState<string>('all');
    const [selectedModel, setSelectedModel] = useState<string>('all');
    const [dateRange, setDateRange] = useState<DateRange | undefined>();

    // Sort State
    const [sortConfig, setSortConfig] = useState<{ field: string; order: 'asc' | 'desc' }>({
        field: 'created_at',
        order: 'desc'
    });

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

    // Main Filtering & Sorting Logic
    const processedItems = useMemo(() => {
        return (status: string) => {
            let items = warranties.filter(w => {
                // Status Filter
                const matchesStatus = status === 'all' ? true :
                    status === 'pending' ? w.status === 'pending_vendor' :
                        w.status === status;
                if (!matchesStatus) return false;

                // Search Filter
                if (warrantySearch) {
                    const search = warrantySearch.toLowerCase();
                    const matchesSearch = (
                        w.customer_name?.toLowerCase().includes(search) ||
                        w.customer_phone?.includes(search) ||
                        w.uid?.toLowerCase().includes(search) ||
                        toTitleCase(w.car_make)?.toLowerCase().includes(search) ||
                        toTitleCase(w.car_model)?.toLowerCase().includes(search)
                    );
                    if (!matchesSearch) return false;
                }

                // Product Filter
                if (selectedProduct !== 'all') {
                    if (w.product_type !== selectedProduct) return false;
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
                    const purchaseDate = new Date(w.purchase_date || w.created_at);
                    const rangeEnd = dateRange.to || dateRange.from;
                    if (!isWithinInterval(purchaseDate, {
                        start: startOfDay(dateRange.from),
                        end: endOfDay(rangeEnd)
                    })) return false;
                }

                return true;
            });

            // Sorting Logic
            items.sort((a, b) => {
                let valA: any = a[sortConfig.field as keyof typeof a];
                let valB: any = b[sortConfig.field as keyof typeof b];

                // Handle Date sorting
                if (sortConfig.field === 'created_at' || sortConfig.field === 'purchase_date') {
                    valA = new Date(valA || 0).getTime();
                    valB = new Date(valB || 0).getTime();
                }

                if (valA < valB) return sortConfig.order === 'asc' ? -1 : 1;
                if (valA > valB) return sortConfig.order === 'asc' ? 1 : -1;
                return 0;
            });

            return items;
        };
    }, [warranties, warrantySearch, selectedProduct, selectedMake, selectedModel, dateRange, sortConfig]);

    const clearFilters = () => {
        setSelectedProduct('all');
        setSelectedMake('all');
        setSelectedModel('all');
        setDateRange(undefined);
    };

    const stats = {
        pending: warranties.filter(w => w.status === 'pending_vendor').length,
        approved: warranties.filter(w => w.status === 'validated').length,
        rejected: warranties.filter(w => w.status === 'rejected').length,
    };

    const renderList = (status: string) => {
        const items = processedItems(status);

        if (items.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center py-16 text-center border rounded-2xl border-dashed border-orange-100 bg-orange-50/20">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 border border-orange-100 shadow-sm">
                        <ShieldCheck className="h-8 w-8 text-orange-200" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-700">No Warranties Found</h3>
                    <p className="text-sm text-slate-400 mt-1 max-w-xs mx-auto">
                        There are no records matching your current filter.
                    </p>
                </div>
            );
        }

        if (viewMode === 'list') {
            return (
                <div className="space-y-3 mt-6">
                    {items.map((warranty, index) => {
                        const isSeatCover = warranty.product_type === 'seat-cover';
                        return (
                            <div key={warranty.id || index} className="group flex flex-col">
                                <div
                                    onClick={() => onSelect(warranty)}
                                    className={cn(
                                        "relative flex items-center gap-4 p-4 bg-white hover:bg-orange-50/50 transition-all duration-300 rounded-2xl border border-orange-100 hover:border-orange-200 shadow-sm hover:shadow-md cursor-pointer active:scale-[0.99] z-10",
                                        "before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-1.5 before:h-0 before:bg-gradient-to-b before:from-orange-500 before:to-orange-400 before:rounded-full before:transition-all before:duration-300 hover:before:h-8"
                                    )}
                                >
                                    {/* Icon */}
                                    <div className={cn(
                                        "h-12 w-12 rounded-xl flex items-center justify-center shrink-0 border transition-all duration-300 group-hover:scale-105",
                                        isSeatCover ? "bg-red-50 border-red-200/60" : "bg-blue-50 border-blue-200/60"
                                    )}>
                                        <img
                                            src={isSeatCover ? "/seat-cover-icon.png" : "/ppf-icon.png"}
                                            alt="Icon"
                                            className="w-7 h-7 object-contain"
                                        />
                                    </div>

                                    {/* Main Info - Styled exactly like Customer side */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <h4 className="font-semibold text-base text-slate-800 truncate pr-2 tracking-tight">
                                                {toTitleCase(warranty.car_make)} {toTitleCase(warranty.car_model)}
                                            </h4>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium tracking-tight mt-0.5 truncate">
                                            <span className={cn(
                                                "font-bold",
                                                isSeatCover ? "text-red-500" : "text-blue-500"
                                            )}>{(warranty.product_type === 'ev-products' ? 'Paint Protection Film' : toTitleCase(warranty.product_type?.replace(/-/g, ' '))) || ''}</span>
                                            <span className="text-slate-300">•</span>
                                            <span className="text-slate-600 truncate font-bold">{toTitleCase(warranty.customer_name)}</span>
                                            <span className="text-slate-300">•</span>
                                            <span className="text-slate-400 font-semibold">{formatToIST(warranty.purchase_date || warranty.created_at).split(',')[0]}</span>
                                            <span className="text-slate-300">•</span>
                                            <span className="font-mono text-slate-500 font-bold">{isSeatCover ? 'UID' : 'Serial'}: {warranty.uid}</span>
                                        </div>
                                    </div>

                                    {/* Actions & Status */}
                                    <div className="shrink-0 flex items-center gap-4">
                                        <div className={cn(
                                            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.1em] border",
                                            warranty.status === 'validated' ? "bg-green-50 text-green-600 border-green-200" :
                                                warranty.status === 'pending_vendor' ? "bg-blue-50 text-blue-600 border-blue-200" :
                                                    warranty.status === 'pending' ? "bg-amber-50 text-amber-600 border-amber-200" :
                                                        "bg-red-50 text-red-600 border-red-200"
                                        )}>
                                            <div className={cn(
                                                "w-1.5 h-1.5 rounded-full",
                                                warranty.status === 'validated' ? "bg-green-500" :
                                                    warranty.status === 'pending_vendor' ? "bg-blue-500 animate-pulse" :
                                                        warranty.status === 'pending' ? "bg-amber-500" : "bg-red-500"
                                            )} />
                                            {warranty.status === 'pending_vendor' ? 'Verify Now' :
                                                warranty.status === 'pending' ? 'H.O Review' :
                                                    warranty.status === 'validated' ? 'Approved' : 'Rejected'}
                                        </div>

                                        <div className="flex items-center gap-1.5">
                                            {warranty.status === 'pending_vendor' && (
                                                <>
                                                    <Button
                                                        size="icon"
                                                        className="h-8 w-8 rounded-full bg-green-600 hover:bg-green-700 text-white shadow-md shadow-green-500/20 active:scale-90 transition-all"
                                                        onClick={(e) => { e.stopPropagation(); onVerify(warranty); }}
                                                    >
                                                        <CheckCircle className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="destructive"
                                                        className="h-8 w-8 rounded-full shadow-md shadow-red-500/20 active:scale-90 transition-all"
                                                        onClick={(e) => { e.stopPropagation(); onReject(warranty); }}
                                                    >
                                                        <XCircle className="h-4 w-4" />
                                                    </Button>
                                                </>
                                            )}
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-8 w-8 rounded-full text-slate-300 hover:text-orange-500 transition-colors"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            );
        }

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {items.map((warranty, index) => {
                    const isSeatCover = warranty.product_type === 'seat-cover';

                    return (
                        <div
                            key={warranty.id || index}
                            onClick={() => onSelect(warranty)}
                            className={cn(
                                "group relative flex flex-col overflow-hidden rounded-[32px] p-6 cursor-pointer transition-all duration-500 active:scale-[0.98]",
                                "bg-white hover:bg-orange-50/30",
                                "border border-orange-100 hover:border-orange-200",
                                "shadow-sm hover:shadow-xl hover:shadow-orange-500/5",
                                "hover:-translate-y-1.5",
                                "before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-1.5 before:h-0 before:bg-gradient-to-b before:from-orange-500 before:to-orange-400 before:rounded-full before:transition-all before:duration-500 hover:before:h-16"
                            )}
                        >
                            {/* Background Decoration */}
                            <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-10 -mt-10 opacity-30 group-hover:opacity-50 transition-opacity duration-500 bg-orange-200" />

                            <div className="relative flex items-start justify-between mb-6">
                                <div className="flex-1 min-w-0 pr-4">
                                    <h4 className="font-bold text-lg text-slate-900 truncate leading-tight">
                                        {toTitleCase(warranty.car_make)} {toTitleCase(warranty.car_model)}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-2">
                                        <Badge variant="outline" className={cn(
                                            "font-bold text-[10px] px-2.5 py-0.5 border-0 shadow-sm",
                                            isSeatCover ? "bg-red-50 text-red-500" : "bg-blue-50 text-blue-500"
                                        )}>
                                            {warranty.product_type === 'ev-products' ? 'Paint Protection Film' : toTitleCase(warranty.product_type?.replace('-', ' '))}
                                        </Badge>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{formatToIST(warranty.purchase_date || warranty.created_at).split(',')[0]}</span>
                                    </div>
                                </div>

                                <div className={cn(
                                    "relative h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-500 group-hover:scale-110 shadow-lg shadow-orange-500/5",
                                    isSeatCover ? "bg-red-50 border border-red-100" : "bg-blue-50 border border-blue-100"
                                )}>
                                    <img
                                        src={isSeatCover ? "/seat-cover-icon.png" : "/ppf-icon.png"}
                                        alt="Icon"
                                        className="w-8 h-8 object-contain opacity-80"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3 mb-6 flex-1">
                                <div className="p-4 rounded-2xl bg-orange-50/50 border border-orange-100/60 group-hover:bg-white transition-colors duration-500 shadow-inner">
                                    <div className="flex justify-between items-center mb-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        <span>Customer</span>
                                        <span>{isSeatCover ? 'UID' : 'Serial'}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold text-sm text-slate-700 truncate mr-4">{toTitleCase(warranty.customer_name)}</span>
                                        <span className="font-mono font-black text-xs text-orange-600 truncate">{warranty.uid}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-5 border-t border-slate-100">
                                <div className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border",
                                    warranty.status === 'validated' ? "bg-green-50 text-green-600 border-green-200" :
                                        warranty.status === 'pending_vendor' ? "bg-blue-50 text-blue-600 border-blue-200" :
                                            warranty.status === 'pending' ? "bg-amber-50 text-amber-600 border-amber-200" :
                                                "bg-red-50 text-red-600 border-red-200"
                                )}>
                                    <div className={cn(
                                        "w-2 h-2 rounded-full animate-pulse",
                                        warranty.status === 'validated' ? "bg-green-500" :
                                            warranty.status === 'pending_vendor' ? "bg-blue-500" :
                                                "bg-amber-500"
                                    )} />
                                    {warranty.status === 'pending_vendor' ? 'Verify Now' :
                                        warranty.status === 'pending' ? 'In Review' :
                                            warranty.status === 'validated' ? 'Approved' : 'Rejected'}
                                </div>

                                <div className="flex items-center gap-2">
                                    {warranty.status === 'pending_vendor' && (
                                        <div className="flex gap-1.5">
                                            <Button
                                                size="sm"
                                                onClick={(e) => { e.stopPropagation(); onVerify(warranty); }}
                                                className="h-10 w-10 rounded-full bg-green-600 hover:bg-green-700 text-white shadow-lg active:scale-95 transition-all"
                                            >
                                                <CheckCircle className="h-5 w-5" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={(e) => { e.stopPropagation(); onReject(warranty); }}
                                                className="h-10 w-10 rounded-full shadow-lg active:scale-95 transition-all"
                                            >
                                                <XCircle className="h-5 w-5" />
                                            </Button>
                                        </div>
                                    )}
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-10 w-10 rounded-full text-slate-300 hover:text-orange-500"
                                    >
                                        <Eye className="h-5 w-5" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="animate-in fade-in duration-700">
            <Tabs defaultValue="all" className="space-y-6">
                {/* Top Action Bar */}
                <div className="flex justify-end gap-3 mb-4">
                    {onRefresh && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onRefresh}
                            disabled={isRefreshing}
                            className="h-10 px-6 rounded-full border-orange-100 text-orange-600 font-bold hover:bg-orange-50 transition-all flex items-center gap-2 shadow-sm"
                        >
                            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                    )}
                    <Button
                        onClick={onExport}
                        className="h-10 px-6 rounded-full bg-[#f46617] hover:bg-[#d85512] text-white font-bold text-xs shadow-lg shadow-orange-500/20 transition-all active:scale-95 flex items-center gap-2 uppercase tracking-widest"
                    >
                        <Download className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
                        Export Data
                    </Button>
                </div>

                {/* Header Container: Tabs + Search + Actions */}
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8 sticky top-5 z-30 bg-white py-4 px-2 -mx-2 rounded-3xl border border-orange-100 shadow-[0_8px_30px_rgba(0,0,0,0.02)]">
                    <div className="w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-none order-2 md:order-1">
                        <TabsList className="relative bg-white p-1 rounded-full h-11 w-full md:w-auto grid grid-cols-4 md:inline-flex gap-0.5 shadow-sm border border-orange-100">
                            <TabsTrigger
                                value="all"
                                className="relative z-10 rounded-full px-8 py-2 text-sm font-bold text-slate-500 data-[state=active]:text-orange-600 data-[state=active]:bg-orange-50/50 data-[state=active]:shadow-sm transition-all duration-500 ease-out whitespace-nowrap"
                            >
                                All
                            </TabsTrigger>
                            <TabsTrigger
                                value="pending"
                                className="relative z-10 rounded-full px-8 py-2 text-sm font-bold text-slate-500 data-[state=active]:text-orange-600 data-[state=active]:bg-white data-[state=active]:shadow-xl transition-all duration-500 ease-out flex items-center gap-3 whitespace-nowrap"
                            >
                                Pending
                                <span className="py-0.5 px-3 rounded-full bg-amber-100 text-amber-700 text-[10px] font-black transition-colors">
                                    {stats.pending || 0}
                                </span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="validated"
                                className="relative z-10 rounded-full px-8 py-2 text-sm font-bold text-slate-500 data-[state=active]:text-orange-600 data-[state=active]:bg-white data-[state=active]:shadow-xl transition-all duration-500 ease-out flex items-center gap-3 whitespace-nowrap"
                            >
                                Verified
                                <span className="py-0.5 px-3 rounded-full bg-green-100 text-green-700 text-[10px] font-black transition-colors">
                                    {stats.approved || 0}
                                </span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="rejected"
                                className="relative z-10 rounded-full px-8 py-2 text-sm font-bold text-slate-500 data-[state=active]:text-orange-600 data-[state=active]:bg-white data-[state=active]:shadow-xl transition-all duration-500 ease-out flex items-center gap-3 whitespace-nowrap"
                            >
                                Rejected
                                <span className="py-0.5 px-3 rounded-full bg-red-100 text-red-700 text-[10px] font-black transition-colors">
                                    {stats.rejected || 0}
                                </span>
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto order-1 md:order-2">
                        <div className="relative group w-full md:w-80 flex-1 md:flex-none">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search warranties..."
                                className="w-full pl-11 pr-4 py-2.5 rounded-2xl border border-slate-100 bg-white placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/20 focus-visible:border-orange-500/30 text-sm transition-all shadow-sm"
                                value={warrantySearch}
                                onChange={(e) => setWarrantySearch(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center gap-1 bg-white p-1 rounded-full h-11 flex-shrink-0 border border-orange-100 shadow-sm">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setViewMode('grid')}
                                className={cn(
                                    "rounded-full h-9 px-3 transition-all",
                                    viewMode === 'grid' ? "bg-orange-50 text-orange-600 border border-orange-200 shadow-sm" : "text-slate-400 hover:text-orange-600"
                                )}
                                title="Card View"
                            >
                                <LayoutGrid className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setViewMode('list')}
                                className={cn(
                                    "rounded-full h-9 px-3 transition-all",
                                    viewMode === 'list' ? "bg-orange-50 text-orange-600 border border-orange-200 shadow-sm" : "text-slate-400 hover:text-orange-600"
                                )}
                                title="List View"
                            >
                                <List className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setShowFilters(!showFilters)}
                                className={cn(
                                    "h-11 w-11 p-0 rounded-full border-orange-100 transition-all shadow-sm flex items-center justify-center shrink-0",
                                    showFilters ? "bg-orange-500 text-white border-orange-500 shadow-orange-500/20" : "bg-white text-slate-700 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200"
                                )}
                                title="Toggle Filters"
                            >
                                <div className="relative">
                                    <Filter className={cn("h-4 w-4", showFilters ? "animate-pulse" : "")} />
                                    {(selectedProduct !== 'all' || selectedMake !== 'all' || selectedModel !== 'all' || dateRange) && (
                                        <span className="absolute -top-1.5 -right-1.5 flex h-3 w-3 items-center justify-center rounded-full bg-red-500 border border-white">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                        </span>
                                    )}
                                </div>
                            </Button>

                        </div>
                    </div>
                </div>

                {/* Advanced Filter & Sort Bar */}
                {
                    showFilters && (
                        <div className="flex flex-wrap gap-4 items-center p-6 bg-slate-50/50 rounded-[32px] border border-orange-100/50 animate-in slide-in-from-top-4 fade-in duration-500 mb-8 shadow-inner relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-100/20 blur-3xl rounded-full -mr-32 -mt-32 pointer-events-none" />

                            <div className="flex items-center gap-2 mr-2 relative z-10">
                                <div className="w-1.5 h-6 bg-orange-500 rounded-full" />
                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Advanced Filters</span>
                            </div>

                            {/* Product Type Search */}
                            <div className="relative z-10">
                                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                                    <SelectTrigger className="w-[180px] h-11 bg-white border-orange-100 rounded-2xl text-xs font-bold shadow-sm hover:border-orange-200 transition-colors focus:ring-orange-500/20">
                                        <SelectValue placeholder="Product Type" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-orange-100 shadow-2xl p-1">
                                        <SelectItem value="all" className="rounded-xl text-xs font-bold py-2.5">All Categories</SelectItem>
                                        <SelectItem value="seat-cover" className="rounded-xl text-xs font-bold py-2.5">Seat Cover</SelectItem>
                                        <SelectItem value="ev-products" className="rounded-xl text-xs font-bold py-2.5">Paint Protection Film</SelectItem>
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

                            {/* Date Range Picker - The "Cute Calendar" */}
                            <div className="relative z-10">
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-[260px] h-11 justify-start text-left font-bold text-xs bg-white border-orange-100 rounded-2xl shadow-sm hover:bg-white hover:border-orange-200 transition-colors",
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
                                            Newest/Z-A First {sortConfig.order === 'desc' && <Check className="h-4 w-4 text-orange-500" />}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setSortConfig({ ...sortConfig, order: 'asc' })} className="flex items-center justify-between text-xs font-bold py-3 px-3 rounded-xl cursor-pointer hover:bg-orange-50 focus:bg-orange-50 group">
                                            Oldest/A-Z First {sortConfig.order === 'asc' && <Check className="h-4 w-4 text-orange-500" />}
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
                    )
                }

                <div className="pt-2">
                    <TabsContent value="all" className="mt-0 outline-none focus-visible:ring-0">{renderList('all')}</TabsContent>
                    <TabsContent value="pending" className="mt-0 outline-none focus-visible:ring-0">{renderList('pending')}</TabsContent>
                    <TabsContent value="validated" className="mt-0 outline-none focus-visible:ring-0">{renderList('validated')}</TabsContent>
                    <TabsContent value="rejected" className="mt-0 outline-none focus-visible:ring-0">{renderList('rejected')}</TabsContent>
                </div>
            </Tabs>
        </div>
    );
};
