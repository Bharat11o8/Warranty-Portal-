import { useState, useEffect, useMemo, useCallback } from "react";
import api, { getErrorMessage } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
    Loader2, Search, RefreshCw, Inbox, Phone, MapPin, Car,
    AlertTriangle, CheckCircle2, Copy, XCircle
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
    status: "sent" | "failed" | "unmatched" | "duplicate" | "matched";
    failure_reason: string | null;
    created_at: string;
    sent_at: string | null;
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
}

const STATUS_STYLE: Record<string, string> = {
    sent: "bg-emerald-50 text-emerald-700 border-emerald-200",
    failed: "bg-rose-50 text-rose-700 border-rose-200",
    unmatched: "bg-amber-50 text-amber-700 border-amber-200",
    duplicate: "bg-slate-100 text-slate-500 border-slate-200",
    matched: "bg-blue-50 text-blue-700 border-blue-200",
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

    const fetchLeads = useCallback(async (silent = false) => {
        silent ? setRefreshing(true) : setLoading(true);
        try {
            const params: Record<string, string> = {};
            if (status !== "all") params.status = status;
            if (product !== "all") params.product = product;

            const res = await api.get("/asm/leads/list", { params });
            if (res.data.success) {
                setLeads(res.data.leads || []);
                setCounts(res.data.counts || null);
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
    }, [status, product, toast]);

    useEffect(() => { fetchLeads(); }, [fetchLeads]);

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
                <Button variant="outline" size="sm" onClick={() => fetchLeads(true)} disabled={refreshing}>
                    <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                </Button>
            </div>

            {/* Unmatched leads first — those are the ones losing business. */}
            {counts && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                        { label: "Total", value: counts.total, tone: "text-slate-800" },
                        { label: "Forwarded", value: counts.sent, tone: "text-emerald-600" },
                        {
                            label: "Unmatched",
                            value: counts.unmatched,
                            tone: counts.unmatched ? "text-amber-600" : "text-slate-400",
                        },
                        {
                            label: "Failed",
                            value: counts.failed,
                            tone: counts.failed ? "text-rose-600" : "text-slate-400",
                        },
                    ].map(s => (
                        <div key={s.label} className="rounded-2xl border border-slate-100 bg-white p-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{s.label}</p>
                            <p className={`text-2xl font-black tabular-nums mt-0.5 ${s.tone}`}>{s.value ?? 0}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* The split by product line — what the team asked to see. */}
            {counts && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                        { label: "Seat Covers", value: counts.seat_covers, tone: "text-orange-600" },
                        { label: "Mats", value: counts.mats, tone: "text-violet-600" },
                        { label: "Accessories", value: counts.accessories, tone: "text-sky-600" },
                        { label: "Unspecified", value: counts.no_product, tone: "text-slate-400" },
                    ].map(s => (
                        <div key={s.label} className="rounded-2xl border border-slate-100 bg-white p-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{s.label}</p>
                            <p className={`text-2xl font-black tabular-nums mt-0.5 ${s.tone}`}>{s.value ?? 0}</p>
                        </div>
                    ))}
                </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[220px] max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search phone, area, car or ASM…"
                        className="pl-9 h-10 rounded-xl"
                    />
                </div>
                <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="h-10 w-[150px] rounded-xl">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All statuses</SelectItem>
                        <SelectItem value="sent">Forwarded</SelectItem>
                        <SelectItem value="unmatched">Unmatched</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                        <SelectItem value="duplicate">Duplicate</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={product} onValueChange={setProduct}>
                    <SelectTrigger className="h-10 w-[160px] rounded-xl">
                        <SelectValue placeholder="Product" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All products</SelectItem>
                        <SelectItem value="Seat Covers">Seat Covers</SelectItem>
                        <SelectItem value="Mats">Mats</SelectItem>
                        <SelectItem value="Accessories">Accessories</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {visible.length === 0 ? (
                <div className="rounded-[28px] border border-dashed border-orange-200 bg-white/40 p-12 text-center">
                    <div className="h-16 w-16 bg-orange-50 rounded-3xl flex items-center justify-center mx-auto mb-5 border border-orange-100">
                        <Inbox className="h-7 w-7 text-orange-500 opacity-80" />
                    </div>
                    <h3 className="text-lg font-black tracking-tight text-slate-800 uppercase mb-2">
                        {search || status !== "all" || product !== "all" ? "Nothing matches that" : "No enquiries yet"}
                    </h3>
                    <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                        {search || status !== "all" || product !== "all"
                            ? "Try a different search or clear the filters."
                            : "Enquiries arriving on WhatsApp will appear here once the workflow forwards them."}
                    </p>
                </div>
            ) : (
                <div className="space-y-2.5">
                    {visible.map(lead => (
                        <Card key={lead.id} className="rounded-2xl border-slate-100 overflow-hidden">
                            <CardContent className="p-4">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="font-black text-slate-800">
                                                {lead.customer_name || "Name not shared"}
                                            </p>
                                            <Badge
                                                variant="outline"
                                                className={`text-[10px] font-black uppercase ${STATUS_STYLE[lead.status] || ""}`}
                                            >
                                                {lead.status === "sent" ? "Forwarded" : lead.status}
                                            </Badge>
                                            {lead.product && (
                                                <Badge
                                                    variant="outline"
                                                    className={`text-[10px] font-black uppercase ${PRODUCT_STYLE[lead.product] || ""}`}
                                                >
                                                    {lead.product}
                                                </Badge>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-slate-500">
                                            <button
                                                type="button"
                                                onClick={() => copyPhone(lead.customer_phone)}
                                                title="Copy number"
                                                className="flex items-center gap-1 font-mono hover:text-orange-600"
                                            >
                                                <Phone className="h-3 w-3" /> {lead.customer_phone}
                                                <Copy className="h-2.5 w-2.5 opacity-50" />
                                            </button>
                                            {lead.raw_area && (
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="h-3 w-3" /> {lead.raw_area}
                                                </span>
                                            )}
                                            {lead.car_model && (
                                                <span className="flex items-center gap-1">
                                                    <Car className="h-3 w-3" /> {lead.car_model}
                                                </span>
                                            )}
                                            <span>·</span>
                                            <span className="tabular-nums">{formatWhen(lead.created_at)}</span>
                                        </div>
                                    </div>

                                    <div className="text-right shrink-0">
                                        {lead.asm_name ? (
                                            <>
                                                <p className="text-xs font-black text-slate-700 flex items-center gap-1.5 justify-end">
                                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                                    {lead.asm_name}
                                                </p>
                                                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                                                    {lead.asm_phone}
                                                </p>
                                                {lead.matched_area && (
                                                    <p className="text-[11px] text-slate-400 mt-0.5">
                                                        via {lead.matched_area}
                                                    </p>
                                                )}
                                            </>
                                        ) : (
                                            <p className="text-xs font-black text-amber-600 flex items-center gap-1.5 justify-end">
                                                <AlertTriangle className="h-3.5 w-3.5" />
                                                No ASM covers this
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {lead.failure_reason && (
                                    <div className="flex items-start gap-1.5 mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
                                        <XCircle className="h-3.5 w-3.5 text-rose-400 shrink-0 mt-px" />
                                        {lead.failure_reason}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {leads.length >= 200 && (
                <p className="text-xs text-slate-400 text-center">
                    Showing the 200 most recent enquiries.
                </p>
            )}
        </div>
    );
};
