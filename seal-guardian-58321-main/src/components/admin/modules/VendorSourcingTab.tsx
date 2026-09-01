import { useState, useEffect, useMemo } from "react";
import api, { getErrorMessage } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Truck, Plus, Search, MapPin, Trash2, PackageSearch } from "lucide-react";

/**
 * Where this franchise sources its stock.
 *
 * The same assignments as the Sourcing Map screen, but for one store — which is
 * the question actually being asked while looking at a franchise. Most stores
 * have one distributor and 149 have none at all, so the empty state and the
 * assign action matter more here than the list does.
 */

interface Props {
    /** profiles.id — franchise_distributors keys on this, not vendor_details.id. */
    franchiseUserId: string | null;
    storeName?: string | null;
}

interface Distributor {
    id: string;
    name: string;
    city: string | null;
    state: string | null;
    allowed_category_names: string | null;
}

export const VendorSourcingTab = ({ franchiseUserId, storeName }: Props) => {
    const { toast } = useToast();
    const [rows, setRows] = useState<Distributor[]>([]);
    const [loading, setLoading] = useState(true);
    const [pickerOpen, setPickerOpen] = useState(false);
    const [all, setAll] = useState<any[]>([]);
    const [allLoading, setAllLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [saving, setSaving] = useState<string | null>(null);
    const [removeTarget, setRemoveTarget] = useState<Distributor | null>(null);

    const load = async () => {
        if (!franchiseUserId) { setRows([]); setLoading(false); return; }
        setLoading(true);
        try {
            const res = await api.get(`/admin/franchises/${franchiseUserId}/distributors`);
            setRows(res.data.distributors || []);
        } catch (error: any) {
            toast({
                title: "Could not load sourcing",
                description: getErrorMessage(error, "Failed to load this store's distributors"),
                variant: "destructive",
            });
            setRows([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [franchiseUserId]);

    const openPicker = async () => {
        setPickerOpen(true);
        if (all.length > 0) return;
        setAllLoading(true);
        try {
            const res = await api.get("/admin/distributors");
            setAll(res.data.distributors || res.data.data || []);
        } catch (error: any) {
            toast({
                title: "Could not load distributors",
                description: getErrorMessage(error, "Failed to load the distributor list"),
                variant: "destructive",
            });
        } finally {
            setAllLoading(false);
        }
    };

    const assigned = useMemo(() => new Set(rows.map(r => r.id)), [rows]);

    const options = useMemo(() => {
        const q = search.trim().toLowerCase();
        return all
            // Already assigned ones are not choices; they are removed below instead.
            .filter(d => !assigned.has(d.id))
            .filter(d => !q
                || String(d.name || "").toLowerCase().includes(q)
                || String(d.city || "").toLowerCase().includes(q)
                || String(d.state || "").toLowerCase().includes(q))
            .slice(0, 50);
    }, [all, assigned, search]);

    const assign = async (distributorId: string, name: string) => {
        if (!franchiseUserId) return;
        setSaving(distributorId);
        try {
            await api.post(`/admin/distributors/${distributorId}/franchises`, { vendorId: franchiseUserId });
            toast({ title: "Distributor assigned", description: `${storeName || "This store"} now sources from ${name}.` });
            setPickerOpen(false);
            setSearch("");
            load();
        } catch (error: any) {
            toast({
                title: "Could not assign",
                description: getErrorMessage(error, "Failed to assign the distributor"),
                variant: "destructive",
            });
        } finally {
            setSaving(null);
        }
    };

    const remove = async () => {
        if (!franchiseUserId || !removeTarget) return;
        setSaving(removeTarget.id);
        try {
            await api.delete(`/admin/distributors/${removeTarget.id}/franchises/${franchiseUserId}`);
            toast({ title: "Distributor removed", description: `No longer sourcing from ${removeTarget.name}.` });
            setRemoveTarget(null);
            load();
        } catch (error: any) {
            toast({
                title: "Could not remove",
                description: getErrorMessage(error, "Failed to remove the distributor"),
                variant: "destructive",
            });
        } finally {
            setSaving(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12 gap-2 text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" /> <span className="text-sm">Loading sourcing…</span>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <p className="text-sm font-bold text-slate-800">Distributors</p>
                    <p className="text-[11px] text-slate-400">
                        {rows.length === 0
                            ? "This store has no distributor assigned"
                            : `Sourcing from ${rows.length} distributor${rows.length === 1 ? "" : "s"}`}
                    </p>
                </div>
                <Button
                    onClick={openPicker}
                    disabled={!franchiseUserId}
                    className="h-9 gap-2 bg-orange-600 hover:bg-orange-700"
                >
                    <Plus className="h-4 w-4" /> Assign
                </Button>
            </div>

            {rows.length === 0 ? (
                <div className="border border-dashed border-slate-200 rounded-2xl py-10 text-center">
                    <PackageSearch className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-600">No sourcing set up</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                        Until a distributor is assigned, this store has nowhere to order from.
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {rows.map(d => (
                        <div
                            key={d.id}
                            className="flex items-start justify-between gap-3 p-4 rounded-2xl border border-slate-100 bg-white hover:border-orange-100 transition-colors"
                        >
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <Truck className="h-4 w-4 text-orange-500 shrink-0" />
                                    <p className="text-sm font-bold text-slate-800 truncate">{d.name}</p>
                                </div>
                                {(d.city || d.state) && (
                                    <p className="flex items-center gap-1 text-[11px] text-slate-400 mt-1 ml-6">
                                        <MapPin className="h-3 w-3" />
                                        {[d.city, d.state].filter(Boolean).join(", ")}
                                    </p>
                                )}
                                {/* What the store can actually order from this
                                    distributor, which is the point of the pairing. */}
                                <div className="flex flex-wrap gap-1 mt-2 ml-6">
                                    {d.allowed_category_names
                                        ? d.allowed_category_names.split(", ").filter(Boolean).map(c => (
                                            <Badge key={c} variant="secondary" className="bg-slate-50 text-slate-600 border-slate-200 text-[10px] font-bold">
                                                {c}
                                            </Badge>
                                        ))
                                        : <span className="text-[11px] text-slate-400">No categories set on this distributor</span>}
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setRemoveTarget(d)}
                                disabled={saving === d.id}
                                title="Remove this distributor"
                                aria-label="Remove this distributor"
                                className="h-8 w-8 shrink-0 text-slate-400 hover:text-red-600 hover:bg-red-50"
                            >
                                {saving === d.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            </Button>
                        </div>
                    ))}
                </div>
            )}

            <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
                <DialogContent className="max-w-lg max-h-[80vh] flex flex-col p-0 gap-0">
                    <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100 shrink-0">
                        <DialogTitle className="text-base">Assign a distributor</DialogTitle>
                        <DialogDescription className="text-xs">
                            {storeName ? `${storeName} will be able to order from whoever you pick.` : "The store will be able to order from whoever you pick."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="px-6 py-3 border-b border-slate-100 shrink-0">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                autoFocus
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search by name, city or state..."
                                className="pl-10 h-10"
                            />
                        </div>
                    </div>

                    <div className="flex-1 min-h-0 overflow-y-auto px-3 py-3">
                        {allLoading ? (
                            <div className="flex items-center justify-center py-10 gap-2 text-slate-400">
                                <Loader2 className="h-4 w-4 animate-spin" /> <span className="text-sm">Loading…</span>
                            </div>
                        ) : options.length === 0 ? (
                            <p className="text-center text-sm text-slate-400 py-10">
                                {search ? "No distributor matches that." : "Every distributor is already assigned to this store."}
                            </p>
                        ) : (
                            <div className="space-y-1">
                                {options.map(d => (
                                    <button
                                        key={d.id}
                                        type="button"
                                        onClick={() => assign(d.id, d.name)}
                                        disabled={saving === d.id}
                                        className="w-full text-left p-3 rounded-xl hover:bg-orange-50 transition-colors flex items-center justify-between gap-3 disabled:opacity-60"
                                    >
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-slate-800 truncate">{d.name}</p>
                                            <p className="text-[11px] text-slate-400">
                                                {[d.city, d.state].filter(Boolean).join(", ") || "—"}
                                            </p>
                                        </div>
                                        {saving === d.id
                                            ? <Loader2 className="h-4 w-4 animate-spin text-orange-500 shrink-0" />
                                            : <Plus className="h-4 w-4 text-orange-500 shrink-0" />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!removeTarget} onOpenChange={open => { if (!open) setRemoveTarget(null); }}>
                <AlertDialogContent className="rounded-3xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove {removeTarget?.name}?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {storeName || "This store"} will no longer be able to order from them.
                            Existing orders are not affected, and the distributor can be assigned again later.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-2xl">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={e => { e.preventDefault(); remove(); }}
                            disabled={!!saving}
                            className="rounded-2xl bg-red-600 hover:bg-red-700 gap-2"
                        >
                            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                            Remove
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};
