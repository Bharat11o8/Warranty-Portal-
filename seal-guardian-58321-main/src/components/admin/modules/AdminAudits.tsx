import { useState, useEffect, useMemo } from "react";
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
    AlertTriangle, CheckCircle2, Flag, Phone, MessageCircle, Plus
} from "lucide-react";
import { AUDIT_QUESTIONS, AUDIT_SECTIONS, AUDIT_FLOW, auditLabel } from "@/lib/auditQuestions";
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
    zone: string | null;
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
    const [callFormOpen, setCallFormOpen] = useState(false);

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

    useEffect(() => { fetchAudits(); }, []);

    const visible = useMemo(() => {
        let list = audits;
        if (filter === "unmatched") list = list.filter(a => !a.vendor_details_id);
        else if (filter === "whatsapp" || filter === "call") list = list.filter(a => a.channel === filter);
        else if (filter !== "all") list = list.filter(a => a.review_status === filter);

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
    }, [audits, filter, search]);

    const tabs: { k: Filter; label: string; n: number; tone: string; bar: string }[] = [
        { k: "all",       label: "All",       n: Number(counts.total || 0),           tone: "text-slate-700",   bar: "bg-slate-700" },
        { k: "whatsapp",  label: "WhatsApp",  n: Number(counts.whatsapp_count || 0),  tone: "text-emerald-600", bar: "bg-emerald-500" },
        { k: "call",      label: "Call",      n: Number(counts.call_count || 0),      tone: "text-violet-600",  bar: "bg-violet-500" },
        { k: "new",       label: "New",       n: Number(counts.new_count || 0),       tone: "text-blue-600",    bar: "bg-blue-500" },
        { k: "follow_up", label: "Follow up", n: Number(counts.follow_up_count || 0), tone: "text-amber-600",   bar: "bg-amber-500" },
        { k: "reviewed",  label: "Reviewed",  n: Number(counts.reviewed_count || 0),  tone: "text-emerald-600", bar: "bg-emerald-500" },
        { k: "unmatched", label: "Unmatched", n: Number(counts.unmatched_count || 0), tone: "text-rose-600",    bar: "bg-rose-500" },
    ];

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
                "Store": a.store_name || a.franchise_name || "(unmatched)",
                "Store code": a.store_code || "",
                "Contact person": a.contact_person || "",
                "Phone": a.submitted_phone,
                "City": a.city || "",
                "State": a.state || "",
                "Zone": a.zone || "",
                "ASM": a.asm || "",
                "Channel": a.channel === "call" ? "Call" : "WhatsApp",
                "Done by": a.audited_by_name || "Store (self)",
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

    const META_COLS = ["Submitted", "Contact", "Phone", "City", "Zone", "ASM", "Channel", "Done by"];

    return (
        <div className="space-y-4">
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
                    <Button variant="outline" size="icon" onClick={() => fetchAudits(true)} disabled={refreshing}
                        title="Refresh" aria-label="Refresh" className="h-9 w-9 shrink-0 border-slate-200">
                        <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
                    </Button>
                    <Button variant="outline" size="icon" onClick={handleExport} disabled={visible.length === 0}
                        title="Export CSV" aria-label="Export CSV" className="h-9 w-9 shrink-0 border-slate-200">
                        <Download className="h-3.5 w-3.5" />
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
                                        Store
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
                                                {a.store_name || a.franchise_name || "Unmatched"}
                                            </div>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                {a.store_code && (
                                                    <span className="text-[10px] font-mono text-slate-400">{a.store_code}</span>
                                                )}
                                                {!a.vendor_details_id && (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600">
                                                        <AlertTriangle className="h-3 w-3" /> No match
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-3 whitespace-nowrap text-[12px] text-slate-500 tabular-nums">{fmtDate(a.submitted_at)}</td>
                                        <td className="p-3 whitespace-nowrap text-[12px] text-slate-600">{a.contact_person || "—"}</td>
                                        <td className="p-3 whitespace-nowrap text-[12px] text-slate-600 tabular-nums">{a.submitted_phone}</td>
                                        <td className="p-3 whitespace-nowrap text-[12px] text-slate-600">{a.city || "—"}</td>
                                        <td className="p-3 whitespace-nowrap text-[12px] text-slate-600">{a.zone || "—"}</td>
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

            <AuditCallForm
                open={callFormOpen}
                onClose={() => setCallFormOpen(false)}
                onSaved={fetchAudits}
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
                            <Button
                                variant="outline"
                                onClick={() => selected && setReview(selected, "follow_up")}
                                disabled={saving}
                                className="border-amber-200 text-amber-700 hover:bg-amber-50"
                            >
                                <Flag className="h-3.5 w-3.5 mr-1.5" /> Flag follow up
                            </Button>
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
