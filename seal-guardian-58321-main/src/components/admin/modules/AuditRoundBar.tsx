import { useState, useEffect } from "react";
import api, { getErrorMessage } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, CalendarRange, Users, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The round selector and its progress.
 *
 * An audit repeats — monthly, or whenever the business asks — and each send is
 * a round. Rounds create themselves from the WhatsApp campaign, so this only
 * ever selects one; there is no "start a round" button because starting one is
 * the act of sending the campaign.
 *
 * The number that matters day to day is "not done": the stores still to chase.
 */
export interface AuditRound {
    id: string;
    name: string;
    campaign_id: string | null;
    campaign_name: string | null;
    first_sent_at: string | null;
    created_at: string;
    status: "open" | "closed";
    target_count: number;
    responded_count: number;
    outstanding_count: number;
    audit_count: number;
}

interface Props {
    rounds: AuditRound[];
    loading: boolean;
    selectedId: string | null;
    onSelect: (id: string | null) => void;
    onSeeded: () => void;
}

const fmtDay = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export const AuditRoundBar = ({ rounds, loading, selectedId, onSelect, onSeeded }: Props) => {
    const { toast } = useToast();
    const [seeding, setSeeding] = useState(false);

    const round = rounds.find(r => r.id === selectedId) || null;

    // Default to the most recent round once they load, but only once — a
    // deliberate switch to "All rounds" must not be overridden on the next render.
    const [touched, setTouched] = useState(false);
    useEffect(() => {
        if (!touched && !selectedId && rounds.length > 0) {
            setTouched(true);
            onSelect(rounds[0].id);
        }
    }, [rounds, selectedId, onSelect, touched]);

    const handleSelect = (v: string) => {
        setTouched(true);
        onSelect(v === "__all__" ? null : v);
    };

    /**
     * Fallback for when campaign send events never arrived: without a target
     * list there is no way to tell who has not responded, so seed it from the
     * verified franchises rather than have no chase list at all.
     */
    const seed = async () => {
        if (!round) return;
        setSeeding(true);
        try {
            const res = await api.post(`/admin/audit-rounds/${round.id}/seed`, {});
            toast({
                title: "Chase list built",
                description: res.data?.message || "Stores added to this round.",
            });
            onSeeded();
        } catch (error: any) {
            toast({
                title: "Could not build the list",
                description: getErrorMessage(error, "Failed to seed the round"),
                variant: "destructive",
            });
        } finally {
            setSeeding(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-3xl border border-orange-50 shadow-sm p-5 flex items-center gap-3">
                <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
                <span className="text-sm text-slate-400">Loading rounds…</span>
            </div>
        );
    }

    if (rounds.length === 0) {
        return (
            <div className="bg-white rounded-3xl border border-orange-50 shadow-sm p-5">
                <div className="flex items-start gap-3">
                    <CalendarRange className="h-5 w-5 text-slate-300 mt-0.5 shrink-0" />
                    <div>
                        <p className="text-sm font-bold text-slate-700">No audit rounds yet</p>
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                            A round is created automatically when an audit campaign goes out from
                            Interakt. Send one and it will appear here, with the list of stores it
                            reached.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    const pct = round && round.target_count > 0
        ? Math.round((round.responded_count / round.target_count) * 100)
        : 0;

    return (
        <div className="bg-white rounded-3xl border border-orange-50 shadow-sm p-5 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                    <CalendarRange className="h-4 w-4 text-orange-500 shrink-0" />
                    <Select value={selectedId || "__all__"} onValueChange={handleSelect}>
                        <SelectTrigger className="h-11 rounded-2xl border-orange-100 bg-slate-50/50 w-full lg:w-[320px]">
                            <SelectValue placeholder="Choose a round" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl">
                            {/* Audits recorded before rounds existed carry no
                                round_id, so they are only reachable here. */}
                            <SelectItem value="__all__">All rounds</SelectItem>
                            {rounds.map(r => (
                                <SelectItem key={r.id} value={r.id}>
                                    {r.name}
                                    {r.first_sent_at ? ` · ${fmtDay(r.first_sent_at)}` : ""}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {round?.status === "open" && (
                        <span className="hidden sm:inline text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-full shrink-0">
                            Open
                        </span>
                    )}
                </div>

                {/* Seeding only makes sense when the send events did not build a list. */}
                {round && round.target_count === 0 && (
                    <Button
                        variant="outline"
                        onClick={seed}
                        disabled={seeding}
                        className="h-11 rounded-2xl border-orange-100 hover:bg-orange-50 gap-2 text-slate-600 shrink-0"
                    >
                        {seeding
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : <ListChecks className="h-4 w-4" />}
                        Build chase list
                    </Button>
                )}
            </div>

            {round && (
                <>
                    <div className="grid grid-cols-3 gap-3">
                        <Stat icon={Users} label="Targeted" value={round.target_count} tone="slate" />
                        <Stat label="Done" value={round.responded_count} tone="emerald" />
                        <Stat label="Not done" value={round.outstanding_count} tone="amber" />
                    </div>

                    <div>
                        <div className="flex justify-between text-[11px] font-bold text-slate-400 mb-1.5">
                            <span>{pct}% responded</span>
                            <span>
                                {round.responded_count} of {round.target_count}
                            </span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                            <div
                                className="h-full bg-emerald-500 transition-all"
                                style={{ width: `${pct}%` }}
                            />
                        </div>
                        {round.target_count === 0 && (
                            <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                                No store list for this round — the campaign's send events did not
                                reach us, so who has not responded cannot be worked out. Build the
                                chase list to fill it from the verified franchises.
                            </p>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

const TONES: Record<string, string> = {
    slate: "text-slate-800",
    emerald: "text-emerald-600",
    amber: "text-amber-600",
};

const Stat = ({ icon: Icon, label, value, tone }: { icon?: any; label: string; value: number; tone: string }) => (
    <div className="rounded-2xl bg-slate-50/70 border border-slate-100 px-4 py-3">
        <p className={cn("text-2xl font-black leading-none", TONES[tone])}>{value}</p>
        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mt-1.5 flex items-center gap-1">
            {Icon && <Icon className="h-3 w-3" />}
            {label}
        </p>
    </div>
);
