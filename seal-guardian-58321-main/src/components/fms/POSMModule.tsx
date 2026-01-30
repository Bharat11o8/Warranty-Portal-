import React, { useState, useEffect } from 'react';
import {
    Plus,
    MessageSquare,
    FileText,
    Clock,
    ChevronRight,
    Send,
    Paperclip,
    X,
    FileImage,
    FileVideo,
    FileBox,
    Loader2
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { cn, formatToIST } from "@/lib/utils";

interface POSMRequest {
    id: number;
    ticket_id: string;
    requirement: string;
    status: string;
    created_at: string;
    updated_at: string;
}

interface Message {
    id: number;
    sender_role: 'admin' | 'franchise';
    message: string | null;
    attachments: string[] | null;
    created_at: string;
}

const POSMModule: React.FC = () => {
    const { toast } = useToast();
    const [requests, setRequests] = useState<POSMRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState<POSMRequest | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loadingMessages, setLoadingMessages] = useState(false);

    // New Request Form
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newRequirement, setNewRequirement] = useState('');
    const [attachments, setAttachments] = useState<File[]>([]);
    const [submitting, setSubmitting] = useState(false);


    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const response = await api.get('/posm');
            if (response.data.success) {
                setRequests(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching POSM requests:', error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to load POSM requests"
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
            console.error('Error fetching ticket details:', error);
        } finally {
            setLoadingMessages(false);
        }
    };

    const handleCreateRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newRequirement.trim()) return;

        try {
            setSubmitting(true);
            const formData = new FormData();
            formData.append('requirement', newRequirement);
            attachments.forEach(file => {
                formData.append('attachments', file);
            });

            const response = await api.post('/posm', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.data.success) {
                toast({
                    title: "Success",
                    description: "POSM request created successfully"
                });
                setIsCreateModalOpen(false);
                setNewRequirement('');
                setAttachments([]);
                fetchRequests();
            }
        } catch (error) {
            console.error('Error creating request:', error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to create request"
            });
        } finally {
            setSubmitting(false);
        }
    };


    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            open: "bg-blue-100 text-blue-700 border-blue-200",
            under_review: "bg-purple-100 text-purple-700 border-purple-200",
            approved: "bg-green-100 text-green-700 border-green-200",
            in_production: "bg-orange-100 text-orange-700 border-orange-200",
            dispatched: "bg-teal-100 text-teal-700 border-teal-200",
            delivered: "bg-emerald-100 text-emerald-700 border-emerald-200",
            closed: "bg-gray-100 text-gray-700 border-gray-200",
            rejected: "bg-red-100 text-red-700 border-red-200"
        };
        return colors[status] || "bg-gray-100 text-gray-700";
    };

    const getFileIcon = (url: string) => {
        const ext = url.split('.').pop()?.toLowerCase();
        if (['jpg', 'jpeg', 'png', 'webp'].includes(ext!)) return <FileImage className="h-4 w-4" />;
        if (['mp4', 'mov', 'avi'].includes(ext!)) return <FileVideo className="h-4 w-4" />;
        return <FileText className="h-4 w-4" />;
    };

    return (
        <div className="flex flex-col h-[calc(100vh-12rem)] md:h-[calc(100vh-10rem)] bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
            <div className="flex flex-col md:flex-row h-full">
                {/* Left Sidebar: Request List */}
                <div className={cn(
                    "w-full md:w-80 border-r border-gray-100 flex flex-col bg-gray-50/50",
                    selectedRequest ? "hidden md:flex" : "flex"
                )}>
                    <div className="p-4 border-b border-gray-100 bg-white flex justify-between items-center">
                        <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                            <FileBox className="h-5 w-5 text-brand-orange" />
                            My Requests
                        </h2>
                        <Button
                            size="sm"
                            onClick={() => setIsCreateModalOpen(true)}
                            className="bg-brand-orange hover:bg-brand-orange/90 text-white rounded-xl h-8 px-3"
                        >
                            <Plus className="h-4 w-4 mr-1" />
                            New
                        </Button>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="flex justify-center p-8">
                                <Loader2 className="h-6 w-6 animate-spin text-brand-orange" />
                            </div>
                        ) : requests.length === 0 ? (
                            <div className="p-8 text-center">
                                <p className="text-gray-500 text-sm">No POSM requests found.</p>
                                <Button
                                    variant="link"
                                    onClick={() => setIsCreateModalOpen(true)}
                                    className="text-brand-orange mt-2"
                                >
                                    Raise your first request
                                </Button>
                            </div>
                        ) : (
                            requests.map((req) => (
                                <div
                                    key={req.id}
                                    onClick={() => {
                                        setSelectedRequest(req);
                                        fetchTicketDetails(req.id);
                                    }}
                                    className={cn(
                                        "p-4 border-b border-gray-100 cursor-pointer transition-all hover:bg-white",
                                        selectedRequest?.id === req.id ? "bg-white border-l-4 border-l-brand-orange shadow-sm" : ""
                                    )}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="text-xs font-mono text-gray-400">#{req.ticket_id}</span>
                                        <Badge className={cn("text-[10px] uppercase font-bold", getStatusColor(req.status))}>
                                            {req.status.replace('_', ' ')}
                                        </Badge>
                                    </div>
                                    <p className="text-sm font-medium text-gray-800 line-clamp-1 mb-2">
                                        {req.requirement}
                                    </p>
                                    <div className="flex items-center text-[11px] text-gray-400">
                                        <Clock className="h-3 w-3 mr-1" />
                                        {formatToIST(req.created_at)}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Right Area: Chat Interface */}
                <div className={cn(
                    "flex-1 flex flex-col bg-white",
                    !selectedRequest ? "hidden md:flex items-center justify-center italic text-gray-400 p-8 text-center" : "flex"
                )}>
                    {!selectedRequest ? (
                        <div className="flex flex-col items-center max-w-sm">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                <MessageSquare className="h-10 w-10 text-gray-200" />
                            </div>
                            <h3 className="text-gray-600 font-medium non-italic">Select a Ticket</h3>
                            <p className="text-sm">Click on a request from the sidebar to view the conversation and status updates.</p>
                        </div>
                    ) : (
                        <>
                            {/* Chat Header */}
                            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="md:hidden h-8 w-8"
                                        onClick={() => setSelectedRequest(null)}
                                    >
                                        <ChevronRight className="h-5 w-5 rotate-180" />
                                    </Button>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-gray-800">#{selectedRequest.ticket_id}</h3>
                                            <Badge className={cn("text-[10px] uppercase", getStatusColor(selectedRequest.status))}>
                                                {selectedRequest.status.replace('_', ' ')}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-gray-500 truncate max-w-[200px] md:max-w-md">
                                            {selectedRequest.requirement}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Messages Area */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30">
                                {loadingMessages ? (
                                    <div className="flex justify-center p-8">
                                        <Loader2 className="h-6 w-6 animate-spin text-brand-orange" />
                                    </div>
                                ) : (
                                    messages.map((msg) => (
                                        <div
                                            key={msg.id}
                                            className={cn(
                                                "flex flex-col max-w-[85%] md:max-w-[70%]",
                                                msg.sender_role === 'franchise' ? "ml-auto items-end" : "mr-auto items-start"
                                            )}
                                        >
                                            <div className={cn(
                                                "p-3 rounded-2xl shadow-sm text-sm",
                                                msg.sender_role === 'franchise'
                                                    ? "bg-brand-orange text-white rounded-tr-none"
                                                    : "bg-white text-gray-800 border border-gray-100 rounded-tl-none"
                                            )}>
                                                {msg.message && <p className="mb-2 whitespace-pre-wrap">{msg.message}</p>}

                                                {msg.attachments && Array.isArray(msg.attachments) && msg.attachments.length > 0 && (
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        {msg.attachments.map((url, i) => (
                                                            <a
                                                                key={i}
                                                                href={url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className={cn(
                                                                    "flex items-center gap-2 p-2 rounded-lg text-xs transition-colors",
                                                                    msg.sender_role === 'franchise'
                                                                        ? "bg-white/20 hover:bg-white/30 text-white"
                                                                        : "bg-gray-50 hover:bg-gray-100 text-gray-600"
                                                                )}
                                                            >
                                                                {getFileIcon(url)}
                                                                <span className="truncate max-w-[100px]">Attachment {i + 1}</span>
                                                            </a>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <span className="text-[10px] text-gray-400 mt-1 uppercase font-semibold">
                                                {msg.sender_role} • {formatToIST(msg.created_at)}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Information Area */}
                            <div className="p-6 border-t border-gray-100 bg-gray-50/50">
                                <p className="text-[11px] font-black text-slate-400 text-center uppercase tracking-[0.2em] leading-relaxed">
                                    This conversation is view-only. Our admin team will provide updates here.
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Create Request Modal */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent className="sm:max-w-[500px] rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-gray-800">Create POSM Request</DialogTitle>
                        <DialogDescription>
                            Please describe your POSM requirement clearly. You can upload images or documents to help us understand better.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleCreateRequest} className="space-y-4 py-2">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">Your Requirement</label>
                            <Textarea
                                placeholder="Describe what you need (e.g., store signage, banners, catalog stands...)"
                                value={newRequirement}
                                onChange={(e) => setNewRequirement(e.target.value)}
                                className="min-h-[120px] rounded-xl bg-gray-50/50 border-gray-100 focus:bg-white transition-all"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">Attachments (Images/PDFs/Videos)</label>
                            <div className="flex flex-col gap-2">
                                <input
                                    type="file"
                                    id="modal-file"
                                    multiple
                                    className="hidden"
                                    onChange={(e) => {
                                        if (e.target.files) {
                                            setAttachments(prev => [...prev, ...Array.from(e.target.files!)]);
                                        }
                                    }}
                                />
                                <label
                                    htmlFor="modal-file"
                                    className="border-2 border-dashed border-gray-100 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-brand-orange/20 transition-all text-gray-400 hover:text-brand-orange"
                                >
                                    <Paperclip className="h-8 w-8 mb-2" />
                                    <span className="text-sm font-medium">Click to upload files</span>
                                    <span className="text-xs">Supports: Images, Videos, PDFs, Excel</span>
                                </label>

                                {attachments.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {attachments.map((file, i) => (
                                            <Badge key={i} variant="secondary" className="pr-1 gap-1 py-1 bg-orange-50 text-orange-700 border-orange-100">
                                                {file.name}
                                                <X
                                                    className="h-3 w-3 cursor-pointer hover:text-red-500"
                                                    onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))}
                                                />
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <DialogFooter className="pt-4">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setIsCreateModalOpen(false)}
                                className="rounded-xl"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={submitting || !newRequirement.trim()}
                                className="bg-brand-orange hover:bg-brand-orange/90 text-white rounded-xl px-8 shadow-lg shadow-orange-100"
                            >
                                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                Submit Request
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default POSMModule;
