import { useState, useEffect, useMemo, useCallback } from "react";
import { AuditRoundBar, type AuditRound } from "./AuditRoundBar";
import { AuditChaseList } from "./AuditChaseList";
import { AuditContactsUpload } from "./AuditContactsUpload";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import api, { getErrorMessage } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { downloadCSV } from "@/lib/utils";
import {
    Search, Loader2, RefreshCw, Download, X, ClipboardCheck,
    AlertTriangle, CheckCircle2, Flag, Phone, MessageCircle, Plus, SlidersHorizontal, FileSpreadsheet, Trash2
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AUDIT_QUESTIONS, AUDIT_SECTIONS, AUDIT_FLOW, auditLabel, type AuditFieldKey } from "@/lib/auditQuestions";
import { AuditCallForm } from "./AuditCallForm";

/**
 * Store audit responses, laid out as the sheet the team already works in: one row
 * per audit, one column per question, newest first, growing as responses arrive.
 *
 * A card list was the wrong shape — audits are compared across stores, and
 * comparison needs columns. The table scrolls horizontally with the store column
 * pinned, so a row never loses its identity while reading the answers.
 *
 * Two channels feed it: the store answers on WhatsApp, or someone rings the store
 * and fills the same questions in. Channel and auditor are columns, so it is
 * always clear which route a row came by and who recorded it.
 */
interface AuditRow {
    id: string;
    vendor_details_id: string | null;
    submitted_phone: string;
    channel: "whatsapp" | "call";
    audited_by_name: string | null;
    flow_name: string | null;
    flow_version: string | null;
    store_name: string | null;
    store_code: string | null;
    city: string | null;
    state: string | null;
    franchise_name: string | null;
    contact_person: string | null;
    asm: string | null;
    brands: string | null;
    category: string | null;
    signage_status: string | null;
    online_presence: string | null;
    online_presence_other: string | null;
    footfall: string | null;
    seat_covers_stock: string | null;
    products_stocked: string | null;
    last_month_business: string | null;
    staff_training: string | null;
    warranty_registration: string | null;
    support_needed: string | null;
    support_details: string | null;
    review_status: "new" | "reviewed" | "follow_up";
    review_note: string | null;
    submitted_at: string;
}

type Filter = "all" | "whatsapp" | "call" | "new" | "follow_up" | "reviewed" | "unmatched";

const STATUS_META: Record<string, { label: string; cls: string }> = {
    new:       { label: "New",       cls: "bg-blue-50 text-blue-700 border-blue-200" },
    reviewed:  { label: "Reviewed",  cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    follow_up: { label: "Follow up", cls: "bg-amber-50 text-amber-700 border-amber-200" },
};

const fmtDate = (d: string) =>
    new Date(d).toLocaleString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    });

export const AdminAudits = () => {
    const { toast } = useToast();
    const [audits, setAudits] = useState<AuditRow[]>([]);
    const [counts, setCounts] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<Filter>("all");
    const [selected, setSelected] = useState<AuditRow | null>(null);
    const [note, setNote] = useState("");
    const [saving, setSaving] = useState(false);
    const [deletingAudit, setDeletingAudit] = useState(false);
    const [callFormOpen, setCallFormOpen] = useState(false);
    const [callPresetTarget, setCallPresetTarget] = useState<{
        targetId: string;
        vendorDetailsId: string | null;
        storeName: string | null;
        city: string | null;
        contactPerson: string | null;
        phone: string | null;
    } | null>(null);
    const [contactsOpen, setContactsOpen] = useState(false);

    // Audits repeat, so submissions belong to a round — the campaign that sent
    // them. The round carries who it went to, which is the only way to tell who
    // has NOT responded: the submissions table can only ever show who did.
    const [rounds, setRounds] = useState<AuditRound[]>([]);
    const [roundsLoading, setRoundsLoading] = useState(true);
    const [roundId, setRoundId] = useState<string | null>(null);
    const [view, setView] = useState<"done" | "not_done">("done");
    const [chaseKey, setChaseKey] = useState(0);

    /**
     * Filters built from the data rather than a fixed list.
     *
     * Territory (city/ASM) and the answers themselves are what an admin
     * actually slices by; the options come from the audits on hand, so a value
     * only ever appears when something matches it.
     */
    const [facets, setFacets] = useState<Record<string, string>>({});

    /** Answer fields worth filtering on: the ones with a fixed set of options. */
    const ANSWER_FACETS = useMemo(
        () => AUDIT_QUESTIONS.filter(q => q.type === "single" || q.type === "multi"),
        []
    );

    /** Multi-selects are stored comma-joined, so they match on contains. */
    const isMulti = (key: string) =>
        AUDIT_QUESTIONS.find(q => q.key === (key as AuditFieldKey))?.type === "multi";

    const facetOptions = useMemo(() => {
        const scoped = roundId ? audits.filter(a => (a as any).round_id === roundId) : audits;
        const uniq = (vals: (string | null | undefined)[]) =>
            Array.from(new Set(vals.filter(Boolean).map(v => String(v).trim()))).sort();

        return {
            city: uniq(scoped.map(a => a.city)),
            state: uniq(scoped.map(a => a.state)),
            asm: uniq(scoped.map(a => a.asm)),
        } as Record<string, string[]>;
    }, [audits, roundId]);

    const setFacet = (key: string, value: string) =>
        setFacets(prev => {
            const next = { ...prev };
            if (!value || value === "all") delete next[key];
            else next[key] = value;
            return next;
        });

    const activeFacetCount = Object.keys(facets).length;

    const fetchRounds = useCallback(async () => {
        try {
            const res = await api.get("/admin/audit-rounds");
            setRounds(res.data.rounds || []);
        } catch {
            setRounds([]);
        } finally {
            setRoundsLoading(false);
        }
    }, []);

    const fetchAudits = async (showToast = false) => {
        setRefreshing(true);
        try {
            const res = await api.get("/admin/audits");
            setAudits(res.data.audits || []);
            setCounts(res.data.counts || {});
            if (showToast) toast({ title: "Refreshed" });
        } catch (error: any) {
            toast({
                title: "Could not load audits",
                description: getErrorMessage(error, "Failed to load audit responses"),
                variant: "destructive",
            });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { fetchAudits(); fetchRounds(); }, [fetchRounds]);

    // Counted from the rows this round actually contains, so a tab never claims
    // more than the table can show.
    const scopedCounts = useMemo(() => {
        const rows = roundId
            ? audits.filter(a => (a as any).round_id === roundId)
            : audits;
        return {
            total: rows.length,
            whatsapp: rows.filter(a => a.channel === "whatsapp").length,
            call: rows.filter(a => a.channel === "call").length,
            new: rows.filter(a => a.review_status === "new").length,
            follow_up: rows.filter(a => a.review_status === "follow_up").length,
            reviewed: rows.filter(a => a.review_status === "reviewed").length,
            unmatched: rows.filter(a => !a.vendor_details_id).length,
        };
    }, [audits, roundId]);

    const visible = useMemo(() => {
        let list = audits;
        // Scope to the selected round; older audits predate rounds and carry no
        // round_id, so they only appear when no round is selected.
        if (roundId) list = list.filter(a => (a as any).round_id === roundId);
        if (filter === "unmatched") list = list.filter(a => !a.vendor_details_id);
        else if (filter === "whatsapp" || filter === "call") list = list.filter(a => a.channel === filter);
        else if (filter !== "all") list = list.filter(a => a.review_status === filter);

        // Territory and answer facets. A multi-select is stored comma-joined,
        // so it matches on contains rather than equality.
        for (const [key, value] of Object.entries(facets)) {
            list = list.filter(a => {
                const cell = (a as any)[key];
                if (!cell) return false;
                return isMulti(key)
                    ? String(cell).split(",").map(x => x.trim()).includes(value)
                    : String(cell).trim() === value;
            });
        }

        const q = search.trim().toLowerCase();
        if (q) {
            list = list.filter(a =>
                (a.store_name || a.franchise_name || "").toLowerCase().includes(q) ||
                (a.store_code || "").toLowerCase().includes(q) ||
                (a.city || "").toLowerCase().includes(q) ||
                (a.contact_person || "").toLowerCase().includes(q) ||
                (a.audited_by_name || "").toLowerCase().includes(q) ||
                a.submitted_phone.includes(q)
            );
        }
        return list;
    }, [audits, filter, search, roundId, facets]);

    const tabs: { k: Filter; label: string; n: number; tone: string; bar: string }[] = [
        { k: "all",       label: "All",       n: scopedCounts.total,      tone: "text-slate-700",   bar: "bg-slate-700" },
        { k: "whatsapp",  label: "WhatsApp",  n: scopedCounts.whatsapp,   tone: "text-emerald-600", bar: "bg-emerald-500" },
        { k: "call",      label: "Call",      n: scopedCounts.call,       tone: "text-violet-600",  bar: "bg-violet-500" },
        { k: "new",       label: "New",       n: scopedCounts.new,        tone: "text-blue-600",    bar: "bg-blue-500" },
        { k: "follow_up", label: "Follow up", n: scopedCounts.follow_up,  tone: "text-amber-600",   bar: "bg-amber-500" },
        { k: "reviewed",  label: "Reviewed",  n: scopedCounts.reviewed,   tone: "text-emerald-600", bar: "bg-emerald-500" },
        { k: "unmatched", label: "Not in franchise DB", n: scopedCounts.unmatched,  tone: "text-rose-600",    bar: "bg-rose-500" },
    ];

    /**
     * Delete one submission.
     *
     * The server reopens the matching round target, so a store whose test entry
     * is removed goes back to "not done" instead of silently counting as done.
     */
    const removeAudit = async (audit: AuditRow) => {
        if (!window.confirm("Delete this audit submission? This cannot be undone.")) return;
        setDeletingAudit(true);
        try {
            await api.delete(`/admin/audits/${audit.id}`);
            toast({ title: "Audit deleted" });
            setSelected(null);
            setNote("");
            fetchAudits();
            // The round's responded/outstanding counts just changed.
            fetchRounds();
            setChaseKey(k => k + 1);
        } catch (error: any) {
            toast({
                title: "Could not delete",
                description: getErrorMessage(error, "Failed to delete the audit"),
                variant: "destructive",
            });
        } finally {
            setDeletingAudit(false);
        }
    };

    const setReview = async (audit: AuditRow, status: AuditRow["review_status"]) => {
        setSaving(true);
        try {
            await api.put(`/admin/audits/${audit.id}/review`, { status, note: note.trim() || null });
            toast({ title: status === "follow_up" ? "Flagged for follow up" : "Marked reviewed" });
            setSelected(null);
            setNote("");
            fetchAudits();
        } catch (error: any) {
            toast({
                title: "Could not save",
                description: getErrorMessage(error, "Failed to update the audit"),
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    /** The CSV mirrors the table, so the export is what is on screen. */
    const handleExport = () => {
        downloadCSV(
            visible.map(a => ({
                "Submitted": fmtDate(a.submitted_at),
                "Store Name": a.store_name || a.franchise_name || "(unknown)",
                "In Franchise DB": a.vendor_details_id ? "Yes" : "No",
                "Store code": a.store_code || "",
                "Contact Person": a.contact_person || "",
                "Phone": a.submitted_phone,
                "City": a.city || "",
                "Area": (a as any).contact_area || "",
                "State": a.state || "",
                "ASM": a.asm || "",
                "Source": a.channel === "call" ? "Call" : "WhatsApp",
                "Audit By": a.audited_by_name || "Store (self)",
                "Status": STATUS_META[a.review_status]?.label || a.review_status,
                ...Object.fromEntries(
                    AUDIT_QUESTIONS.map(q => [q.label, auditLabel(q.key, a[q.key] as string)])
                ),
                "Note": a.review_note || "",
                "Flow": a.flow_name || (a.channel === "call" ? "Call" : ""),
            })),
            `store-audits-${new Date().toISOString().slice(0, 10)}.csv`
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
            </div>
        );
    }

    const META_COLS = ["Submitted", "Contact Person", "Phone", "City", "ASM", "Source", "Audit By"];

    const activeRound = rounds.find(r => r.id === roundId) || null;


    return (
        <div className="space-y-4">
            <AuditRoundBar
                rounds={rounds}
                loading={roundsLoading}
                selectedId={roundId}
                onSelect={setRoundId}
                onSeeded={() => { fetchRounds(); setChaseKey(k => k + 1); }}
            />

            {/* Done vs not done. The submissions table can only show replies, so
                "not done" is a different list entirely, built from who the audit
                was sent to. */}
            {roundId && (
                <div className="flex gap-2">
                    <button
                        onClick={() => setView("done")}
                        className={
                            "h-10 px-4 rounded-2xl text-sm font-bold transition-colors border " +
                            (view === "done"
                                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50")
                        }
                    >
                        Done{activeRound ? ` · ${activeRound.responded_count}` : ""}
                    </button>
                    <button
                        onClick={() => setView("not_done")}
                        className={
                            "h-10 px-4 rounded-2xl text-sm font-bold transition-colors border " +
                            (view === "not_done"
                                ? "bg-amber-50 border-amber-200 text-amber-700"
                                : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50")
                        }
                    >
                        Not done{activeRound ? ` · ${activeRound.outstanding_count}` : ""}
                    </button>
                </div>
            )}

            {/* Filters drawn from the data on hand. Not gated on a round: they
                filter whatever audits are listed, round or no round. */}
            {view === "done" && (
                <div className="flex flex-wrap items-center gap-2">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className={
                                    "h-10 rounded-2xl border-orange-100 hover:bg-orange-50 gap-2 " +
                                    (activeFacetCount > 0
                                        ? "text-orange-600 border-orange-200 bg-orange-50"
                                        : "text-slate-600")
                                }
                            >
                                <SlidersHorizontal className="h-4 w-4" />
                                Filter
                                {activeFacetCount > 0 && (
                                    <span className="ml-0.5 h-5 min-w-5 px-1.5 rounded-full bg-orange-600 text-white text-[10px] font-black flex items-center justify-center">
                                        {activeFacetCount}
                                    </span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent align="start" className="w-80 rounded-2xl p-4 max-h-[70vh] overflow-y-auto space-y-4">
                            <div className="flex items-center justify-between">
                                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Filters</p>
                                {activeFacetCount > 0 && (
                                    <button
                                        onClick={() => setFacets({})}
                                        className="text-[11px] font-bold text-orange-600 hover:text-orange-700"
                                    >
                                        Clear all
                                    </button>
                                )}
                            </div>

                            {/* Territory — only shown where the audits carry values */}
                            {(["city", "state", "asm"] as const).map(key =>
                                facetOptions[key]?.length > 0 ? (
                                    <div key={key} className="space-y-1.5">
                                        <label className="text-[11px] font-bold text-slate-500 capitalize">
                                            {key === "asm" ? "ASM" : key}
                                        </label>
                                        <Select value={facets[key] || "all"} onValueChange={v => setFacet(key, v)}>
                                            <SelectTrigger className="h-10 rounded-xl border-slate-200 text-sm">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl max-h-64">
                                                <SelectItem value="all">Any</SelectItem>
                                                {facetOptions[key].map(v => (
                                                    <SelectItem key={v} value={v}>{v}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                ) : null
                            )}

                            {/* The answers themselves */}
                            <div className="pt-1 border-t border-slate-100">
                                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 pt-3 pb-2">
                                    Answers
                                </p>
                                <div className="space-y-3">
                                    {ANSWER_FACETS.map(q => (
                                        <div key={q.key} className="space-y-1.5">
                                            <label className="text-[11px] font-bold text-slate-500">{q.label}</label>
                                            <Select
                                                value={facets[q.key] || "all"}
                                                onValueChange={v => setFacet(q.key, v)}
                                            >
                                                <SelectTrigger className="h-10 rounded-xl border-slate-200 text-sm">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-2xl max-h-64">
                                                    <SelectItem value="all">Any</SelectItem>
                                                    {q.options!.map(o => (
                                                        <SelectItem key={o.id} value={o.id}>{o.title}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>

                    {/* Active filters as removable chips, so what is applied is visible
                        without reopening the panel. */}
                    {Object.entries(facets).map(([key, value]) => (
                        <button
                            key={key}
                            onClick={() => setFacet(key, "all")}
                            className="h-10 px-3 rounded-2xl border border-orange-200 bg-orange-50 text-orange-700 text-xs font-bold inline-flex items-center gap-1.5 hover:bg-orange-100 transition-colors"
                        >
                            <span className="text-orange-400 uppercase text-[9px] tracking-wider">
                                {key === "asm" ? "ASM" : (AUDIT_QUESTIONS.find(q => q.key === (key as AuditFieldKey))?.label || key)}
                            </span>
                            {AUDIT_QUESTIONS.some(q => q.key === (key as AuditFieldKey))
                                ? auditLabel(key as AuditFieldKey, value)
                                : value}
                            <X className="h-3 w-3" />
                        </button>
                    ))}
                </div>
            )}

            {view === "not_done" && roundId ? (
                <div className="bg-white rounded-3xl border border-orange-50 shadow-sm p-5">
                    <AuditChaseList
                        roundId={roundId}
                        responded="no"
                        refreshKey={chaseKey}
                        onAudit={(t) => {
                            // Open the call form on the store whose row was
                            // clicked, so the audit is filed against the one
                            // being chased rather than one picked again by hand.
                            setCallPresetTarget({
                                targetId: t.id,
                                vendorDetailsId: t.vendor_details_id,
                                storeName: t.store_name,
                                city: t.city,
                                contactPerson: t.contact_person,
                                phone: t.phone_number || t.sent_phone,
                            });
                            setCallFormOpen(true);
                        }}
                    />
                </div>
            ) : (
            <>
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 shrink-0 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-500">
                        <ClipboardCheck className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                        <h2 className="text-[15px] font-bold leading-tight">Audit &amp; Compliance</h2>
                        {/* Named explicitly: a later af_store_audit_3 may ask different
                            questions, and rows must stay traceable to their source. */}
                        <p className="text-[11px] text-slate-400 mt-0.5">
                            Flow <span className="font-mono font-semibold text-slate-500">{AUDIT_FLOW.name}</span>
                            {" · "}v{AUDIT_FLOW.version}
                            {" · "}<span className="font-mono">{AUDIT_FLOW.id}</span>
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 ml-auto">
                    <div className="relative w-full sm:w-[240px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                        <Input
                            placeholder="Search store, person or auditor..."
                            className="pl-9 pr-8 h-9 text-sm bg-slate-50 border-slate-200 focus-visible:bg-white"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                        {search && (
                            <button
                                onClick={() => setSearch("")}
                                aria-label="Clear search"
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>
                    {/* The round cards and the chase list come from their own
                        endpoints, so refreshing only the submissions left the
                        targeted/done counts stale — which is the part someone
                        watching a live campaign is actually refreshing for. */}
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => { fetchAudits(true); fetchRounds(); setChaseKey(k => k + 1); }}
                        disabled={refreshing}
                        title="Refresh" aria-label="Refresh" className="h-9 w-9 shrink-0 border-slate-200">
                        <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
                    </Button>
                    <Button variant="outline" size="icon" onClick={handleExport} disabled={visible.length === 0}
                        title="Export CSV" aria-label="Export CSV" className="h-9 w-9 shrink-0 border-slate-200">
                        <Download className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="outline" onClick={() => setContactsOpen(true)}
                        title="Upload your store list"
                        className="h-9 shrink-0 border-slate-200 gap-1.5 text-slate-600">
                        <FileSpreadsheet className="h-3.5 w-3.5" />
                        <span className="hidden lg:inline">Store list</span>
                    </Button>
                    <Button onClick={() => setCallFormOpen(true)} className="h-9 bg-orange-600 hover:bg-orange-700 shrink-0">
                        <Plus className="h-3.5 w-3.5 mr-1.5" /> Call audit
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-1 border-b border-slate-100 overflow-x-auto no-scrollbar">
                {tabs.map(t => {
                    const active = filter === t.k;
                    return (
                        <button
                            key={t.k}
                            onClick={() => setFilter(t.k)}
                            className={`relative shrink-0 flex items-center gap-1.5 px-3 py-2.5 text-[13px] font-semibold whitespace-nowrap transition-colors ${
                                active ? t.tone : "text-slate-400 hover:text-slate-600"
                            }`}
                        >
                            {t.label}
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full tabular-nums ${
                                active ? "bg-slate-100 text-slate-600" : "bg-slate-100 text-slate-400"
                            }`}>
                                {t.n}
                            </span>
                            {active && <span className={`absolute inset-x-2 -bottom-px h-0.5 rounded-full ${t.bar}`} />}
                        </button>
                    );
                })}
            </div>

            {visible.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                    <ClipboardCheck className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm font-bold">No audit responses yet</p>
                    <p className="text-xs mt-1 max-w-md mx-auto">
                        Rows appear here as stores submit the WhatsApp form. You can also
                        record one taken over the phone with <span className="font-semibold">Call audit</span>.
                    </p>
                </div>
            ) : (
                /* Horizontal scroll is confined to this container, so the page body
                   never scrolls sideways however many question columns exist. */
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-sm">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="sticky left-0 z-10 bg-slate-50 text-left p-3 font-black text-[10px] uppercase tracking-wider text-slate-500 min-w-[200px] border-r border-slate-200">
                                        Store Name
                                    </th>
                                    {META_COLS.map(h => (
                                        <th key={h} className="text-left p-3 font-black text-[10px] uppercase tracking-wider text-slate-500 whitespace-nowrap">
                                            {h}
                                        </th>
                                    ))}
                                    {AUDIT_QUESTIONS.map(q => (
                                        <th
                                            key={q.key}
                                            title={q.question}
                                            className="text-left p-3 font-black text-[10px] uppercase tracking-wider text-slate-500 whitespace-nowrap min-w-[140px]"
                                        >
                                            {q.label}
                                        </th>
                                    ))}
                                    <th className="text-left p-3 font-black text-[10px] uppercase tracking-wider text-slate-500 whitespace-nowrap">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {visible.map(a => (
                                    <tr
                                        key={a.id}
                                        onClick={() => { setSelected(a); setNote(a.review_note || ""); }}
                                        className="border-b border-slate-100 hover:bg-orange-50/40 cursor-pointer transition-colors"
                                    >
                                        <td className="sticky left-0 z-10 bg-white p-3 border-r border-slate-200 min-w-[200px]">
                                            <div className="font-bold text-slate-800 truncate max-w-[220px]">
                                                {a.store_name || a.franchise_name || "Unknown store"}
                                            </div>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                {a.store_code && (
                                                    <span className="text-[10px] font-mono text-slate-400">{a.store_code}</span>
                                                )}
                                                {/* Two different things, so say which one.
                                                    A store from the uploaded sheet has a name
                                                    and is worth auditing — it simply has no
                                                    franchise record. A store in neither list is
                                                    the one that actually needs looking into. */}
                                                {!a.vendor_details_id && (
                                                    (a as any).in_contact_sheet ? (
                                                        <span
                                                            title="Known from the uploaded store list, but this number is not in the franchise database"
                                                            className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600"
                                                        >
                                                            <FileSpreadsheet className="h-3 w-3" /> Sheet only
                                                        </span>
                                                    ) : (
                                                        <span
                                                            title="This number is in neither the franchise database nor the uploaded store list"
                                                            className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600"
                                                        >
                                                            <AlertTriangle className="h-3 w-3" /> Not in DB
                                                        </span>
                                                    )
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-3 whitespace-nowrap text-[12px] text-slate-500 tabular-nums">{fmtDate(a.submitted_at)}</td>
                                        <td className="p-3 whitespace-nowrap text-[12px] text-slate-600">{a.contact_person || "—"}</td>
                                        <td className="p-3 whitespace-nowrap text-[12px] text-slate-600 tabular-nums">{a.submitted_phone}</td>
                                        <td className="p-3 whitespace-nowrap text-[12px] text-slate-600">
                                            {a.city || "—"}
                                        </td>
                                        <td className="p-3 whitespace-nowrap text-[12px] text-slate-600">{a.asm || "—"}</td>
                                        <td className="p-3 whitespace-nowrap">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                                a.channel === "call"
                                                    ? "bg-violet-50 text-violet-700"
                                                    : "bg-emerald-50 text-emerald-700"
                                            }`}>
                                                {a.channel === "call"
                                                    ? <><Phone className="h-3 w-3" /> Call</>
                                                    : <><MessageCircle className="h-3 w-3" /> WhatsApp</>}
                                            </span>
                                        </td>
                                        <td className="p-3 whitespace-nowrap text-[12px] text-slate-600">
                                            {a.audited_by_name || <span className="text-slate-400">Store (self)</span>}
                                        </td>
                                        {AUDIT_QUESTIONS.map(q => {
                                            const value = a[q.key] as string | null;
                                            return (
                                                <td key={q.key} className="p-3 text-[12px] text-slate-700 min-w-[140px]">
                                                    <span className="line-clamp-2">
                                                        {value ? auditLabel(q.key, value) : <span className="text-slate-300">—</span>}
                                                    </span>
                                                </td>
                                            );
                                        })}
                                        <td className="p-3 whitespace-nowrap">
                                            <Badge variant="outline" className={`text-[10px] ${STATUS_META[a.review_status]?.cls}`}>
                                                {STATUS_META[a.review_status]?.label}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="px-3 py-2 border-t border-slate-100 bg-slate-50/60">
                        <p className="text-[11px] text-slate-400 tabular-nums">
                            {visible.length} audit{visible.length === 1 ? "" : "s"}
                            {visible.length !== audits.length && ` of ${audits.length}`}
                            {" · scroll right for all answers"}
                        </p>
                    </div>
                </div>
            )}
            </>
            )}

            <AuditContactsUpload
                open={contactsOpen}
                onClose={() => setContactsOpen(false)}
                onUploaded={() => {
                    // The upload also rebuilds the round's chase list, so the
                    // round bar and the not-done list have to refetch too —
                    // otherwise they keep showing the pre-upload totals.
                    fetchAudits(true);
                    fetchRounds();
                    setChaseKey(k => k + 1);
                }}
            />

            <AuditCallForm
                open={callFormOpen}
                presetTarget={callPresetTarget}
                roundId={roundId}
                onClose={() => { setCallFormOpen(false); setCallPresetTarget(null); }}
                onSaved={() => {
                    fetchAudits();
                    // The store just moved from "not done" to "done", so the
                    // round counters and the chase list are both stale.
                    fetchRounds();
                    setChaseKey(k => k + 1);
                }}
            />

            {/* One audit in full */}
            <Dialog open={!!selected} onOpenChange={open => { if (!open) { setSelected(null); setNote(""); } }}>
                <DialogContent className="max-w-2xl max-h-[88vh] flex flex-col p-0 gap-0">
                    <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100 shrink-0">
                        <DialogTitle className="text-base">
                            {selected?.store_name || selected?.franchise_name || "Unmatched response"}
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            {selected && (
                                <>
                                    {[selected.city, selected.state].filter(Boolean).join(", ")}
                                    {selected.city ? " · " : ""}
                                    {selected.submitted_phone} · {fmtDate(selected.submitted_at)}
                                    {" · "}
                                    {selected.channel === "call"
                                        ? `Call audit by ${selected.audited_by_name || "unknown"}`
                                        : "Submitted by the store on WhatsApp"}
                                </>
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-4">
                        {selected && AUDIT_SECTIONS.map(section => (
                            <div key={section}>
                                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
                                    {section}
                                </p>
                                <div className="space-y-2">
                                    {AUDIT_QUESTIONS.filter(q => q.section === section).map(q => {
                                        const value = selected[q.key] as string | null;
                                        return (
                                            <div key={q.key} className="flex gap-3 text-sm">
                                                <span className="w-1/2 shrink-0 text-slate-500">{q.question}</span>
                                                <span className={`flex-1 font-semibold ${value ? "text-slate-800" : "text-slate-300 italic"}`}>
                                                    {value ? auditLabel(q.key, value) : "Not answered"}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="px-6 py-4 border-t border-slate-100 shrink-0 space-y-3">
                        <Textarea
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            placeholder="Internal note (optional) — what needs following up?"
                            rows={2}
                            maxLength={500}
                            className="text-sm resize-none"
                        />
                        <DialogFooter className="gap-2 sm:justify-between">
                            <div className="flex gap-2">
                                {/* Test submissions look exactly like real ones,
                                    so removing one has to be possible here. */}
                                <Button
                                    variant="outline"
                                    onClick={() => selected && removeAudit(selected)}
                                    disabled={saving || deletingAudit}
                                    className="border-red-200 text-red-600 hover:bg-red-50"
                                >
                                    {deletingAudit
                                        ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                                        : <Trash2 className="h-3.5 w-3.5 mr-1.5" />}
                                    Delete
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => selected && setReview(selected, "follow_up")}
                                    disabled={saving}
                                    className="border-amber-200 text-amber-700 hover:bg-amber-50"
                                >
                                    <Flag className="h-3.5 w-3.5 mr-1.5" /> Flag follow up
                                </Button>
                            </div>
                            <Button
                                onClick={() => selected && setReview(selected, "reviewed")}
                                disabled={saving}
                                className="bg-emerald-600 hover:bg-emerald-700"
                            >
                                {saving
                                    ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                                    : <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />}
                                Mark reviewed
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};
