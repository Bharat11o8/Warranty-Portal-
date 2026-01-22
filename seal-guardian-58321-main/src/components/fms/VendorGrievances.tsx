import { useState, useEffect } from "react";
import api from "@/lib/api";
import { formatToIST } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, RefreshCw, MessageSquare, AlertCircle, CheckCircle, Clock, Users, Building2, Package, Receipt, Store, Wrench, ShieldCheck, HelpCircle, Paperclip, Plus, X, Upload, Factory, Truck, UserCheck } from "lucide-react";
import { compressImage, isCompressibleImage } from "@/lib/imageCompression";

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

const VendorGrievances = () => {
    const { toast } = useToast();
    const [grievances, setGrievances] = useState<Grievance[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedGrievance, setSelectedGrievance] = useState<Grievance | null>(null);
    const [remarks, setRemarks] = useState("");
    const [updating, setUpdating] = useState(false);

    // My Grievance state
    const [myGrievances, setMyGrievances] = useState<any[]>([]);
    const [loadingMyGrievances, setLoadingMyGrievances] = useState(false);
    const [showNewGrievanceForm, setShowNewGrievanceForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [department, setDepartment] = useState("");
    const [departmentDetails, setDepartmentDetails] = useState("");
    const [category, setCategory] = useState("");
    const [subject, setSubject] = useState("");
    const [description, setDescription] = useState("");
    const [attachment1, setAttachment1] = useState<File | null>(null);
    const [attachment2, setAttachment2] = useState<File | null>(null);
    const [attachment3, setAttachment3] = useState<File | null>(null);
    const [compressing, setCompressing] = useState(false);

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

    const fetchGrievances = async () => {
        setLoading(true);
        try {
            const response = await api.get("/grievance/vendor");
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

    const fetchMyGrievances = async () => {
        setLoadingMyGrievances(true);
        try {
            const response = await api.get("/grievance/franchise/submitted");
            if (response.data.success) {
                setMyGrievances(response.data.data);
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
                headers: { 'Content-Type': 'multipart/form-data' }
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

    const handleOpenDetail = (g: Grievance) => {
        setSelectedGrievance(g);
        setRemarks(g.franchise_remarks || "");
    };

    const handleUpdate = async () => {
        if (!selectedGrievance) return;

        setUpdating(true);
        try {
            // Update remarks if changed
            if (remarks !== (selectedGrievance.franchise_remarks || "")) {
                await api.put(`/grievance/${selectedGrievance.id}/remarks`, { remarks });
                toast({ title: "Updated", description: "Remarks updated successfully" });
                setSelectedGrievance(null);
                fetchGrievances();
            } else {
                // If nothing changed, just close
                setSelectedGrievance(null);
            }
        } catch (error: any) {
            toast({
                title: "Update Failed",
                description: error.response?.data?.error || "Failed to update grievance",
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
        <div className="space-y-6">
            <Tabs defaultValue="customer" className="w-full">
                <TabsList className="bg-muted/50 p-1 rounded-lg mb-6 w-full md:w-auto inline-flex">
                    <TabsTrigger
                        value="customer"
                        className="flex-1 md:flex-none px-6 py-2.5 rounded-md text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all flex items-center gap-2"
                    >
                        <Users className="h-4 w-4" />
                        Customer Grievance
                    </TabsTrigger>
                    <TabsTrigger
                        value="my"
                        className="flex-1 md:flex-none px-6 py-2.5 rounded-md text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all flex items-center gap-2"
                    >
                        <Building2 className="h-4 w-4" />
                        My Grievance
                    </TabsTrigger>
                </TabsList>

                {/* Customer Grievance Tab Content */}
                <TabsContent value="customer" className="mt-0 outline-none">

                    {/* Refresh Button */}
                    <div className="flex justify-end mb-4">
                        <Button variant="outline" size="sm" onClick={fetchGrievances}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh
                        </Button>
                    </div>

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
                                        className={`group relative flex items-center gap-4 p-4 bg-white hover:bg-accent/5 transition-all rounded-r-xl rounded-l-md border-l-[6px] shadow-sm hover:shadow-md cursor-pointer ${categoryConfig.border}`}
                                    >
                                        {/* Icon Box */}
                                        <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${categoryConfig.bg} ${categoryConfig.text}`}>
                                            <CategoryIcon className="w-6 h-6" />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-mono text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{g.ticket_id}</span>
                                                <Badge variant="outline" className={`${STATUS_CONFIG[g.status]?.color?.replace('bg-', 'text-')} border-0 bg-transparent font-semibold pl-0`}>
                                                    • {STATUS_CONFIG[g.status]?.label}
                                                </Badge>
                                            </div>
                                            <h3 className="font-semibold text-base truncate">{g.subject}</h3>
                                            <p className="text-sm text-muted-foreground truncate">
                                                {g.customer_name} • {CATEGORIES[g.category] || g.category}
                                                <span className="text-xs opacity-60 ml-2">• {formatToIST(g.created_at)}</span>
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

                    {/* Detail Dialog */}
                    <Dialog open={!!selectedGrievance} onOpenChange={() => setSelectedGrievance(null)}>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            {selectedGrievance && (
                                <>
                                    <DialogHeader>
                                        <DialogTitle className="flex items-center gap-2">
                                            <span>{selectedGrievance.ticket_id}</span>
                                            <Badge className={STATUS_CONFIG[selectedGrievance.status]?.color}>
                                                {STATUS_CONFIG[selectedGrievance.status]?.label}
                                            </Badge>
                                        </DialogTitle>
                                        <DialogDescription>
                                            {formatToIST(selectedGrievance.created_at)}
                                        </DialogDescription>
                                    </DialogHeader>

                                    <div className="space-y-4 mt-4">
                                        {/* Customer Info */}
                                        <div className="p-4 bg-muted rounded-lg">
                                            <h4 className="font-semibold mb-2">Customer Details</h4>
                                            <div className="grid grid-cols-2 gap-2 text-sm">
                                                <div>Name: {selectedGrievance.customer_name}</div>
                                                <div>Phone: {selectedGrievance.customer_phone}</div>
                                                <div className="col-span-2">Email: {selectedGrievance.customer_email}</div>
                                            </div>
                                        </div>

                                        {/* Issue Details */}
                                        <div>
                                            <h4 className="font-semibold mb-2">Issue Details</h4>
                                            <p className="text-sm text-muted-foreground mb-1">
                                                Category: {CATEGORIES[selectedGrievance.category]}
                                                {selectedGrievance.sub_category && ` > ${selectedGrievance.sub_category}`}
                                            </p>
                                            <h5 className="font-medium">{selectedGrievance.subject}</h5>
                                            <p className="text-sm mt-2">{selectedGrievance.description}</p>

                                            {/* Attachments */}
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
                                                        <div className="mt-4">
                                                            <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                                                                <Paperclip className="h-3 w-3" />
                                                                Attachments
                                                            </h5>
                                                            <div className="flex flex-wrap gap-2">
                                                                {attachments.map((url, idx) => (
                                                                    <a
                                                                        key={idx}
                                                                        href={url}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="block h-16 w-16 rounded-md overflow-hidden border hover:opacity-80 transition-opacity"
                                                                    >
                                                                        <img
                                                                            src={url}
                                                                            alt={`Attachment ${idx + 1}`}
                                                                            className="h-full w-full object-cover"
                                                                        />
                                                                    </a>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            })()}
                                        </div>

                                        {/* Admin Remarks (if any) */}
                                        {selectedGrievance.admin_remarks && (
                                            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                                                <h4 className="font-semibold mb-1 text-blue-600">Admin Remarks</h4>
                                                <p className="text-sm">{selectedGrievance.admin_remarks}</p>
                                            </div>
                                        )}

                                        {/* Status & Priority Display */}
                                        <div className="grid grid-cols-1 gap-4">
                                            <div className="p-3 bg-muted/50 rounded border">
                                                <span className="text-xs text-muted-foreground block mb-1">Current Status</span>
                                                <Badge className={STATUS_CONFIG[selectedGrievance.status]?.color}>
                                                    {STATUS_CONFIG[selectedGrievance.status]?.label}
                                                </Badge>
                                            </div>
                                        </div>

                                        {/* Franchise Remarks */}
                                        <div>
                                            <label className="text-sm font-medium">Your Remarks / Response</label>
                                            <Textarea
                                                value={remarks}
                                                onChange={(e) => setRemarks(e.target.value)}
                                                placeholder="Add your response or internal notes..."
                                                rows={4}
                                                className="mt-1"
                                            />
                                        </div>

                                        <Button onClick={handleUpdate} disabled={updating} className="w-full">
                                            {updating ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    Updating...
                                                </>
                                            ) : (
                                                "Save Changes"
                                            )}
                                        </Button>
                                    </div>
                                </>
                            )}
                        </DialogContent>
                    </Dialog>
                </TabsContent>

                {/* My Grievance Tab Content */}
                <TabsContent value="my" className="mt-0 outline-none">
                    <div className="flex justify-end mb-4 gap-2">
                        <Button variant="outline" size="sm" onClick={fetchMyGrievances}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh
                        </Button>
                        <Button size="sm" onClick={() => setShowNewGrievanceForm(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add New Grievance
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
                                        className={`flex items-center gap-4 p-4 bg-white rounded-r-xl rounded-l-md border-l-[6px] shadow-sm ${categoryConfig.border}`}
                                    >
                                        <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${categoryConfig.bg} ${categoryConfig.text}`}>
                                            <CategoryIcon className="w-6 h-6" />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-mono text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{g.ticket_id}</span>
                                                <Badge variant="outline" className={`${STATUS_CONFIG[g.status]?.color?.replace('bg-', 'text-')} border-0 bg-transparent font-semibold pl-0`}>
                                                    • {STATUS_CONFIG[g.status]?.label}
                                                </Badge>
                                                <Badge variant="secondary" className="text-xs">
                                                    To: {g.department_display || g.department?.toUpperCase()}
                                                </Badge>
                                            </div>
                                            <h3 className="font-semibold text-base truncate">{g.subject}</h3>
                                            <p className="text-sm text-muted-foreground truncate">
                                                {CATEGORIES[g.category] || g.category}
                                                <span className="text-xs opacity-60 ml-2">• {formatToIST(g.created_at)}</span>
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* New Grievance Dialog */}
                    <Dialog open={showNewGrievanceForm} onOpenChange={setShowNewGrievanceForm}>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Submit New Grievance</DialogTitle>
                                <DialogDescription>
                                    Report an issue to Plant, Distributor, or ASM.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4 mt-4">
                                {/* Department Selection */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    {DEPARTMENTS.map((dept) => {
                                        const Icon = dept.icon;
                                        const isSelected = department === dept.value;
                                        return (
                                            <div
                                                key={dept.value}
                                                onClick={() => setDepartment(dept.value)}
                                                className={`cursor-pointer rounded-lg border p-4 flex flex-col items-center gap-2 transition-all hover:bg-accent/5 ${isSelected ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-muted'
                                                    }`}
                                            >
                                                <Icon className={`h-6 w-6 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                                                <span className={`font-medium text-sm ${isSelected ? 'text-primary' : ''}`}>{dept.label}</span>
                                            </div>
                                        );
                                    })}
                                </div>

                                {department && DEPARTMENTS.find(d => d.value === department)?.requiresDetails && (
                                    <div className="animate-in fade-in slide-in-from-top-2">
                                        <label className="text-sm font-medium mb-1.5 block">
                                            {department === 'distributor' ? 'Distributor Name/Details' : 'ASM Name/Details'} <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            placeholder={`Enter ${department === 'distributor' ? 'distributor' : 'ASM'} name`}
                                            value={departmentDetails}
                                            onChange={(e) => setDepartmentDetails(e.target.value)}
                                        />
                                    </div>
                                )}

                                {/* Category */}
                                <div>
                                    <label className="text-sm font-medium mb-1.5 block">Category <span className="text-red-500">*</span></label>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                        {FRANCHISE_CATEGORIES.map((cat) => (
                                            <div
                                                key={cat.value}
                                                onClick={() => setCategory(cat.value)}
                                                className={`cursor-pointer rounded-md border px-3 py-2 text-sm text-center transition-all hover:bg-accent/5 ${category === cat.value ? 'border-primary bg-primary/5 text-primary font-medium' : 'text-muted-foreground'
                                                    }`}
                                            >
                                                {cat.label}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Subject */}
                                <div>
                                    <label className="text-sm font-medium mb-1.5 block">Subject <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        placeholder="Brief title of the issue"
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                    />
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="text-sm font-medium mb-1.5 block">Description <span className="text-red-500">*</span></label>
                                    <Textarea
                                        value={description}
                                        onChange={(e: any) => setDescription(e.target.value)}
                                        placeholder="Detailed description of the issue..."
                                        rows={4}
                                    />
                                </div>

                                {/* Attachments */}
                                <div>
                                    <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                                        <Paperclip className="h-4 w-4" />
                                        Attachments (Optional - Max 3)
                                    </label>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                                                    className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-4 h-24 cursor-pointer transition-colors hover:bg-accent/5 ${slot.file ? 'border-primary bg-primary/5' : 'border-muted-foreground/20'
                                                        }`}
                                                >
                                                    {slot.file ? (
                                                        <>
                                                            <CheckCircle className="h-6 w-6 text-primary mb-1" />
                                                            <span className="text-xs text-primary font-medium truncate max-w-full px-2">
                                                                {slot.file.name}
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                                                            <span className="text-xs text-muted-foreground">Upload Image</span>
                                                        </>
                                                    )}
                                                </label>
                                                {slot.file && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            slot.setter(null);
                                                        }}
                                                        className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-0.5 shadow-sm hover:bg-destructive/90"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        supported formats: jpg, png, jpeg
                                    </p>
                                </div>

                                <div className="pt-2">
                                    <Button onClick={handleSubmitGrievance} disabled={submitting || compressing} className="w-full">
                                        {submitting || compressing ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                {compressing ? "Compressing Images..." : "Submitting..."}
                                            </>
                                        ) : (
                                            "Submit Grievance"
                                        )}
                                    </Button>
                                    <p className="text-xs text-center text-muted-foreground mt-2">
                                        Your grievance will be sent to the selected department and tracked by admin.
                                    </p>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default VendorGrievances;
