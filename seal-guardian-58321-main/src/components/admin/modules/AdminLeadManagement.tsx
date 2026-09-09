import { useState, useEffect, useMemo } from "react";
import api, { getErrorMessage } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import {
    Loader2, Plus, Trash2, Search, MapPin, Phone, UserRound,
    RefreshCw, X, AlertTriangle, Power
} from "lucide-react";

/**
 * ASMs and the areas they cover.
 *
 * This is the routing table behind lead forwarding: an enquiry carries an area,
 * and whoever owns that area gets the WhatsApp. One area belongs to exactly one
 * ASM — the database enforces it — so this screen's job is mostly to make the
 * mapping visible and easy to correct.
 */

interface Asm {
    id: string;
    name: string;
    phone_number: string;
    email: string | null;
    is_active: number;
    area_count: number;
    lead_count: number;
}

interface Area {
    id: string;
    asm_id: string;
    area_key: string;
    area_label: string;
    state: string | null;
}

export const AdminLeadManagement = () => {
    const { toast } = useToast();
    const [asms, setAsms] = useState<Asm[]>([]);
    const [areas, setAreas] = useState<Area[]>([]);
    const [knownAreas, setKnownAreas] = useState<{ label: string; state: string | null }[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState("");
    const [busyId, setBusyId] = useState<string | null>(null);

    // Add / edit an ASM
    const [asmDialogOpen, setAsmDialogOpen] = useState(false);
    const [editing, setEditing] = useState<Asm | null>(null);
    const [form, setForm] = useState({ name: "", phone_number: "", email: "" });
    const [saving, setSaving] = useState(false);

    // Assign an area
    const [areaTarget, setAreaTarget] = useState<Asm | null>(null);
    const [areaInput, setAreaInput] = useState("");
    const [addingArea, setAddingArea] = useState(false);

    const fetchAll = async (silent = false) => {
        silent ? setRefreshing(true) : setLoading(true);
        try {
            const res = await api.get("/asm");
            if (res.data.success) {
                setAsms(res.data.asms || []);
                setAreas(res.data.areas || []);
            }
        } catch (error: any) {
            toast({
                title: "Could not load ASMs",
                description: getErrorMessage(error, "Please try again"),
                variant: "destructive",
            });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchAll();
        // Cities we already serve, offered as suggestions so nobody assigns an
        // area from memory and mistypes it.
        api.get("/asm/known-areas")
            .then(res => { if (res.data.success) setKnownAreas(res.data.areas || []); })
            .catch(() => { /* suggestions are a convenience, not a requirement */ });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const areasByAsm = useMemo(() => {
        const map: Record<string, Area[]> = {};
        areas.forEach(a => { (map[a.asm_id] ||= []).push(a); });
        return map;
    }, [areas]);

    /** Areas already taken, so the suggestion list never offers a clash. */
    const takenKeys = useMemo(() => new Set(areas.map(a => a.area_key)), [areas]);

    const visible = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return asms;
        return asms.filter(a =>
            a.name.toLowerCase().includes(q) ||
            a.phone_number.includes(q) ||
            (areasByAsm[a.id] || []).some(ar => ar.area_label.toLowerCase().includes(q))
        );
    }, [asms, search, areasByAsm]);

    const openAdd = () => {
        setEditing(null);
        setForm({ name: "", phone_number: "", email: "" });
        setAsmDialogOpen(true);
    };

    const openEdit = (asm: Asm) => {
        setEditing(asm);
        setForm({ name: asm.name, phone_number: asm.phone_number, email: asm.email || "" });
        setAsmDialogOpen(true);
    };

    const saveAsm = async () => {
        if (!form.name.trim() || !form.phone_number.trim()) {
            toast({ title: "Name and WhatsApp number are required", variant: "destructive" });
            return;
        }
        setSaving(true);
        try {
            if (editing) {
                await api.put(`/asm/${editing.id}`, form);
                toast({ title: "ASM updated" });
            } else {
                await api.post("/asm", form);
                toast({ title: "ASM added" });
            }
            setAsmDialogOpen(false);
            fetchAll(true);
        } catch (error: any) {
            toast({
                title: editing ? "Update failed" : "Could not add ASM",
                description: getErrorMessage(error, "Please try again"),
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    const toggleActive = async (asm: Asm) => {
        setBusyId(asm.id);
        try {
            await api.put(`/asm/${asm.id}`, { is_active: !asm.is_active });
            toast({
                title: asm.is_active ? "ASM deactivated" : "ASM activated",
                description: asm.is_active
                    ? "Enquiries for their areas will queue as unmatched until reassigned."
                    : undefined,
            });
            fetchAll(true);
        } catch (error: any) {
            toast({ title: "Update failed", description: getErrorMessage(error, ""), variant: "destructive" });
        } finally {
            setBusyId(null);
        }
    };

    const removeAsm = async (asm: Asm) => {
        const areaCount = (areasByAsm[asm.id] || []).length;
        if (!window.confirm(
            `Remove ${asm.name}?` +
            (areaCount ? `\n\nTheir ${areaCount} area${areaCount > 1 ? "s" : ""} will become unassigned — enquiries from ${areaCount > 1 ? "them" : "it"} will queue as unmatched until someone else covers ${areaCount > 1 ? "them" : "it"}.` : "")
        )) return;

        setBusyId(asm.id);
        try {
            await api.delete(`/asm/${asm.id}`);
            toast({ title: "ASM removed" });
            fetchAll(true);
        } catch (error: any) {
            toast({ title: "Could not remove", description: getErrorMessage(error, ""), variant: "destructive" });
        } finally {
            setBusyId(null);
        }
    };

    const addArea = async (label: string) => {
        if (!areaTarget || !label.trim()) return;
        setAddingArea(true);
        try {
            const known = knownAreas.find(k => k.label.toLowerCase() === label.trim().toLowerCase());
            await api.post("/asm/areas", {
                asm_id: areaTarget.id,
                area_label: label.trim(),
                state: known?.state || null,
            });
            toast({ title: `${label.trim()} assigned to ${areaTarget.name}` });
            setAreaInput("");
            fetchAll(true);
        } catch (error: any) {
            // The API names the ASM already covering it — far more useful than
            // "duplicate entry".
            toast({
                title: "Could not assign",
                description: getErrorMessage(error, "Please try again"),
                variant: "destructive",
            });
        } finally {
            setAddingArea(false);
        }
    };

    const removeArea = async (area: Area) => {
        try {
            await api.delete(`/asm/areas/${area.id}`);
            toast({ title: `${area.area_label} unassigned` });
            fetchAll(true);
        } catch (error: any) {
            toast({ title: "Could not remove", description: getErrorMessage(error, ""), variant: "destructive" });
        }
    };

    /** Suggestions: known cities, minus anything already covered. */
    const suggestions = useMemo(() => {
        const q = areaInput.trim().toLowerCase();
        const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "");
        return knownAreas
            .filter(k => !takenKeys.has(norm(k.label)))
            .filter(k => !q || k.label.toLowerCase().includes(q))
            .slice(0, 8);
    }, [knownAreas, areaInput, takenKeys]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px] gap-3 text-slate-400">
                <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
                <span className="text-sm font-medium">Loading ASMs…</span>
            </div>
        );
    }

    const unassignedCount = knownAreas.filter(k =>
        !takenKeys.has(k.label.toLowerCase().replace(/[^a-z0-9]+/g, ""))
    ).length;

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h2 className="text-2xl font-black tracking-tight text-slate-800 uppercase">Lead Management</h2>
                    <p className="text-sm text-slate-500 mt-1">
                        ASMs and the areas they cover. An enquiry is forwarded to whoever owns its area.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => fetchAll(true)} disabled={refreshing}>
                        <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                    </Button>
                    <Button size="sm" onClick={openAdd} className="bg-orange-500 hover:bg-orange-600">
                        <Plus className="h-4 w-4 mr-1.5" /> Add ASM
                    </Button>
                </div>
            </div>

            {/* Coverage at a glance — an area nobody covers is the thing that
                silently loses enquiries, so it leads. */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { label: "ASMs", value: asms.length, tone: "text-slate-800" },
                    { label: "Active", value: asms.filter(a => a.is_active).length, tone: "text-emerald-600" },
                    { label: "Areas covered", value: areas.length, tone: "text-blue-600" },
                    { label: "Cities uncovered", value: unassignedCount, tone: unassignedCount ? "text-amber-600" : "text-slate-400" },
                ].map(s => (
                    <div key={s.label} className="rounded-2xl border border-slate-100 bg-white p-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{s.label}</p>
                        <p className={`text-2xl font-black tabular-nums mt-0.5 ${s.tone}`}>{s.value}</p>
                    </div>
                ))}
            </div>

            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search by name, number or area…"
                    className="pl-9 h-10 rounded-xl"
                />
            </div>

            {visible.length === 0 ? (
                <div className="rounded-[28px] border border-dashed border-orange-200 bg-white/40 p-12 text-center">
                    <div className="h-16 w-16 bg-orange-50 rounded-3xl flex items-center justify-center mx-auto mb-5 border border-orange-100">
                        <UserRound className="h-7 w-7 text-orange-500 opacity-80" />
                    </div>
                    <h3 className="text-lg font-black tracking-tight text-slate-800 uppercase mb-2">
                        {search ? "No ASM matches that" : "No ASMs yet"}
                    </h3>
                    <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                        {search
                            ? "Try a different name, number or area."
                            : "Add an ASM and assign the areas they cover. Enquiries from those areas will then reach them on WhatsApp."}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {visible.map(asm => {
                        const myAreas = areasByAsm[asm.id] || [];
                        return (
                            <Card key={asm.id} className="rounded-3xl border-slate-100 overflow-hidden">
                                <CardContent className="p-5">
                                    <div className="flex flex-wrap items-start justify-between gap-4">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="font-black text-slate-800">{asm.name}</p>
                                                {!asm.is_active && (
                                                    <Badge variant="outline" className="text-[10px] font-black uppercase bg-slate-100 text-slate-500">
                                                        Inactive
                                                    </Badge>
                                                )}
                                                {myAreas.length === 0 && (
                                                    <Badge variant="outline" className="text-[10px] font-black uppercase bg-amber-50 text-amber-700 border-amber-200">
                                                        No areas
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-500">
                                                <span className="flex items-center gap-1 font-mono">
                                                    <Phone className="h-3 w-3" /> {asm.phone_number}
                                                </span>
                                                {asm.email && <span>{asm.email}</span>}
                                                <span>·</span>
                                                <span className="tabular-nums">{asm.lead_count} enquir{asm.lead_count === 1 ? "y" : "ies"}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <Button
                                                size="sm" variant="outline"
                                                className="h-8 text-xs"
                                                onClick={() => { setAreaTarget(asm); setAreaInput(""); }}
                                            >
                                                <MapPin className="h-3.5 w-3.5 mr-1" /> Areas
                                            </Button>
                                            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => openEdit(asm)}>
                                                Edit
                                            </Button>
                                            <Button
                                                size="sm" variant="outline"
                                                className="h-8 w-8 p-0"
                                                title={asm.is_active ? "Deactivate" : "Activate"}
                                                disabled={busyId === asm.id}
                                                onClick={() => toggleActive(asm)}
                                            >
                                                {busyId === asm.id
                                                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                    : <Power className={`h-3.5 w-3.5 ${asm.is_active ? "text-emerald-600" : "text-slate-400"}`} />}
                                            </Button>
                                            <Button
                                                size="sm" variant="outline"
                                                className="h-8 w-8 p-0 text-rose-600 border-rose-200 hover:bg-rose-50"
                                                title="Remove"
                                                disabled={busyId === asm.id}
                                                onClick={() => removeAsm(asm)}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>

                                    {myAreas.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-slate-100">
                                            {myAreas.map(area => (
                                                <span
                                                    key={area.id}
                                                    className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg pl-2.5 pr-1 py-1 text-xs font-semibold text-slate-700"
                                                >
                                                    {area.area_label}
                                                    <button
                                                        type="button"
                                                        onClick={() => removeArea(area)}
                                                        title={`Unassign ${area.area_label}`}
                                                        className="h-4 w-4 rounded grid place-items-center text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Add / edit ASM */}
            <Dialog open={asmDialogOpen} onOpenChange={setAsmDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editing ? "Edit ASM" : "Add ASM"}</DialogTitle>
                        <DialogDescription>
                            The WhatsApp number is where their enquiries will be sent, so it must be a number
                            that is actually on WhatsApp.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label htmlFor="asm-name">Name *</Label>
                            <Input
                                id="asm-name"
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                placeholder="Rahul Sharma"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="asm-phone">WhatsApp number *</Label>
                            <Input
                                id="asm-phone"
                                value={form.phone_number}
                                onChange={e => setForm({ ...form, phone_number: e.target.value.replace(/\D/g, "").slice(0, 12) })}
                                placeholder="9876543210"
                                className="font-mono"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="asm-email">Email <span className="text-slate-400 font-normal">(optional)</span></Label>
                            <Input
                                id="asm-email"
                                type="email"
                                value={form.email}
                                onChange={e => setForm({ ...form, email: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAsmDialogOpen(false)} disabled={saving}>Cancel</Button>
                        <Button onClick={saveAsm} disabled={saving} className="bg-orange-500 hover:bg-orange-600">
                            {saving && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                            {editing ? "Save changes" : "Add ASM"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Assign areas */}
            <Dialog open={!!areaTarget} onOpenChange={open => { if (!open) setAreaTarget(null); }}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Areas for {areaTarget?.name}</DialogTitle>
                        <DialogDescription>
                            One area belongs to one ASM. If an area is already covered, you will be told who has it.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="flex gap-2">
                            <Input
                                value={areaInput}
                                onChange={e => setAreaInput(e.target.value)}
                                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addArea(areaInput); } }}
                                placeholder="Type an area, or pick one below"
                            />
                            <Button
                                onClick={() => addArea(areaInput)}
                                disabled={addingArea || !areaInput.trim()}
                                className="bg-orange-500 hover:bg-orange-600 shrink-0"
                            >
                                {addingArea ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
                            </Button>
                        </div>

                        {suggestions.length > 0 && (
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                                    Cities we serve, not yet covered
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                    {suggestions.map(s => (
                                        <button
                                            key={s.label}
                                            type="button"
                                            onClick={() => addArea(s.label)}
                                            disabled={addingArea}
                                            className="text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200 rounded-lg px-2.5 py-1 hover:bg-orange-100 transition-colors"
                                        >
                                            + {s.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                                Currently covering ({(areasByAsm[areaTarget?.id || ""] || []).length})
                            </p>
                            {(areasByAsm[areaTarget?.id || ""] || []).length === 0 ? (
                                <p className="text-sm text-slate-400 italic flex items-center gap-1.5">
                                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                                    No areas yet — they will not receive any enquiries.
                                </p>
                            ) : (
                                <div className="flex flex-wrap gap-1.5">
                                    {(areasByAsm[areaTarget?.id || ""] || []).map(area => (
                                        <span
                                            key={area.id}
                                            className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg pl-2.5 pr-1 py-1 text-xs font-semibold text-slate-700"
                                        >
                                            {area.area_label}
                                            <button
                                                type="button"
                                                onClick={() => removeArea(area)}
                                                className="h-4 w-4 rounded grid place-items-center text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAreaTarget(null)}>Done</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
