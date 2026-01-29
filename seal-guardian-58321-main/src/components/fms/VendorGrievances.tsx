import { useState, useEffect } from "react";
import api from "@/lib/api";
import { formatToIST, cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, RefreshCw, MessageSquare, AlertCircle, CheckCircle, Clock, Users, Building2, Package, Receipt, Store, Wrench, ShieldCheck, HelpCircle, Paperclip, Plus, X, Upload, Factory, Truck, UserCheck } from "lucide-react";
import { compressImage, isCompressibleImage } from "@/lib/imageCompression";
import { Pagination } from "./Pagination";

interface Grievance {
    id: number;
    ticket_id: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    category: string;
    sub_category: string | null;
    subject: string;
    description: string;
    attachments: string;
    status: string;
    franchise_remarks: string | null;
    admin_remarks: string | null;
    customer_rating: number | null;
    created_at: string;
    resolved_at: string | null;
    department?: string;
    departmentDetails?: string;
    department_details?: string;
}

interface GrievanceRemark {
    id: number;
    grievance_id: number;
    added_by: 'franchise' | 'admin';
    added_by_name: string;
    added_by_id: string;
    remark: string;
    created_at: string;
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

const CATEGORY_CONFIG: Record<string, { color: string; icon: any; border: string; bg: string; text: string }> = {
    product_issue: { color: "bg-orange-500", border: "border-orange-500", bg: "bg-orange-50", text: "text-orange-700", icon: Package },
    billing_issue: { color: "bg-green-500", border: "border-green-500", bg: "bg-green-50", text: "text-green-700", icon: Receipt },
    store_issue: { color: "bg-blue-500", border: "border-blue-500", bg: "bg-blue-50", text: "text-blue-700", icon: Store },
    manpower_issue: { color: "bg-purple-500", border: "border-purple-500", bg: "bg-purple-50", text: "text-purple-700", icon: Users },
    service_issue: { color: "bg-cyan-500", border: "border-cyan-500", bg: "bg-cyan-50", text: "text-cyan-700", icon: Wrench },
    warranty_issue: { color: "bg-amber-500", border: "border-amber-500", bg: "bg-amber-50", text: "text-amber-700", icon: ShieldCheck },
    other: { color: "bg-slate-500", border: "border-slate-500", bg: "bg-slate-50", text: "text-slate-700", icon: HelpCircle },
};

const STATUS_CONFIG: Record<string, { color: string; icon: any; label: string }> = {
    submitted: { color: "bg-gray-500", icon: Clock, label: "Submitted" },
    under_review: { color: "bg-blue-500", icon: AlertCircle, label: "Under Review" },
    in_progress: { color: "bg-amber-500", icon: RefreshCw, label: "In Progress" },
    resolved: { color: "bg-green-500", icon: CheckCircle, label: "Resolved" },
    rejected: { color: "bg-red-500", icon: AlertCircle, label: "Rejected" },
};

const FRANCHISE_CATEGORIES = [
    { value: "product_issue", label: "Product Issue" },
    { value: "warranty_issue", label: "Warranty Issue" },
    { value: "logistics_issue", label: "Logistics Issue" },
    { value: "stock_issue", label: "Stock Issue" },
    { value: "software_issue", label: "Software/Portal Issue" },
    { value: "other", label: "Other" },
];

const DEPARTMENTS = [
    { value: "plant", label: "Plant", icon: Factory, requiresDetails: false },
    { value: "distributor", label: "Distributor", icon: Truck, requiresDetails: true },
    { value: "asm", label: "ASM", icon: UserCheck, requiresDetails: true },
];

const VendorGrievances = () => {
    const { toast } = useToast();
    const [grievances, setGrievances] = useState<Grievance[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedGrievance, setSelectedGrievance] = useState<Grievance | null>(null);
    const [remarks, setRemarks] = useState("");
    const [updating, setUpdating] = useState(false);
    const [remarksHistory, setRemarksHistory] = useState<GrievanceRemark[]>([]);
    const [loadingRemarks, setLoadingRemarks] = useState(false);

    // My Grievance state
    const [myGrievances, setMyGrievances] = useState<any[]>([]);
    const [loadingMyGrievances, setLoadingMyGrievances] = useState(false);
    const [showNewGrievanceForm, setShowNewGrievanceForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Pagination states
    const [customerLimit, setCustomerLimit] = useState(15);
    const [myGrievanceLimit, setMyGrievanceLimit] = useState(15);
    const [customerPagination, setCustomerPagination] = useState({ currentPage: 1, totalPages: 1, totalCount: 0, limit: 15 });
    const [myGrievancePagination, setMyGrievancePagination] = useState({ currentPage: 1, totalPages: 1, totalCount: 0, limit: 15 });

    // Form state
    const [activeTab, setActiveTab] = useState("customer");
    const [department, setDepartment] = useState("");
    const [departmentDetails, setDepartmentDetails] = useState("");
    const [category, setCategory] = useState("");
    const [subject, setSubject] = useState("");
    const [description, setDescription] = useState("");
    const [attachment1, setAttachment1] = useState<File | null>(null);
    const [attachment2, setAttachment2] = useState<File | null>(null);
    const [attachment3, setAttachment3] = useState<File | null>(null);
    const [compressing, setCompressing] = useState(false);

    const fetchGrievances = async (page = 1, currentLimit = customerLimit) => {
        setLoading(true);
        try {
            const response = await api.get(`/grievance/vendor?page=${page}&limit=${currentLimit}`);
            if (response.data.success) {
                setGrievances(response.data.data);
                if (response.data.pagination) setCustomerPagination(response.data.pagination);
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

    const fetchMyGrievances = async (page = 1, currentLimit = myGrievanceLimit) => {
        setLoadingMyGrievances(true);
        try {
            const response = await api.get(`/grievance/franchise/submitted?page=${page}&limit=${currentLimit}`);
            if (response.data.success) {
                setMyGrievances(response.data.data);
                if (response.data.pagination) setMyGrievancePagination(response.data.pagination);
            }
        } catch (error: any) {
            console.error("Failed to fetch my grievances", error);
        } finally {
            setLoadingMyGrievances(false);
        }
    };

    useEffect(() => {
        fetchGrievances();
        fetchMyGrievances();
    }, []);

    const handleAttachmentChange = async (
        e: React.ChangeEvent<HTMLInputElement>,
        setter: React.Dispatch<React.SetStateAction<File | null>>
    ) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (isCompressibleImage(file)) {
                setCompressing(true);
                try {
                    const compressed = await compressImage(file);
                    setter(compressed);
                    toast({ title: "Image Compressed", description: "Image optimized for upload." });
                } catch (error) {
                    console.error("Compression failed", error);
                    setter(file); // Fallback
                } finally {
                    setCompressing(false);
                }
            } else {
                setter(file);
            }
        }
    };

    const handleSubmitGrievance = async () => {
        if (!department || !category || !subject.trim() || !description.trim()) {
            toast({
                title: "Missing Fields",
                description: "Please fill in all required fields",
                variant: "destructive"
            });
            return;
        }

        const selectedDept = DEPARTMENTS.find(d => d.value === department);
        if (selectedDept?.requiresDetails && !departmentDetails.trim()) {
            toast({
                title: "Missing Details",
                description: `Please provide Name/Details for ${selectedDept.label}`,
                variant: "destructive"
            });
            return;
        }

        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('department', department);
            if (departmentDetails) formData.append('departmentDetails', departmentDetails);
            formData.append('category', category);
            formData.append('subject', subject);
            formData.append('description', description);

            if (attachment1) formData.append('attachments', attachment1);
            if (attachment2) formData.append('attachments', attachment2);
            if (attachment3) formData.append('attachments', attachment3);

            const response = await api.post('/grievance/franchise', formData, {
                headers: { 'Content-Type': undefined }
            });

            if (response.data.success) {
                toast({
                    title: "Grievance Submitted",
                    description: "Your grievance has been submitted successfully.",
                    className: "bg-green-500 text-white"
                });
                setShowNewGrievanceForm(false);
                // Reset form
                setDepartment("");
                setDepartmentDetails("");
                setCategory("");
                setSubject("");
                setDescription("");
                setAttachment1(null);
                setAttachment2(null);
                setAttachment3(null);
                // Refresh list
                fetchMyGrievances();
            }
        } catch (error: any) {
            console.error("Submit grievance error:", error);
            toast({
                title: "Submission Failed",
                description: error.response?.data?.error || "Failed to submit grievance",
                variant: "destructive"
            });
        } finally {
            setSubmitting(false);
        }
    };

    const fetchRemarksHistory = async (grievanceId: number) => {
        setLoadingRemarks(true);
        try {
            const response = await api.get(`/grievance/${grievanceId}/remarks`);
            if (response.data.success) {
                setRemarksHistory(response.data.data);
            }
        } catch (error) {
            console.error("Failed to fetch remarks history", error);
        } finally {
            setLoadingRemarks(false);
        }
    };

    const handleOpenDetail = (g: Grievance) => {
        setSelectedGrievance(g);
        setRemarks(""); // Clear input on open
        fetchRemarksHistory(g.id);
    };

    const handleUpdate = async () => {
        if (!selectedGrievance || !remarks.trim()) return;

        setUpdating(true);
        try {
            await api.put(`/grievance/${selectedGrievance.id}/remarks`, { remarks });
            toast({ title: "Remarks Added", description: "Your response has been logged in history." });
            setRemarks(""); // Clear input
            fetchRemarksHistory(selectedGrievance.id); // Refresh history
            fetchGrievances(customerPagination.currentPage, customerLimit); // Refresh main list
        } catch (error: any) {
            toast({
                title: "Failed to Add Remark",
                description: error.response?.data?.error || "An error occurred",
                variant: "destructive",
            });
        } finally {
            setUpdating(false);
        }
    };


    if (loading) {
        return (
            <div className="flex items-center justify-center h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="animate-in fade-in duration-700">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-8">
                {/* Header Container */}
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 md:gap-6 sticky top-0 z-30 bg-white py-3 md:py-4 px-3 md:px-2 -mx-3 md:-mx-2 rounded-2xl md:rounded-3xl border border-orange-100 shadow-[0_8px_30px_rgba(0,0,0,0.02)]">

                    {/* Mobile: Refresh Icon Top Right */}
                    <div className="flex md:hidden justify-end w-full absolute top-2 right-2 z-20">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                fetchGrievances();
                                fetchMyGrievances();
                            }}
                            className="h-8 w-8 rounded-full text-orange-600 hover:bg-orange-50 p-0"
                        >
                            <RefreshCw className={`h-4 w-4 ${loading || loadingMyGrievances ? "animate-spin" : ""}`} />
                        </Button>
                    </div>

                    {/* Tabs List */}
                    <TabsList className="bg-white p-1 rounded-full h-10 md:h-11 w-full md:w-auto grid grid-cols-2 md:inline-flex gap-0.5 shadow-sm border border-orange-100 mt-6 md:mt-0">
                        <TabsTrigger
                            value="customer"
                            className="relative z-10 rounded-full px-4 md:px-8 py-1.5 md:py-2 text-[10px] md:text-sm font-black md:font-bold text-slate-500 data-[state=active]:text-orange-600 data-[state=active]:bg-orange-50/50 data-[state=active]:shadow-sm transition-all duration-500 ease-out whitespace-nowrap flex items-center justify-center gap-1.5 md:gap-2 uppercase md:normal-case"
                        >
                            <Users className="h-3.5 w-3.5 md:h-4 md:w-4" />
                            Customer
                        </TabsTrigger>
                        <TabsTrigger
                            value="my"
                            className="relative z-10 rounded-full px-4 md:px-8 py-1.5 md:py-2 text-[10px] md:text-sm font-black md:font-bold text-slate-500 data-[state=active]:text-orange-600 data-[state=active]:bg-orange-50/50 data-[state=active]:shadow-sm transition-all duration-500 ease-out whitespace-nowrap flex items-center justify-center gap-1.5 md:gap-2 uppercase md:normal-case"
                        >
                            <Building2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
                            My Grievance
                        </TabsTrigger>
                    </TabsList>

                    {/* Desktop Refresh Button */}
                    <div className="hidden md:flex items-center gap-2 md:gap-3 w-full md:w-auto">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                fetchGrievances();
                                fetchMyGrievances();
                            }}
                            className="h-10 md:h-11 flex-1 md:flex-none px-6 rounded-full border-orange-100 text-orange-600 font-bold hover:bg-orange-50 transition-all flex items-center justify-center gap-2 shadow-sm text-xs md:text-sm"
                        >
                            <RefreshCw className={`h-3.5 w-3.5 md:h-4 md:w-4 ${loading || loadingMyGrievances ? "animate-spin" : ""}`} />
                            Refresh
                        </Button>
                    </div>

                    {/* Mobile: Raise New Concern (Only for My Grievance Tab) */}
                    {activeTab === 'my' && (
                        <div className="flex md:hidden w-full">
                            <Button
                                onClick={() => setShowNewGrievanceForm(true)}
                                className="w-full h-11 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-black uppercase tracking-widest shadow-xl shadow-orange-600/20 transition-all active:scale-95 flex items-center justify-center gap-2 text-xs"
                            >
                                <Plus className="h-4 w-4" />
                                Raise New Concern
                            </Button>
                        </div>
                    )}
                </div>

                {/* Customer Grievance Tab Content */}
                <TabsContent value="customer" className="mt-0 outline-none space-y-4">

                    {/* Grievances List */}
                    {grievances.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                <p className="text-muted-foreground">No grievances received yet</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {grievances.map((g) => {
                                const categoryConfig = CATEGORY_CONFIG[g.category] || CATEGORY_CONFIG['other'];
                                const CategoryIcon = categoryConfig.icon;

                                return (
                                    <div
                                        key={g.id}
                                        onClick={() => handleOpenDetail(g)}
                                        className={`group relative flex items-center gap-3 md:gap-4 p-3 md:p-5 bg-white hover:bg-orange-50/30 transition-all duration-300 rounded-[18px] md:rounded-[24px] border border-slate-100 hover:border-orange-200 shadow-sm hover:shadow-xl cursor-pointer active:scale-[0.99] ${categoryConfig.border?.replace('border-', 'border-l-[6px] border-l-')}`}
                                    >
                                        {/* Icon Box */}
                                        <div className={`h-9 w-9 md:h-12 md:w-12 rounded-lg md:rounded-xl flex items-center justify-center shrink-0 ${categoryConfig.bg} ${categoryConfig.text}`}>
                                            <CategoryIcon className="w-4 h-4 md:w-6 md:h-6" />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-mono text-[9px] md:text-xs text-muted-foreground bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded uppercase font-black tracking-tight">{g.ticket_id}</span>
                                                <Badge variant="outline" className={`${STATUS_CONFIG[g.status]?.color?.replace('bg-', 'text-')} border-0 bg-transparent font-black tracking-widest text-[9px] md:text-[10px] pl-0 uppercase`}>
                                                    • {STATUS_CONFIG[g.status]?.label}
                                                </Badge>
                                            </div>
                                            <h3 className="font-black text-slate-800 text-sm md:text-base truncate tracking-tight">{g.subject}</h3>
                                            <p className="text-[10px] md:text-sm text-slate-400 truncate font-bold uppercase tracking-widest opacity-70">
                                                {g.customer_name} • {CATEGORIES[g.category] || g.category}
                                                <span className="text-[9px] md:text-xs opacity-60 ml-2">• {formatToIST(g.created_at)}</span>
                                            </p>
                                        </div>

                                        {/* Arrow/Action */}
                                        <div className="shrink-0 text-muted-foreground/30 group-hover:text-primary transition-colors">
                                            {/* Minimal hover indicator */}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {customerPagination.totalPages > 0 && (
                        <div className="mt-8 flex justify-end pb-8">
                            <Pagination
                                currentPage={customerPagination.currentPage}
                                totalPages={customerPagination.totalPages}
                                onPageChange={fetchGrievances}
                                rowsPerPage={customerLimit}
                                onRowsPerPageChange={(rows) => {
                                    setCustomerLimit(rows);
                                    fetchGrievances(1, rows);
                                }}
                            />
                        </div>
                    )}
                </TabsContent>

                {/* My Grievance Tab Content */}
                <TabsContent value="my" className="mt-0 outline-none space-y-6">
                    <div className="hidden md:flex justify-end mb-2">
                        <Button
                            onClick={() => setShowNewGrievanceForm(true)}
                            className="h-12 px-8 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-black uppercase tracking-widest shadow-xl shadow-orange-600/20 transition-all active:scale-95 flex items-center gap-2"
                        >
                            <Plus className="h-5 w-5" />
                            Raise New Concern
                        </Button>
                    </div>

                    {loadingMyGrievances ? (
                        <div className="flex items-center justify-center p-12">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : myGrievances.length === 0 ? (
                        <Card className="border-dashed">
                            <CardContent className="py-12 text-center">
                                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                <p className="text-muted-foreground">You haven't submitted any grievances yet</p>
                                <Button variant="link" onClick={() => setShowNewGrievanceForm(true)}>
                                    Submit your first grievance
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {myGrievances.map((g) => {
                                const categoryConfig = CATEGORY_CONFIG[g.category] || CATEGORY_CONFIG['other'];
                                const CategoryIcon = categoryConfig.icon;

                                return (
                                    <div
                                        key={g.id}
                                        onClick={() => handleOpenDetail(g)}
                                        className={`group relative flex items-center gap-3 md:gap-4 p-4 md:p-5 bg-white hover:bg-orange-50/30 transition-all duration-300 rounded-[18px] md:rounded-[24px] border border-slate-100 hover:border-orange-200 shadow-sm hover:shadow-xl cursor-pointer active:scale-[0.99] ${categoryConfig.border?.replace('border-', 'border-l-[6px] border-l-')}`}
                                    >
                                        <div className={`h-11 w-11 md:h-14 md:w-14 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-transform duration-500 group-hover:scale-110 ${categoryConfig.bg} ${categoryConfig.text}`}>
                                            <CategoryIcon className="w-5 h-5 md:w-7 md:h-7" />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mb-1.5">
                                                <span className="font-mono text-[8px] md:text-[10px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 md:px-2 md:py-1 rounded-md border border-slate-100">{g.ticket_id}</span>
                                                <Badge variant="outline" className={`${STATUS_CONFIG[g.status]?.color?.replace('bg-', 'text-')} border-0 bg-transparent font-black tracking-widest text-[8px] md:text-[10px] uppercase pl-0`}>
                                                    • {STATUS_CONFIG[g.status]?.label}
                                                </Badge>
                                                <Badge variant="secondary" className="text-[8px] md:text-[10px] font-black uppercase tracking-widest bg-slate-50 text-slate-400 border-slate-100 shrink-0">
                                                    To: {g.department_display || g.department?.toUpperCase()}
                                                </Badge>
                                            </div>
                                            <h3 className="font-black text-slate-800 text-sm md:text-lg truncate tracking-tight group-hover:text-orange-600 transition-colors">{g.subject}</h3>
                                            <p className="text-[8px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate opacity-70">
                                                {CATEGORIES[g.category] || FRANCHISE_CATEGORIES.find(c => c.value === g.category)?.label || g.category}
                                                <span className="mx-1 md:mx-2 opacity-30">•</span>
                                                {formatToIST(g.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {myGrievancePagination.totalPages > 0 && (
                        <div className="mt-8 flex justify-end pb-8">
                            <Pagination
                                currentPage={myGrievancePagination.currentPage}
                                totalPages={myGrievancePagination.totalPages}
                                onPageChange={fetchMyGrievances}
                                rowsPerPage={myGrievanceLimit}
                                onRowsPerPageChange={(rows) => {
                                    setMyGrievanceLimit(rows);
                                    fetchMyGrievances(1, rows);
                                }}
                            />
                        </div>
                    )}

                    {/* New Grievance Dialog */}
                    <Dialog open={showNewGrievanceForm} onOpenChange={setShowNewGrievanceForm}>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 border-0 rounded-[30px] shadow-2xl bg-white">
                            <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100 bg-slate-50/50">
                                <DialogTitle className="text-xl font-black text-slate-800">Submit New Grievance</DialogTitle>
                                <DialogDescription className="text-slate-500">
                                    Report an issue to Plant, Distributor, or ASM.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-5 p-6">
                                {/* Department Selection */}
                                <div className="grid grid-cols-3 gap-3">
                                    {DEPARTMENTS.map((dept) => {
                                        const Icon = dept.icon;
                                        const isSelected = department === dept.value;
                                        return (
                                            <div
                                                key={dept.value}
                                                onClick={() => setDepartment(dept.value)}
                                                className={cn(
                                                    "cursor-pointer rounded-2xl border-2 p-3 md:p-4 flex flex-col items-center justify-center gap-2 transition-all hover:shadow-md",
                                                    isSelected
                                                        ? "border-orange-500 bg-orange-50 ring-2 ring-orange-500/20 shadow-lg shadow-orange-500/10"
                                                        : "border-slate-100 bg-white hover:border-slate-200"
                                                )}
                                            >
                                                <div className={cn(
                                                    "h-10 w-10 md:h-12 md:w-12 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                                                    isSelected ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30" : "bg-slate-100 text-slate-400"
                                                )}>
                                                    <Icon className="h-5 w-5 md:h-6 md:w-6" />
                                                </div>
                                                <span className={cn(
                                                    "font-black text-[10px] md:text-xs uppercase tracking-widest text-center",
                                                    isSelected ? "text-orange-600" : "text-slate-500"
                                                )}>{dept.label}</span>
                                            </div>
                                        );
                                    })}
                                </div>

                                {department && DEPARTMENTS.find(d => d.value === department)?.requiresDetails && (
                                    <div className="animate-in fade-in slide-in-from-top-2">
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 block">
                                            {department === 'distributor' ? 'Distributor Name/Details' : 'ASM Name/Details'} <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="flex h-12 w-full rounded-2xl border-2 border-slate-100 bg-slate-50/50 px-4 py-2 text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all"
                                            placeholder={`Enter ${department === 'distributor' ? 'distributor' : 'ASM'} name`}
                                            value={departmentDetails}
                                            onChange={(e) => setDepartmentDetails(e.target.value)}
                                        />
                                    </div>
                                )}

                                {/* Category */}
                                <div>
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 block">Category <span className="text-red-500">*</span></label>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                        {FRANCHISE_CATEGORIES.map((cat) => (
                                            <div
                                                key={cat.value}
                                                onClick={() => setCategory(cat.value)}
                                                className={cn(
                                                    "cursor-pointer rounded-xl border-2 px-3 py-3 text-xs md:text-sm text-center font-bold transition-all hover:shadow-sm",
                                                    category === cat.value
                                                        ? "border-orange-500 bg-orange-50 text-orange-600 ring-1 ring-orange-500/20"
                                                        : "text-slate-600 border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50"
                                                )}
                                            >
                                                {cat.label}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Subject */}
                                <div>
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 block">Subject <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        className="flex h-12 w-full rounded-2xl border-2 border-slate-100 bg-slate-50/50 px-4 py-2 text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all"
                                        placeholder="Brief title of the issue"
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                    />
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 block">Description <span className="text-red-500">*</span></label>
                                    <Textarea
                                        value={description}
                                        onChange={(e: any) => setDescription(e.target.value)}
                                        placeholder="Detailed description of the issue..."
                                        rows={4}
                                        className="rounded-2xl border-2 border-slate-100 bg-slate-50/50 px-4 py-3 text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all resize-none"
                                    />
                                </div>

                                {/* Attachments */}
                                <div>
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 block flex items-center gap-2">
                                        <Paperclip className="h-4 w-4" />
                                        Attachments (Optional - Max 3)
                                    </label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {[
                                            { file: attachment1, setter: setAttachment1, id: 1 },
                                            { file: attachment2, setter: setAttachment2, id: 2 },
                                            { file: attachment3, setter: setAttachment3, id: 3 }
                                        ].map((slot) => (
                                            <div key={slot.id} className="relative">
                                                <input
                                                    type="file"
                                                    id={`attachment-${slot.id}`}
                                                    className="hidden"
                                                    accept="image/*"
                                                    onChange={(e) => handleAttachmentChange(e, slot.setter)}
                                                />
                                                <label
                                                    htmlFor={`attachment-${slot.id}`}
                                                    className={cn(
                                                        "flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-4 h-28 cursor-pointer transition-all",
                                                        slot.file
                                                            ? "border-orange-400 bg-orange-50"
                                                            : "border-slate-200 hover:border-orange-300 hover:bg-orange-50/30"
                                                    )}
                                                >
                                                    {slot.file ? (
                                                        <>
                                                            <CheckCircle className="h-7 w-7 text-orange-500 mb-1" />
                                                            <span className="text-[10px] text-orange-600 font-bold truncate max-w-full px-1 text-center">
                                                                {slot.file.name.length > 12 ? slot.file.name.substring(0, 12) + '...' : slot.file.name}
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Upload className="h-6 w-6 text-slate-400 mb-1" />
                                                            <span className="text-[10px] text-slate-400 font-medium">Upload</span>
                                                        </>
                                                    )}
                                                </label>
                                                {slot.file && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            slot.setter(null);
                                                        }}
                                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600 transition-colors"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-2 text-center">
                                        Supported: JPG, PNG, JPEG
                                    </p>
                                </div>

                                <div className="pt-2">
                                    <Button
                                        onClick={handleSubmitGrievance}
                                        disabled={submitting || compressing}
                                        className="w-full h-12 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-widest shadow-xl shadow-slate-900/20 transition-all hover:translate-y-[-1px] active:translate-y-[0px]"
                                    >
                                        {submitting || compressing ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                {compressing ? "Compressing..." : "Submitting..."}
                                            </>
                                        ) : (
                                            "Submit Grievance"
                                        )}
                                    </Button>
                                    <p className="text-[10px] text-center text-slate-400 mt-3">
                                        Your grievance will be sent to the selected department and tracked by admin.
                                    </p>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </TabsContent>
            </Tabs>

            {/* Global Detail Dialog - Fixed scrolling and height */}
            <Dialog open={!!selectedGrievance} onOpenChange={() => setSelectedGrievance(null)}>
                <DialogContent className="max-w-2xl h-[85vh] p-0 border-0 rounded-[30px] overflow-hidden shadow-2xl flex flex-col font-sans bg-white">
                    <DialogHeader className="sr-only">
                        <DialogTitle>Grievance Details</DialogTitle>
                        <DialogDescription>
                            Details for grievance {selectedGrievance?.ticket_id}
                        </DialogDescription>
                    </DialogHeader>
                    {selectedGrievance && (
                        <div className="flex flex-col h-full bg-white overflow-hidden">
                            {/* Header Section - Sticky-like */}
                            <div className="px-6 md:px-8 pt-8 pb-6 bg-slate-50/50 border-b border-slate-100 flex-shrink-0">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <Badge variant="outline" className="bg-white border-slate-200 text-slate-500 font-bold tracking-widest uppercase text-[10px] shadow-sm">
                                            {selectedGrievance.ticket_id}
                                        </Badge>
                                        <Badge className={cn(
                                            "font-black tracking-widest text-[10px] uppercase px-3 py-1 rounded-full shadow-sm",
                                            STATUS_CONFIG[selectedGrievance.status]?.color || "bg-slate-500"
                                        )}>
                                            {STATUS_CONFIG[selectedGrievance.status]?.label}
                                        </Badge>
                                    </div>
                                </div>
                                <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight leading-tight">
                                    {selectedGrievance.subject}
                                </h2>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-2">
                                    <Clock className="h-3 w-3" />
                                    {formatToIST(selectedGrievance.created_at)}
                                </p>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 custom-scrollbar bg-white">
                                {/* Target Info: Either Customer or Department */}
                                {selectedGrievance.department ? (
                                    <div className="p-4 bg-orange-50/50 border border-orange-100 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400 mb-3">Target Department</h4>
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/10">
                                                {(() => {
                                                    const deptValue = (selectedGrievance.department || "").toLowerCase();
                                                    const dept = DEPARTMENTS.find(d => d.value.toLowerCase() === deptValue);
                                                    const Icon = dept?.icon || Building2;
                                                    return <Icon className="h-6 w-6" />;
                                                })()}
                                            </div>
                                            <div>
                                                <div className="font-black text-slate-800 text-base uppercase tracking-tight">
                                                    {DEPARTMENTS.find(d => (d.value || "").toLowerCase() === (selectedGrievance.department || "").toLowerCase())?.label || selectedGrievance.department}
                                                </div>
                                                {(selectedGrievance.department_details || selectedGrievance.departmentDetails) && (
                                                    <div className="text-sm text-slate-500 font-bold opacity-80">
                                                        {selectedGrievance.department_details || selectedGrievance.departmentDetails}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400 mb-3">Customer Details</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-slate-400 uppercase">Name</p>
                                                <p className="font-bold text-slate-700">{selectedGrievance.customer_name || 'N/A'}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-slate-400 uppercase">Phone</p>
                                                <p className="font-bold text-slate-700">{selectedGrievance.customer_phone || 'N/A'}</p>
                                            </div>
                                            <div className="sm:col-span-2 space-y-1">
                                                <p className="text-[10px] font-black text-slate-400 uppercase">Email</p>
                                                <p className="font-bold text-slate-700">{selectedGrievance.customer_email || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Issue Details */}
                                <div className="space-y-4">
                                    {/* Subject and Category explicit display */}
                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="space-y-1">
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">Subject</h4>
                                            <p className="font-bold text-slate-800 text-sm md:text-base border-b border-slate-100 pb-2">
                                                {selectedGrievance.subject}
                                            </p>
                                        </div>

                                        <div className="space-y-1">
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">Category</h4>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-slate-200 uppercase text-[9px] font-black tracking-widest">
                                                    {(() => {
                                                        const val = String(selectedGrievance.category || "").trim().toLowerCase();
                                                        return CATEGORIES[val] ||
                                                            FRANCHISE_CATEGORIES.find(c => c.value.toLowerCase() === val)?.label ||
                                                            selectedGrievance.category || "N/A";
                                                    })()}
                                                </Badge>
                                                {selectedGrievance.sub_category && (
                                                    <Badge variant="outline" className="border-slate-200 text-slate-500 uppercase text-[9px] font-black tracking-widest">
                                                        {selectedGrievance.sub_category}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="text-slate-600 text-base bg-slate-50/50 p-5 rounded-2xl border border-slate-100/50 leading-relaxed whitespace-pre-wrap font-medium">
                                            {selectedGrievance.description}
                                        </div>
                                    </div>

                                    {/* Attachments Section */}
                                    {(() => {
                                        let attachments: string[] = [];
                                        try {
                                            if (Array.isArray(selectedGrievance.attachments)) {
                                                attachments = selectedGrievance.attachments;
                                            } else if (typeof selectedGrievance.attachments === 'string' && selectedGrievance.attachments) {
                                                attachments = JSON.parse(selectedGrievance.attachments);
                                            }
                                        } catch (e) {
                                            console.error("Failed to parse attachments", e);
                                        }

                                        if (attachments && attachments.length > 0) {
                                            return (
                                                <div className="pt-4">
                                                    <h4 className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400 mb-3 flex items-center gap-2">
                                                        <Paperclip className="h-3 w-3" />
                                                        Attachments ({attachments.length})
                                                    </h4>
                                                    <div className="flex flex-wrap gap-3">
                                                        {attachments.map((url, idx) => (
                                                            <div key={idx} className="group relative h-20 w-20 md:h-24 md:w-24 rounded-xl overflow-hidden border border-slate-200 hover:border-orange-500 transition-all shadow-sm hover:shadow-md">
                                                                <a
                                                                    href={url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="block h-full w-full"
                                                                >
                                                                    <img
                                                                        src={url}
                                                                        alt={`Attachment ${idx + 1}`}
                                                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                                    />
                                                                </a>
                                                                <a
                                                                    href={url}
                                                                    download={`attachment-${idx + 1}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="absolute bottom-1 right-1 p-1.5 bg-white/90 hover:bg-white text-orange-600 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                                                                    title="Download"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    <Upload className="h-3.5 w-3.5 rotate-180" />
                                                                </a>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    })()}
                                </div>

                                {/* Response History / Remarks Log */}
                                <div className="space-y-4 pt-6 mt-4 border-t border-slate-100">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400 flex items-center gap-2">
                                        <Clock className="h-3 w-3" />
                                        Response History & Remarks
                                    </h4>

                                    {loadingRemarks ? (
                                        <div className="flex items-center gap-2 text-xs text-slate-400 p-4">
                                            <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
                                            Loading history...
                                        </div>
                                    ) : remarksHistory.length === 0 ? (
                                        <div className="bg-slate-50/50 rounded-2xl p-6 text-center border border-dashed border-slate-200">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No response recorded yet</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                            {remarksHistory.map((remark) => (
                                                <div key={remark.id} className={cn(
                                                    "p-4 rounded-2xl border transition-all",
                                                    remark.added_by === 'admin'
                                                        ? "bg-blue-50/30 border-blue-100 ml-0 mr-8"
                                                        : "bg-orange-50/30 border-orange-100 ml-8 mr-0"
                                                )}>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className={cn(
                                                            "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded",
                                                            remark.added_by === 'admin' ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"
                                                        )}>
                                                            {remark.added_by_name} ({remark.added_by})
                                                        </span>
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                                                            {formatToIST(remark.created_at)}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-slate-700 leading-relaxed font-medium">
                                                        {remark.remark}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Add New Remark Section */}
                                    <div className="space-y-3 pt-4 border-t border-slate-100">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">Add New Remark</h4>
                                        <Textarea
                                            value={remarks}
                                            onChange={(e) => setRemarks(e.target.value)}
                                            placeholder="Add your response or internal notes..."
                                            rows={4}
                                            className="rounded-2xl border-slate-200 focus:border-orange-500 focus:ring-orange-500/10 min-h-[120px] text-sm font-medium"
                                        />
                                        <Button
                                            onClick={handleUpdate}
                                            disabled={updating || !remarks.trim()}
                                            className="w-full h-12 rounded-2xl bg-slate-900 border-0 text-white font-black uppercase tracking-widest shadow-xl shadow-slate-900/10 hover:bg-slate-800 transition-all hover:translate-y-[-1px] active:translate-y-[0px] flex items-center justify-center"
                                        >
                                            {updating ? (
                                                <div className="flex items-center gap-2">
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Sending...
                                                </div>
                                            ) : (
                                                <>
                                                    <Plus className="h-4 w-4 mr-2" />
                                                    Post Official Remark
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div >
    );
};

export default VendorGrievances;
