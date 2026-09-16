import { useState, useEffect, useMemo } from "react";
import api from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search, Download, Phone, CheckCircle2, ClipboardCheck } from "lucide-react";

/**
 * The stores that still owe an audit for this round.
 *
 * This is the list the flat submissions table can never show: every row there
 * is a reply, so a store that never answered has no row at all. Here a store
 * exists because the audit was sent to it, which is what makes absence visible.
 */
interface Target {
    id: string;
    vendor_details_id: string | null;
    store_audit_id: string | null;
    responded_at: string | null;
    sent_at: string | null;
    sent_phone: string | null;
    store_name: string | null;
    store_code: string | null;
    city: string | null;
    state: string | null;
    phone_number: string | null;
    contact_person: string | null;
    /* Present only in the month view, where a store can be reached by more
       than one campaign. */
    rounds_sent?: number;
    round_names?: string | null;
    done?: boolean;
    done_by?: 'whatsapp' | 'call' | null;
}

interface Props {
    roundId: string | null;
    /**
     * A month instead of a round.
     *
     * The same stores are chased by several campaigns in a month, so read
     * round by round a store appears twice — outstanding in one, done in
     * another. Given a month the list asks for the consolidated view, where a
     * store is counted once and is done if it answered any of them.
     */
    month?: string | null;
    responded: "yes" | "no";
    /** Bumped by the parent to force a refetch. */
    refreshKey?: number;
    /** Record a call audit for this store, straight from its row. */
    onAudit?: (target: Target) => void;
}

const fmtDay = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export const AuditChaseList = ({ roundId, month = null, responded, refreshKey = 0, onAudit }: Props) => {
    const [targets, setTargets] = useState<Target[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");

    useEffect(() => {
        if (!month && !roundId) { setTargets([]); return; }
        let cancelled = false;
        setLoading(true);
        const request = month
            ? api.get(`/admin/audit-months/${month}`, {
                params: { status: responded === "no" ? "outstanding" : "done" },
            }).then(res => res.data.stores || [])
            : api.get(`/admin/audit-rounds/${roundId}/targets`, { params: { responded } })
                .then(res => res.data.targets || []);
        request
            .then((rows: Target[]) => { if (!cancelled) setTargets(rows); })
            .catch(() => { if (!cancelled) setTargets([]); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [roundId, month, responded, refreshKey]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return targets;
        return targets.filter(t =>
            (t.store_name || "").toLowerCase().includes(q) ||
            (t.store_code || "").toLowerCase().includes(q) ||
            (t.city || "").toLowerCase().includes(q) ||
            (t.phone_number || "").includes(q) ||
            (t.sent_phone || "").includes(q)
        );
    }, [targets, search]);

    const exportCsv = () => {
        const headers = ["Store", "Code", "City", "State", "Contact", "Phone", "Audit sent",
            ...(month ? ["Campaigns sent"] : []), "Responded"];
        const rows = filtered.map(t => [
            t.store_name || "Unmatched",
            t.store_code || "",
            t.city || "",
            t.state || "",
            t.contact_person || "",
            t.phone_number || t.sent_phone || "",
            fmtDay(t.sent_at),
            ...(month ? [t.round_names || ""] : []),
            t.responded_at ? fmtDay(t.responded_at) : t.done ? "By call" : "Not yet",
        ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(","));

        const blob = new Blob([[headers.join(","), ...rows].join("\n")], { type: "text/csv;charset=utf-8;" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `audit_${month || "round"}_${responded === "no" ? "not_done" : "done"}_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(a.href);
    };

    if (!month && !roundId) {
        return <p className="text-sm text-slate-400 text-center py-12">Choose a round to see its stores.</p>;
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
            </div>
        );
    }

    if (targets.length === 0) {
        return (
            <div className="text-center py-16">
                {responded === "no" ? (
                    <>
                        <CheckCircle2 className="h-10 w-10 mx-auto text-emerald-400 mb-3" />
                        <p className="text-sm font-bold text-slate-700">Nobody left to chase</p>
                        <p className="text-xs text-slate-400 mt-1">
                            Every store in this round has responded.
                        </p>
                    </>
                ) : (
                    <p className="text-sm text-slate-400">No responses in this round yet.</p>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
                <div className="relative w-full sm:max-w-xs">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    <Input
                        placeholder="Search store, code, city…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-10 h-10 rounded-2xl border-orange-100 bg-slate-50/50 text-sm"
                    />
                </div>
                <Button
                    variant="outline"
                    onClick={exportCsv}
                    className="h-10 rounded-2xl border-orange-100 hover:bg-orange-50 gap-2 text-slate-600 shrink-0"
                >
                    <Download className="h-4 w-4" />
                    Export {responded === "no" ? "chase list" : "responses"}
                </Button>
            </div>

            <div className="rounded-2xl border border-slate-100 overflow-hidden">
                {/* Hundreds of stores can owe an audit, so the list scrolls in its own
                    box rather than running the page on, and the header stays visible. */}
                <div className="overflow-auto max-h-[calc(100vh-360px)] min-h-[280px]">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-[10px] font-black uppercase tracking-wider text-slate-400">
                                <th className="sticky top-0 z-10 bg-slate-50 p-4">Store</th>
                                <th className="sticky top-0 z-10 bg-slate-50 p-4">City</th>
                                <th className="sticky top-0 z-10 bg-slate-50 p-4">Contact</th>
                                <th className="sticky top-0 z-10 bg-slate-50 p-4">Phone</th>
                                <th className="sticky top-0 z-10 bg-slate-50 p-4">Audit sent</th>
                                {/* Only the month view can reach a store twice. */}
                                {month && <th className="sticky top-0 z-10 bg-slate-50 p-4">Sent in</th>}
                                <th className="sticky top-0 z-10 bg-slate-50 p-4">{responded === "no" ? "Status" : "Responded"}</th>
                                <th className="sticky top-0 z-10 bg-slate-50 p-4"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(t => (
                                <tr key={t.id} className="border-t border-slate-50 hover:bg-slate-50/40">
                                    <td className="p-4">
                                        <p className="font-bold text-slate-800">
                                            {t.store_name || <span className="text-slate-400">Unmatched</span>}
                                        </p>
                                        {t.store_code && (
                                            <p className="text-[11px] text-slate-400">{t.store_code}</p>
                                        )}
                                    </td>
                                    <td className="p-4 text-slate-600">{t.city || "—"}</td>
                                    <td className="p-4 text-slate-600">{t.contact_person || "—"}</td>
                                    <td className="p-4">
                                        {(t.phone_number || t.sent_phone) ? (
                                            <a
                                                href={`tel:${t.phone_number || t.sent_phone}`}
                                                className="text-slate-700 hover:text-orange-600 inline-flex items-center gap-1.5"
                                            >
                                                <Phone className="h-3 w-3" />
                                                {t.phone_number || t.sent_phone}
                                            </a>
                                        ) : "—"}
                                    </td>
                                    <td className="p-4 text-slate-500 text-xs">{fmtDay(t.sent_at)}</td>
                                    {month && (
                                        <td className="p-4">
                                            {/* How many times this store has already been
                                                asked — worth knowing before ringing them. */}
                                            <span
                                                title={t.round_names || ""}
                                                className="text-[10px] font-black uppercase tracking-wider text-slate-500 bg-slate-100 border border-slate-200 px-2 py-1 rounded-full"
                                            >
                                                {t.rounds_sent === 1 ? "1 campaign" : `${t.rounds_sent || 0} campaigns`}
                                            </span>
                                        </td>
                                    )}
                                    <td className="p-4">
                                        {t.responded_at ? (
                                            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-full">
                                                {fmtDay(t.responded_at)}
                                            </span>
                                        ) : t.done ? (
                                            /* Closed out by a call rather than a reply. */
                                            <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-2 py-1 rounded-full">
                                                By call
                                            </span>
                                        ) : (
                                            <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full">
                                                Awaiting
                                            </span>
                                        )}
                                    </td>
                                    {/* This list is where you decide who to ring,
                                        so the call form opens from the row itself
                                        rather than sending you back to search for
                                        a store you are already looking at. */}
                                    <td className="p-4 text-right">
                                        {!t.responded_at && !t.done && onAudit && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => onAudit(t)}
                                                className="h-8 gap-1.5 border-orange-200 text-orange-700 hover:bg-orange-50 text-xs font-bold"
                                            >
                                                <ClipboardCheck className="h-3.5 w-3.5" />
                                                Audit
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <p className="text-[11px] text-slate-400 px-4 py-3 bg-slate-50/50 border-t border-slate-100">
                    {filtered.length} store{filtered.length === 1 ? "" : "s"}
                    {search ? ` matching "${search}"` : ""}
                </p>
            </div>
        </div>
    );
};
