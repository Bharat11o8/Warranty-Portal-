import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, RefreshCw, MessageSquare, AlertCircle, CheckCircle, Clock, Users, Building2, Package, Receipt, Store, Wrench, ShieldCheck, HelpCircle, Paperclip } from "lucide-react";

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

    useEffect(() => {
        fetchGrievances();
    }, []);

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
                                                <span className="text-xs opacity-60 ml-2">• {new Date(g.created_at).toLocaleDateString()}</span>
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
                                            {new Date(selectedGrievance.created_at).toLocaleString()}
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

                {/* My Grievance Tab Content - Placeholder */}
                <TabsContent value="my" className="mt-0 outline-none">
                    <Card className="border-dashed">
                        <CardContent className="py-16 text-center">
                            <Building2 className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                            <h3 className="text-xl font-semibold mb-2">My Grievances</h3>
                            <p className="text-muted-foreground max-w-md mx-auto">
                                This section will allow you to submit grievances to Autoform India regarding any issues you face as a franchise partner.
                            </p>
                            <p className="text-sm text-muted-foreground/70 mt-4">
                                Coming Soon
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default VendorGrievances;
