import { useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Loader2, CalendarDays, ChevronDown, Check } from "lucide-react";

/**
 * The month a set of audits belongs to, and what it adds up to.
 *
 * Audits repeat within a month — September went out on the 1st and was chased
 * on the 15th — and the same store is targeted by both. Counted per campaign a
 * store appears twice, once outstanding and once done, which is no use to
 * someone working a call list. The month is the unit of compliance; campaigns
 * are the detail underneath it.
 */
export interface MonthSummary {
    month: string;
    rounds: number;
    stores: number;
    done: number;
    outstanding: number;
    compliance: number;
}

export interface MonthCampaign {
    id: string;
    name: string;
    campaign_name: string | null;
    template_name: string | null;
    include_in_stats: number;
    first_sent_at: string | null;
    targets: number;
}

interface Props {
    selected: string | null;
    onSelect: (month: string | null) => void;
    /** Bumped by the parent when an audit is recorded, to refresh the counts. */
    refreshKey?: number;
    /** Ticking a campaign changes which stores are listed, not just the totals. */
    onCounted?: () => void;
}

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

const label = (m: string) => {
    const [y, mo] = m.split("-");
    return `${MONTH_NAMES[Number(mo) - 1] || mo} ${y}`;
};

export const AuditMonthBar = ({ selected, onSelect, refreshKey = 0, onCounted }: Props) => {
    const [months, setMonths] = useState<MonthSummary[]>([]);
    const [campaigns, setCampaigns] = useState<MonthCampaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        api.get("/admin/audit-months", { params: { _: Date.now() } })
            .then(res => { if (!cancelled) setMonths(res.data.months || []); })
            .catch(() => { if (!cancelled) setMonths([]); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [refreshKey]);

    // The campaigns of the chosen month, so an admin can say which ones count.
    useEffect(() => {
        if (!selected) { setCampaigns([]); return; }
        let cancelled = false;
        api.get(`/admin/audit-months/${selected}`, { params: { status: "none", _: Date.now() } })
            .then(res => { if (!cancelled) setCampaigns(res.data.campaigns || []); })
            .catch(() => { if (!cancelled) setCampaigns([]); });
        return () => { cancelled = true; };
    }, [selected, refreshKey]);

    const active = useMemo(
        () => months.find(m => m.month === selected) || null,
        [months, selected]
    );

    /** Years present in the data, so the picker grows without being edited. */
    const years = useMemo(() => {
        const set = new Set(months.map(m => m.month.slice(0, 4)));
        return [...set].sort().reverse();
    }, [months]);

    const [year, setYear] = useState<string | null>(null);
    useEffect(() => {
        if (!year && years.length) setYear(selected?.slice(0, 4) || years[0]);
    }, [years, year, selected]);

    const toggleCampaign = async (c: MonthCampaign) => {
        setSaving(c.id);
        try {
            await api.patch(`/admin/audit-rounds/${c.id}/counted`, {
                include: !c.include_in_stats,
            });
            setCampaigns(prev => prev.map(x =>
                x.id === c.id ? { ...x, include_in_stats: x.include_in_stats ? 0 : 1 } : x
            ));
            // The totals move when a campaign is counted or dropped.
            const res = await api.get("/admin/audit-months", { params: { _: Date.now() } });
            setMonths(res.data.months || []);
            // The store list behind this bar is now stale too.
            onCounted?.();
        } catch {
            /* The row keeps its previous state; the admin can try again. */
        } finally {
            setSaving(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center gap-2 text-sm text-slate-400 py-4">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading months…
            </div>
        );
    }

    if (months.length === 0) {
        return (
            <p className="text-sm text-slate-400 py-4">
                No audit campaigns yet. Send one, then tick it here to start counting.
            </p>
        );
    }

    /* Nothing ticked reads as "no data" unless it says otherwise, and the fix
       is the dropdown alongside this message. */
    const nothingCounted = Boolean(active && active.rounds === 0);

    const inYear = months.filter(m => m.month.startsWith(year || ""));

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
                {/* Year first, so the list stays short as the years accumulate. */}
                {years.length > 1 && (
                    <div className="flex gap-1 bg-slate-50 p-1 rounded-2xl border border-slate-200/60">
                        {years.map(y => (
                            <button
                                key={y}
                                onClick={() => setYear(y)}
                                className={
                                    "h-8 px-3 rounded-xl text-xs font-black transition-colors " +
                                    (year === y ? "bg-white shadow-sm text-slate-800" : "text-slate-400 hover:text-slate-600")
                                }
                            >
                                {y}
                            </button>
                        ))}
                    </div>
                )}

                {inYear.map(m => {
                    const on = selected === m.month;
                    return (
                        <button
                            key={m.month}
                            onClick={() => onSelect(on ? null : m.month)}
                            className={
                                "h-10 px-4 rounded-2xl text-sm font-bold border transition-colors inline-flex items-center gap-2 " +
                                (on
                                    ? "bg-orange-50 border-orange-200 text-orange-700"
                                    : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50")
                            }
                        >
                            <CalendarDays className="h-3.5 w-3.5" />
                            {label(m.month)}
                            <span className={
                                "text-[10px] font-black px-1.5 py-0.5 rounded-full " +
                                (on ? "bg-orange-100 text-orange-700" : "bg-slate-100 text-slate-500")
                            }>
                                {m.done}/{m.stores}
                            </span>
                        </button>
                    );
                })}

                {/* Which campaigns count. Interakt sends plenty that have nothing
                    to do with auditing, and one of those opened a round here, so
                    nothing counts until somebody says it does. */}
                {selected && (
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className="h-10 rounded-2xl border-orange-100 hover:bg-orange-50 gap-2 text-slate-600"
                            >
                                {campaigns.filter(c => c.include_in_stats).length} of {campaigns.length} campaigns
                                <ChevronDown className="h-3.5 w-3.5" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent align="start" className="w-80 p-2 rounded-2xl">
                            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-2 py-1.5">
                                Campaigns counted in {label(selected)}
                            </p>
                            {campaigns.length === 0 && (
                                <p className="text-sm text-slate-400 px-2 py-3">
                                    No campaigns recorded for this month yet.
                                </p>
                            )}
                            {campaigns.map(c => (
                                <button
                                    key={c.id}
                                    onClick={() => toggleCampaign(c)}
                                    disabled={saving === c.id}
                                    className="w-full flex items-start gap-2.5 px-2 py-2 rounded-xl hover:bg-slate-50 text-left disabled:opacity-50"
                                >
                                    <span className={
                                        "mt-0.5 h-4 w-4 rounded border flex items-center justify-center shrink-0 " +
                                        (c.include_in_stats
                                            ? "bg-orange-500 border-orange-500"
                                            : "border-slate-300")
                                    }>
                                        {saving === c.id
                                            ? <Loader2 className="h-3 w-3 animate-spin text-slate-400" />
                                            : c.include_in_stats
                                                ? <Check className="h-3 w-3 text-white" />
                                                : null}
                                    </span>
                                    <span className="min-w-0">
                                        <span className="block text-sm font-bold text-slate-700 truncate">
                                            {c.campaign_name || c.name}
                                        </span>
                                        <span className="block text-[11px] text-slate-400">
                                            {c.targets} store{c.targets === 1 ? "" : "s"}
                                            {c.first_sent_at
                                                ? ` · ${new Date(c.first_sent_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}`
                                                : ""}
                                        </span>
                                    </span>
                                </button>
                            ))}
                            <p className="text-[11px] text-slate-400 px-2 py-2 border-t border-slate-100 mt-1">
                                Untick anything that is not a store audit — it stops
                                counting but nothing is deleted.
                            </p>
                        </PopoverContent>
                    </Popover>
                )}
            </div>

            {nothingCounted && (
                <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
                    No campaign is being counted for {label(selected!)} yet — tick the
                    audit campaigns above to see the stores.
                </p>
            )}

            {active && !nothingCounted && (
                <div className="flex flex-wrap items-center gap-4 px-4 py-3 rounded-2xl bg-slate-50/60 border border-slate-100">
                    <span className="text-sm font-black text-slate-800">{label(active.month)}</span>
                    <span className="text-xs text-slate-500">
                        <b className="text-slate-700">{active.stores}</b> stores
                    </span>
                    <span className="text-xs text-emerald-600">
                        <b>{active.done}</b> done
                    </span>
                    <span className="text-xs text-amber-600">
                        <b>{active.outstanding}</b> outstanding
                    </span>
                    <span className="text-xs text-slate-400">
                        across {active.rounds} campaign{active.rounds === 1 ? "" : "s"}
                    </span>
                    <span className="ml-auto text-sm font-black text-slate-700">
                        {active.compliance}%
                    </span>
                </div>
            )}
        </div>
    );
};
