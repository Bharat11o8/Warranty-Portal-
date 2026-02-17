import { useState, useEffect, useCallback } from "react";
import {
    Search,
    Plus,
    Trash2,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    CheckCircle2,
    XCircle,
    Hash,
    Loader2,
    AlertCircle,
    Package,
    ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

interface UIDRecord {
    uid: string;
    is_used: boolean;
    used_at: string | null;
    created_at: string;
}

interface UIDStats {
    total: number;
    available: number;
    used: number;
}

interface UIDManagementProps {
    onBack?: () => void;
}

export const AdminUIDManagement = ({ onBack }: UIDManagementProps) => {
    const { toast } = useToast();
    const [uids, setUIDs] = useState<UIDRecord[]>([]);
    const [stats, setStats] = useState<UIDStats>({ total: 0, available: 0, used: 0 });
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "available" | "used">("all");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    // Add UID dialog
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [newUID, setNewUID] = useState("");
    const [addLoading, setAddLoading] = useState(false);

    // Delete confirmation
    const [deleteUID, setDeleteUID] = useState<string | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const fetchUIDs = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: "30",
                status: statusFilter,
            });
            if (search) params.set("search", search);

            const response = await api.get(`/uid?${params.toString()}`);
            if (response.data.success) {
                setUIDs(response.data.uids);
                setStats(response.data.stats);
                setTotalPages(response.data.pagination.totalPages);
                setTotalCount(response.data.pagination.totalCount);
            }
        } catch (error) {
            console.error("Failed to fetch UIDs:", error);
            toast({ title: "Error", description: "Failed to load UIDs", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [page, statusFilter, search, toast]);

    useEffect(() => {
        fetchUIDs();
    }, [fetchUIDs]);

    // Debounce search
    useEffect(() => {
        setPage(1);
    }, [search, statusFilter]);

    const handleAddUID = async () => {
        if (!/^\d{13,16}$/.test(newUID)) {
            toast({ title: "Invalid UID", description: "UID must be a 13-16 digit number", variant: "destructive" });
            return;
        }
        setAddLoading(true);
        try {
            const response = await api.post("/uid/add", { uid: newUID });
            if (response.data.success) {
                toast({ title: "Success", description: `UID ${newUID} added successfully` });
                setNewUID("");
                setAddDialogOpen(false);
                fetchUIDs();
            }
        } catch (error: any) {
            const msg = error.response?.data?.error || "Failed to add UID";
            toast({ title: "Error", description: msg, variant: "destructive" });
        } finally {
            setAddLoading(false);
        }
    };

    const handleDeleteUID = async () => {
        if (!deleteUID) return;
        setDeleteLoading(true);
        try {
            const response = await api.delete(`/uid/${deleteUID}`);
            if (response.data.success) {
                toast({ title: "Deleted", description: `UID ${deleteUID} removed` });
                setDeleteUID(null);
                fetchUIDs();
            }
        } catch (error: any) {
            const msg = error.response?.data?.error || "Failed to delete UID";
            toast({ title: "Error", description: msg, variant: "destructive" });
        } finally {
            setDeleteLoading(false);
        }
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return "—";
        return new Date(dateStr).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <div className="animate-in fade-in duration-500 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    {onBack && (
                        <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full h-9 w-9 hover:bg-orange-50">
                            <ArrowLeft className="h-5 w-5 text-slate-600" />
                        </Button>
                    )}
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 tracking-tight">UID Management</h2>
                        <p className="text-sm text-slate-500">Manage pre-generated product UIDs for seat cover warranties</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchUIDs}
                        disabled={loading}
                        className="h-9 px-4 rounded-xl border-orange-100 text-orange-600 hover:bg-orange-50"
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                    <Button
                        size="sm"
                        onClick={() => setAddDialogOpen(true)}
                        className="h-9 px-4 rounded-xl bg-[#f46617] hover:bg-[#d85512] text-white shadow-lg shadow-orange-500/20"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add UID
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-3">
                <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm text-center">
                    <div className="text-2xl font-black text-slate-800">{stats.total.toLocaleString()}</div>
                    <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mt-1">Total UIDs</div>
                </div>
                <div className="bg-white rounded-2xl border border-emerald-100 p-4 shadow-sm text-center">
                    <div className="text-2xl font-black text-emerald-600">{stats.available.toLocaleString()}</div>
                    <div className="text-xs font-medium text-emerald-400 uppercase tracking-wider mt-1">Available</div>
                </div>
                <div className="bg-white rounded-2xl border border-blue-100 p-4 shadow-sm text-center">
                    <div className="text-2xl font-black text-blue-600">{stats.used.toLocaleString()}</div>
                    <div className="text-xs font-medium text-blue-400 uppercase tracking-wider mt-1">Used</div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        type="text"
                        placeholder="Search UIDs..."
                        className="pl-10 h-10 rounded-xl border-slate-200 bg-white"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-100 shadow-sm">
                    {(["all", "available", "used"] as const).map((s) => (
                        <Button
                            key={s}
                            variant="ghost"
                            size="sm"
                            onClick={() => setStatusFilter(s)}
                            className={`
                                rounded-lg h-8 px-4 text-xs font-bold uppercase tracking-wider
                                ${statusFilter === s
                                    ? s === "available"
                                        ? "bg-emerald-50 text-emerald-600"
                                        : s === "used"
                                            ? "bg-blue-50 text-blue-600"
                                            : "bg-orange-50 text-orange-600"
                                    : "text-slate-400"
                                }
                            `}
                        >
                            {s}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
                        <span className="ml-2 text-sm text-slate-500">Loading UIDs...</span>
                    </div>
                ) : uids.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                        <Package className="h-10 w-10 mb-3 text-slate-300" />
                        <p className="text-sm font-medium">No UIDs found</p>
                        <p className="text-xs mt-1">
                            {search ? "Try a different search term" : "Add UIDs manually or sync from the UID generator"}
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table */}
                        <div className="hidden md:block">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-50 bg-slate-50/50">
                                        <th className="text-left py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">UID</th>
                                        <th className="text-center py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                                        <th className="text-left py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Used At</th>
                                        <th className="text-left py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Created</th>
                                        <th className="text-center py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {uids.map((uid) => (
                                        <tr key={uid.uid} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-2">
                                                    <Hash className="h-3.5 w-3.5 text-slate-300" />
                                                    <span className="font-mono font-semibold text-slate-700 tracking-wider">{uid.uid}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                {uid.is_used ? (
                                                    <Badge className="bg-blue-50 text-blue-600 border border-blue-100 font-bold text-[10px] rounded-full">
                                                        <XCircle className="h-3 w-3 mr-1" /> Used
                                                    </Badge>
                                                ) : (
                                                    <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-100 font-bold text-[10px] rounded-full">
                                                        <CheckCircle2 className="h-3 w-3 mr-1" /> Available
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-slate-500 text-xs">{formatDate(uid.used_at)}</td>
                                            <td className="py-3 px-4 text-slate-500 text-xs">{formatDate(uid.created_at)}</td>
                                            <td className="py-3 px-4 text-center">
                                                {!uid.is_used && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => setDeleteUID(uid.uid)}
                                                        className="h-8 w-8 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="md:hidden divide-y divide-slate-50">
                            {uids.map((uid) => (
                                <div key={uid.uid} className="p-4 flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Hash className="h-3 w-3 text-slate-300 shrink-0" />
                                            <span className="font-mono font-semibold text-slate-700 text-sm tracking-wider truncate">{uid.uid}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                            <span>{formatDate(uid.created_at)}</span>
                                            {uid.used_at && <span>• Used {formatDate(uid.used_at)}</span>}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        {uid.is_used ? (
                                            <Badge className="bg-blue-50 text-blue-600 border border-blue-100 font-bold text-[10px] rounded-full px-2 py-0.5">Used</Badge>
                                        ) : (
                                            <>
                                                <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-100 font-bold text-[10px] rounded-full px-2 py-0.5">Available</Badge>
                                                <Button variant="ghost" size="icon" onClick={() => setDeleteUID(uid.uid)} className="h-7 w-7 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50">
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between py-2">
                    <span className="text-xs text-slate-400">
                        Showing {(page - 1) * 30 + 1}–{Math.min(page * 30, totalCount)} of {totalCount}
                    </span>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="h-8 w-8 rounded-lg border-slate-200"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-xs font-bold text-slate-600">{page} / {totalPages}</span>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="h-8 w-8 rounded-lg border-slate-200"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Add UID Dialog */}
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogContent className="sm:max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold">Add UID Manually</DialogTitle>
                        <DialogDescription>
                            Enter a 13–16 digit UID from the product packaging. This is for cases where the sticker was removed or misplaced.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        <Input
                            type="text"
                            placeholder="Enter 13-16 digit UID"
                            value={newUID}
                            onChange={(e) => setNewUID(e.target.value.replace(/\D/g, "").slice(0, 16))}
                            maxLength={16}
                            className="font-mono tracking-wider text-center text-lg h-12 rounded-xl border-slate-200"
                        />
                        <div className="flex items-center justify-between px-1">
                            <span className="text-xs text-slate-400">{newUID.length}/16 digits</span>
                            {newUID.length >= 13 && newUID.length <= 16 ? (
                                <span className="text-xs text-emerald-500 flex items-center gap-1">
                                    <CheckCircle2 className="h-3 w-3" /> Valid format
                                </span>
                            ) : newUID.length > 0 ? (
                                <span className="text-xs text-red-400 flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" /> Need {13 - newUID.length > 0 ? `${13 - newUID.length} more` : "valid"} digits
                                </span>
                            ) : null}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setAddDialogOpen(false); setNewUID(""); }} className="rounded-xl">
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAddUID}
                            disabled={addLoading || !/^\d{13,16}$/.test(newUID)}
                            className="rounded-xl bg-[#f46617] hover:bg-[#d85512] text-white"
                        >
                            {addLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Add UID
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deleteUID} onOpenChange={(open) => !open && setDeleteUID(null)}>
                <DialogContent className="sm:max-w-sm rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-red-600">Delete UID</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete UID <span className="font-mono font-bold text-slate-700">{deleteUID}</span>? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteUID(null)} className="rounded-xl">Cancel</Button>
                        <Button
                            onClick={handleDeleteUID}
                            disabled={deleteLoading}
                            className="rounded-xl bg-red-500 hover:bg-red-600 text-white"
                        >
                            {deleteLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminUIDManagement;
