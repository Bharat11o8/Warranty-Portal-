import { useEffect, useState } from "react";
import api, { getErrorMessage } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown, Loader2, Lock, Trash2 } from "lucide-react";

/**
 * Internal remarks on a warranty: notes between admins, never shown to the
 * customer or the franchise. Admin-only routes back it, and it is only ever
 * rendered on admin screens — keep it that way.
 */

interface Remark {
    id: number;
    admin_id: string;
    admin_name: string | null;
    remark: string;
    created_at: string;
}

const when = (at: string) => {
    const d = new Date(at);
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true,
    });
};

export const WarrantyRemarks = ({ uid }: { uid?: string }) => {
    const { user, hasPermission } = useAuth();
    const { toast } = useToast();
    const [remarks, setRemarks] = useState<Remark[]>([]);
    const [loading, setLoading] = useState(false);
    const [draft, setDraft] = useState("");
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    // Most warranties never get a remark, so the panel starts folded. One that
    // already has remarks opens on its own, so a note left for the next
    // reviewer is not missed.
    const [open, setOpen] = useState(false);

    const canWrite = hasPermission('warranties', 'write');

    useEffect(() => {
        setDraft("");
        setOpen(false);
        if (!uid) { setRemarks([]); return; }
        let cancelled = false;
        setLoading(true);

        api.get(`/admin/warranties/${encodeURIComponent(uid)}/remarks`)
            .then(res => {
                if (cancelled || !res.data?.success) return;
                const list = res.data.remarks || [];
                setRemarks(list);
                if (list.length > 0) setOpen(true);
            })
            .catch(() => { if (!cancelled) setRemarks([]); })
            .finally(() => { if (!cancelled) setLoading(false); });

        return () => { cancelled = true; };
    }, [uid]);

    const addRemark = async () => {
        const text = draft.trim();
        if (!uid || !text) return;
        setSaving(true);
        try {
            const res = await api.post(`/admin/warranties/${encodeURIComponent(uid)}/remarks`, { remark: text });
            if (res.data?.success) {
                setRemarks(prev => [...prev, res.data.remark]);
                setDraft("");
            }
        } catch (error) {
            toast({ title: "Could not save remark", description: getErrorMessage(error, "Please try again"), variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    const deleteRemark = async (id: number) => {
        if (!uid) return;
        setDeletingId(id);
        try {
            await api.delete(`/admin/warranties/${encodeURIComponent(uid)}/remarks/${id}`);
            setRemarks(prev => prev.filter(r => r.id !== id));
        } catch (error) {
            toast({ title: "Could not delete remark", description: getErrorMessage(error, "Please try again"), variant: "destructive" });
        } finally {
            setDeletingId(null);
        }
    };

    if (!uid) return null;

    return (
        <div className="bg-amber-50/40 border border-amber-100 rounded-2xl px-4 py-2.5 space-y-3" onClick={e => e.stopPropagation()}>
            <button
                type="button"
                onClick={() => setOpen(v => !v)}
                className="flex w-full items-center gap-2 text-left group"
                aria-expanded={open}
            >
                <Lock className="h-3.5 w-3.5 text-amber-600" />
                <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Internal Remarks</span>
                {loading
                    ? <Loader2 className="h-3 w-3 animate-spin text-slate-400" />
                    : remarks.length > 0 && (
                        <span className="rounded-full bg-amber-100 px-1.5 text-[10px] font-bold text-amber-700">
                            {remarks.length}
                        </span>
                    )}
                <span className="min-w-0 flex-1 truncate text-[10px] text-slate-400">
                    Admins only, not shown to customer or franchise
                </span>
                <ChevronDown
                    className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform group-hover:text-slate-600 ${open ? 'rotate-180' : ''}`}
                />
            </button>

            {!open ? null : loading ? (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading remarks…
                </div>
            ) : remarks.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No remarks yet.</p>
            ) : (
                <ul className="space-y-2">
                    {remarks.map(r => {
                        const canDelete = canWrite && (String(r.admin_id) === String(user?.id) || user?.isSuperAdmin);
                        return (
                            <li key={r.id} className="bg-white border border-amber-100 rounded-lg px-3 py-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-bold text-slate-700">{r.admin_name || 'Admin'}</span>
                                    <span className="text-[10px] text-slate-400">{when(r.created_at)}</span>
                                    {canDelete && (
                                        <button
                                            type="button"
                                            onClick={() => deleteRemark(r.id)}
                                            disabled={deletingId === r.id}
                                            className="ml-auto text-slate-300 hover:text-red-500 disabled:opacity-50"
                                            aria-label="Delete remark"
                                        >
                                            {deletingId === r.id
                                                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                : <Trash2 className="h-3.5 w-3.5" />}
                                        </button>
                                    )}
                                </div>
                                <p className="mt-1 text-sm text-slate-700 whitespace-pre-wrap break-words">{r.remark}</p>
                            </li>
                        );
                    })}
                </ul>
            )}

            {open && canWrite && (
                <div className="space-y-2">
                    <Textarea
                        value={draft}
                        onChange={e => setDraft(e.target.value)}
                        placeholder="Add an internal remark…"
                        maxLength={2000}
                        className="min-h-[70px] bg-white text-sm"
                    />
                    <div className="flex justify-end">
                        <Button size="sm" onClick={addRemark} disabled={!draft.trim() || saving}>
                            {saving ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Saving…</> : "Add Remark"}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};
