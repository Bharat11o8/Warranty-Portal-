import { useState, useEffect, useMemo, useCallback } from "react";
import api, { getErrorMessage } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { downloadCSV } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import {
    Loader2, Search, RefreshCw, Inbox, AlertTriangle, Copy,
    Check, CheckCheck, XCircle, Pencil, Plus, MapPin, Download, CalendarDays
} from "lucide-react";

/**
 * Every enquiry that reached us, and where it went.
 *
 * The list is deliberately led by what went wrong: an unmatched enquiry is a
 * customer nobody is calling back, and it is invisible unless something puts it
 * in front of an admin. Matched ones are just history.
 */

interface Lead {
    id: string;
    source: string;
    product: string | null;
    car_model: string | null;
    customer_name: string | null;
    customer_phone: string;
    raw_area: string | null;
    matched_area: string | null;
    asm_id: string | null;
    asm_name: string | null;
    asm_phone: string | null;
    status: "sent" | "failed" | "unmatched" | "duplicate" | "throttled" | "matched";
    failure_reason: string | null;
    created_at: string;
    sent_at: string | null;
    /* Live from Interakt's delivery webhook: whether the ASM's WhatsApp
       actually arrived, and whether they opened it. Null when no message was
       sent for this lead — unmatched, duplicate or throttled. */
    delivery_status: "sent" | "delivered" | "read" | "failed" | null;
    delivery_updated_at: string | null;
    /* The state the area resolved to — what actually decided the routing. */
    state: string | null;
    /* What an admin found calling the customer back. `lead_status` is still
       written by the API but no longer shown: forwarding is automatic, so
       there is nothing to record until somebody has actually made the call. */
    lead_status: Outcome | null;
    review_status: Outcome | null;
    review_reason: string | null;
    reviewed_at: string | null;
}

interface Counts {
    total: number;
    sent: number;
    failed: number;
    unmatched: number;
    seat_covers: number;
    mats: number;
    accessories: number;
    no_product: number;
    ch_whatsapp: number;
    ch_instagram: number;
    ch_ivr: number;
    ch_website: number;
}

/*
 * The seven ways a lead conversation ends, as found when an admin calls the
 * customer back. Stored as an enum, so this list and the database must agree.
 */
const OUTCOMES = [
    { value: "no_response", label: "No response" },
    { value: "follow_up", label: "Follow up" },
    { value: "closed_won", label: "Closed won" },
    { value: "closed_lost", label: "Closed lost" },
    { value: "call_disconnected", label: "Call disconnected" },
    { value: "switched_off", label: "Switched off" },
    { value: "number_not_working", label: "Number not working" },
] as const;

type Outcome = (typeof OUTCOMES)[number]["value"];

const OUTCOME_LABEL: Record<string, string> =
    Object.fromEntries(OUTCOMES.map(o => [o.value, o.label]));

/* Only the two decided outcomes carry colour. The rest are states of not
   having reached anyone yet, and colouring five of seven would leave the
   column looking like a warning light. */
const OUTCOME_TONE: Record<string, string> = {
    closed_won: "bg-emerald-50 text-emerald-700 border-emerald-200",
    closed_lost: "bg-rose-50 text-rose-700 border-rose-200",
    follow_up: "bg-blue-50 text-blue-700 border-blue-200",
};

const CHANNEL_LABEL: Record<string, string> = {
    whatsapp: "WhatsApp",
    instagram: "Instagram",
    ivr: "IVR",
    website: "Website",
};

const STATUS_STYLE: Record<string, string> = {
    sent: "bg-emerald-50 text-emerald-700 border-emerald-200",
    failed: "bg-rose-50 text-rose-700 border-rose-200",
    unmatched: "bg-amber-50 text-amber-700 border-amber-200",
    duplicate: "bg-slate-100 text-slate-500 border-slate-200",
    // Capped by the daily per-number limit — not a failure, but not sent either.
    throttled: "bg-slate-100 text-slate-500 border-slate-200",
    matched: "bg-blue-50 text-blue-700 border-blue-200",
};

/*
 * How far the ASM's message got.
 *
 * Deliberately quieter than the lead's own status badge: the lead being
 * forwarded is the headline, and whether it has been read yet is the detail
 * underneath it. Only 'failed' takes a loud colour, because that is the one
 * that needs somebody to act.
 */
const DELIVERY_LABEL: Record<string, string> = {
    sent: "Sent",
    delivered: "Delivered",
    read: "Read",
    failed: "Not delivered",
};

const DELIVERY_TONE: Record<string, string> = {
    sent: "text-slate-400",
    delivered: "text-slate-500",
    read: "text-emerald-600",
    failed: "text-rose-600",
};

const PRODUCT_STYLE: Record<string, string> = {
    "Seat Covers": "bg-orange-50 text-orange-700 border-orange-200",
    Mats: "bg-violet-50 text-violet-700 border-violet-200",
    Accessories: "bg-sky-50 text-sky-700 border-sky-200",
};

/** "10 Sep, 3:45 PM" — the same shape the ASM sees on WhatsApp. */
const formatWhen = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString("en-IN", {
        day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: true,
    });
};

export const AdminLeadsList = () => {
    const { toast } = useToast();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [counts, setCounts] = useState<Counts | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("all");
    const [product, setProduct] = useState("all");
    const [delivery, setDelivery] = useState("all");
    const [asmId, setAsmId] = useState("all");
    const [channel, setChannel] = useState("all");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [asmOptions, setAsmOptions] = useState<
        { id: string; name: string; is_active?: number; lead_count?: number }[]
    >([]);

    // Editing one lead: the audit, and corrections to what was captured.
    const [editing, setEditing] = useState<Lead | null>(null);
    const [editForm, setEditForm] = useState({
        review_status: "", review_reason: "",
        customer_name: "", raw_area: "", car_model: "",
    });
    const [saving, setSaving] = useState(false);

    // Adding a lead by hand, for IVR and website enquiries.
    const [addOpen, setAddOpen] = useState(false);
    const [addForm, setAddForm] = useState({
        name: "", phone: "", area: "", product: "", car: "", source: "ivr",
    });
    const [addPreview, setAddPreview] = useState<{
        state: string | null; matched: boolean; asm_name: string | null;
    } | null>(null);
    const [previewing, setPreviewing] = useState(false);
    const [adding, setAdding] = useState(false);

    const fetchLeads = useCallback(async (silent = false) => {
        silent ? setRefreshing(true) : setLoading(true);
        try {
            const params: Record<string, string> = {};
            if (status !== "all") params.status = status;
            if (product !== "all") params.product = product;
            if (delivery !== "all") params.delivery = delivery;
            if (asmId !== "all") params.asm_id = asmId;
            if (channel !== "all") params.source = channel;
            if (dateFrom) params.dateFrom = dateFrom;
            if (dateTo) params.dateTo = dateTo;

            const res = await api.get("/asm/leads/list", { params });
            if (res.data.success) {
                setLeads(res.data.leads || []);
                setCounts(res.data.counts || null);
                /*
                 * The options are the full set regardless of the active filter
                 * — the server derives them from all leads, not the filtered
                 * page. Narrowing them to the current result would leave the
                 * dropdown holding only the ASM already selected, with no way
                 * back to the others.
                 */
                setAsmOptions(res.data.asms || []);
            }
        } catch (error: any) {
            toast({
                title: "Could not load enquiries",
                description: getErrorMessage(error, "Please try again"),
                variant: "destructive",
            });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [status, product, delivery, asmId, channel, dateFrom, dateTo, toast]);

    useEffect(() => { fetchLeads(); }, [fetchLeads]);

    /*
     * Keep the delivery states current.
     *
     * A message goes sent → delivered → read over seconds or minutes, and those
     * changes arrive on Interakt's webhook rather than from anything the admin
     * does here — so without a poll the column would sit on whatever it said
     * when the page loaded.
     *
     * Thirty seconds, and silently: a refresh that emptied the table or moved
     * the scroll position while somebody was reading it would be worse than a
     * slightly stale label. Paused while the tab is hidden, since nobody is
     * watching and the query is not free.
     */
    useEffect(() => {
        const tick = () => {
            if (document.visibilityState === "visible") fetchLeads(true);
        };
        const id = setInterval(tick, 30_000);
        return () => clearInterval(id);
    }, [fetchLeads]);

    /*
     * Searching filters what is already loaded rather than asking the server.
     * The list is capped at a couple of hundred rows, so this is instant and
     * keeps typing responsive; the status and product filters go to the server
     * because they change which rows are in scope at all.
     */
    const visible = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return leads;
        return leads.filter(l =>
            l.customer_phone.includes(q) ||
            (l.customer_name || "").toLowerCase().includes(q) ||
            (l.raw_area || "").toLowerCase().includes(q) ||
            (l.car_model || "").toLowerCase().includes(q) ||
            (l.asm_name || "").toLowerCase().includes(q)
        );
    }, [leads, search]);

    const openEdit = (lead: Lead) => {
        setEditing(lead);
        setEditForm({
            review_status: lead.review_status || "",
            review_reason: lead.review_reason || "",
            customer_name: lead.customer_name || "",
            raw_area: lead.raw_area || "",
            car_model: lead.car_model || "",
        });
    };

    const saveEdit = async () => {
        if (!editing) return;
        setSaving(true);
        try {
            const res = await api.put(`/asm/leads/${editing.id}`, editForm);
            if (res.data.success) {
                toast({ title: "Lead updated", description: res.data.message });
                setEditing(null);
                fetchLeads(true);
            }
        } catch (error: any) {
            toast({
                title: "Could not save",
                description: getErrorMessage(error, "Please try again"),
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    /*
     * Resolve the area before anything is sent.
     *
     * Saving this form puts a real WhatsApp on an ASM's phone, and a mistyped
     * area cannot be recalled — so the form says who it is about to reach, and
     * the admin confirms it.
     */
    const previewLead = async () => {
        if (!addForm.area.trim() || !addForm.phone.trim()) return;
        setPreviewing(true);
        try {
            const res = await api.post("/asm/leads", { ...addForm, preview: true });
            if (res.data.success) {
                setAddPreview({
                    state: res.data.state,
                    matched: res.data.matched,
                    asm_name: res.data.asm_name,
                });
            }
        } catch {
            setAddPreview(null);
        } finally {
            setPreviewing(false);
        }
    };

    const submitLead = async () => {
        setAdding(true);
        try {
            const res = await api.post("/asm/leads", addForm);
            if (res.data.success) {
                toast({ title: "Lead added", description: res.data.message });
                setAddOpen(false);
                setAddForm({ name: "", phone: "", area: "", product: "", car: "", source: "ivr" });
                setAddPreview(null);
                fetchLeads(true);
            }
        } catch (error: any) {
            toast({
                title: "Could not add the lead",
                description: getErrorMessage(error, "Please try again"),
                variant: "destructive",
            });
        } finally {
            setAdding(false);
        }
    };

    /*
     * Export exactly what is on screen.
     *
     * `visible` is the filtered, searched list, so a filtered export matches
     * the filtered table — an export that quietly returned everything would be
     * worse than none, because nobody checks the row count of a file they just
     * downloaded.
     *
     * Columns mirror the table, in the same order, with the codes spelled out:
     * a spreadsheet reading "closed_won" helps nobody.
     */
    const exportCsv = () => {
        if (!visible.length) {
            toast({ title: "Nothing to export", description: "No enquiries match the current filters." });
            return;
        }

        const rows = visible.map(lead => ({
            Date: formatWhen(lead.created_at),
            Customer: lead.customer_name || "",
            Phone: lead.customer_phone,
            Channel: CHANNEL_LABEL[lead.source] || lead.source,
            Area: lead.raw_area || "",
            State: lead.state || "",
            Vehicle: lead.car_model || "",
            Product: lead.product || "",
            "Forwarded to": lead.asm_name || "",
            "ASM phone": lead.asm_phone || "",
            Forwarding: lead.status,
            Delivery: lead.delivery_status ? DELIVERY_LABEL[lead.delivery_status] : "",
            Review: lead.review_status ? OUTCOME_LABEL[lead.review_status] : "",
            "Review reason": lead.review_reason || "",
            "Reviewed at": lead.reviewed_at ? formatWhen(lead.reviewed_at) : "",
        }));

        // The filters are in the filename, so a file found later still says
        // what it was a view of.
        const parts = ["leads"];
        if (status !== "all") parts.push(status);
        if (product !== "all") parts.push(product.replace(/\s+/g, "-").toLowerCase());
        if (delivery !== "all") parts.push(delivery);
        if (channel !== "all") parts.push(channel);
        if (asmId !== "all") {
            const asm = asmOptions.find(a => a.id === asmId);
            if (asm) parts.push(asm.name.replace(/\s+/g, "-").toLowerCase());
        }
        if (dateFrom || dateTo) parts.push(`${dateFrom || "start"}-to-${dateTo || "today"}`);
        parts.push(new Date().toISOString().slice(0, 10));

        downloadCSV(rows, `${parts.join("_")}.csv`);
        toast({
            title: "Export started",
            description: `${rows.length} enquir${rows.length === 1 ? "y" : "ies"} downloaded`,
        });
    };

    /** Whether anything is narrowing the list — so an empty result can say why. */
    const anyFilter = Boolean(
        search.trim() || status !== "all" || product !== "all" ||
        delivery !== "all" || asmId !== "all" || channel !== "all" || dateFrom || dateTo
    );

    const copyPhone = (phone: string) => {
        navigator.clipboard?.writeText(phone)
            .then(() => toast({ title: "Number copied", description: phone }))
            .catch(() => { /* clipboard is blocked in some browsers — not worth an error */ });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px] gap-3 text-slate-400">
                <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
                <span className="text-sm font-medium">Loading enquiries…</span>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h3 className="text-lg font-black tracking-tight text-slate-800 uppercase">Enquiries</h3>
                    <p className="text-sm text-slate-500 mt-0.5">
                        Every enquiry received, and the ASM it was forwarded to.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => fetchLeads(true)} disabled={refreshing}>
                        <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                    </Button>
                    {/* IVR and website enquiries arrive by phone or a form, so
                        somebody has to enter them. They route and send exactly
                        like an automatic lead once saved. */}
                    <Button
                        variant="outline" size="sm"
                        onClick={exportCsv}
                        disabled={!visible.length}
                        title="Export the enquiries currently shown"
                    >
                        <Download className="h-4 w-4 mr-1.5" />
                        Export{visible.length ? ` (${visible.length})` : ""}
                    </Button>
                    <Button size="sm" onClick={() => setAddOpen(true)} className="bg-orange-500 hover:bg-orange-600">
                        <Plus className="h-4 w-4 mr-1.5" /> Add Lead
                    </Button>
                </div>
            </div>

            {/* Each tile filters the list to what it counts — the number and
                the way to look at it should not be two separate controls.

                Two groups, divided: the first four ask what happened to the
                forward, the last three which product was asked about. They set
                different filters, so a tile carries its own kind and selecting
                one does not clear the other — product and status narrow
                together, which is usually what somebody wants.

                Zero counts go grey rather than coloured, so a quiet day reads
                as quiet instead of as a row of alerts. */}
            {counts && (
                <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-7 gap-2.5">
                    {([
                        { label: "Total", value: counts.total, tone: "text-slate-800", kind: "status", key: "all" },
                        { label: "Forwarded", value: counts.sent, tone: "text-emerald-600", kind: "status", key: "sent" },
                        { label: "Unmatched", value: counts.unmatched, tone: "text-amber-600", kind: "status", key: "unmatched" },
                        { label: "Failed", value: counts.failed, tone: "text-rose-600", kind: "status", key: "failed" },
                        { label: "Seat Covers", value: counts.seat_covers, tone: "text-orange-600", kind: "product", key: "Seat Covers", divide: true },
                        { label: "Mats", value: counts.mats, tone: "text-violet-600", kind: "product", key: "Mats" },
                        { label: "Accessories", value: counts.accessories, tone: "text-sky-600", kind: "product", key: "Accessories" },
                    ] as const).map(s => {
                        const active = s.kind === "status" ? status === s.key : product === s.key;
                        const empty = !s.value;
                        return (
                            <button
                                key={s.label}
                                type="button"
                                onClick={() => {
                                    if (s.kind === "status") setStatus(s.key);
                                    // Clicking the active product tile clears it,
                                    // so the same tile both applies and undoes.
                                    else setProduct(active ? "all" : s.key);
                                }}
                                className={`rounded-2xl border bg-white p-3.5 text-left transition-colors ${
                                    active
                                        ? "border-orange-300 ring-1 ring-orange-100"
                                        : "border-slate-100 hover:border-slate-200"
                                } ${s.divide ? "xl:ml-3 xl:border-l-slate-200" : ""}`}
                            >
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 truncate">
                                    {s.label}
                                </p>
                                <p className={`text-2xl font-black tabular-nums mt-0.5 ${empty ? "text-slate-300" : s.tone}`}>
                                    {s.value ?? 0}
                                </p>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Where the enquiries came from.
                A second row rather than four more tiles beside the others:
                eleven numbers across one line stops being a summary and becomes
                a wall. These answer a different question anyway — which channel
                is actually producing business — so they read better grouped.

                A channel with nothing in it is still shown: a campaign that has
                stopped producing leads is exactly the thing worth noticing, and
                it cannot be noticed if its tile disappears. */}
            {counts && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {([
                        { label: "WhatsApp", value: counts.ch_whatsapp, tone: "text-emerald-600", key: "whatsapp" },
                        { label: "Instagram", value: counts.ch_instagram, tone: "text-pink-600", key: "instagram" },
                        { label: "IVR", value: counts.ch_ivr, tone: "text-indigo-600", key: "ivr" },
                        { label: "Website", value: counts.ch_website, tone: "text-cyan-600", key: "website" },
                    ] as const).map(s => {
                        const active = channel === s.key;
                        const empty = !s.value;
                        return (
                            <button
                                key={s.label}
                                type="button"
                                onClick={() => setChannel(active ? "all" : s.key)}
                                className={`rounded-2xl border bg-white p-3.5 text-left transition-colors ${
                                    active
                                        ? "border-orange-300 ring-1 ring-orange-100"
                                        : "border-slate-100 hover:border-slate-200"
                                }`}
                            >
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 truncate">
                                    {s.label}
                                </p>
                                <p className={`text-2xl font-black tabular-nums mt-0.5 ${empty ? "text-slate-300" : s.tone}`}>
                                    {s.value ?? 0}
                                </p>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Search and dates lead, because they are the two things somebody
                arrives wanting to narrow. The four dropdowns sit under them as
                one quiet row — they were competing with the search box for
                attention and wrapping badly at anything under a wide screen. */}
            <div className="rounded-2xl border border-slate-100 bg-white p-3 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative flex-1 min-w-[240px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search phone, area, car or ASM…"
                            className="pl-9 h-10 rounded-xl border-slate-200"
                        />
                    </div>

                    {/* Compared in IST on the server: created_at is stored UTC,
                        so an enquiry at 1am IST would otherwise be filed under
                        the previous day and fall outside the range. */}
                    <div className="flex items-center gap-1.5 h-10 rounded-xl border border-slate-200 px-3 shrink-0">
                        <CalendarDays className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <input
                            type="date"
                            value={dateFrom}
                            max={dateTo || undefined}
                            onChange={e => setDateFrom(e.target.value)}
                            className="text-xs text-slate-600 bg-transparent border-none p-0 w-[105px] focus:ring-0 focus:outline-none"
                        />
                        <span className="text-slate-300">–</span>
                        <input
                            type="date"
                            value={dateTo}
                            min={dateFrom || undefined}
                            onChange={e => setDateTo(e.target.value)}
                            className="text-xs text-slate-600 bg-transparent border-none p-0 w-[105px] focus:ring-0 focus:outline-none"
                        />
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger className="h-9 w-[140px] rounded-lg border-slate-200 text-xs">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All statuses</SelectItem>
                            <SelectItem value="sent">Forwarded</SelectItem>
                            <SelectItem value="unmatched">Unmatched</SelectItem>
                            <SelectItem value="failed">Failed</SelectItem>
                            <SelectItem value="duplicate">Duplicate</SelectItem>
                            <SelectItem value="throttled">Throttled</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={product} onValueChange={setProduct}>
                        <SelectTrigger className="h-9 w-[145px] rounded-lg border-slate-200 text-xs">
                            <SelectValue placeholder="Product" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All products</SelectItem>
                            <SelectItem value="Seat Covers">Seat Covers</SelectItem>
                            <SelectItem value="Mats">Mats</SelectItem>
                            <SelectItem value="Accessories">Accessories</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={delivery} onValueChange={setDelivery}>
                        <SelectTrigger className="h-9 w-[140px] rounded-lg border-slate-200 text-xs">
                            <SelectValue placeholder="Delivery" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Any delivery</SelectItem>
                            <SelectItem value="read">Read</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="sent">Sent only</SelectItem>
                            <SelectItem value="failed">Not delivered</SelectItem>
                            <SelectItem value="none">Not sent</SelectItem>
                        </SelectContent>
                    </Select>

                    {asmOptions.length > 0 && (
                        <Select value={asmId} onValueChange={setAsmId}>
                            <SelectTrigger className="h-9 w-[160px] rounded-lg border-slate-200 text-xs">
                                <SelectValue placeholder="ASM" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All ASMs</SelectItem>
                                {asmOptions.map(a => (
                                    <SelectItem key={a.id} value={a.id}>
                                        {a.name}
                                        {!a.is_active && " (inactive)"}
                                        {typeof a.lead_count === "number" && ` · ${a.lead_count}`}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}

                    {/* Only appears once something is actually narrowing the
                        list, so the row stays quiet in its resting state. */}
                    {anyFilter && (
                        <button
                            type="button"
                            onClick={() => {
                                setSearch(""); setStatus("all"); setProduct("all");
                                setDelivery("all"); setAsmId("all"); setChannel("all");
                                setDateFrom(""); setDateTo("");
                            }}
                            className="h-9 px-3 rounded-lg text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                            Clear filters
                        </button>
                    )}

                    <span className="ml-auto text-xs text-slate-400 tabular-nums">
                        {visible.length} shown
                    </span>
                </div>
            </div>

            {visible.length === 0 ? (
                <div className="rounded-[28px] border border-dashed border-orange-200 bg-white/40 p-12 text-center">
                    <div className="h-16 w-16 bg-orange-50 rounded-3xl flex items-center justify-center mx-auto mb-5 border border-orange-100">
                        <Inbox className="h-7 w-7 text-orange-500 opacity-80" />
                    </div>
                    {/* Every filter counts here, not just the first three.
                        A list emptied by a date range while the message reads
                        "no enquiries yet" looks like the system is broken. */}
                    <h3 className="text-lg font-black tracking-tight text-slate-800 uppercase mb-2">
                        {anyFilter ? "Nothing matches that" : "No enquiries yet"}
                    </h3>
                    <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                        {anyFilter
                            ? "Try a different search, widen the dates, or clear the filters."
                            : "Enquiries arriving on WhatsApp will appear here once the workflow forwards them."}
                    </p>
                    {anyFilter && (
                        <Button
                            variant="outline" size="sm" className="mt-5"
                            onClick={() => {
                                setSearch(""); setStatus("all"); setProduct("all");
                                setDelivery("all"); setAsmId("all"); setChannel("all");
                                setDateFrom(""); setDateTo("");
                            }}
                        >
                            Clear all filters
                        </Button>
                    )}
                </div>
            ) : (
                /* A table rather than cards: these rows are read by comparing
                   them — which areas keep coming up, which ASM is taking the
                   volume, how many went unmatched — and a column of values
                   under one heading is what makes that scannable. */
                <Card className="rounded-2xl border-slate-100 overflow-hidden">
                    <div className="relative w-full overflow-auto">
                        <table className="w-full text-sm text-left table-fixed min-w-[1400px]">
                            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                                <tr>
                                    <th className="px-3 py-3 w-[110px] font-semibold">Date</th>
                                    <th className="px-3 py-3 w-[160px] font-semibold">Customer</th>
                                    <th className="px-3 py-3 w-[100px] font-semibold">Channel</th>
                                    <th className="px-3 py-3 w-[150px] font-semibold">Area</th>
                                    <th className="px-3 py-3 w-[120px] font-semibold">State</th>
                                    <th className="px-3 py-3 w-[110px] font-semibold">Vehicle</th>
                                    <th className="px-3 py-3 w-[120px] font-semibold">Product</th>
                                    <th className="px-3 py-3 w-[160px] font-semibold">Forwarded to</th>
                                    <th className="px-3 py-3 w-[140px] font-semibold">Review</th>
                                    <th className="px-3 py-3 font-semibold">Review reason</th>
                                    <th className="px-3 py-3 w-[52px]"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {visible.map(lead => (
                                    <tr key={lead.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-3 py-3 align-top whitespace-nowrap text-xs text-slate-500 tabular-nums">
                                            {formatWhen(lead.created_at)}
                                        </td>

                                        <td className="px-3 py-3 align-top">
                                            <div className="text-slate-800 font-medium truncate" title={lead.customer_name || ""}>
                                                {lead.customer_name || <span className="text-slate-300 font-normal">Not shared</span>}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => copyPhone(lead.customer_phone)}
                                                title="Copy number"
                                                className="flex items-center gap-1 text-xs font-mono text-slate-400 hover:text-orange-600"
                                            >
                                                {lead.customer_phone}
                                                <Copy className="h-2.5 w-2.5 opacity-50" />
                                            </button>
                                        </td>

                                        <td className="px-3 py-3 align-top">
                                            <span className="text-slate-600 text-xs">
                                                {CHANNEL_LABEL[lead.source] || lead.source}
                                            </span>
                                        </td>

                                        {/* What the customer typed, and the state it
                                            resolved to. The state is the column that
                                            decided the routing, so it earns its own
                                            place beside their words rather than
                                            replacing them. */}
                                        <td className="px-3 py-3 align-top">
                                            <div className="text-slate-700 truncate" title={lead.raw_area || ""}>
                                                {lead.raw_area || <span className="text-slate-300">—</span>}
                                            </div>
                                        </td>

                                        <td className="px-3 py-3 align-top">
                                            {lead.state ? (
                                                <span className="flex items-center gap-1 text-slate-600 text-xs">
                                                    <MapPin className="h-3 w-3 shrink-0 text-slate-300" />
                                                    <span className="truncate" title={lead.state}>{lead.state}</span>
                                                </span>
                                            ) : (
                                                <span className="text-slate-300">—</span>
                                            )}
                                        </td>

                                        <td className="px-3 py-3 align-top">
                                            <span className="text-slate-600 truncate block" title={lead.car_model || ""}>
                                                {lead.car_model || <span className="text-slate-300">—</span>}
                                            </span>
                                        </td>

                                        <td className="px-3 py-3 align-top">
                                            {lead.product ? (
                                                <Badge
                                                    variant="outline"
                                                    className={`text-[10px] font-black uppercase whitespace-nowrap ${PRODUCT_STYLE[lead.product] || ""}`}
                                                >
                                                    {lead.product}
                                                </Badge>
                                            ) : (
                                                <span className="text-slate-300">—</span>
                                            )}
                                        </td>

                                        {/* The ASM, whether the forward itself worked,
                                            and how far the message got — one column,
                                            because they are one fact about one send. */}
                                        <td className="px-3 py-3 align-top">
                                            {lead.asm_name ? (
                                                <>
                                                    <div className="text-slate-800 font-medium truncate">{lead.asm_name}</div>
                                                    <div className="text-xs text-slate-400 font-mono">{lead.asm_phone}</div>
                                                    {lead.delivery_status ? (
                                                        <div
                                                            className={`text-[11px] mt-0.5 flex items-center gap-1 ${DELIVERY_TONE[lead.delivery_status] || "text-slate-400"}`}
                                                            title={lead.delivery_updated_at
                                                                ? `Last updated ${formatWhen(lead.delivery_updated_at)}`
                                                                : undefined}
                                                        >
                                                            {lead.delivery_status === "read"
                                                                ? <CheckCheck className="h-3 w-3" />
                                                                : lead.delivery_status === "failed"
                                                                    ? <XCircle className="h-3 w-3" />
                                                                    : <Check className="h-3 w-3" />}
                                                            {DELIVERY_LABEL[lead.delivery_status]}
                                                        </div>
                                                    ) : (
                                                        <Badge
                                                            variant="outline"
                                                            className={`text-[10px] font-black uppercase mt-0.5 ${STATUS_STYLE[lead.status] || ""}`}
                                                        >
                                                            {lead.status}
                                                        </Badge>
                                                    )}
                                                </>
                                            ) : (
                                                <span className="flex items-center gap-1.5 text-xs text-amber-600 font-medium">
                                                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                                                    No ASM
                                                </span>
                                            )}
                                        </td>

                                        <td className="px-3 py-3 align-top">
                                            {lead.review_status ? (
                                                <Badge
                                                    variant="outline"
                                                    className={`text-[10px] font-black uppercase whitespace-nowrap ${OUTCOME_TONE[lead.review_status] || "bg-slate-50 text-slate-600 border-slate-200"}`}
                                                >
                                                    {OUTCOME_LABEL[lead.review_status]}
                                                </Badge>
                                            ) : (
                                                <span className="text-slate-300">—</span>
                                            )}
                                        </td>

                                        <td className="px-3 py-3 align-top">
                                            <span className="text-slate-600 text-xs line-clamp-2" title={lead.review_reason || ""}>
                                                {lead.review_reason || <span className="text-slate-300">—</span>}
                                            </span>
                                        </td>

                                        <td className="px-3 py-3 align-top">
                                            <Button
                                                variant="ghost" size="icon"
                                                onClick={() => openEdit(lead)}
                                                title="Edit lead"
                                                aria-label="Edit lead"
                                                className="h-8 w-8 text-slate-400 hover:text-orange-600"
                                            >
                                                <Pencil className="h-3.5 w-3.5" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {/* Edit one lead: its outcome, the audit of it, and corrections
                to what was captured. */}
            <Dialog open={Boolean(editing)} onOpenChange={open => !open && setEditing(null)}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit lead</DialogTitle>
                        <DialogDescription>
                            {editing?.customer_phone}
                            {editing?.asm_name ? ` · forwarded to ${editing.asm_name}` : " · not forwarded"}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-1">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="e-name">Customer</Label>
                                <Input
                                    id="e-name"
                                    value={editForm.customer_name}
                                    onChange={e => setEditForm({ ...editForm, customer_name: e.target.value })}
                                    placeholder="Name not shared"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="e-car">Vehicle</Label>
                                <Input
                                    id="e-car"
                                    value={editForm.car_model}
                                    onChange={e => setEditForm({ ...editForm, car_model: e.target.value })}
                                    placeholder="e.g. Creta"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="e-area">Area</Label>
                            <Input
                                id="e-area"
                                value={editForm.raw_area}
                                onChange={e => setEditForm({ ...editForm, raw_area: e.target.value })}
                                placeholder="e.g. Rohini Delhi"
                            />
                            <p className="text-xs text-slate-400">
                                Currently resolved to {editing?.state || "no state"}. Changing this
                                re-resolves it, and can change who the lead belongs to.
                            </p>
                        </div>

                        <div className="border-t border-slate-100 pt-4 space-y-4">
                            {/* Only the audit. Forwarding is automatic now, so
                                there is no separate outcome to record before
                                somebody has actually called the customer. */}
                            <div className="space-y-1.5">
                                <Label>Review status — what you found on the call</Label>
                                <Select
                                    value={editForm.review_status || "none"}
                                    onValueChange={v => setEditForm({ ...editForm, review_status: v === "none" ? "" : v })}
                                >
                                    <SelectTrigger><SelectValue placeholder="Not reviewed" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Not reviewed</SelectItem>
                                        {OUTCOMES.map(o => (
                                            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="e-reason">Review reason</Label>
                                <Textarea
                                    id="e-reason"
                                    rows={3}
                                    value={editForm.review_reason}
                                    onChange={e => setEditForm({ ...editForm, review_reason: e.target.value })}
                                    placeholder="What the customer said, and anything worth keeping"
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
                        <Button onClick={saveEdit} disabled={saving} className="bg-orange-500 hover:bg-orange-600">
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add a lead by hand, for IVR and website enquiries. */}
            <Dialog open={addOpen} onOpenChange={open => { setAddOpen(open); if (!open) setAddPreview(null); }}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Add a lead</DialogTitle>
                        <DialogDescription>
                            This forwards to the ASM covering the area, exactly as an
                            automatic enquiry would.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-1">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="a-phone">Phone *</Label>
                                <Input
                                    id="a-phone"
                                    inputMode="numeric"
                                    value={addForm.phone}
                                    onChange={e => { setAddForm({ ...addForm, phone: e.target.value }); setAddPreview(null); }}
                                    placeholder="9876543210"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="a-name">Name</Label>
                                <Input
                                    id="a-name"
                                    value={addForm.name}
                                    onChange={e => setAddForm({ ...addForm, name: e.target.value })}
                                    placeholder="Optional"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="a-area">Area *</Label>
                            <Input
                                id="a-area"
                                value={addForm.area}
                                onChange={e => { setAddForm({ ...addForm, area: e.target.value }); setAddPreview(null); }}
                                onBlur={previewLead}
                                placeholder="e.g. Rohini Delhi"
                            />
                            {/* Who this is about to reach. A mistyped area costs a
                                real message to a real ASM, so it is shown before
                                the send rather than discovered after it. */}
                            {previewing ? (
                                <p className="text-xs text-slate-400 flex items-center gap-1.5">
                                    <Loader2 className="h-3 w-3 animate-spin" /> Checking…
                                </p>
                            ) : addPreview ? (
                                addPreview.matched ? (
                                    <p className="text-xs text-emerald-600">
                                        {addPreview.state} — goes to {addPreview.asm_name}
                                    </p>
                                ) : (
                                    <p className="text-xs text-amber-600">
                                        {addPreview.state
                                            ? `${addPreview.state} — no ASM covers this state yet`
                                            : "No state could be read from this"}
                                        . The lead will be saved and queued as unmatched.
                                    </p>
                                )
                            ) : null}
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-1.5">
                                <Label>Channel</Label>
                                <Select value={addForm.source} onValueChange={v => setAddForm({ ...addForm, source: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ivr">IVR</SelectItem>
                                        <SelectItem value="website">Website</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Product</Label>
                                <Select
                                    value={addForm.product || "none"}
                                    onValueChange={v => setAddForm({ ...addForm, product: v === "none" ? "" : v })}
                                >
                                    <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Not specified</SelectItem>
                                        <SelectItem value="Seat Covers">Seat Covers</SelectItem>
                                        <SelectItem value="Mats">Mats</SelectItem>
                                        <SelectItem value="Accessories">Accessories</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="a-car">Vehicle</Label>
                                <Input
                                    id="a-car"
                                    value={addForm.car}
                                    onChange={e => setAddForm({ ...addForm, car: e.target.value })}
                                    placeholder="e.g. Creta"
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
                        <Button
                            onClick={submitLead}
                            disabled={adding || !addForm.phone.trim() || !addForm.area.trim()}
                            className="bg-orange-500 hover:bg-orange-600"
                        >
                            {adding
                                ? <Loader2 className="h-4 w-4 animate-spin" />
                                : addPreview?.matched
                                    ? `Add and forward to ${addPreview.asm_name}`
                                    : "Add lead"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {leads.length >= 200 && (
                <p className="text-xs text-slate-400 text-center">
                    Showing the 200 most recent enquiries.
                </p>
            )}
        </div>
    );
};
