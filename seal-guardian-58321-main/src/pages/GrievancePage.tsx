import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, Star, Send, RefreshCw, X, ImageIcon, MessageSquare, Store, FileText, HelpCircle, AlertTriangle } from "lucide-react";
import api from "@/lib/api";
import { compressImage, isCompressibleImage } from "@/lib/imageCompression";

interface Grievance {
    id: number;
    ticket_id: string;
    category: string;
    sub_category: string | null;
    subject: string;
    description: string;
    status: string;
    priority: string;
    franchise_name: string | null;
    franchise_remarks: string | null;
    admin_remarks: string | null;
    customer_rating: number | null;
    customer_feedback: string | null;
    created_at: string;
    resolved_at: string | null;
}

interface Dealer {
    id: string;
    store_name: string;
    city: string;
    address: string;
}

const CATEGORIES = [
    { value: "product_issue", label: "Product Issue", requiresAttachment: true },
    { value: "billing_issue", label: "Billing Issue", requiresAttachment: true },
    { value: "warranty_issue", label: "Warranty Issue", requiresAttachment: true },
    { value: "store_issue", label: "Store/Dealer Issue", requiresAttachment: false },
    { value: "manpower_issue", label: "Manpower Issue", requiresAttachment: false },
    { value: "service_issue", label: "Service Issue", requiresAttachment: false },
    { value: "other", label: "Other", requiresAttachment: false },
];

const STATUS_COLORS: Record<string, string> = {
    submitted: "bg-gray-500",
    under_review: "bg-blue-500",
    in_progress: "bg-amber-500",
    resolved: "bg-green-500",
    rejected: "bg-red-500",
};

const GrievancePage = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState("list");
    const [grievances, setGrievances] = useState<Grievance[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [category, setCategory] = useState("");
    const [subCategory, setSubCategory] = useState("");
    const [subject, setSubject] = useState("");
    const [description, setDescription] = useState("");
    const [selectedDealer, setSelectedDealer] = useState("");

    // Separate attachment slots
    const [attachment1, setAttachment1] = useState<File | null>(null);
    const [attachment2, setAttachment2] = useState<File | null>(null);
    const [attachment3, setAttachment3] = useState<File | null>(null);
    const [compressing, setCompressing] = useState(false);

    // Dealers list
    const [dealers, setDealers] = useState<Dealer[]>([]);
    const [loadingDealers, setLoadingDealers] = useState(false);

    // Rating state
    const [ratingGrievanceId, setRatingGrievanceId] = useState<number | null>(null);
    const [rating, setRating] = useState(0);
    const [feedback, setFeedback] = useState("");

    const fetchGrievances = async () => {
        setLoading(true);
        try {
            const response = await api.get("/grievance");
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

    const fetchDealers = async () => {
        setLoadingDealers(true);
        try {
            const response = await api.get("/public/stores");
            if (response.data.success) {
                // Map stores data to dealer interface
                setDealers(response.data.stores.map((s: any) => ({
                    id: s.vendor_details_id,
                    store_name: s.store_name,
                    city: s.city,
                    address: s.address
                })));
            }
        } catch (error) {
            console.error("Failed to fetch dealers", error);
        } finally {
            setLoadingDealers(false);
        }
    };

    useEffect(() => {
        fetchGrievances();
        fetchDealers();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!selectedDealer) {
            toast({
                title: "Dealer Required",
                description: "Please select the dealer/store related to your grievance",
                variant: "destructive",
            });
            return;
        }

        if (!category || !subject || !description) {
            toast({
                title: "Missing Fields",
                description: "Please fill all required fields",
                variant: "destructive",
            });
            return;
        }

        // Collect attachments
        const attachments = [attachment1, attachment2, attachment3].filter(Boolean) as File[];

        const selectedCategory = CATEGORIES.find(c => c.value === category);
        if (selectedCategory?.requiresAttachment && attachments.length === 0) {
            toast({
                title: "Attachment Required",
                description: "Please upload at least one photo/document for this category",
                variant: "destructive",
            });
            return;
        }

        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append("category", category);
            formData.append("subCategory", subCategory);
            formData.append("subject", subject);
            formData.append("description", description);
            if (selectedDealer) {
                formData.append("franchiseId", selectedDealer);
            }
            attachments.forEach(file => formData.append("attachments", file));

            const response = await api.post("/grievance", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            if (response.data.success) {
                toast({
                    title: "Grievance Submitted",
                    description: `Ticket ID: ${response.data.data.ticketId}`,
                });
                // Reset form
                setCategory("");
                setSubCategory("");
                setSubject("");
                setDescription("");
                setAttachment1(null);
                setAttachment2(null);
                setAttachment3(null);
                setSelectedDealer("");
                setActiveTab("list");
                fetchGrievances();
            }
        } catch (error: any) {
            toast({
                title: "Submission Failed",
                description: error.response?.data?.error || "Failed to submit grievance",
                variant: "destructive",
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleRating = async (grievanceId: number) => {
        if (rating < 1 || rating > 5) {
            toast({
                title: "Invalid Rating",
                description: "Please select a rating between 1 and 5",
                variant: "destructive",
            });
            return;
        }

        try {
            const response = await api.put(`/grievance/${grievanceId}/rating`, {
                rating,
                feedback,
            });

            if (response.data.success) {
                toast({ title: "Thank you!", description: "Your feedback has been submitted" });
                setRatingGrievanceId(null);
                setRating(0);
                setFeedback("");
                fetchGrievances();
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.response?.data?.error || "Failed to submit rating",
                variant: "destructive",
            });
        }
    };

    const handleAttachmentChange = async (
        e: React.ChangeEvent<HTMLInputElement>,
        setter: React.Dispatch<React.SetStateAction<File | null>>,
        slotName: string
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

        // Compress image if needed
        let processedFile = file;
        if (isCompressibleImage(file) && file.size > 1024 * 1024) { // Compress if > 1MB
            setCompressing(true);
            try {
                processedFile = await compressImage(file, { maxSizeKB: 1024, quality: 0.8 });
            } catch (err) {
                console.error('Compression failed:', err);
                // Continue with original file if compression fails
            }
            setCompressing(false);
        }

        if (processedFile.size > MAX_FILE_SIZE) {
            toast({
                title: "File Too Large",
                description: `${slotName} must be under 5MB`,
                variant: "destructive",
            });
            return;
        }

        setter(processedFile);
        // Clear the input so the same file can be re-selected if needed
        e.target.value = '';
    };

    const selectedCategory = CATEGORIES.find(c => c.value === category);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
            <div className="container mx-auto py-8 px-4 max-w-4xl">
                {/* Back Button - Top Left */}
                {/* Header Section */}
                <div className="mb-8 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 mb-4 shadow-lg">
                        <MessageSquare className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        Grievance Portal
                    </h1>
                    <p className="text-muted-foreground mt-2">Submit and track your complaints</p>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border shadow-sm">
                        <TabsTrigger value="list" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm">
                            <RefreshCw className="h-4 w-4 mr-2" />
                            My Grievances
                        </TabsTrigger>
                        <TabsTrigger value="new" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm">
                            <Send className="h-4 w-4 mr-2" />
                            Submit New
                        </TabsTrigger>
                    </TabsList>

                    {/* List Tab */}
                    <TabsContent value="list" className="mt-6">
                        <div className="flex justify-end mb-4">
                            <Button variant="outline" size="sm" onClick={fetchGrievances} disabled={loading}>
                                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                                Refresh
                            </Button>
                        </div>

                        {loading ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin" />
                            </div>
                        ) : grievances.length === 0 ? (
                            <Card>
                                <CardContent className="py-12 text-center">
                                    <p className="text-muted-foreground">No grievances submitted yet</p>
                                    <Button className="mt-4" onClick={() => setActiveTab("new")}>
                                        Submit Your First Grievance
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-4">
                                {grievances.map((g) => (
                                    <Card key={g.id}>
                                        <CardHeader className="pb-2">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <CardTitle className="text-lg">{g.subject}</CardTitle>
                                                    <CardDescription>
                                                        {g.ticket_id} • {new Date(g.created_at).toLocaleDateString()}
                                                    </CardDescription>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Badge className={STATUS_COLORS[g.status]}>
                                                        {g.status.replace("_", " ")}
                                                    </Badge>
                                                    {g.priority !== "normal" && (
                                                        <Badge variant="outline" className="text-amber-500 border-amber-500">
                                                            {g.priority}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm text-muted-foreground mb-2">
                                                Category: {CATEGORIES.find(c => c.value === g.category)?.label || g.category}
                                            </p>
                                            <p className="text-sm">{g.description}</p>

                                            {g.franchise_remarks && (
                                                <div className="mt-3 p-3 bg-muted rounded-lg">
                                                    <p className="text-sm font-medium">Franchise Response:</p>
                                                    <p className="text-sm">{g.franchise_remarks}</p>
                                                </div>
                                            )}

                                            {g.admin_remarks && (
                                                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                                                    <p className="text-sm font-medium">Admin Response:</p>
                                                    <p className="text-sm">{g.admin_remarks}</p>
                                                </div>
                                            )}

                                            {/* Rating Section */}
                                            {(g.status === "resolved" || g.status === "rejected") && !g.customer_rating && (
                                                <div className="mt-4 p-4 border rounded-lg">
                                                    {ratingGrievanceId === g.id ? (
                                                        <div className="space-y-3">
                                                            <Label>Rate your experience</Label>
                                                            <div className="flex gap-1">
                                                                {[1, 2, 3, 4, 5].map((star) => (
                                                                    <Star
                                                                        key={star}
                                                                        className={`h-6 w-6 cursor-pointer ${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                                                                            }`}
                                                                        onClick={() => setRating(star)}
                                                                    />
                                                                ))}
                                                            </div>
                                                            <Textarea
                                                                placeholder="Additional feedback (optional)"
                                                                value={feedback}
                                                                onChange={(e) => setFeedback(e.target.value)}
                                                            />
                                                            <div className="flex gap-2">
                                                                <Button size="sm" onClick={() => handleRating(g.id)}>
                                                                    Submit Rating
                                                                </Button>
                                                                <Button size="sm" variant="outline" onClick={() => setRatingGrievanceId(null)}>
                                                                    Cancel
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <Button variant="outline" size="sm" onClick={() => setRatingGrievanceId(g.id)}>
                                                            <Star className="h-4 w-4 mr-2" />
                                                            Rate This Resolution
                                                        </Button>
                                                    )}
                                                </div>
                                            )}

                                            {g.customer_rating && (
                                                <div className="mt-3 flex items-center gap-2">
                                                    <span className="text-sm text-muted-foreground">Your rating:</span>
                                                    <div className="flex">
                                                        {[1, 2, 3, 4, 5].map((star) => (
                                                            <Star
                                                                key={star}
                                                                className={`h-4 w-4 ${star <= g.customer_rating! ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                                                                    }`}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* Submit New Tab */}
                    <TabsContent value="new" className="mt-6">
                        <Card className="shadow-xl border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm overflow-hidden">
                            <div className="h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
                            <CardHeader className="pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                                        <HelpCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl">Submit a Grievance</CardTitle>
                                        <CardDescription>
                                            Tell us about your issue and we'll help resolve it
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Dealer Selection */}
                                    <div className="space-y-2">
                                        <Label htmlFor="dealer" className="flex items-center gap-2 text-sm font-medium">
                                            <Store className="h-4 w-4 text-blue-500" />
                                            Select Dealer/Store <span className="text-red-500">*</span>
                                        </Label>
                                        <Select value={selectedDealer} onValueChange={setSelectedDealer}>
                                            <SelectTrigger className="h-12 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700">
                                                <SelectValue placeholder={loadingDealers ? "Loading dealers..." : "Select the dealer/store"} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {dealers.map((dealer) => (
                                                    <SelectItem key={dealer.id} value={dealer.id}>
                                                        <span className="font-medium">{dealer.store_name}</span>
                                                        <span className="text-muted-foreground ml-2 text-xs">
                                                            ({dealer.city}{dealer.address ? `, ${dealer.address}` : ''})
                                                        </span>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <p className="text-xs text-muted-foreground">
                                            Select the dealer where you purchased or had service done
                                        </p>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="category" className="flex items-center gap-2 text-sm font-medium">
                                                <AlertTriangle className="h-4 w-4 text-amber-500" />
                                                Category <span className="text-red-500">*</span>
                                            </Label>
                                            <Select value={category} onValueChange={setCategory}>
                                                <SelectTrigger className="h-12 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700">
                                                    <SelectValue placeholder="Select category" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {CATEGORIES.map((cat) => (
                                                        <SelectItem key={cat.value} value={cat.value}>
                                                            {cat.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="subCategory" className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                                Sub-Category (Optional)
                                            </Label>
                                            <Input
                                                id="subCategory"
                                                value={subCategory}
                                                onChange={(e) => setSubCategory(e.target.value)}
                                                placeholder="Specify further if needed"
                                                className="h-12 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="subject" className="flex items-center gap-2 text-sm font-medium">
                                            <FileText className="h-4 w-4 text-indigo-500" />
                                            Subject <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="subject"
                                            value={subject}
                                            onChange={(e) => setSubject(e.target.value)}
                                            placeholder="Brief summary of your issue"
                                            maxLength={200}
                                            className="h-12 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="description" className="flex items-center gap-2 text-sm font-medium">
                                            <MessageSquare className="h-4 w-4 text-green-500" />
                                            Description <span className="text-red-500">*</span>
                                        </Label>
                                        <Textarea
                                            id="description"
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="Describe your issue in detail..."
                                            rows={5}
                                            maxLength={1000}
                                            className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 resize-none"
                                        />
                                        <p className="text-xs text-muted-foreground text-right">
                                            {description.length}/1000
                                        </p>
                                    </div>

                                    <div className="space-y-3">
                                        <Label className="flex items-center gap-2 text-sm font-medium">
                                            <Upload className="h-4 w-4 text-purple-500" />
                                            Attachments {selectedCategory?.requiresAttachment ? <span className="text-red-500">*</span> : <span className="text-muted-foreground">(Optional)</span>}
                                        </Label>
                                        {compressing && (
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Compressing image...
                                            </div>
                                        )}
                                        <div className="grid gap-3 md:grid-cols-3">
                                            {/* Attachment 1 */}
                                            <div className="border-2 border-dashed rounded-lg p-3 relative">
                                                <input
                                                    type="file"
                                                    id="attachment1"
                                                    className="hidden"
                                                    accept="image/*,.pdf"
                                                    onChange={(e) => handleAttachmentChange(e, setAttachment1, "Attachment 1")}
                                                />
                                                {attachment1 ? (
                                                    <div className="flex items-center gap-2">
                                                        <ImageIcon className="h-4 w-4 text-green-500 flex-shrink-0" />
                                                        <span className="text-sm truncate flex-1">{attachment1.name}</span>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-6 w-6 p-0"
                                                            onClick={() => setAttachment1(null)}
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <label htmlFor="attachment1" className="flex flex-col items-center cursor-pointer py-2">
                                                        <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                                                        <span className="text-xs text-muted-foreground">Attachment 1</span>
                                                    </label>
                                                )}
                                            </div>

                                            {/* Attachment 2 */}
                                            <div className="border-2 border-dashed rounded-lg p-3 relative">
                                                <input
                                                    type="file"
                                                    id="attachment2"
                                                    className="hidden"
                                                    accept="image/*,.pdf"
                                                    onChange={(e) => handleAttachmentChange(e, setAttachment2, "Attachment 2")}
                                                />
                                                {attachment2 ? (
                                                    <div className="flex items-center gap-2">
                                                        <ImageIcon className="h-4 w-4 text-green-500 flex-shrink-0" />
                                                        <span className="text-sm truncate flex-1">{attachment2.name}</span>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-6 w-6 p-0"
                                                            onClick={() => setAttachment2(null)}
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <label htmlFor="attachment2" className="flex flex-col items-center cursor-pointer py-2">
                                                        <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                                                        <span className="text-xs text-muted-foreground">Attachment 2</span>
                                                    </label>
                                                )}
                                            </div>

                                            {/* Attachment 3 */}
                                            <div className="border-2 border-dashed rounded-lg p-3 relative">
                                                <input
                                                    type="file"
                                                    id="attachment3"
                                                    className="hidden"
                                                    accept="image/*,.pdf"
                                                    onChange={(e) => handleAttachmentChange(e, setAttachment3, "Attachment 3")}
                                                />
                                                {attachment3 ? (
                                                    <div className="flex items-center gap-2">
                                                        <ImageIcon className="h-4 w-4 text-green-500 flex-shrink-0" />
                                                        <span className="text-sm truncate flex-1">{attachment3.name}</span>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-6 w-6 p-0"
                                                            onClick={() => setAttachment3(null)}
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <label htmlFor="attachment3" className="flex flex-col items-center cursor-pointer py-2">
                                                        <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                                                        <span className="text-xs text-muted-foreground">Attachment 3</span>
                                                    </label>
                                                )}
                                            </div>
                                        </div>
                                        {selectedCategory?.requiresAttachment && (
                                            <p className="text-xs text-amber-600">
                                                At least one photo/document is required for {selectedCategory.label}
                                            </p>
                                        )}
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={submitting || compressing}
                                        className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-lg hover:shadow-xl transition-all"
                                    >
                                        {submitting ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Submitting...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="h-4 w-4 mr-2" />
                                                Submit Grievance
                                            </>
                                        )}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
};

export default GrievancePage;

