import { useState, useEffect } from "react";
import api from "@/lib/api";
import { formatToIST, cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Loader2, RefreshCw, MessageSquare, Search, Paperclip, Store, User, Mail, Send, Clock, Eye, Filter, CheckCircle2, X, FileImage, FileVideo, FileText } from "lucide-react";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";

interface POSMRequest {
    id: number;
    ticket_id: string;
    franchise_id: string;
    store_name: string;
    contact_name: string;
    contact_email: string;
    requirement: string;
    status: string;
    internal_notes: string | null;
    created_at: string;
    updated_at: string;
}

interface Message {
    id: number;
    sender_id: string;
    sender_role: 'admin' | 'franchise';
    message: string | null;
    attachments: string[] | null;
    created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
    open: "bg-blue-500",
    under_review: "bg-purple-500",
    approved: "bg-green-500",
    in_production: "bg-orange-500",
    dispatched: "bg-teal-500",
    delivered: "bg-emerald-500",
    closed: "bg-gray-500",
    rejected: "bg-red-500"
};

const STATUS_OPTIONS = [
    { value: 'open', label: 'Open' },
    { value: 'under_review', label: 'Under Review' },
    { value: 'approved', label: 'Approved' },
    { value: 'in_production', label: 'In Production' },
    { value: 'dispatched', label: 'Dispatched' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'closed', label: 'Closed' },
    { value: 'rejected', label: 'Rejected' }
];

export const AdminPOSM = () => {
    const { toast } = useToast();
    const [requests, setRequests] = useState<POSMRequest[]>([]);
    const [filteredRequests, setFilteredRequests] = useState<POSMRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState<POSMRequest | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loadingMessages, setLoadingMessages] = useState(false);

    // Admin Update States
    const [tempStatus, setTempStatus] = useState("");
    const [tempInternalNotes, setTempInternalNotes] = useState("");
    const [updating, setUpdating] = useState(false);

    // Chat State
    const [newMessage, setNewMessage] = useState("");
    const [adminAttachments, setAdminAttachments] = useState<File[]>([]);
    const [sending, setSending] = useState(false);

    // Filters
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [activeTab, setActiveTab] = useState<'details' | 'chat'>('details');

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const response = await api.get("/posm/admin/all");
            if (response.data.success) {
                setRequests(response.data.data);
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: "Failed to fetch POSM requests",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchTicketDetails = async (id: number) => {
        try {
            setLoadingMessages(true);
            const response = await api.get(`/posm/${id}`);
            if (response.data.success) {
                setMessages(response.data.data.messages || []);
            }
        } catch (error) {
            console.error('Error fetching ticket messages:', error);
        } finally {
            setLoadingMessages(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    useEffect(() => {
        let result = requests;

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(r =>
                r.ticket_id.toLowerCase().includes(query) ||
                r.store_name.toLowerCase().includes(query) ||
                r.contact_name.toLowerCase().includes(query) ||
                r.requirement.toLowerCase().includes(query)
            );
        }

        // Status filter
        if (statusFilter !== "all") {
            result = result.filter(r => r.status === statusFilter);
        }

        setFilteredRequests(result);
        setCurrentPage(1); // Reset to first page when filters change
    }, [searchQuery, statusFilter, requests]);

    // Pagination Calculation
    const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedRequests = filteredRequests.slice(startIndex, startIndex + itemsPerPage);

    const handleOpenDetail = (r: POSMRequest) => {
        setSelectedRequest(r);
        setTempStatus(r.status);
        setTempInternalNotes(r.internal_notes || "");
        setActiveTab('details');
        fetchTicketDetails(r.id);
    };

    const handleSaveChanges = async () => {
        if (!selectedRequest) return;

        setUpdating(true);
        try {
            const response = await api.put(`/posm/${selectedRequest.id}/status`, {
                status: tempStatus,
                internalNotes: tempInternalNotes
            });

            if (response.data.success) {
                toast({ title: "Success", description: "Request updated successfully" });
                fetchRequests();
                // Update local selected request
                setSelectedRequest(prev => prev ? { ...prev, status: tempStatus, internal_notes: tempInternalNotes } : null);
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.response?.data?.error || "Failed to update request",
                variant: "destructive",
            });
        } finally {
            setUpdating(false);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!newMessage.trim() && adminAttachments.length === 0) || !selectedRequest) return;

        setSending(true);
        try {
            const formData = new FormData();
            formData.append("message", newMessage);
            adminAttachments.forEach(file => {
                formData.append("attachments", file);
            });

            const response = await api.post(`/posm/${selectedRequest.id}/messages`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.data.success) {
                setNewMessage("");
                setAdminAttachments([]);
                fetchTicketDetails(selectedRequest.id);
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: "Failed to send message",
                variant: "destructive",
            });
        } finally {
            setSending(false);
        }
    };

    const getFileIcon = (url: string) => {
        const ext = url.split('.').pop()?.toLowerCase();
        if (['jpg', 'jpeg', 'png', 'webp'].includes(ext!)) return <FileImage className="h-4 w-4" />;
        if (['mp4', 'mov', 'avi'].includes(ext!)) return <FileVideo className="h-4 w-4" />;
        return <FileText className="h-4 w-4" />;
    };

    const stats = {
        total: requests.length,
        open: requests.filter(r => r.status === 'open').length,
        active: requests.filter(r => !['closed', 'rejected', 'delivered'].includes(r.status)).length,
        completed: requests.filter(r => ['delivered', 'closed'].includes(r.status)).length
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
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-orange-100 shadow-sm bg-white/50 backdrop-blur-sm">
                    <CardContent className="pt-6">
                        <p className="text-3xl font-black text-slate-800">{stats.total}</p>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Requests</p>
                    </CardContent>
                </Card>
                <Card className="border-orange-100 shadow-sm bg-white/50 backdrop-blur-sm">
                    <CardContent className="pt-6">
                        <p className="text-3xl font-black text-blue-500">{stats.open}</p>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">New (Open)</p>
                    </CardContent>
                </Card>
                <Card className="border-orange-100 shadow-sm bg-white/50 backdrop-blur-sm">
                    <CardContent className="pt-6">
                        <p className="text-3xl font-black text-orange-500">{stats.active}</p>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">In Progress</p>
                    </CardContent>
                </Card>
                <Card className="border-orange-100 shadow-sm bg-white/50 backdrop-blur-sm">
                    <CardContent className="pt-6">
                        <p className="text-3xl font-black text-green-500">{stats.completed}</p>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fulfilled</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters Row */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-3xl border border-orange-50 shadow-sm">
                <div className="relative w-full md:w-[400px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search by Ticket ID, Franchise or Requirement..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-11 h-12 border-orange-100 focus:border-orange-200 rounded-2xl text-sm bg-slate-50/50"
                    />
                </div>

                <div className="flex w-full md:w-auto gap-3 items-center">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[180px] border-orange-100 h-12 rounded-2xl bg-slate-50/50">
                            <Filter className="h-4 w-4 mr-2 text-slate-400" />
                            <SelectValue placeholder="Status Filter" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl">
                            <SelectItem value="all">All Statuses</SelectItem>
                            {STATUS_OPTIONS.map(opt => (
                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Button
                        variant="outline"
                        size="icon"
                        onClick={fetchRequests}
                        className="h-12 w-12 border-orange-100 hover:bg-orange-50 rounded-2xl shrink-0"
                    >
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* List Desktop View */}
            <Card className="border-orange-100 shadow-sm overflow-hidden hidden md:block rounded-[32px]">
                <div className="w-full overflow-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-b border-orange-50">
                            <tr>
                                <th className="p-6">Date</th>
                                <th className="p-6">Ticket</th>
                                <th className="p-6">Franchise</th>
                                <th className="p-6">Requirement</th>
                                <th className="p-6">Status</th>
                                <th className="p-6 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-orange-50 bg-white">
                            {paginatedRequests.map((r) => (
                                <tr key={r.id} className="hover:bg-orange-50/30 transition-colors">
                                    <td className="p-6 text-slate-500 font-medium whitespace-nowrap">
                                        {formatToIST(r.created_at)}
                                    </td>
                                    <td className="p-6">
                                        <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-lg">
                                            {r.ticket_id}
                                        </span>
                                    </td>
                                    <td className="p-6">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-900">{r.store_name}</span>
                                            <span className="text-[10px] text-slate-400">{r.contact_name}</span>
                                        </div>
                                    </td>
                                    <td className="p-6 max-w-[300px]">
                                        <p className="truncate text-slate-600 font-medium">{r.requirement}</p>
                                    </td>
                                    <td className="p-6">
                                        <Badge className={cn(STATUS_COLORS[r.status], "shadow-sm uppercase text-[10px] h-6")}>
                                            {r.status.replace("_", " ")}
                                        </Badge>
                                    </td>
                                    <td className="p-6 text-right">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-10 w-10 p-0 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-xl"
                                            onClick={() => handleOpenDetail(r)}
                                        >
                                            <Eye className="h-5 w-5" />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {filteredRequests.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center text-slate-400 italic font-medium">
                                        No POSM requests found matching your filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Mobile Cards View */}
            <div className="md:hidden space-y-4">
                {paginatedRequests.map((r) => (
                    <Card key={r.id} className="border-orange-100 shadow-sm rounded-3xl overflow-hidden" onClick={() => handleOpenDetail(r)}>
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <Badge className={cn(STATUS_COLORS[r.status], "uppercase text-[9px] px-2")}>
                                    {r.status.replace("_", " ")}
                                </Badge>
                                <span className="text-[10px] font-bold text-slate-400 font-mono tracking-tighter bg-slate-50 px-2 py-1 rounded-lg">
                                    {r.ticket_id}
                                </span>
                            </div>
                            <h3 className="font-black text-slate-800 mb-1 leading-tight">{r.store_name}</h3>
                            <p className="text-xs text-slate-500 line-clamp-2 mb-4 font-medium">{r.requirement}</p>
                            <div className="flex justify-between items-center text-[10px] text-slate-400 pt-3 border-t border-orange-50">
                                <span className="flex items-center gap-1 font-bold italic">
                                    <Clock className="h-3 w-3" /> {formatToIST(r.created_at)}
                                </span>
                                <span className="font-bold uppercase tracking-widest text-orange-500">View Details →</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

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

            {/* Detail & Chat Dialog */}
            <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
                <DialogContent className="max-w-4xl h-[90vh] p-0 gap-0 overflow-hidden rounded-[40px] border-none">
                    <div className="sr-only">
                        <DialogTitle>POSM Request: {selectedRequest?.ticket_id}</DialogTitle>
                        <DialogDescription>View and manage the POSM request from {selectedRequest?.store_name}</DialogDescription>
                    </div>
                    {selectedRequest && (
                        <div className="flex flex-col h-full w-full overflow-hidden">
                            {/* Mobile Tab Switcher */}
                            <div className="lg:hidden sticky top-0 z-10 px-6 pt-10 pb-4 bg-white/80 backdrop-blur-xl border-b border-orange-50 shrink-0">
                                <div className="bg-slate-100 p-1.5 rounded-3xl flex gap-1">
                                    <Button
                                        variant="ghost"
                                        onClick={() => setActiveTab('details')}
                                        className={cn(
                                            "flex-1 rounded-2xl h-11 font-black text-[10px] uppercase tracking-widest transition-all duration-300",
                                            activeTab === 'details'
                                                ? "bg-white text-slate-900 shadow-sm"
                                                : "text-slate-400 hover:text-slate-600"
                                        )}
                                    >
                                        <FileText className={cn("h-4 w-4 mr-2 transition-transform", activeTab === 'details' && "scale-110")} />
                                        Details
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        onClick={() => setActiveTab('chat')}
                                        className={cn(
                                            "flex-1 rounded-2xl h-11 font-black text-[10px] uppercase tracking-widest transition-all duration-300",
                                            activeTab === 'chat'
                                                ? "bg-white text-slate-900 shadow-sm"
                                                : "text-slate-400 hover:text-slate-600"
                                        )}
                                    >
                                        <MessageSquare className={cn("h-4 w-4 mr-2 transition-transform", activeTab === 'chat' && "scale-110")} />
                                        Chat
                                    </Button>
                                </div>
                            </div>

                            <div className="flex flex-col lg:flex-row h-full w-full overflow-hidden">
                                {/* Details Pane (Left/Static) */}
                                <div className={cn(
                                    "w-full lg:w-[350px] h-full bg-slate-50 border-r border-orange-50 flex flex-col overflow-hidden shrink-0",
                                    activeTab !== 'details' && "hidden lg:flex"
                                )}>
                                    <div className="p-8 border-b border-orange-50 bg-white">
                                        <Badge className={cn(STATUS_COLORS[selectedRequest.status], "mb-4 h-6 uppercase text-[10px]")}>
                                            {selectedRequest.status.replace("_", " ")}
                                        </Badge>
                                        <h2 className="text-2xl font-black text-slate-800 mb-1">#{selectedRequest.ticket_id}</h2>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{formatToIST(selectedRequest.created_at)}</p>
                                    </div>

                                    <div className="p-8 flex-1 overflow-y-auto min-h-0 space-y-8 custom-scrollbar">
                                        {/* Requester Info */}
                                        <div className="space-y-4">
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500 flex items-center gap-2">
                                                <Store className="h-3 w-3" /> Requester Store
                                            </h4>
                                            <div className="bg-white p-5 rounded-3xl border border-orange-50 shadow-sm">
                                                <p className="font-black text-slate-800 leading-tight mb-2">{selectedRequest.store_name}</p>
                                                <div className="space-y-1">
                                                    <p className="text-xs text-slate-500 flex items-center gap-2 font-medium">
                                                        <User className="h-3 w-3" /> {selectedRequest.contact_name}
                                                    </p>
                                                    <p className="text-[11px] text-slate-400 flex items-center gap-2 font-mono">
                                                        <Mail className="h-3 w-3" /> {selectedRequest.contact_email}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Requirement */}
                                        <div className="space-y-4">
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500 flex items-center gap-2">
                                                <MessageSquare className="h-3 w-3" /> Requirement Details
                                            </h4>
                                            <div className="bg-white p-5 rounded-3xl border border-orange-50 shadow-sm italic text-slate-600 text-sm leading-relaxed">
                                                "{selectedRequest.requirement}"
                                            </div>
                                        </div>

                                        {/* Status & Notes Form */}
                                        <div className="space-y-6 pt-4 border-t border-orange-50">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Update Status</label>
                                                <Select value={tempStatus} onValueChange={setTempStatus}>
                                                    <SelectTrigger className="rounded-2xl border-orange-100 bg-white h-11 font-bold text-xs">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-2xl">
                                                        {STATUS_OPTIONS.map(opt => (
                                                            <SelectItem key={opt.value} value={opt.value} className="text-xs font-bold">{opt.label}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Internal Notes (Priv)</label>
                                                <Textarea
                                                    value={tempInternalNotes}
                                                    onChange={(e) => setTempInternalNotes(e.target.value)}
                                                    className="rounded-2xl border-orange-100 bg-white min-h-[100px] text-xs font-medium resize-none"
                                                    placeholder="Notes for admin eyes only..."
                                                />
                                            </div>

                                            <Button
                                                onClick={handleSaveChanges}
                                                disabled={updating}
                                                className="w-full bg-slate-900 border-none hover:bg-slate-800 text-white rounded-2xl h-11 font-black text-xs uppercase tracking-widest shadow-lg shadow-slate-100"
                                            >
                                                {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                {/* Chat Pane (Right/Flexible) */}
                                <div className={cn(
                                    "flex-1 min-w-0 h-full flex flex-col bg-white overflow-hidden",
                                    activeTab !== 'chat' && "hidden lg:flex"
                                )}>
                                    <div className="p-6 border-b border-orange-50 flex items-center justify-between">
                                        <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
                                            <MessageSquare className="h-5 w-5 text-orange-500" />
                                            Conversation History
                                        </h3>
                                    </div>

                                    <div className="flex-1 overflow-y-auto min-h-0 p-8 space-y-6 bg-slate-50/30 custom-scrollbar">
                                        {loadingMessages ? (
                                            <div className="flex justify-center p-12">
                                                <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                                            </div>
                                        ) : (
                                            messages.map((msg) => (
                                                <div
                                                    key={msg.id}
                                                    className={cn(
                                                        "flex flex-col max-w-[85%] md:max-w-[70%]",
                                                        msg.sender_role === 'admin' ? "ml-auto items-end" : "mr-auto items-start"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "p-5 rounded-[32px] shadow-sm text-sm font-medium leading-relaxed",
                                                        msg.sender_role === 'admin'
                                                            ? "bg-slate-900 text-white rounded-tr-none"
                                                            : "bg-white text-slate-700 border border-orange-50 rounded-tl-none"
                                                    )}>
                                                        {msg.message && <p className="whitespace-pre-wrap">{msg.message}</p>}

                                                        {msg.attachments && Array.isArray(msg.attachments) && msg.attachments.length > 0 && (
                                                            <div className="flex flex-wrap gap-2 mt-4">
                                                                {msg.attachments.map((url, i) => (
                                                                    <a
                                                                        key={i}
                                                                        href={url}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className={cn(
                                                                            "flex items-center gap-2 p-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                                                            msg.sender_role === 'admin'
                                                                                ? "bg-white/10 hover:bg-white/20 text-white"
                                                                                : "bg-orange-50 hover:bg-orange-100 text-orange-600"
                                                                        )}
                                                                    >
                                                                        {getFileIcon(url)}
                                                                        <span className="truncate max-w-[120px]">File {i + 1}</span>
                                                                    </a>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-2 px-2">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                                                            {msg.sender_role === 'admin' ? 'Support' : 'Franchise'}
                                                        </span>
                                                        <div className="w-1 h-1 rounded-full bg-slate-200" />
                                                        <span className="text-[10px] font-bold text-slate-300">
                                                            {formatToIST(msg.created_at)}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    <div className="p-8 border-t border-orange-50 bg-white">
                                        <form onSubmit={handleSendMessage} className="space-y-4">
                                            {adminAttachments.length > 0 && (
                                                <div className="flex flex-wrap gap-2 pb-2">
                                                    {adminAttachments.map((file, i) => (
                                                        <Badge key={i} variant="secondary" className="pr-1 gap-1 py-1 bg-orange-50 text-orange-700 border-orange-100">
                                                            <span className="truncate max-w-[150px]">{file.name}</span>
                                                            <X
                                                                className="h-3 w-3 cursor-pointer hover:text-red-500"
                                                                onClick={() => setAdminAttachments(prev => prev.filter((_, idx) => idx !== i))}
                                                            />
                                                        </Badge>
                                                    ))}
                                                </div>
                                            )}
                                            <div className="flex items-end gap-3">
                                                <div className="flex-1 relative">
                                                    <Textarea
                                                        placeholder="Write a message to the franchise..."
                                                        value={newMessage}
                                                        onChange={(e) => setNewMessage(e.target.value)}
                                                        className="min-h-[60px] max-h-[150px] rounded-3xl bg-slate-50 border-orange-50 focus:border-orange-200 focus:bg-white transition-all resize-none font-medium text-sm p-4 pr-12"
                                                    />
                                                    <div className="absolute right-3 bottom-3">
                                                        <input
                                                            type="file"
                                                            id="admin-chat-file"
                                                            multiple
                                                            className="hidden"
                                                            onChange={(e) => {
                                                                if (e.target.files) {
                                                                    setAdminAttachments(prev => [...prev, ...Array.from(e.target.files!)]);
                                                                }
                                                            }}
                                                        />
                                                        <label
                                                            htmlFor="admin-chat-file"
                                                            className="p-2 text-slate-400 hover:text-orange-500 cursor-pointer transition-colors block"
                                                        >
                                                            <Paperclip className="h-5 w-5" />
                                                        </label>
                                                    </div>
                                                </div>
                                                <Button
                                                    type="submit"
                                                    disabled={sending || (!newMessage.trim() && adminAttachments.length === 0)}
                                                    className="bg-orange-500 hover:bg-orange-600 text-white h-[60px] w-[60px] rounded-[24px] p-0 flex items-center justify-center shrink-0 shadow-lg shadow-orange-100 transition-all active:scale-95"
                                                >
                                                    {sending ? <Loader2 className="h-6 w-6 animate-spin" /> : <Send className="h-6 w-6" />}
                                                </Button>
                                            </div>
                                        </form>
                                        <p className="text-[10px] font-bold text-slate-300 mt-4 text-center uppercase tracking-widest">
                                            Franchise will be notified of your reply instantly via dashboard
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};
