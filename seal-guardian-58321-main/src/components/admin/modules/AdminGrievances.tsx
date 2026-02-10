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
import { Loader2, RefreshCw, MessageSquare, Search, Paperclip, Store, Users, Mail, Send, Clock, Eye, Filter, ShieldCheck, Download } from "lucide-react";
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
    product_issue: "Product Issue",
    billing_issue: "Billing Issue",
    store_issue: "Store/Dealer Issue",
    manpower_issue: "Manpower Issue",
    service_issue: "Service Issue",
    warranty_issue: "Warranty Issue",
    other: "Other",
};

const STATUS_COLORS: Record<string, string> = {
    submitted: "bg-gray-500",
    under_review: "bg-blue-500",
    in_progress: "bg-amber-500",
    resolved: "bg-green-500",
    rejected: "bg-red-500",
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
    const [activeTab, setActiveTab] = useState("customer");

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
        let result = grievances.filter(g => {
            // Filter by Tab (Source Type)
            if (activeTab === 'franchise') {
                return g.source_type === 'franchise';
            } else {
                // Customer tab shows 'customer' or anything undefined (legacy)
                return g.source_type !== 'franchise';
            }
        });

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

        setFilteredGrievances(result);
        setCurrentPage(1); // Reset to first page when filters change
    }, [searchQuery, statusFilter, grievances, activeTab]);

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
        // Filter grievances based on active tab
        const tabGrievances = grievances.filter(g =>
            activeTab === 'franchise'
                ? g.source_type === 'franchise'
                : g.source_type !== 'franchise'
        );

        const total = tabGrievances.length;
        const open = tabGrievances.filter(g => !["resolved", "rejected"].includes(g.status)).length;
        const resolved = tabGrievances.filter(g => ["resolved", "rejected"].includes(g.status)).length;
        const ratedGrievances = tabGrievances.filter(g => g.customer_rating);
        const avgRating = ratedGrievances.length > 0
            ? ratedGrievances.reduce((acc, g) => acc + (g.customer_rating || 0), 0) / ratedGrievances.length
            : 0;
        return { total, open, resolved, avgRating: avgRating.toFixed(1) };
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
            "Date", "Ticket ID", activeTab === 'customer' ? "Customer" : "Raised By",
            activeTab === 'customer' ? "Franchise" : "Department", "Category", "Subject", "Status", "Assigned To", "Last Update"
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
        link.download = `${activeTab}_grievances_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(link.href);

        toast({ title: "Exported", description: `${dataToExport.length} ${activeTab} grievances exported to CSV.` });
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
            <div className={`grid grid-cols-2 ${activeTab === 'customer' ? 'md:grid-cols-4' : 'md:grid-cols-3'} gap-3 md:gap-4`}>
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
                {activeTab === 'customer' && (
                    <Card className="border-orange-100 shadow-sm">
                        <CardContent className="pt-4 md:pt-6 p-4 md:p-6">
                            <p className="text-2xl md:text-3xl font-bold text-blue-500">⭐ {stats.avgRating}</p>
                            <p className="text-xs md:text-sm text-slate-500">Avg. Rating</p>
                        </CardContent>
                    </Card>
                )}
            </div>

            <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full xl:w-auto">
                    <TabsList className="bg-white border border-orange-100 p-1 rounded-lg w-full md:w-auto grid grid-cols-2 md:inline-flex">
                        <TabsTrigger
                            value="customer"
                            className="px-4 md:px-6 data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700 data-[state=active]:border-orange-200 transition-all flex items-center justify-center gap-2"
                        >
                            <Users className="h-4 w-4" />
                            <span className="truncate">Customer</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="franchise"
                            className="px-4 md:px-6 data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700 data-[state=active]:border-orange-200 transition-all flex items-center justify-center gap-2"
                        >
                            <Store className="h-4 w-4" />
                            <span className="truncate">Franchise</span>
                        </TabsTrigger>
                    </TabsList>
                </Tabs>

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
                                <DropdownMenuItem onClick={() => setStatusFilter("rejected")}>Rejected</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Desktop: Select Dropdown */}
                    <div className="hidden md:block">
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
                                <SelectItem value="rejected">Rejected</SelectItem>
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
                                            <Badge className={`${STATUS_COLORS[g.status]} text-[10px] px-2 py-0.5`}>
                                                {g.status.replace("_", " ")}
                                            </Badge>
                                        </div>

                                        <div className="space-y-2 mb-4">
                                            <div>
                                                <p className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">
                                                    {activeTab === 'customer' ? 'Customer' : 'Raised By'}
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
                                            <th className="p-4">
                                                {activeTab === 'customer' ? 'Customer' : 'Raised By'}
                                            </th>
                                            <th className="p-4">
                                                {activeTab === 'customer' ? 'Franchise' : 'To Department'}
                                            </th>
                                            <th className="p-4">Category</th>
                                            <th className="p-4">Status</th>
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
                                                <td className="p-4 font-mono font-medium text-slate-700">{g.ticket_id}</td>
                                                <td className="p-4 font-medium text-slate-900">{g.customer_name}</td>
                                                <td className="p-4 text-slate-500">{g.franchise_name || "-"}</td>
                                                <td className="p-4">
                                                    <Badge variant="outline" className="font-normal text-slate-600 border-slate-200">
                                                        {CATEGORIES[g.category] || g.category}
                                                    </Badge>
                                                </td>
                                                <td className="p-4">
                                                    <Badge className={`${STATUS_COLORS[g.status]} hover:${STATUS_COLORS[g.status]}`}>
                                                        {g.status.replace("_", " ")}
                                                    </Badge>
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
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <span>{selectedGrievance.ticket_id}</span>
                                    <Badge className={STATUS_COLORS[selectedGrievance.status]}>
                                        {selectedGrievance.status.replace("_", " ")}
                                    </Badge>
                                </DialogTitle>
                                <DialogDescription>{selectedGrievance.subject}</DialogDescription>
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
                                <TabsContent value="details" className="mt-4 space-y-4">
                                    {/* For Franchise Grievances - show clean "Raised By" section */}
                                    {selectedGrievance.source_type === 'franchise' ? (
                                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                                            <h4 className="font-semibold mb-4 flex items-center gap-2 text-base border-b pb-2 text-slate-800">
                                                <Store className="h-4 w-4" />
                                                Raised By
                                            </h4>
                                            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                                                <div>
                                                    <p className="text-slate-500 text-xs mb-1">Store Name</p>
                                                    <p className="font-medium">{selectedGrievance.customer_name}</p>
                                                </div>
                                                <div>
                                                    <p className="text-slate-500 text-xs mb-1">Email</p>
                                                    <p className="font-medium">{selectedGrievance.customer_email}</p>
                                                </div>
                                                {selectedGrievance.franchise_name && (
                                                    <div>
                                                        <p className="text-slate-500 text-xs mb-1">Grievance For (Department)</p>
                                                        <p className="font-medium text-orange-600">{selectedGrievance.franchise_name}</p>
                                                    </div>
                                                )}
                                                {(selectedGrievance.franchise_address || selectedGrievance.franchise_city) && (
                                                    <div className="col-span-2">
                                                        <p className="text-slate-500 text-xs mb-1">Address</p>
                                                        <p className="font-medium">
                                                            {[selectedGrievance.franchise_address, selectedGrievance.franchise_city].filter(Boolean).join(', ')}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        /* For Customer Grievances - show Customer and Franchise sections */
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                                                <h4 className="font-semibold mb-2 flex items-center gap-2 text-slate-800">
                                                    <Users className="h-4 w-4" />
                                                    Customer
                                                </h4>
                                                <div className="text-sm space-y-1">
                                                    <p className="font-medium">{selectedGrievance.customer_name}</p>
                                                    <p className="text-slate-500">{selectedGrievance.customer_email}</p>
                                                </div>
                                            </div>
                                            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                                                <h4 className="font-semibold mb-2 flex items-center gap-2 text-slate-800">
                                                    <Store className="h-4 w-4" />
                                                    Franchise
                                                </h4>
                                                <div className="text-sm space-y-1">
                                                    <p className="font-medium">{selectedGrievance.franchise_name || "Not specified"}</p>
                                                    {selectedGrievance.franchise_address && (
                                                        <p className="text-slate-500 text-xs">{selectedGrievance.franchise_address}</p>
                                                    )}
                                                    {selectedGrievance.franchise_city && (
                                                        <p className="text-slate-500 text-xs">{selectedGrievance.franchise_city}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <h4 className="font-semibold mb-2 text-slate-800">Issue Details</h4>
                                        <div className="space-y-3 text-sm">
                                            <p><strong className="text-slate-600">Category:</strong> {CATEGORIES[selectedGrievance.category] || selectedGrievance.category}</p>
                                            {selectedGrievance.sub_category && (
                                                <p><strong className="text-slate-600">Sub-Category:</strong> {selectedGrievance.sub_category}</p>
                                            )}
                                            <p><strong className="text-slate-600">Subject:</strong> {selectedGrievance.subject}</p>
                                            <div>
                                                <p className="mb-1"><strong className="text-slate-600">Description:</strong></p>
                                                <p className="whitespace-pre-wrap bg-slate-50 p-3 rounded border border-slate-100 text-slate-700">{selectedGrievance.description || "No description provided"}</p>
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

                                    <div className="flex flex-wrap gap-2">
                                        <span className="text-sm font-medium mr-2 self-center text-slate-600">Quick Actions:</span>
                                        {["under_review", "in_progress", "resolved", "rejected"].map(status => (
                                            <Button key={status} size="sm"
                                                variant={selectedGrievance.status === status ? "default" : "outline"}
                                                className={selectedGrievance.status === status ? STATUS_COLORS[status] : ""}
                                                onClick={() => handleStatusLocalUpdate(status)}>
                                                {status.replace("_", " ")}
                                            </Button>
                                        ))}
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-slate-700">Admin Remarks (Visible to Vendor)</label>
                                        <Textarea value={adminRemarks} onChange={(e) => setAdminRemarks(e.target.value)}
                                            placeholder="Add reply or public notes..." rows={3} className="mt-1" />
                                    </div>

                                    <div>
                                        <div className="flex justify-between">
                                            <label className="text-sm font-medium text-slate-700">Internal Notes (Private)</label>
                                            <span className="text-xs text-slate-400">{adminNotes.length}/1000</span>
                                        </div>
                                        <Textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)}
                                            maxLength={1000} placeholder="Private observations, hidden from vendor..."
                                            rows={3} className="mt-1 bg-yellow-50/30 border-yellow-100 focus:border-yellow-200" />
                                    </div>

                                    <Button onClick={handleSaveChanges} disabled={updating} className="w-full bg-orange-600 hover:bg-orange-700">
                                        {updating ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>) : "Save Changes"}
                                    </Button>
                                </TabsContent>

                                {/* Assignment Tab */}
                                <TabsContent value="assignment" className="mt-4 space-y-4">
                                    <div className="p-4 border rounded-lg bg-blue-50/50">
                                        <h4 className="font-semibold mb-3 flex items-center gap-2 text-blue-900">
                                            <Mail className="h-4 w-4" />
                                            Send Assignment Email
                                        </h4>
                                        <div className="grid md:grid-cols-3 gap-3">
                                            <div>
                                                <label className="text-xs text-slate-500">Assignee Name</label>
                                                <Input value={assigneeName} onChange={(e) => setAssigneeName(e.target.value)}
                                                    placeholder="Enter name" className="mt-1" />
                                            </div>
                                            <div>
                                                <label className="text-xs text-slate-500">Assignee Email</label>
                                                <Input type="email" value={assigneeEmail} onChange={(e) => setAssigneeEmail(e.target.value)}
                                                    placeholder="email@example.com" className="mt-1" />
                                            </div>
                                            <div>
                                                <label className="text-xs text-slate-500">Expected Resolution Date</label>
                                                <Input type="date" value={estimatedCompletionDate}
                                                    min={getISTTodayISO()}
                                                    onChange={(e) => setEstimatedCompletionDate(e.target.value)}
                                                    className="mt-1" />
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
