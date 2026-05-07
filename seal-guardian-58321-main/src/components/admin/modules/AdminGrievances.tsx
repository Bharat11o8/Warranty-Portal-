import { useState, useEffect } from "react";
import api from "@/lib/api";
import { formatToIST, cn, getISTTodayISO } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, RefreshCw, MessageSquare, Search, Paperclip, Store, Users, Mail, Send, Clock, Eye, Filter, ShieldCheck, Download, Package, Box, Wrench, Monitor, HelpCircle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { WarrantySpecSheet } from "@/components/warranty/WarrantySpecSheet";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";

interface Grievance {
    id: number;
    ticket_id: string;
    customer_name: string;
    customer_email: string;
    franchise_name: string | null;
    category: string;
    sub_category: string | null;
    subject: string;
    description: string;
    status: string;
    attachments: string;
    assigned_to: string | null;
    franchise_remarks: string | null;
    admin_remarks: string | null;
    admin_notes: string | null;
    customer_rating: number | null;
    customer_feedback: string | null;
    created_at: string;
    resolved_at: string | null;
    status_updated_at: string | null;
    updated_at?: string;
    franchise_address?: string;
    franchise_city?: string;
    source_type?: 'customer' | 'franchise';
    department?: string;
    department_details?: string;
    warranty_id?: string | number;
}

interface AssignmentRecord {
    id: number;
    assignee_name: string;
    assignee_email: string;
    remarks: string | null;
    completion_remarks: string | null;
    assignment_type: 'initial' | 'follow_up';
    status: 'pending' | 'in_progress' | 'completed' | 'follow_up_sent';
    email_sent_at: string;
    sent_by_name: string | null;
}

const CATEGORIES: Record<string, string> = {
    seat_cover: "Seat Cover",
    mats: "Mats",
    accessories: "Accessories",
    software_issue: "Software/Portal Issue",
    other: "Other",
};

const CATEGORY_CONFIG: Record<string, { color: string; icon: any; border: string; bg: string; text: string }> = {
    seat_cover: { color: "bg-blue-500", border: "border-blue-200", bg: "bg-blue-50", text: "text-blue-700", icon: Package },
    mats: { color: "bg-emerald-500", border: "border-emerald-200", bg: "bg-emerald-50", text: "text-emerald-700", icon: Box },
    accessories: { color: "bg-amber-500", border: "border-amber-200", bg: "bg-amber-50", text: "text-amber-700", icon: Wrench },
    software_issue: { color: "bg-fuchsia-500", border: "border-fuchsia-200", bg: "bg-fuchsia-50", text: "text-fuchsia-700", icon: Monitor },
    other: { color: "bg-slate-500", border: "border-slate-200", bg: "bg-slate-100", text: "text-slate-700", icon: HelpCircle },
};

const DEPARTMENTS = [
    { department: "Sales (Seatcover)", name: "Anuka", email: "afacsales@autoformindia.com" },
    { department: "Accessories", name: "Ashish Dwivedi", email: "aashishdwivedi@autoformindia.com" },
    { department: "Mats", name: "Anurag Gupta", email: "anuraggupta@autoformindia.com" },
    { department: "Tech-Software", name: "DevTeam", email: "Dev@autoformindia.com" },
    { department: "Others", name: "Ashish", email: "ashish@autoformindia.com" }
];

const STATUS_COLORS: Record<string, string> = {
    submitted: "bg-gray-500",
    under_review: "bg-blue-500",
    in_progress: "bg-amber-500",
    resolved: "bg-green-500",
    rejected: "bg-red-500",
};

const calculateSLA = (createdAt: string, resolvedAt: string | null, status: string) => {
    const start = new Date(createdAt);
    const end = (status === 'resolved' || status === 'rejected') && resolvedAt ? new Date(resolvedAt) : new Date();

    const diffMs = end.getTime() - start.getTime();
    const hours = diffMs / (1000 * 60 * 60);

    if (hours <= 24) return { color: "bg-green-100 text-green-800 border-green-200", label: "< 24h" };
    if (hours > 24 && hours <= 36) return { color: "bg-yellow-100 text-yellow-800 border-yellow-200", label: "24-36h" };
    if (hours > 36 && hours <= 48) return { color: "bg-orange-100 text-orange-800 border-orange-200", label: "36-48h" };
    return { color: "bg-red-100 text-red-800 border-red-200", label: "> 48h" };
};

export const AdminGrievances = () => {
    const { toast } = useToast();
    const [grievances, setGrievances] = useState<Grievance[]>([]);
    const [filteredGrievances, setFilteredGrievances] = useState<Grievance[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedGrievance, setSelectedGrievance] = useState<Grievance | null>(null);
    const [adminRemarks, setAdminRemarks] = useState("");
    const [adminNotes, setAdminNotes] = useState("");
    const [updating, setUpdating] = useState(false);

    // Filters
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [categoryFilter, setCategoryFilter] = useState("all");

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

    // Assignment Email State
    const [assigneeName, setAssigneeName] = useState("");
    const [assigneeEmail, setAssigneeEmail] = useState("");
    const [assigneeRemarks, setAssigneeRemarks] = useState("");
    const [estimatedCompletionDate, setEstimatedCompletionDate] = useState("");
    const [sendingEmail, setSendingEmail] = useState(false);
    const [assignmentHistory, setAssignmentHistory] = useState<AssignmentRecord[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    const [dialogTab, setDialogTab] = useState<'details' | 'assignment'>('details');

    // Warranty View State
    const [viewingWarranty, setViewingWarranty] = useState<any>(null);
    const [showWarrantySheet, setShowWarrantySheet] = useState(false);
    const [loadingWarranty, setLoadingWarranty] = useState(false);

    const fetchGrievances = async () => {
        setLoading(true);
        try {
            const response = await api.get("/grievance/admin");
            if (response.data.success) {
                setGrievances(response.data.data);
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: "Failed to fetch grievances",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGrievances();
    }, []);

    useEffect(() => {
        let result = grievances.filter(g => g.source_type === 'franchise');

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(g =>
                g.ticket_id.toLowerCase().includes(query) ||
                g.customer_name?.toLowerCase().includes(query) ||
                g.franchise_name?.toLowerCase().includes(query) ||
                g.subject.toLowerCase().includes(query) ||
                (CATEGORIES[g.category] || g.category).toLowerCase().includes(query)
            );
        }

        // Status filter
        if (statusFilter !== "all") {
            result = result.filter(g => g.status === statusFilter);
        }

        // Category Filter
        if (categoryFilter !== "all") {
            result = result.filter(g => g.category === categoryFilter);
        }

        setFilteredGrievances(result);
        setCurrentPage(1);
    }, [searchQuery, statusFilter, categoryFilter, grievances]);

    // Pagination Calculation
    const totalPages = Math.ceil(filteredGrievances.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedGrievances = filteredGrievances.slice(startIndex, startIndex + itemsPerPage);

    const handleViewWarranty = async (warrantyId: string | number) => {
        setLoadingWarranty(true);
        try {
            // Try fetching from admin endpoint
            const response = await api.get(`/admin/warranties/${warrantyId}`);
            if (response.data.success) {
                setViewingWarranty(response.data.warranty || response.data.data);
                setShowWarrantySheet(true);
            } else {
                toast({ title: "Not Found", description: "Warranty details could not be found.", variant: "destructive" });
            }
        } catch (error) {
            console.error("Failed to fetch warranty", error);
            toast({ title: "Error", description: "Failed to load warranty details.", variant: "destructive" });
        } finally {
            setLoadingWarranty(false);
        }
    };

    const handleOpenDetail = async (g: Grievance) => {
        setSelectedGrievance(g);
        setAdminRemarks(g.admin_remarks || "");
        setAdminNotes(g.admin_notes || "");
        setAssigneeName(g.assigned_to || "");
        setAssigneeEmail("");
        setAssigneeRemarks("");
        setDialogTab('details');
        setAssignmentHistory([]);

        // Fetch assignment history
        setLoadingHistory(true);
        try {
            const response = await api.get(`/grievance/${g.id}/assignments`);
            if (response.data.success) {
                setAssignmentHistory(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch assignment history:', error);
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleSaveChanges = async () => {
        if (!selectedGrievance) return;

        // Validation: Public remarks mandatory for Resolved/Rejected
        if (["resolved", "rejected"].includes(selectedGrievance.status) && !adminRemarks.trim()) {
            toast({
                title: "Validation Error",
                description: "Public remarks are required when resolving or rejecting.",
                variant: "destructive",
            });
            return;
        }

        setUpdating(true);
        try {
            await api.put(`/grievance/${selectedGrievance.id}/admin-update`, {
                status: selectedGrievance.status,
                admin_remarks: adminRemarks,
                admin_notes: adminNotes
            });

            toast({ title: "Saved", description: "Changes saved successfully" });
            setSelectedGrievance(null);
            fetchGrievances();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.response?.data?.error || "Failed to save changes",
                variant: "destructive",
            });
        } finally {
            setUpdating(false);
        }
    };

    const handleStatusLocalUpdate = (status: string) => {
        if (selectedGrievance) {
            setSelectedGrievance({ ...selectedGrievance, status });
        }
    };

    const getStats = () => {
        const tabGrievances = grievances.filter(g => g.source_type === 'franchise');
        const total = tabGrievances.length;
        const open = tabGrievances.filter(g => !["resolved", "rejected"].includes(g.status)).length;
        const resolved = tabGrievances.filter(g => ["resolved", "rejected"].includes(g.status)).length;
        return { total, open, resolved };
    };

    const stats = getStats();

    // Export to CSV function
    const exportToCSV = () => {
        const dataToExport = filteredGrievances;
        if (dataToExport.length === 0) {
            toast({ title: "No Data", description: "No grievances to export with current filters.", variant: "destructive" });
            return;
        }

        const headers = [
            "Date", "Ticket ID", "Raised By", "Department", "Category", "Subject", "Status", "Assigned To", "Last Update"
        ];

        const csvContent = [
            headers.join(","),
            ...dataToExport.map(g => [
                `"${formatToIST(g.created_at)}"`,
                `"${g.ticket_id}"`,
                `"${g.customer_name || ''}"`,
                `"${g.franchise_name || '-'}"`,
                `"${CATEGORIES[g.category] || g.category}"`,
                `"${g.subject.replace(/"/g, '""')}"`,
                `"${g.status.replace("_", " ")}"`,
                `"${g.assigned_to || 'Unassigned'}"`,
                `"${g.updated_at ? formatToIST(g.updated_at) : (g.status_updated_at ? formatToIST(g.status_updated_at) : formatToIST(g.created_at))}"`
            ].join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `franchise_grievances_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(link.href);

        toast({ title: "Exported", description: `${dataToExport.length} franchise grievances exported to CSV.` });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                <Card className="border-orange-100 shadow-sm">
                    <CardContent className="pt-4 md:pt-6 p-4 md:p-6">
                        <p className="text-2xl md:text-3xl font-bold text-slate-800">{stats.total}</p>
                        <p className="text-xs md:text-sm text-slate-500">Total Grievances</p>
                    </CardContent>
                </Card>
                <Card className="border-orange-100 shadow-sm">
                    <CardContent className="pt-4 md:pt-6 p-4 md:p-6">
                        <p className="text-2xl md:text-3xl font-bold text-amber-500">{stats.open}</p>
                        <p className="text-xs md:text-sm text-slate-500">Open Cases</p>
                    </CardContent>
                </Card>
                <Card className="border-orange-100 shadow-sm">
                    <CardContent className="pt-4 md:pt-6 p-4 md:p-6">
                        <p className="text-2xl md:text-3xl font-bold text-green-500">{stats.resolved}</p>
                        <p className="text-xs md:text-sm text-slate-500">Resolved</p>
                    </CardContent>
                </Card>
            </div>

            <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">

                <div className="flex w-full md:w-auto gap-2 items-center">
                    <div className="relative flex-1 md:w-[300px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 h-10 border-orange-100 focus:border-orange-200 rounded-lg text-sm"
                        />
                    </div>

                    {/* Mobile: Filter Icon Dropdown */}
                    <div className="md:hidden">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="icon" className={cn("h-10 w-10 border-orange-100 bg-white", statusFilter !== 'all' && "text-orange-600 border-orange-200 bg-orange-50")}>
                                    <Filter className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setStatusFilter("all")}>All Status</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setStatusFilter("submitted")}>Submitted</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setStatusFilter("under_review")}>Under Review</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setStatusFilter("in_progress")}>In Progress</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setStatusFilter("resolved")}>Resolved</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Desktop: Select Dropdown */}
                    <div className="hidden md:flex gap-2">
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[150px] border-orange-100 h-10">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="submitted">Submitted</SelectItem>
                                <SelectItem value="under_review">Under Review</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="resolved">Resolved</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                            <SelectTrigger className="w-[180px] border-orange-100 h-10">
                                <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                {Object.entries(CATEGORIES).map(([key, label]) => (
                                    <SelectItem key={key} value={key}>{label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Button variant="outline" onClick={exportToCSV} className="hidden md:flex h-10 border-orange-100 hover:bg-orange-50 shrink-0 gap-2 text-slate-600">
                        <Download className="h-4 w-4" />
                        <span>Export</span>
                    </Button>
                    <Button variant="outline" size="icon" onClick={fetchGrievances} className="h-10 w-10 border-orange-100 hover:bg-orange-50 shrink-0">
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Grievances List (Mobile Cards + Desktop Table) */}
            <div className="space-y-4">
                {filteredGrievances.length === 0 ? (
                    <Card className="border-orange-100 shadow-sm overflow-hidden">
                        <CardContent className="py-12 text-center">
                            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">No grievances found</p>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        {/* Mobile View: Cards */}
                        <div className="grid grid-cols-1 gap-4 md:hidden">
                            {paginatedGrievances.map((g) => (
                                <Card key={g.id} className="border-orange-100 shadow-sm hover:shadow-md transition-shadow">
                                    <CardContent className="p-4">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex flex-col">
                                                <span className="font-mono font-bold text-slate-800">{g.ticket_id}</span>
                                                <span className="text-xs text-slate-500">{formatToIST(g.created_at)}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Badge className={cn("text-[10px] px-2 py-0.5 border shadow-sm", calculateSLA(g.created_at, g.resolved_at, g.status).color)}>
                                                    {calculateSLA(g.created_at, g.resolved_at, g.status).label}
                                                </Badge>
                                                <Badge className={cn(STATUS_COLORS[g.status], "text-[10px] px-2 py-0.5 whitespace-nowrap")}>
                                                    {g.status.replace("_", " ")}
                                                </Badge>
                                            </div>
                                        </div>

                                        <div className="space-y-2 mb-4">
                                            <div>
                                                <p className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">
                                                    Raised By
                                                </p>
                                                <p className="font-medium text-sm">{g.customer_name}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">Category</p>
                                                <p className="text-sm text-slate-700">{CATEGORIES[g.category] || g.category}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 hover:border-orange-100 transition-colors">
                                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                                {g.assigned_to ? (
                                                    <span className="flex items-center gap-1 text-orange-600 font-medium">
                                                        <Users className="h-3 w-3" /> {g.assigned_to}
                                                    </span>
                                                ) : (
                                                    <span className="italic">Unassigned</span>
                                                )}
                                            </div>

                                            {/* Eye Button for Mobile Details */}
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-8 w-8 p-0 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-full"
                                                onClick={() => handleOpenDetail(g)}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Desktop View: Table */}
                        <Card className="border-orange-100 shadow-sm overflow-hidden hidden md:block">
                            <div className="w-full overflow-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                                        <tr>
                                            <th className="p-4 w-12">S.No</th>
                                            <th className="p-4">Date</th>
                                            <th className="p-4">Ticket</th>
                                            <th className="p-4">Raised By</th>
                                            <th className="p-4">Category</th>
                                            <th className="p-4">Status & SLA</th>
                                            <th className="p-4">Assigned To</th>
                                            <th className="p-4">Last Update</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white">
                                        {paginatedGrievances.map((g, index) => (
                                            <tr
                                                key={g.id}
                                                className="hover:bg-slate-50/50 cursor-pointer transition-colors"
                                                onClick={() => handleOpenDetail(g)}
                                            >
                                                <td className="p-4 text-slate-400">{startIndex + index + 1}</td>
                                                <td className="p-4 text-slate-600">
                                                    {formatToIST(g.created_at)}
                                                </td>
                                                <td className="p-4 font-mono font-bold text-black-600">{g.ticket_id}</td>
                                                <td className="p-4 font-medium text-slate-900">{g.customer_name}</td>
                                                <td className="p-4">
                                                    {CATEGORY_CONFIG[g.category] ? (
                                                        <Badge variant="outline" className={cn("font-bold uppercase tracking-wider text-[10px] flex items-center w-max gap-1 px-2.5 py-1", CATEGORY_CONFIG[g.category].border, CATEGORY_CONFIG[g.category].bg, CATEGORY_CONFIG[g.category].text)}>
                                                            <div className={cn("w-1.5 h-1.5 rounded-full mr-1", CATEGORY_CONFIG[g.category].color)} />
                                                            {CATEGORIES[g.category]}
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="font-normal text-slate-600 border-slate-200">
                                                            {CATEGORIES[g.category] || g.category}
                                                        </Badge>
                                                    )}
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex flex-col gap-1 items-start">
                                                        <Badge className={`${STATUS_COLORS[g.status]} hover:${STATUS_COLORS[g.status]} whitespace-nowrap`}>
                                                            {g.status === 'rejected' ? 'Action Required' : g.status.replace("_", " ")}
                                                        </Badge>
                                                        <Badge className={cn(
                                                            "text-[10px] font-medium border shadow-sm whitespace-nowrap",
                                                            calculateSLA(g.created_at, g.resolved_at, g.status).color
                                                        )}>
                                                            {calculateSLA(g.created_at, g.resolved_at, g.status).label}
                                                        </Badge>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-slate-600">
                                                    {g.assigned_to || <span className="text-slate-300 italic">Unassigned</span>}
                                                </td>
                                                <td className="p-4 text-xs text-slate-400">
                                                    {g.updated_at ? formatToIST(g.updated_at) : (g.status_updated_at ? formatToIST(g.status_updated_at) : formatToIST(g.created_at))}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>

                        {/* Pagination */}
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
                    </>
                )}
            </div>

            {/* Detail Dialog */}
            <Dialog open={!!selectedGrievance} onOpenChange={() => setSelectedGrievance(null)}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    {selectedGrievance && (
                        <>
                            <DialogHeader className="pb-2 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between px-2 pt-2">
                                <div className="space-y-1">
                                    <DialogTitle className="flex flex-wrap items-center gap-2 md:gap-3">
                                        <span className="text-2xl text-blue-600 font-black tracking-tight">{selectedGrievance.ticket_id}</span>
                                        <Badge className={cn("font-black uppercase tracking-widest text-[10px] px-2 py-0.5", STATUS_COLORS[selectedGrievance.status] || "bg-slate-500")}>
                                            {selectedGrievance.status === 'rejected' ? 'Action Required' : selectedGrievance.status.replace("_", " ")}
                                        </Badge>
                                    </DialogTitle>
                                </div>
                            </DialogHeader>

                            {/* Sub-Tabs */}
                            <Tabs value={dialogTab} onValueChange={(v) => setDialogTab(v as 'details' | 'assignment')} className="mt-4">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="details">Details</TabsTrigger>
                                    <TabsTrigger value="assignment" className="flex items-center gap-2">
                                        Assignment
                                        {assignmentHistory.length > 0 && (
                                            <Badge variant="secondary" className="h-5 px-1.5 text-xs">{assignmentHistory.length}</Badge>
                                        )}
                                    </TabsTrigger>
                                </TabsList>

                                {/* Details Tab */}
                                <TabsContent value="details" className="mt-6 space-y-5 px-1 pb-4">

                                    {/* Raised By Block */}
                                    {selectedGrievance.source_type === 'franchise' ? (
                                        <div className="p-5 bg-white rounded-2xl border-2 border-slate-100 shadow-sm">
                                            <h4 className="font-bold mb-4 flex items-center gap-2 text-xs uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-3">
                                                <Store className="h-4 w-4 text-orange-500" />
                                                Store Details
                                            </h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                <div>
                                                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1.5">Raised By</p>
                                                    <p className="font-bold text-slate-900 text-base">{selectedGrievance.customer_name}</p>
                                                </div>
                                                <div>
                                                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1.5">Registered Address</p>
                                                    <p className="font-medium text-slate-600 leading-snug">
                                                        {[selectedGrievance.franchise_address, selectedGrievance.franchise_city].filter(Boolean).join(", ") || <span className="text-slate-300 italic">Address unavailable</span>}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div className="p-5 bg-white rounded-2xl border-2 border-slate-100 shadow-sm">
                                                <h4 className="font-bold mb-4 flex items-center gap-2 text-xs uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-3">
                                                    <Users className="h-4 w-4 text-orange-500" />
                                                    Customer Contact
                                                </h4>
                                                <div className="space-y-4">
                                                    <div>
                                                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Name</p>
                                                        <p className="font-bold text-slate-900 text-sm">{selectedGrievance.customer_name}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Contact</p>
                                                        <p className="font-medium text-slate-600 text-sm">{selectedGrievance.customer_email}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="p-5 bg-white rounded-2xl border-2 border-slate-100 shadow-sm">
                                                <h4 className="font-bold mb-4 flex items-center gap-2 text-xs uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-3">
                                                    <Store className="h-4 w-4 text-orange-500" />
                                                    Servicing Franchise
                                                </h4>
                                                <div className="space-y-4">
                                                    <div>
                                                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Store Name</p>
                                                        <p className="font-bold text-slate-900 text-sm">{selectedGrievance.franchise_name || <span className="text-slate-300 italic">Not Linked</span>}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Location</p>
                                                        <p className="font-medium text-slate-600 text-sm">
                                                            {[selectedGrievance.franchise_address, selectedGrievance.franchise_city].filter(Boolean).join(", ") || <span className="text-slate-300 italic">-</span>}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Issue Core Display */}
                                    <div className="p-5 bg-slate-50 rounded-2xl border-2 border-slate-100 shadow-inner">
                                        <h4 className="font-bold mb-5 flex items-center gap-2 text-xs uppercase tracking-widest text-slate-500">
                                            <MessageSquare className="h-4 w-4" />
                                            Issue Details
                                        </h4>

                                        <div className="space-y-4">
                                            {/* Top Banner: Category & Subject */}
                                            <div className="flex flex-col md:flex-row md:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                                <div className="shrink-0 flex items-center">
                                                    {CATEGORY_CONFIG[selectedGrievance.category] ? (
                                                        <Badge variant="outline" className={cn("font-black uppercase tracking-widest text-[10px] flex items-center w-max gap-1.5 px-3 py-1.5", CATEGORY_CONFIG[selectedGrievance.category].border, CATEGORY_CONFIG[selectedGrievance.category].bg, CATEGORY_CONFIG[selectedGrievance.category].text)}>
                                                            <div className={cn("w-2 h-2 rounded-full", CATEGORY_CONFIG[selectedGrievance.category].color)} />
                                                            {CATEGORIES[selectedGrievance.category]}
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="font-black uppercase tracking-widest text-[10px] text-slate-600 border-slate-200 bg-slate-100 px-3 py-1.5">
                                                            {CATEGORIES[selectedGrievance.category] || selectedGrievance.category}
                                                        </Badge>
                                                    )}
                                                </div>

                                                <div className="w-px h-8 bg-slate-200 hidden md:block" />

                                                <div className="flex-1">
                                                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-0.5">Subject</p>
                                                    <p className="font-bold text-slate-900 text-base leading-tight">{selectedGrievance.subject || "No Subject"}</p>
                                                </div>

                                                {selectedGrievance.sub_category && (
                                                    <>
                                                        <div className="w-px h-8 bg-slate-200 hidden md:block" />
                                                        <div className="shrink-0 pr-4">
                                                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-0.5">Tags</p>
                                                            <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded-md">{selectedGrievance.sub_category}</span>
                                                        </div>
                                                    </>
                                                )}
                                            </div>

                                            {/* Description Card */}
                                            <div className="bg-white p-5 pt-6 rounded-xl border border-slate-200 shadow-sm relative mt-2">
                                                <div className="absolute -top-2.5 left-4 bg-white px-2 text-[10px] font-black uppercase tracking-widest text-slate-400 rounded">
                                                    Detailed Description
                                                </div>
                                                <p className="whitespace-pre-wrap text-slate-700 leading-relaxed font-medium text-sm">
                                                    {selectedGrievance.description || <span className="text-slate-300 italic">No description provided</span>}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Link to Warranty if applicable */}
                                    {selectedGrievance.category === 'warranty_issue' && (() => {
                                        // Extract warranty ID from description if not present in the field
                                        let linkedWarrantyId = selectedGrievance.warranty_id;
                                        if (!linkedWarrantyId && selectedGrievance.description) {
                                            const match = selectedGrievance.description.match(/Warranty ID: ([\w-]+)/);
                                            if (match && match[1]) {
                                                linkedWarrantyId = match[1];
                                            }
                                        }

                                        return (
                                            <div className="p-3 bg-orange-50/50 rounded-lg border border-orange-100 flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                                                        <ShieldCheck className="h-4 w-4 text-orange-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-slate-800">Related Warranty</p>
                                                        <p className="text-xs text-slate-500">
                                                            {linkedWarrantyId
                                                                ? `ID: ${linkedWarrantyId}`
                                                                : "Status: Warranty Linked"}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        if (linkedWarrantyId) {
                                                            handleViewWarranty(linkedWarrantyId);
                                                        } else {
                                                            toast({ description: "No Warranty ID linked to this grievance." });
                                                        }
                                                    }}
                                                    disabled={!linkedWarrantyId || loadingWarranty}
                                                    className="border-orange-200 text-orange-700 hover:bg-orange-100"
                                                >
                                                    {loadingWarranty ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
                                                    View Details
                                                </Button>
                                            </div>
                                        );
                                    })()}

                                    {selectedGrievance.attachments && (() => {
                                        try {
                                            const attachments = JSON.parse(selectedGrievance.attachments || "[]");
                                            if (Array.isArray(attachments) && attachments.length > 0) {
                                                return (
                                                    <div>
                                                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                                                            <Paperclip className="h-4 w-4" />
                                                            Attachments
                                                        </h4>
                                                        <div className="flex flex-wrap gap-2">
                                                            {attachments.map((url: string, idx: number) => (
                                                                <a key={idx} href={url} target="_blank" rel="noopener noreferrer"
                                                                    className="text-sm px-3 py-1 bg-orange-50 text-orange-600 border border-orange-100 rounded hover:bg-orange-100">
                                                                    Attachment {idx + 1}
                                                                </a>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            }
                                        } catch { return null; }
                                        return null;
                                    })()}

                                    {selectedGrievance.franchise_remarks && (
                                        <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
                                            <h4 className="font-semibold mb-1 text-amber-900">Franchise Remarks</h4>
                                            <p className="text-sm text-amber-800">{selectedGrievance.franchise_remarks}</p>
                                        </div>
                                    )}

                                    {selectedGrievance.customer_rating && (
                                        <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                                            <h4 className="font-semibold mb-1 text-green-900">Customer Feedback</h4>
                                            <div className="flex items-center gap-2">
                                                <span className="text-yellow-500">{"★".repeat(selectedGrievance.customer_rating)}</span>
                                                <span className="text-slate-500 text-sm">{selectedGrievance.customer_rating}/5</span>
                                            </div>
                                            {selectedGrievance.customer_feedback && (
                                                <p className="text-sm mt-1 text-green-800">{selectedGrievance.customer_feedback}</p>
                                            )}
                                        </div>
                                    )}

                                    <div className="p-5 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.03)] border-2 border-slate-100 rounded-2xl space-y-6 mt-4">
                                        <div>
                                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-3">Quick Update Status</p>
                                            <div className="flex flex-wrap gap-3 mt-1">
                                                {["under_review", "in_progress", "resolved"].map(status => {
                                                    const isActive = selectedGrievance.status === status;
                                                    return (
                                                        <Button key={status} size="sm"
                                                            variant={isActive ? "default" : "outline"}
                                                            className={cn(
                                                                "font-bold tracking-widest uppercase text-[11px] px-6 py-4 transition-all rounded-xl border-2",
                                                                isActive
                                                                    ? STATUS_COLORS[status] + " border-transparent text-white shadow-lg"
                                                                    : "border-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-50 hover:border-slate-200"
                                                            )}
                                                            onClick={() => handleStatusLocalUpdate(status)}>
                                                            {status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                                        </Button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-5 pt-2 border-t border-slate-100">
                                            <div>
                                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2.5 flex items-center justify-between">
                                                    Admin Remarks
                                                    <span className="text-orange-600 bg-orange-50 border border-orange-100 px-2 flex items-center h-5 rounded uppercase tracking-widest text-[8px]">Visible to Vendor</span>
                                                </p>
                                                <Textarea value={adminRemarks} onChange={(e) => setAdminRemarks(e.target.value)}
                                                    placeholder="Add reply or public notes..." rows={3} className="bg-slate-50 border-slate-200 focus:border-slate-300 rounded-xl" />
                                            </div>

                                            <div>
                                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2.5 flex justify-between items-center">
                                                    <span className="flex items-center gap-2">Internal Notes <span className="text-slate-500 bg-slate-100 border border-slate-200 px-2 flex items-center h-5 rounded uppercase tracking-widest text-[8px]">Private</span></span>
                                                    <span className="text-slate-300 font-medium">{adminNotes.length}/1000</span>
                                                </p>
                                                <Textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)}
                                                    maxLength={1000} placeholder="Private observations, hidden from vendor..."
                                                    rows={3} className="bg-amber-50/50 border-amber-200/60 focus:border-amber-400 rounded-xl placeholder:text-amber-700/40 text-amber-900" />
                                            </div>
                                        </div>

                                        <Button onClick={handleSaveChanges} disabled={updating} className="w-full h-12 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-orange-500/20 bg-orange-600 hover:bg-orange-700 transition-all">
                                            {updating ? (<><Loader2 className="h-4 w-4 mr-3 animate-spin" /> Committing Changes...</>) : "Save Grievance Updates"}
                                        </Button>
                                    </div>
                                </TabsContent>

                                {/* Assignment Tab */}
                                <TabsContent value="assignment" className="mt-4 space-y-4">
                                    <div className="p-4 border rounded-lg bg-blue-50/50">
                                        <h4 className="font-semibold mb-3 flex items-center gap-2 text-blue-900">
                                            <Mail className="h-4 w-4" />
                                            Send Assignment Email
                                        </h4>
                                        <div className="grid md:grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-xs text-slate-500">Select Department / Person</label>
                                                <Select
                                                    value={DEPARTMENTS.find(d => d.name === assigneeName)?.department || ""}
                                                    onValueChange={(val) => {
                                                        const dept = DEPARTMENTS.find(d => d.department === val);
                                                        if (dept) {
                                                            setAssigneeName(dept.name);
                                                            setAssigneeEmail(dept.email);
                                                        }
                                                    }}
                                                >
                                                    <SelectTrigger className="mt-1">
                                                        <SelectValue placeholder="Select Department" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {DEPARTMENTS.map((dept) => (
                                                            <SelectItem key={dept.department} value={dept.department}>
                                                                {dept.department} ({dept.name})
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <label className="text-xs text-slate-500">Assignee Email</label>
                                                <Input
                                                    type="email"
                                                    value={assigneeEmail}
                                                    readOnly
                                                    placeholder="Select department first"
                                                    className="mt-1 bg-slate-50 cursor-not-allowed"
                                                />
                                            </div>
                                        </div>
                                        <div className="mt-3">
                                            <label className="text-xs text-slate-500">Remarks for Assignee (Optional)</label>
                                            <Textarea value={assigneeRemarks} onChange={(e) => setAssigneeRemarks(e.target.value)}
                                                placeholder="Any additional notes or instructions..." rows={2} className="mt-1" />
                                        </div>
                                        <Button
                                            onClick={async () => {
                                                if (!assigneeName.trim() || !assigneeEmail.trim()) {
                                                    toast({ title: "Missing Info", description: "Please enter both name and email", variant: "destructive" });
                                                    return;
                                                }
                                                setSendingEmail(true);
                                                try {
                                                    const response = await api.post(`/grievance/${selectedGrievance.id}/send-assignment-email`, {
                                                        assigneeName: assigneeName.trim(),
                                                        assigneeEmail: assigneeEmail.trim(),
                                                        remarks: assigneeRemarks.trim() || undefined,
                                                        estimatedCompletionDate: estimatedCompletionDate || undefined,
                                                        assignmentType: assignmentHistory.length === 0 ? 'initial' : 'follow_up'
                                                    });
                                                    if (response.data.success) {
                                                        toast({ title: "Email Sent", description: response.data.message });
                                                        setSelectedGrievance(prev => prev ? { ...prev, assigned_to: assigneeName.trim() } : null);
                                                        setGrievances(prev => prev.map(g => g.id === selectedGrievance.id ? { ...g, assigned_to: assigneeName.trim() } : g));
                                                        setFilteredGrievances(prev => prev.map(g => g.id === selectedGrievance.id ? { ...g, assigned_to: assigneeName.trim() } : g));
                                                        const historyResponse = await api.get(`/grievance/${selectedGrievance.id}/assignments`);
                                                        if (historyResponse.data.success) setAssignmentHistory(historyResponse.data.data);
                                                        setAssigneeEmail("");
                                                        setAssigneeRemarks("");
                                                    }
                                                } catch (error: any) {
                                                    toast({ title: "Error", description: error.response?.data?.error || "Failed to send email", variant: "destructive" });
                                                } finally {
                                                    setSendingEmail(false);
                                                }
                                            }}
                                            disabled={sendingEmail || !assigneeName.trim() || !assigneeEmail.trim()}
                                            className="w-full mt-3 bg-blue-600 hover:bg-blue-700"
                                        >
                                            {sendingEmail ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending...</>) :
                                                (<><Send className="h-4 w-4 mr-2" /> {assignmentHistory.length === 0 ? 'Send Initial Assignment' : 'Send Follow-up'}</>)}
                                        </Button>
                                    </div>

                                    <div>
                                        <h4 className="font-semibold mb-3 flex items-center gap-2 text-slate-700">
                                            <Clock className="h-4 w-4" />
                                            Assignment History
                                        </h4>
                                        {loadingHistory ? (
                                            <div className="flex items-center justify-center py-8">
                                                <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                                            </div>
                                        ) : assignmentHistory.length === 0 ? (
                                            <div className="text-center py-8 text-slate-400 text-sm border border-dashed rounded-lg">
                                                No assignments yet. Send the first assignment above.
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {assignmentHistory.map((record) => (
                                                    <div key={record.id}
                                                        className={`p-3 rounded-lg border-l-4 ${record.assignment_type === 'initial'
                                                            ? 'bg-blue-50 border-l-blue-500'
                                                            : 'bg-amber-50 border-l-amber-500'}`}>
                                                        <div className="flex items-center justify-between mb-1">
                                                            <div className="flex items-center gap-2">
                                                                <Badge variant="outline" className="text-xs bg-white">
                                                                    {record.assignment_type === 'initial' ? '🔵 Initial' : '🟡 Follow-up'}
                                                                </Badge>
                                                                <span className="font-medium text-sm text-slate-800">{record.assignee_name}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Badge variant="secondary" className={`text-[10px] h-4 px-1 ${record.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                                    record.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                                                        record.status === 'follow_up_sent' ? 'bg-orange-100 text-orange-700' :
                                                                            'bg-slate-100 text-slate-600'
                                                                    }`}>
                                                                    {record.status.replace("_", " ").toUpperCase()}
                                                                </Badge>
                                                                <span className="text-xs text-slate-400">
                                                                    {new Date(record.email_sent_at).toLocaleString('en-IN', {
                                                                        day: 'numeric', month: 'short', year: 'numeric',
                                                                        hour: '2-digit', minute: '2-digit'
                                                                    })}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <p className="text-xs text-slate-500">{record.assignee_email}</p>
                                                        {record.remarks && (
                                                            <p className="text-sm mt-2 p-2 bg-white rounded border border-slate-100 text-slate-600">
                                                                <strong className="text-xs text-slate-400 block mb-1">ADMIN INSTRUCTIONS:</strong>
                                                                "{record.remarks}"
                                                            </p>
                                                        )}
                                                        {record.completion_remarks && (
                                                            <p className="text-sm mt-2 p-2 bg-green-50 rounded border border-green-100 text-green-700">
                                                                <strong className="text-xs text-green-400 block mb-1 uppercase">Assignee Update:</strong>
                                                                "{record.completion_remarks}"
                                                            </p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </>
                    )}
                </DialogContent>
            </Dialog>
            {/* Warranty Details Sheet */}
            <WarrantySpecSheet
                isOpen={showWarrantySheet}
                onClose={() => setShowWarrantySheet(false)}
                warranty={viewingWarranty}
            />
        </div>
    );
};
