import { useState, useEffect, useMemo } from "react";
import api, { getErrorMessage } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { downloadCSV } from "@/lib/utils";
import {
    Search, Users, Loader2, Store, Clock, CheckCircle2,
    Trophy, Download, Phone, ChevronRight, RefreshCw, CalendarDays, X
} from "lucide-react";

interface ManpowerRow {
    id: string;
    name: string;
    phone_number: string;
    manpower_id: string;
    applicator_type: string;
    is_active: number;
    is_approved: number;
    approved_at: string | null;
    removed_at: string | null;
    removed_reason: string | null;
    vendor_details_id: string;
    store_name: string;
    store_code: string | null;
    city: string | null;
    state: string | null;
    total_applications: number;
    points: number;
    pending_points: number;
    rejected_points: number;
    request_type: "remove" | "restore" | null;
    request_reason: string | null;
    requested_at: string | null;
    request_status: "pending" | "approved" | "rejected" | null;
    request_review_note: string | null;
}

export const AdminManpower = () => {
    const { toast } = useToast();
    const [manpower, setManpower] = useState<ManpowerRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [franchiseSearch, setFranchiseSearch] = useState("");
    const [memberSearch, setMemberSearch] = useState("");
    const [selectedStore, setSelectedStore] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<"all" | "approved" | "pending" | "removalRequests" | "inactive">("all");
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [view, setView] = useState<"leaderboard" | "byFranchise">("leaderboard");

    // Period filter — narrows the warranty tallies (the leaderboard numbers).
    // The staff roster itself is always shown in full.
    type Period = "all" | "year" | "month" | "week" | "custom";
    const now = new Date();
    const [period, setPeriod] = useState<Period>("all");
    const [year, setYear] = useState(String(now.getFullYear()));
    const [month, setMonth] = useState(String(now.getMonth() + 1));
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    // silent = keep the list on screen and spin the Refresh icon instead of
    // swapping the whole panel for a loader.
    const fetchManpower = async (silent = false) => {
        if (silent) setRefreshing(true); else setLoading(true);
        try {
            const params = new URLSearchParams({ period });
            if (period === "year") params.set("year", year);
            if (period === "month") { params.set("year", year); params.set("month", month); }
            if (period === "custom") {
                if (!startDate || !endDate) return;   // finally{} clears the flags
                params.set("startDate", startDate);
                params.set("endDate", endDate);
            }
            const res = await api.get(`/admin/manpower?${params.toString()}`);
            if (res.data.success) {
                setManpower(res.data.manpower || []);
                if (silent) toast({ title: "Refreshed", description: `${(res.data.manpower || []).length} staff loaded` });
            }
        } catch (error: any) {
            toast({
                title: "Failed to load manpower",
                description: getErrorMessage(error, "Could not fetch the manpower list"),
                variant: "destructive"
            });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Refetch whenever the period changes. For a custom range we wait until both
    // dates are set, so we don't fire a request on a half-filled range.
    useEffect(() => {
        if (period === "custom" && (!startDate || !endDate)) return;
        fetchManpower();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [period, year, month, startDate, endDate]);

    const handleApproval = async (member: ManpowerRow, approve: boolean) => {
        setUpdatingId(member.id);
        try {
            const res = await api.put(`/admin/manpower/${member.id}/approval`, { is_approved: approve });
            if (res.data.success) {
                toast({ title: approve ? "Staff Approved" : "Moved to Pending", description: res.data.message });
                setManpower(prev => prev.map(m =>
                    m.id === member.id ? { ...m, is_approved: approve ? 1 : 0 } : m
                ));
            }
        } catch (error: any) {
            toast({
                title: "Update Failed",
                description: getErrorMessage(error, "Could not update approval status"),
                variant: "destructive"
            });
        } finally {
            setUpdatingId(null);
        }
    };

    // Decide a franchise's removal request: approve (member leaves the team) or
    // decline (they stay, and the store sees the note).
    const handleRemovalReview = async (member: ManpowerRow, approve: boolean) => {
        if (!approve) {
            const note = window.prompt(`Why are you declining the removal of ${member.name}? (optional)`);
            if (note === null) return; // cancelled
            await submitRemovalReview(member, false, note);
            return;
        }
        if (!window.confirm(`Approve removal of ${member.name}? They will be moved to the Removed list.`)) return;
        await submitRemovalReview(member, true, "");
    };

    const submitRemovalReview = async (member: ManpowerRow, approve: boolean, note: string) => {
        setUpdatingId(member.id);
        try {
            const res = await api.put(`/admin/manpower/${member.id}/removal-review`, { approve, note });
            if (res.data.success) {
                toast({ title: approve ? "Removal Approved" : "Removal Declined", description: res.data.message });
                setManpower(prev => prev.map(m => m.id === member.id ? {
                    ...m,
                    is_active: approve ? 0 : m.is_active,
                    request_status: approve ? "approved" : "rejected",
                    removed_reason: approve ? m.request_reason : m.removed_reason,
                } : m));
            }
        } catch (error: any) {
            toast({
                title: "Review Failed",
                description: getErrorMessage(error, "Could not review the removal request"),
                variant: "destructive"
            });
        } finally {
            setUpdatingId(null);
        }
    };

    // ── Derived data ─────────────────────────────────────────────────────────
    // Staff currently in scope: the whole roster on the leaderboard, or just the
    // selected franchise's team. The status tabs count from THIS, so their numbers
    // always describe what you're actually looking at.
    const scopedManpower = useMemo(() => (
        view === "byFranchise" && selectedStore
            ? manpower.filter(m => m.vendor_details_id === selectedStore)
            : manpower
    ), [manpower, view, selectedStore]);

    const scopedCounts = useMemo(() => ({
        all: scopedManpower.length,
        approved: scopedManpower.filter(m => m.is_active && m.is_approved).length,
        pending: scopedManpower.filter(m => m.is_active && !m.is_approved).length,
        removalRequests: scopedManpower.filter(m => m.request_status === "pending" && m.request_type === "remove").length,
        inactive: scopedManpower.filter(m => !m.is_active).length,
    }), [scopedManpower]);

    // Switching franchise can leave you on a tab that's empty for the new store
    // (e.g. "Removed" when they have none) — fall back to All so the panel isn't
    // mysteriously blank.
    useEffect(() => {
        if (statusFilter !== "all" && scopedCounts[statusFilter] === 0) {
            setStatusFilter("all");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedStore, view]);

    // Pending across everything — used by the summary card at the top.
    const totalPendingCount = manpower.filter(m => m.is_active && !m.is_approved).length;

    // Group by franchise for the left panel.
    const franchises = useMemo(() => {
        const map = new Map<string, {
            id: string; store_name: string; store_code: string | null;
            city: string | null; state: string | null;
            total: number; pending: number; approved: number; points: number;
        }>();
        for (const m of manpower) {
            const key = m.vendor_details_id;
            if (!map.has(key)) {
                map.set(key, {
                    id: key, store_name: m.store_name, store_code: m.store_code,
                    city: m.city, state: m.state, total: 0, pending: 0, approved: 0, points: 0
                });
            }
            const f = map.get(key)!;
            f.total++;
            if (m.is_active && !m.is_approved) f.pending++;
            if (m.is_active && m.is_approved) f.approved++;
            f.points += Number(m.points || 0);
        }
        return [...map.values()].sort((a, b) =>
            b.pending - a.pending || b.points - a.points || a.store_name.localeCompare(b.store_name)
        );
    }, [manpower]);

    const filteredFranchises = useMemo(() => {
        if (!franchiseSearch) return franchises;
        const q = franchiseSearch.toLowerCase();
        return franchises.filter(f =>
            f.store_name?.toLowerCase().includes(q) ||
            f.store_code?.toLowerCase().includes(q) ||
            f.city?.toLowerCase().includes(q) ||
            f.state?.toLowerCase().includes(q)
        );
    }, [franchises, franchiseSearch]);

    // A member awaiting removal review is still active — they only leave the team
    // once an admin approves the request.
    const hasPendingRemoval = (m: ManpowerRow) =>
        m.request_status === "pending" && m.request_type === "remove";

    // A restore comes back as an unapproved active member, so it sits in the
    // normal approval queue — the reason just explains why they're back.
    const isRestoreRequest = (m: ManpowerRow) =>
        m.request_type === "restore" && !m.request_status &&
        Boolean(m.is_active) && !m.is_approved;

    const matchesStatus = (m: ManpowerRow) => {
        if (statusFilter === "approved") return m.is_active && m.is_approved;
        if (statusFilter === "pending") return m.is_active && !m.is_approved;
        if (statusFilter === "removalRequests") return hasPendingRemoval(m);
        if (statusFilter === "inactive") return !m.is_active;
        return true;
    };

    // Right panel list: the in-scope staff, narrowed by status tab and search.
    const visibleMembers = useMemo(() => {
        let list = scopedManpower.filter(matchesStatus);
        if (memberSearch) {
            const q = memberSearch.toLowerCase();
            list = list.filter(m =>
                m.name?.toLowerCase().includes(q) ||
                m.phone_number?.includes(q) ||
                m.manpower_id?.toLowerCase().includes(q) ||
                m.store_name?.toLowerCase().includes(q)
            );
        }
        return list;
    }, [scopedManpower, statusFilter, memberSearch]);

    const selectedFranchise = franchises.find(f => f.id === selectedStore);

    const handleExport = () => {
        if (visibleMembers.length === 0) {
            toast({ description: "Nothing to export", variant: "destructive" });
            return;
        }
        downloadCSV(visibleMembers.map((m, i) => ({
            Rank: i + 1,
            Name: m.name,
            "Staff ID": m.manpower_id,
            Phone: m.phone_number,
            Franchise: m.store_name,
            "Franchise Code": m.store_code || "",
            City: m.city || "",
            State: m.state || "",
            Type: m.applicator_type,
            Status: !m.is_active ? "Removed" : m.is_approved ? "Approved" : "Pending",
            Approved: m.points,
            Pending: m.pending_points,
            Rejected: m.rejected_points,
            Total: m.total_applications
        })), `manpower_${period}${period === "custom" ? `_${startDate}_to_${endDate}` : ""}_${new Date().toISOString().split("T")[0]}.csv`);
    };

    const statusBadge = (m: ManpowerRow) => {
        if (!m.is_active) return <Badge className="bg-slate-100 text-slate-500 border-slate-200">Removed</Badge>;
        if (!m.is_approved) return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Pending</Badge>;
        return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Approved</Badge>;
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-32">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Summary strip */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Total Staff", value: manpower.length, icon: Users, color: "text-slate-700" },
                    { label: "Approved", value: manpower.filter(m => m.is_active && m.is_approved).length, icon: CheckCircle2, color: "text-emerald-600" },
                    { label: "Pending Approval", value: totalPendingCount, icon: Clock, color: "text-amber-600" },
                    { label: "Removal Requests", value: manpower.filter(m => m.request_status === "pending" && m.request_type === "remove").length, icon: Store, color: "text-rose-600" },
                ].map(s => (
                    <Card key={s.label} className="border-orange-100">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center">
                                <s.icon className={`h-5 w-5 ${s.color}`} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{s.label}</p>
                                <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Fixed height (not min-height) so each panel scrolls inside itself
                instead of growing and scrolling the whole page. */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:h-[calc(100vh-20rem)] lg:min-h-[500px]">
                {/* ── Left: franchises ─────────────────────────────────────────── */}
                <div className="lg:col-span-4 flex flex-col gap-4 min-h-0">
                    <Card className="border-orange-100 shadow-sm flex-1 flex flex-col overflow-hidden min-h-0">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-bold">Franchises</CardTitle>
                            <CardDescription className="text-xs">
                                Select a franchise to see its team
                            </CardDescription>
                            <div className="relative mt-2">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Search franchise..."
                                    className="pl-9 h-9 text-sm"
                                    value={franchiseSearch}
                                    onChange={e => setFranchiseSearch(e.target.value)}
                                />
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 min-h-0 overflow-y-auto p-3 pt-0 space-y-1.5">
                            <button
                                onClick={() => { setSelectedStore(null); setView("leaderboard"); }}
                                className={`w-full text-left px-3 py-2.5 rounded-xl border transition-colors ${
                                    view === "leaderboard"
                                        ? "bg-orange-50 border-orange-200 text-orange-700"
                                        : "bg-white border-slate-100 hover:border-orange-200 text-slate-700"
                                }`}
                            >
                                <div className="flex items-center gap-2 font-bold text-sm">
                                    <Trophy className="h-4 w-4" /> All Staff — Leaderboard
                                </div>
                                <p className="text-[11px] text-slate-400 mt-0.5">{manpower.length} members across all franchises</p>
                            </button>

                            {filteredFranchises.map(f => {
                                const active = view === "byFranchise" && selectedStore === f.id;
                                return (
                                    <button
                                        key={f.id}
                                        onClick={() => { setSelectedStore(f.id); setView("byFranchise"); }}
                                        className={`w-full text-left px-3 py-2.5 rounded-xl border transition-colors ${
                                            active
                                                ? "bg-orange-50 border-orange-200"
                                                : "bg-white border-slate-100 hover:border-orange-200"
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className={`font-bold text-sm truncate ${active ? "text-orange-700" : "text-slate-800"}`}>
                                                    {f.store_name}
                                                </p>
                                                <p className={`text-[11px] truncate ${active ? "text-orange-500" : "text-slate-400"}`}>
                                                    {f.store_code ? `${f.store_code} • ` : ""}{f.city || ""}{f.state ? `, ${f.state}` : ""}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                {f.pending > 0 && (
                                                    <span className="text-[10px] font-black bg-amber-500 text-white px-1.5 py-0.5 rounded-full">
                                                        {f.pending}
                                                    </span>
                                                )}
                                                <span className={`text-[10px] font-bold ${active ? "text-orange-500" : "text-slate-400"}`}>
                                                    {f.total}
                                                </span>
                                                <ChevronRight className={`h-3.5 w-3.5 ${active ? "text-orange-500" : "text-slate-300"}`} />
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}

                            {filteredFranchises.length === 0 && (
                                <p className="text-center text-xs text-slate-400 py-8">No franchise matches your search.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* ── Right: staff list ────────────────────────────────────────── */}
                <div className="lg:col-span-8 min-h-0">
                    <Card className="border-orange-100 shadow-sm h-full flex flex-col overflow-hidden min-h-0">
                        <CardHeader className="pb-0 gap-0 space-y-0">
                            {/* Tier 1 — identity + actions + search */}
                            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="h-10 w-10 shrink-0 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-500">
                                        {view === "leaderboard" ? <Trophy className="h-5 w-5" /> : <Store className="h-5 w-5" />}
                                    </div>
                                    <div className="min-w-0">
                                        <CardTitle className="text-[15px] font-bold leading-tight truncate">
                                            {view === "leaderboard" ? "Staff Leaderboard" : selectedFranchise?.store_name}
                                        </CardTitle>
                                        <CardDescription className="text-xs mt-0.5 truncate">
                                            {view === "leaderboard"
                                                ? "All staff ranked by approved warranties"
                                                : `${selectedFranchise?.city || ""}${selectedFranchise?.state ? `, ${selectedFranchise.state}` : ""}`}
                                        </CardDescription>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 ml-auto">
                                    <div className="relative w-full sm:w-[240px]">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                                        <Input
                                            placeholder="Search staff..."
                                            className="pl-9 pr-8 h-9 text-sm bg-slate-50 border-slate-200 focus-visible:bg-white"
                                            value={memberSearch}
                                            onChange={e => setMemberSearch(e.target.value)}
                                        />
                                        {memberSearch && (
                                            <button
                                                onClick={() => setMemberSearch("")}
                                                aria-label="Clear search"
                                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                        )}
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => fetchManpower(true)}
                                        disabled={refreshing}
                                        title="Refresh"
                                        aria-label="Refresh"
                                        className="h-9 w-9 shrink-0 border-slate-200"
                                    >
                                        <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={handleExport}
                                        title="Export CSV"
                                        aria-label="Export CSV"
                                        className="h-9 w-9 shrink-0 border-slate-200"
                                    >
                                        <Download className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>

                            {/* Tier 2 — status filters as an underlined tab rail */}
                            <div className="flex items-center gap-1 mt-4 -mx-6 px-6 border-b border-slate-100 overflow-x-auto no-scrollbar">
                                {([
                                    { k: "all",             label: "All",              tone: "text-slate-700",   bar: "bg-slate-700",   pill: "bg-slate-100 text-slate-600" },
                                    { k: "approved",        label: "Approved",         tone: "text-emerald-600", bar: "bg-emerald-500", pill: "bg-emerald-50 text-emerald-600" },
                                    { k: "pending",         label: "Pending",          tone: "text-amber-600",   bar: "bg-amber-500",   pill: "bg-amber-50 text-amber-600" },
                                    { k: "removalRequests", label: "Removal Requests", tone: "text-rose-600",    bar: "bg-rose-500",    pill: "bg-rose-50 text-rose-600" },
                                    { k: "inactive",        label: "Removed",          tone: "text-slate-500",   bar: "bg-slate-400",   pill: "bg-slate-100 text-slate-500" },
                                ] as const).map(t => {
                                    const active = statusFilter === t.k;
                                    const count = scopedCounts[t.k as keyof typeof scopedCounts];
                                    return (
                                        <button
                                            key={t.k}
                                            onClick={() => setStatusFilter(t.k as any)}
                                            className={`relative shrink-0 flex items-center gap-1.5 px-3 py-2.5 text-[13px] font-semibold whitespace-nowrap transition-colors ${
                                                active ? t.tone : "text-slate-400 hover:text-slate-600"
                                            }`}
                                        >
                                            {t.label}
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full tabular-nums ${
                                                active ? t.pill : "bg-slate-100 text-slate-400"
                                            }`}>
                                                {count}
                                            </span>
                                            {active && <span className={`absolute inset-x-2 -bottom-px h-0.5 rounded-full ${t.bar}`} />}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Tier 3 — period scope for the warranty tallies */}
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3">
                                <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                                    <CalendarDays className="h-3.5 w-3.5" /> Period
                                </span>

                                <div className="inline-flex items-center gap-0.5 p-0.5 rounded-lg bg-slate-100">
                                    {([
                                        { k: "all", label: "All Time" },
                                        { k: "year", label: "Year" },
                                        { k: "month", label: "Month" },
                                        { k: "week", label: "Last 7 Days" },
                                        { k: "custom", label: "Custom" },
                                    ] as { k: Period; label: string }[]).map(p => (
                                        <button
                                            key={p.k}
                                            onClick={() => setPeriod(p.k)}
                                            className={`px-2.5 py-1 rounded-md text-[11px] font-bold whitespace-nowrap transition-all ${
                                                period === p.k
                                                    ? "bg-white text-orange-600 shadow-sm"
                                                    : "text-slate-500 hover:text-slate-700"
                                            }`}
                                        >
                                            {p.label}
                                        </button>
                                    ))}
                                </div>

                                {(period === "year" || period === "month") && (
                                    <select
                                        value={year}
                                        onChange={e => setYear(e.target.value)}
                                        className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-[11px] font-bold text-slate-700"
                                    >
                                        {Array.from({ length: 6 }, (_, i) => now.getFullYear() - i).map(y => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                )}

                                {period === "month" && (
                                    <select
                                        value={month}
                                        onChange={e => setMonth(e.target.value)}
                                        className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-[11px] font-bold text-slate-700"
                                    >
                                        {["January","February","March","April","May","June",
                                          "July","August","September","October","November","December"]
                                          .map((mn, i) => <option key={mn} value={i + 1}>{mn}</option>)}
                                    </select>
                                )}

                                {period === "custom" && (
                                    <div className="flex items-center gap-1.5">
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={e => setStartDate(e.target.value)}
                                            className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-[11px] font-bold text-slate-700"
                                        />
                                        <span className="text-[11px] text-slate-400">to</span>
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={e => setEndDate(e.target.value)}
                                            className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-[11px] font-bold text-slate-700"
                                        />
                                    </div>
                                )}

                                <span className="ml-auto text-[11px] font-semibold text-slate-400 tabular-nums">
                                    {visibleMembers.length} shown
                                    {period !== "all" && <span className="hidden md:inline"> · counts for selected period</span>}
                                </span>
                            </div>
                        </CardHeader>

                        <CardContent className="flex-1 min-h-0 overflow-y-auto p-4 pt-0 space-y-2">
                            {visibleMembers.length === 0 ? (
                                <div className="text-center py-16 text-slate-400">
                                    <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
                                    <p className="text-sm font-bold">No staff found</p>
                                    <p className="text-xs mt-1">Try a different filter or search.</p>
                                </div>
                            ) : visibleMembers.map((m, index) => (
                                <div
                                    key={m.id}
                                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 border border-slate-100 rounded-xl bg-white hover:border-orange-200 transition-colors"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        {view === "leaderboard" && (
                                            <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                                                index === 0 ? "bg-amber-100 text-amber-700"
                                                : index === 1 ? "bg-slate-200 text-slate-600"
                                                : index === 2 ? "bg-orange-100 text-orange-700"
                                                : "bg-slate-50 text-slate-400"
                                            }`}>
                                                {index + 1}
                                            </div>
                                        )}
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="font-bold text-sm text-slate-800 truncate">{m.name}</p>
                                                {statusBadge(m)}
                                                {hasPendingRemoval(m) && (
                                                    <Badge className="bg-rose-100 text-rose-700 border-rose-200">Removal Requested</Badge>
                                                )}
                                                {isRestoreRequest(m) && (
                                                    <Badge className="bg-orange-100 text-orange-700 border-orange-200">Restore Requested</Badge>
                                                )}
                                            </div>
                                            {hasPendingRemoval(m) && m.request_reason && (
                                                <p className="text-[11px] text-rose-600 mt-1 italic">
                                                    Reason: {m.request_reason}
                                                </p>
                                            )}
                                            {isRestoreRequest(m) && m.request_reason && (
                                                <p className="text-[11px] text-orange-600 mt-1 italic">
                                                    Restore reason: {m.request_reason}
                                                </p>
                                            )}
                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-400 mt-0.5">
                                                <span className="font-mono">{m.manpower_id}</span>
                                                <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{m.phone_number}</span>
                                                {view === "leaderboard" && (
                                                    <span className="flex items-center gap-1 truncate">
                                                        <Store className="h-3 w-3" />{m.store_name}
                                                    </span>
                                                )}
                                                <span className="capitalize">{m.applicator_type?.replace("_", " ")}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        <div className="flex gap-1.5">
                                            <span className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[11px] font-bold" title="Approved warranties">
                                                {m.points}
                                            </span>
                                            <span className="px-2 py-1 rounded-lg bg-amber-50 text-amber-700 text-[11px] font-bold" title="Pending warranties">
                                                {m.pending_points}
                                            </span>
                                            <span className="px-2 py-1 rounded-lg bg-red-50 text-red-600 text-[11px] font-bold" title="Rejected warranties">
                                                {m.rejected_points}
                                            </span>
                                        </div>

                                        {hasPendingRemoval(m) ? (
                                            // A removal request takes precedence — decide it first.
                                            <div className="flex items-center gap-1.5">
                                                <Button
                                                    size="sm" variant="outline"
                                                    disabled={updatingId === m.id}
                                                    onClick={() => handleRemovalReview(m, false)}
                                                    className="h-7 text-[11px] border-slate-200 text-slate-600"
                                                >
                                                    {updatingId === m.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Decline"}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    disabled={updatingId === m.id}
                                                    onClick={() => handleRemovalReview(m, true)}
                                                    className="h-7 text-[11px] bg-rose-600 hover:bg-rose-700 text-white"
                                                >
                                                    {updatingId === m.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Approve Removal"}
                                                </Button>
                                            </div>
                                        ) : Boolean(m.is_active) && (
                                            Boolean(m.is_approved) ? (
                                                <Button
                                                    size="sm" variant="outline"
                                                    disabled={updatingId === m.id}
                                                    onClick={() => handleApproval(m, false)}
                                                    className="h-7 text-[11px] border-slate-200 text-slate-600"
                                                >
                                                    {updatingId === m.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Move to Pending"}
                                                </Button>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    disabled={updatingId === m.id}
                                                    onClick={() => handleApproval(m, true)}
                                                    className="h-7 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white"
                                                >
                                                    {updatingId === m.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Approve"}
                                                </Button>
                                            )
                                        )}
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};
