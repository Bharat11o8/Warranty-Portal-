import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, RefreshCw, MessageSquare, Search, Paperclip, Store, Users } from "lucide-react";

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
    franchise_address?: string;
    franchise_city?: string;
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

const AdminGrievances = () => {
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

    const fetchGrievances = async () => {
        setLoading(true);
        try {
            const response = await api.get("/grievance/admin");
            if (response.data.success) {
                setGrievances(response.data.data);
                setFilteredGrievances(response.data.data);
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
        let result = grievances;

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
    }, [searchQuery, statusFilter, grievances]);

    const handleOpenDetail = (g: Grievance) => {
        setSelectedGrievance(g);
        setAdminRemarks(g.admin_remarks || "");
        setAdminNotes(g.admin_notes || "");
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

    const handleAssign = async (id: number, assignedTo: string) => {
        try {
            // Only update if changed (optional check, but good for perf)
            const current = grievances.find(g => g.id === id);
            if (current && current.assigned_to === assignedTo) return;

            await api.put(`/grievance/${id}/assign`, { assignedTo });
            toast({ title: "Assigned", description: "Grievance assigned successfully" });

            // Update local state
            setGrievances(prev => prev.map(g => g.id === id ? { ...g, assigned_to: assignedTo } : g));
            setFilteredGrievances(prev => prev.map(g => g.id === id ? { ...g, assigned_to: assignedTo } : g));
        } catch (error: any) {
            toast({
                title: "Error",
                description: "Failed to assign",
                variant: "destructive",
            });
            fetchGrievances(); // Revert
        }
    };

    const getStats = () => {
        const total = grievances.length;
        const open = grievances.filter(g => !["resolved", "rejected"].includes(g.status)).length;
        const resolved = grievances.filter(g => ["resolved", "rejected"].includes(g.status)).length;
        const avgRating = grievances.filter(g => g.customer_rating).reduce((acc, g) => acc + (g.customer_rating || 0), 0) / (grievances.filter(g => g.customer_rating).length || 1);
        return { total, open, resolved, avgRating: avgRating.toFixed(1) };
    };

    const stats = getStats();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold">Grievance Management</h2>
                    <p className="text-muted-foreground">Monitor and manage all customer grievances</p>
                </div>
                <Button variant="outline" onClick={fetchGrievances}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                </Button>
            </div>

            {/* Tabs Structure */}
            <Tabs defaultValue="customer" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="customer">Customer Grievances</TabsTrigger>
                    <TabsTrigger value="franchise">Franchise Grievances (Coming Soon)</TabsTrigger>
                </TabsList>

                <TabsContent value="customer" className="space-y-6">
                    {/* Stats Row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card>
                            <CardContent className="pt-6">
                                <p className="text-3xl font-bold">{stats.total}</p>
                                <p className="text-sm text-muted-foreground">Total Grievances</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <p className="text-3xl font-bold text-amber-500">{stats.open}</p>
                                <p className="text-sm text-muted-foreground">Open Cases</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <p className="text-3xl font-bold text-green-500">{stats.resolved}</p>
                                <p className="text-sm text-muted-foreground">Resolved</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <p className="text-3xl font-bold text-green-500">⭐ {stats.avgRating}</p>
                                <p className="text-sm text-muted-foreground">Avg. Rating</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-wrap gap-4">
                        <div className="flex-1 min-w-[200px]">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by ticket, customer, franchise, category..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[150px]">
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

                    {/* Grievances Table/List */}
                    {filteredGrievances.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                <p className="text-muted-foreground">No grievances found</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="border rounded-lg overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="text-left p-3 text-sm font-medium">Ticket</th>
                                        <th className="text-left p-3 text-sm font-medium">Customer</th>
                                        <th className="text-left p-3 text-sm font-medium">Franchise</th>
                                        <th className="text-left p-3 text-sm font-medium">Category</th>
                                        <th className="text-left p-3 text-sm font-medium">Status</th>
                                        <th className="text-left p-3 text-sm font-medium">Assigned To</th>
                                        <th className="text-left p-3 text-sm font-medium">Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredGrievances.map((g) => (
                                        <tr
                                            key={g.id}
                                            className="border-t hover:bg-muted/30 cursor-pointer transition-colors"
                                            onClick={() => handleOpenDetail(g)}
                                        >
                                            <td className="p-3 font-mono text-sm">{g.ticket_id}</td>
                                            <td className="p-3">{g.customer_name}</td>
                                            <td className="p-3 text-sm text-muted-foreground">{g.franchise_name || "-"}</td>
                                            <td className="p-3">
                                                <Badge variant="outline">{CATEGORIES[g.category] || g.category}</Badge>
                                            </td>
                                            <td className="p-3">
                                                <Badge className={STATUS_COLORS[g.status]}>
                                                    {g.status.replace("_", " ")}
                                                </Badge>
                                            </td>
                                            <td className="p-3" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        defaultValue={g.assigned_to || ""}
                                                        onBlur={(e) => handleAssign(g.id, e.target.value)}
                                                        className="h-8 min-w-[120px]"
                                                        placeholder="Unassigned"
                                                    />
                                                </div>
                                            </td>
                                            <td className="p-3 text-sm text-muted-foreground">
                                                {new Date(g.created_at).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="franchise">
                    <Card>
                        <CardContent className="py-12 text-center">
                            <Store className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">Franchise Grievances</h3>
                            <p className="text-muted-foreground">
                                Functionality to manage grievances raised by franchises is coming soon.
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

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

                            <div className="grid md:grid-cols-2 gap-4 mt-4">
                                {/* Customer & Franchise Info */}
                                <div className="p-4 bg-muted rounded-lg">
                                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                                        <Users className="h-4 w-4" />
                                        Customer
                                    </h4>
                                    <div className="text-sm space-y-1">
                                        <p>{selectedGrievance.customer_name}</p>
                                        <p className="text-muted-foreground">{selectedGrievance.customer_email}</p>
                                    </div>
                                </div>
                                <div className="p-4 bg-muted rounded-lg">
                                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                                        <Store className="h-4 w-4" />
                                        Franchise
                                    </h4>
                                    <div className="text-sm space-y-1">
                                        <p className="font-medium">{selectedGrievance.franchise_name || "Not specified"}</p>
                                        {selectedGrievance.franchise_address && (
                                            <p className="text-muted-foreground text-xs">{selectedGrievance.franchise_address}</p>
                                        )}
                                        {selectedGrievance.franchise_city && (
                                            <p className="text-muted-foreground text-xs">{selectedGrievance.franchise_city}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Issue Details */}
                            <div className="mt-4">
                                <h4 className="font-semibold mb-2">Issue Details</h4>
                                <p className="text-sm text-muted-foreground">
                                    {CATEGORIES[selectedGrievance.category]}
                                    {selectedGrievance.sub_category && ` > ${selectedGrievance.sub_category}`}
                                </p>
                                <p className="text-sm mt-2">{selectedGrievance.description}</p>

                                {selectedGrievance.attachments && (() => {
                                    try {
                                        let attachments = [];
                                        try {
                                            attachments = JSON.parse(selectedGrievance.attachments);
                                        } catch {
                                            if (typeof selectedGrievance.attachments === 'string' && selectedGrievance.attachments.startsWith('[')) {
                                                // Try parsing again if it looks like an array
                                                attachments = JSON.parse(selectedGrievance.attachments);
                                            } else {
                                                // If it's a simple string URL
                                                attachments = [selectedGrievance.attachments];
                                            }
                                        }

                                        if (Array.isArray(attachments) && attachments.length > 0) {
                                            return (
                                                <div className="mt-4">
                                                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                                                        <Paperclip className="h-4 w-4" />
                                                        Attachments
                                                    </h4>
                                                    <div className="flex flex-wrap gap-2">
                                                        {attachments.map((url, index) => (
                                                            <div key={index} className="relative group">
                                                                <a href={url} target="_blank" rel="noopener noreferrer" className="block">
                                                                    <div className="h-20 w-20 rounded-md border overflow-hidden bg-muted">
                                                                        <img
                                                                            src={url}
                                                                            alt={`Attachment ${index + 1}`}
                                                                            className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                                                            onError={(e) => {
                                                                                (e.target as HTMLImageElement).style.display = 'none';
                                                                                (e.target as HTMLImageElement).parentElement!.innerText = 'File';
                                                                            }}
                                                                        />
                                                                    </div>
                                                                </a>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        }
                                    } catch (e) {
                                        console.error("Failed to parse attachments", e);
                                    }
                                    return null;
                                })()}
                            </div>

                            {/* Franchise Remarks */}
                            {selectedGrievance.franchise_remarks && (
                                <div className="p-4 bg-amber-50 dark:bg-amber-950 rounded-lg">
                                    <h4 className="font-semibold mb-1">Franchise Remarks</h4>
                                    <p className="text-sm">{selectedGrievance.franchise_remarks}</p>
                                </div>
                            )}

                            {/* Customer Feedback */}
                            {selectedGrievance.customer_rating && (
                                <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                                    <h4 className="font-semibold mb-1">Customer Feedback</h4>
                                    <div className="flex items-center gap-2">
                                        <span>Rating: {"⭐".repeat(selectedGrievance.customer_rating)}</span>
                                    </div>
                                    {selectedGrievance.customer_feedback && (
                                        <p className="text-sm mt-1">{selectedGrievance.customer_feedback}</p>
                                    )}
                                </div>
                            )}

                            {/* Status Override */}
                            <div className="flex flex-wrap gap-2 mt-4">
                                <span className="text-sm font-medium mr-2">Quick Actions:</span>
                                {["under_review", "in_progress", "resolved", "rejected"].map(status => (
                                    <Button
                                        key={status}
                                        size="sm"
                                        variant={selectedGrievance.status === status ? "default" : "outline"}
                                        onClick={() => handleStatusLocalUpdate(status)}
                                    >
                                        {status.replace("_", " ")}
                                    </Button>
                                ))}
                            </div>

                            {/* Admin Remarks */}
                            <div className="mt-4">
                                <label className="text-sm font-medium">Admin Remarks (Visible to Vendor)</label>
                                <Textarea
                                    value={adminRemarks}
                                    onChange={(e) => setAdminRemarks(e.target.value)}
                                    placeholder="Add reply or public notes..."
                                    rows={3}
                                    className="mt-1"
                                />
                            </div>

                            <div className="mt-4">
                                <div className="flex justify-between">
                                    <label className="text-sm font-medium flex items-center gap-2">
                                        Internal Notes (Private)
                                    </label>
                                    <span className="text-xs text-muted-foreground">
                                        {adminNotes.length}/1000
                                    </span>
                                </div>
                                <Textarea
                                    value={adminNotes}
                                    onChange={(e) => setAdminNotes(e.target.value)}
                                    maxLength={1000}
                                    placeholder="Private observations, hidden from vendor..."
                                    rows={3}
                                    className="mt-1 bg-yellow-50/50"
                                />
                            </div>

                            <Button onClick={handleSaveChanges} disabled={updating} className="w-full mt-4">
                                {updating ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    "Save Changes"
                                )}
                            </Button>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminGrievances;
