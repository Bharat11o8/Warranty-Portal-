import { useState, useEffect, useMemo } from "react";
import api, { getErrorMessage } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Loader2, Search, Phone, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { AUDIT_QUESTIONS, AUDIT_SECTIONS, AUDIT_FLOW, type AuditFieldKey } from "@/lib/auditQuestions";

/**
 * Record an audit taken over the phone.
 *
 * Asks exactly what the WhatsApp Flow asks, from the shared definition, so both
 * channels produce comparable answers. The auditor is taken from the session on
 * the server — this form never sends it.
 */
interface AuditCallFormProps {
    open: boolean;
    onClose: () => void;
    onSaved: () => void;
}

interface StoreOption {
    id: string;
    store_name: string;
    store_code: string | null;
    city: string | null;
}

export const AuditCallForm = ({ open, onClose, onSaved }: AuditCallFormProps) => {
    const { toast } = useToast();
    const [stores, setStores] = useState<StoreOption[]>([]);
    const [storeSearch, setStoreSearch] = useState("");
    const [vendorId, setVendorId] = useState<string | null>(null);
    const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!open) return;
        setVendorId(null);
        setAnswers({});
        setStoreSearch("");
        api.get("/admin/vendors")
            .then(res => {
                const list = res.data.vendors || res.data.data || [];
                setStores(list.map((v: any) => ({
                    id: v.id ?? v.vendor_details_id,
                    store_name: v.store_name,
                    store_code: v.store_code,
                    city: v.city,
                })).filter((v: StoreOption) => v.id && v.store_name));
            })
            .catch(() => toast({
                title: "Could not load stores",
                description: "Try reopening the form.",
                variant: "destructive",
            }));
    }, [open]);

    const filteredStores = useMemo(() => {
        const q = storeSearch.trim().toLowerCase();
        if (!q) return stores.slice(0, 40);
        return stores.filter(s =>
            s.store_name.toLowerCase().includes(q) ||
            (s.store_code || "").toLowerCase().includes(q) ||
            (s.city || "").toLowerCase().includes(q)
        ).slice(0, 40);
    }, [stores, storeSearch]);

    const selectedStore = stores.find(s => s.id === vendorId) || null;

    const setAnswer = (key: AuditFieldKey, value: string | string[]) =>
        setAnswers(prev => ({ ...prev, [key]: value }));

    const toggleMulti = (key: AuditFieldKey, optionId: string) => {
        const current = (answers[key] as string[]) || [];
        setAnswer(key, current.includes(optionId)
            ? current.filter(o => o !== optionId)
            : [...current, optionId]);
    };

    /** Conditional fields appear only once their trigger answer is given. */
    const isVisible = (q: typeof AUDIT_QUESTIONS[number]) => {
        if (!q.showWhen) return true;
        const trigger = answers[q.showWhen.key];
        return Array.isArray(trigger)
            ? trigger.includes(q.showWhen.equals)
            : trigger === q.showWhen.equals;
    };

    const visibleQuestions = AUDIT_QUESTIONS.filter(isVisible);
    const answeredCount = visibleQuestions.filter(q => {
        const v = answers[q.key];
        return Array.isArray(v) ? v.length > 0 : Boolean(v && String(v).trim());
    }).length;

    const handleSave = async () => {
        if (!vendorId) return;
        setSaving(true);
        try {
            await api.post("/admin/audits/call", { vendorDetailsId: vendorId, ...answers });
            toast({
                title: "Call audit saved",
                description: `${selectedStore?.store_name} — ${answeredCount} of ${visibleQuestions.length} answered.`,
            });
            onSaved();
            onClose();
        } catch (error: any) {
            toast({
                title: "Could not save",
                description: getErrorMessage(error, "Failed to record the audit"),
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
                <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100 shrink-0">
                    <DialogTitle className="text-base flex items-center gap-2">
                        <Phone className="h-4 w-4 text-orange-500" /> Record a call audit
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                        The same questions as <span className="font-mono">{AUDIT_FLOW.name}</span>,
                        saved against your account as the auditor.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-6">
                    {/* Which store */}
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">Store</p>
                        {selectedStore ? (
                            <div className="flex items-center justify-between p-3 rounded-xl border border-orange-200 bg-orange-50">
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-slate-800 truncate">{selectedStore.store_name}</p>
                                    <p className="text-[11px] text-slate-500">
                                        {[selectedStore.store_code, selectedStore.city].filter(Boolean).join(" · ")}
                                    </p>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => setVendorId(null)} className="text-xs shrink-0">
                                    Change
                                </Button>
                            </div>
                        ) : (
                            <>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                                    <Input
                                        autoFocus
                                        placeholder="Search store by name, code or city..."
                                        className="pl-9 h-9 text-sm"
                                        value={storeSearch}
                                        onChange={e => setStoreSearch(e.target.value)}
                                    />
                                </div>
                                <div className="mt-2 max-h-52 overflow-y-auto space-y-1">
                                    {filteredStores.map(s => (
                                        <button
                                            key={s.id}
                                            onClick={() => setVendorId(s.id)}
                                            className="w-full text-left p-2.5 rounded-lg border border-slate-100 hover:border-orange-200 hover:bg-orange-50/50 transition-colors"
                                        >
                                            <p className="text-sm font-semibold text-slate-700 truncate">{s.store_name}</p>
                                            <p className="text-[11px] text-slate-400">
                                                {[s.store_code, s.city].filter(Boolean).join(" · ")}
                                            </p>
                                        </button>
                                    ))}
                                    {filteredStores.length === 0 && (
                                        <p className="text-xs text-slate-400 text-center py-6">No store matches that search.</p>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Zone and ASM are carried by the Flow but held nowhere in the
                        portal, so a call audit collects them if the auditor knows. */}
                    {selectedStore && (
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
                                Territory <span className="font-medium normal-case tracking-normal">(optional)</span>
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                                <Input
                                    value={(answers["zone" as AuditFieldKey] as string) || ""}
                                    onChange={e => setAnswer("zone" as AuditFieldKey, e.target.value)}
                                    placeholder="Zone"
                                    className="h-9 text-sm"
                                />
                                <Input
                                    value={(answers["asm" as AuditFieldKey] as string) || ""}
                                    onChange={e => setAnswer("asm" as AuditFieldKey, e.target.value)}
                                    placeholder="ASM"
                                    className="h-9 text-sm"
                                />
                            </div>
                        </div>
                    )}

                    {/* Questions — only after a store is chosen, so an audit always has an owner */}
                    {selectedStore && AUDIT_SECTIONS.map(section => {
                        const qs = AUDIT_QUESTIONS.filter(q => q.section === section && isVisible(q));
                        if (qs.length === 0) return null;
                        return (
                            <div key={section}>
                                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-3">{section}</p>
                                <div className="space-y-5">
                                    {qs.map(q => (
                                        <div key={q.key}>
                                            <p className="text-sm font-semibold text-slate-800 mb-2">{q.question}</p>

                                            {q.type === "single" && (
                                                <div className="flex flex-wrap gap-2">
                                                    {q.options!.map(o => {
                                                        const active = answers[q.key] === o.id;
                                                        return (
                                                            <button
                                                                key={o.id}
                                                                onClick={() => setAnswer(q.key, active ? "" : o.id)}
                                                                className={cn(
                                                                    "px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors",
                                                                    active
                                                                        ? "border-orange-300 bg-orange-50 text-orange-700"
                                                                        : "border-slate-200 text-slate-600 hover:border-slate-300"
                                                                )}
                                                            >
                                                                {o.title}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            {q.type === "multi" && (
                                                <div className="grid grid-cols-2 gap-1.5">
                                                    {q.options!.map(o => {
                                                        const active = ((answers[q.key] as string[]) || []).includes(o.id);
                                                        return (
                                                            <label
                                                                key={o.id}
                                                                className={cn(
                                                                    "flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors text-xs",
                                                                    active
                                                                        ? "border-orange-200 bg-orange-50/60 text-slate-800"
                                                                        : "border-slate-100 text-slate-600 hover:bg-slate-50"
                                                                )}
                                                            >
                                                                <Checkbox
                                                                    checked={active}
                                                                    onCheckedChange={() => toggleMulti(q.key, o.id)}
                                                                />
                                                                <span className="font-medium leading-tight">{o.title}</span>
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            {q.type === "text" && (
                                                <Input
                                                    value={(answers[q.key] as string) || ""}
                                                    onChange={e => setAnswer(q.key, e.target.value)}
                                                    placeholder={q.placeholder}
                                                    className="h-9 text-sm"
                                                />
                                            )}

                                            {q.type === "longtext" && (
                                                <Textarea
                                                    value={(answers[q.key] as string) || ""}
                                                    onChange={e => setAnswer(q.key, e.target.value)}
                                                    placeholder={q.placeholder}
                                                    rows={3}
                                                    className="text-sm resize-none"
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <DialogFooter className="px-6 py-4 border-t border-slate-100 shrink-0 sm:justify-between">
                    <p className="text-[11px] text-slate-400 self-center">
                        {selectedStore
                            ? `${answeredCount} of ${visibleQuestions.length} answered`
                            : "Choose a store to begin"}
                    </p>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onClose} className="border-slate-200">Cancel</Button>
                        <Button
                            onClick={handleSave}
                            disabled={!vendorId || saving}
                            className="bg-orange-600 hover:bg-orange-700"
                        >
                            {saving
                                ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                                : <Check className="h-3.5 w-3.5 mr-1.5" />}
                            Save audit
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
