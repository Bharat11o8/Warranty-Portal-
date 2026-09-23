import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Loader2, XCircle, RotateCcw, CheckCircle2, PencilLine, ShieldAlert, ChevronDown } from "lucide-react";

/**
 * The chain a warranty has been through: rejected, corrected, looked at again.
 *
 * A resubmitted warranty rejoins the ordinary queue, and on screen that made it
 * indistinguishable from something nobody had ever reviewed. The admin who
 * rejected it could see it waiting again but not what they had objected to, nor
 * whether the store had addressed it — so the second review started from
 * nothing, which is how the same fault gets rejected twice.
 *
 * Read from the activity log rather than the warranty row: resubmitting clears
 * the rejection reason from the row, correctly, since it no longer applies.
 */

interface HistoryEntry {
    id: string;
    action: string;
    by: string;
    at: string;
    summary: string | null;
    rejectionReason: string | null;
    changes: Record<string, { before: string | null; after: string | null }> | null;
}

const LOOK: Record<string, { label: string; icon: any; dot: string; text: string }> = {
    WARRANTY_REJECTED: { label: 'Rejected', icon: XCircle, dot: 'bg-red-500', text: 'text-red-700' },
    WARRANTY_RESUBMITTED: { label: 'Resubmitted', icon: RotateCcw, dot: 'bg-blue-500', text: 'text-blue-700' },
    WARRANTY_APPROVED: { label: 'Approved', icon: CheckCircle2, dot: 'bg-emerald-500', text: 'text-emerald-700' },
    WARRANTY_UPDATED: { label: 'Edited by admin', icon: PencilLine, dot: 'bg-slate-400', text: 'text-slate-600' },
    WARRANTY_OVERRIDDEN: { label: 'Overridden', icon: ShieldAlert, dot: 'bg-amber-500', text: 'text-amber-700' },
};

const when = (at: string) => {
    const d = new Date(at);
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true,
    });
};

export const WarrantyHistory = ({ uid }: { uid?: string }) => {
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (!uid) { setHistory([]); return; }
        let cancelled = false;
        setLoading(true);

        api.get(`/admin/warranties/${encodeURIComponent(uid)}/history`)
            .then(res => { if (!cancelled && res.data?.success) setHistory(res.data.history || []); })
            // A warranty nothing has happened to yet has no history; that is
            // not an error worth interrupting the reviewer over.
            .catch(() => { if (!cancelled) setHistory([]); })
            .finally(() => { if (!cancelled) setLoading(false); });

        return () => { cancelled = true; };
    }, [uid]);

    if (loading) {
        return (
            <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading history…
            </div>
        );
    }

    // A first-time submission has nothing to show, and an empty panel saying so
    // is more clutter than the absence of one.
    if (history.length === 0) return null;

    /*
     * Folded once there is more than one entry.
     *
     * A single rejection is the reason the warranty is on screen and reads as
     * part of the row. Two or more turn a card somebody is scanning into a
     * wall of repeated text, so the rest go behind a summary line naming the
     * most recent — which is the one that still needs answering.
     */
    const collapsible = history.length >= 2;
    const shown = collapsible && !open ? [] : history;
    const latest = history[history.length - 1];

    return (
        <div className="mt-3 pt-3 border-t border-dashed border-slate-200">
            {collapsible ? (
                <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setOpen(v => !v); }}
                    className="flex w-full items-center gap-2 text-left group"
                    aria-expanded={open}
                >
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                        History
                    </span>
                    <span className="rounded-full bg-slate-100 px-1.5 text-[10px] font-bold text-slate-600">
                        {history.length}
                    </span>
                    {/* What the reviewer needs if they read nothing else. */}
                    {!open && latest && (
                        <span className="min-w-0 flex-1 truncate text-[10px] text-slate-400">
                            {(LOOK[latest.action]?.label || latest.action)} · {when(latest.at)}
                        </span>
                    )}
                    <ChevronDown
                        className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform group-hover:text-slate-600 ${open ? 'rotate-180' : ''}`}
                    />
                </button>
            ) : (
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    History
                </p>
            )}

            <ol className={`space-y-2.5 ${collapsible && open ? 'mt-2.5' : ''}`}>
                {shown.map((entry, i) => {
                    const look = LOOK[entry.action] || {
                        label: entry.action, icon: PencilLine, dot: 'bg-slate-300', text: 'text-slate-600',
                    };
                    const Icon = look.icon;
                    const changes = entry.changes ? Object.entries(entry.changes) : [];

                    return (
                        <li key={entry.id} className="flex gap-2.5">
                            {/* The rail: a dot per event, joined except after the last. */}
                            <div className="flex flex-col items-center shrink-0 pt-1">
                                <span className={`h-1.5 w-1.5 rounded-full ${look.dot}`} />
                                {i < shown.length - 1 && (
                                    <span className="w-px flex-1 bg-slate-200 mt-1" aria-hidden />
                                )}
                            </div>

                            <div className="min-w-0 flex-1 pb-0.5">
                                <div className="flex flex-wrap items-baseline gap-x-2">
                                    <span className={`text-xs font-bold ${look.text} inline-flex items-center gap-1`}>
                                        <Icon className="h-3 w-3" />
                                        {look.label}
                                    </span>
                                    <span className="text-[10px] text-slate-400">
                                        {when(entry.at)} · {entry.by}
                                    </span>
                                </div>

                                {/* What was objected to, in the objector's own words. */}
                                {entry.rejectionReason && (
                                    <p className="mt-1 text-[11px] text-red-700 bg-red-50 border border-red-100 rounded-md px-2 py-1 leading-snug">
                                        {entry.rejectionReason}
                                    </p>
                                )}

                                {entry.summary && !entry.rejectionReason && (
                                    <p className="mt-0.5 text-[11px] text-slate-600">{entry.summary}</p>
                                )}

                                {/* Field by field, so "did they fix it?" is answerable
                                    without opening the warranty twice. */}
                                {changes.length > 0 && (
                                    <ul className="mt-1 space-y-0.5">
                                        {changes.map(([field, v]) => (
                                            <li key={field} className="text-[10px] text-slate-500 leading-snug">
                                                <span className="font-semibold text-slate-700">{field}</span>
                                                {': '}
                                                {v.before
                                                    ? <span className="line-through text-slate-400">{v.before}</span>
                                                    : <span className="text-slate-400 italic">empty</span>}
                                                {' → '}
                                                <span className="text-slate-700">{v.after ?? 'cleared'}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </li>
                    );
                })}
            </ol>
        </div>
    );
};
