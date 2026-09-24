import { useEffect, useState } from "react";
import api, { getErrorMessage } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Loader2, Minus, Plus, MapPin, Phone, Search, Store as StoreIcon,
    UserRound, Truck, Headset, MessageCircle,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";

/**
 * The rules deciding what a customer is offered from their pincode.
 *
 *   stores within 15 km           → a list, the customer picks one
 *   else the ASM for the state    → one person, who gets the lead
 *   else the state's distributors → a list, the customer picks one
 *   else customer support         → one number
 *
 * The minimum-warranties threshold lives here so the team can tighten or
 * loosen it without a release, as does the customer support number that ends
 * the chain. The preview runs the same lookup a customer would, so a change can
 * be checked on a real pincode before anyone relies on it.
 */

interface Settings {
    min_warranties: number;
    support_phone: string;
    support_name: string;
    whatsapp_live: boolean;
    test_numbers: string[];
}

/** "98765 43210, +91 91234-56789" → ["9876543210", "9123456789"]; bad entries kept to flag. */
const parseNumbers = (text: string) =>
    text.split(/[\s,;]+/).map(s => s.trim()).filter(Boolean);
const tenDigits = (s: string) => s.replace(/\D/g, "").slice(-10);

interface OfferedStore {
    id: string;
    store_name: string;
    city: string | null;
    phone: string | null;
    warranties: number;
    distance_label: string;
}

interface Contact {
    id: string | null;
    name: string;
    phone: string | null;
    city?: string | null;
    distance_label?: string | null;
}

interface PreviewResult {
    pincode: string;
    found: boolean;
    customer: { district: string | null; state: string | null } | null;
    rules: { radius_km: number; min_warranties: number };
    stores: OfferedStore[];
    fallback: { kind: "asm" | "distributor" | "support"; contacts: Contact[] } | null;
    reason?: string;
}

const MAX = 1000;

/** How each step of the chain is named, and what it means for the lead. */
const STEP = {
    asm: {
        label: "ASM", icon: UserRound,
        says: "No store within reach, so the lead goes to the ASM for this state.",
    },
    distributor: {
        label: "Distributors", icon: Truck,
        says: "No store and no ASM, so the customer picks a distributor in their state. The lead goes to the one they pick.",
    },
    support: {
        label: "Customer Support", icon: Headset,
        says: "No store, ASM or distributor in this state, so the lead goes to customer support.",
    },
} as const;

/** One step of the chain, drawn the same way in the explainer and the preview. */
const ChainStep = ({ n, title, detail }: { n: number; title: string; detail: string }) => (
    <li className="flex gap-2.5">
        <span className="h-5 w-5 rounded-full bg-slate-100 text-[10px] font-black text-slate-500 grid place-items-center shrink-0 mt-0.5">
            {n}
        </span>
        <div className="min-w-0">
            <p className="text-xs font-bold text-slate-700">{title}</p>
            <p className="text-[11px] text-slate-400 leading-snug">{detail}</p>
        </div>
    </li>
);

const ContactRow = ({ c }: { c: Contact }) => (
    <div className="px-3.5 py-2.5 flex items-start gap-3 min-w-0">
        <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-slate-800 truncate">{c.name}</p>
            <p className="text-[11px] text-slate-400 truncate">{c.city || ""}</p>
        </div>
        <div className="text-right shrink-0">
            <p className="text-xs font-semibold text-slate-700 inline-flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {c.phone || <span className="text-amber-700">no number set</span>}
            </p>
            {c.distance_label && <p className="text-[10px] text-slate-400">{c.distance_label} away</p>}
        </div>
    </div>
);

export const AdminStoreLocator = () => {
    const { toast } = useToast();

    const [saved, setSaved] = useState<Settings | null>(null);
    const [form, setForm] = useState<Settings>({
        min_warranties: 1, support_phone: "", support_name: "", whatsapp_live: false, test_numbers: [],
    });
    // Typed freely, turned into test_numbers on save.
    const [testText, setTestText] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [pincode, setPincode] = useState("");
    const [preview, setPreview] = useState<PreviewResult | null>(null);
    const [previewing, setPreviewing] = useState(false);

    const load = (s: Settings) => {
        setSaved(s);
        setForm(s);
        setTestText((s.test_numbers || []).join(", "));
    };

    useEffect(() => {
        api.get("/asm/locator-settings")
            .then(res => {
                if (res.data?.success) load(res.data.settings);
            })
            .catch(() => toast({ title: "Could not load the locator settings", variant: "destructive" }))
            .finally(() => setLoading(false));
    }, []);

    const typedNumbers = parseNumbers(testText);
    const badNumbers = typedNumbers.filter(n => tenDigits(n).length !== 10);
    const testNumbers = [...new Set(typedNumbers.map(tenDigits).filter(n => n.length === 10))];

    const dirty = saved !== null && (
        saved.min_warranties !== form.min_warranties
        || saved.support_phone !== form.support_phone
        || saved.support_name !== form.support_name
        || saved.whatsapp_live !== form.whatsapp_live
        || (saved.test_numbers || []).join(",") !== testNumbers.join(",")
    );

    const phoneDigits = form.support_phone.replace(/\D/g, "");
    const phoneError = phoneDigits && (phoneDigits.length < 10 || phoneDigits.length > 12)
        ? "10 to 12 digits" : "";

    const step = (delta: number) =>
        setForm(f => ({ ...f, min_warranties: Math.min(MAX, Math.max(0, f.min_warranties + delta)) }));

    const runPreview = async (pin = pincode) => {
        const p = pin.trim();
        if (!/^[1-9][0-9]{5}$/.test(p)) return;
        setPreviewing(true);
        try {
            const res = await api.get("/asm/stores-near", { params: { pincode: p } });
            if (res.data?.success) setPreview(res.data);
        } catch (error: any) {
            toast({ title: "Could not run the lookup", description: getErrorMessage(error, "Please try again"), variant: "destructive" });
        } finally {
            setPreviewing(false);
        }
    };

    const save = async () => {
        // Going live messages every customer who reaches the workflow.
        if (form.whatsapp_live && !saved?.whatsapp_live
            && !window.confirm("Turn on WhatsApp replies for every customer? Store lists will start going out to real customers, and ASMs will be messaged.")) {
            return;
        }
        setSaving(true);
        try {
            const res = await api.put("/asm/locator-settings", { ...form, test_numbers: testNumbers });
            if (res.data?.success) {
                load(res.data.settings);
                toast({ title: "Store locator updated" });
                // A preview on screen was worked out under the old rules.
                if (preview) runPreview(preview.pincode);
            }
        } catch (error: any) {
            toast({ title: "Could not save", description: getErrorMessage(error, "Please try again"), variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center gap-2 text-sm text-slate-400 py-10 justify-center">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
        );
    }

    return (
        <div className="grid lg:grid-cols-5 gap-5 items-start">
            {/* ── The rules ── */}
            <Card className="lg:col-span-2 rounded-2xl border-slate-200">
                <CardContent className="p-5 space-y-5">
                    <div className="space-y-2.5">
                        <h3 className="text-sm font-black text-slate-800">What a customer is offered</h3>
                        <ol className="space-y-2.5">
                            <ChainStep n={1} title="Stores within 15 km"
                                detail="Alphabetical, with at least the warranties set below. The customer picks one." />
                            <ChainStep n={2} title="Else the ASM"
                                detail="The ASM covering the customer's state gets the lead." />
                            <ChainStep n={3} title="Else the distributors"
                                detail="Every active distributor in the state, alphabetical. The customer picks one." />
                            <ChainStep n={4} title="Else customer support"
                                detail="The number set below." />
                        </ol>
                    </div>

                    <div className="border-t border-slate-100 pt-4 space-y-2">
                        <Label className="text-xs">Minimum approved warranties for a store</Label>
                        <div className="flex items-center gap-2">
                            <Button
                                type="button" variant="outline" size="icon" className="h-10 w-10 rounded-xl"
                                onClick={() => step(-1)} disabled={form.min_warranties <= 0}
                                aria-label="Decrease"
                            >
                                <Minus className="h-4 w-4" />
                            </Button>
                            <Input
                                inputMode="numeric"
                                value={String(form.min_warranties)}
                                onChange={e => {
                                    const n = parseInt(e.target.value.replace(/\D/g, "") || "0", 10);
                                    setForm(f => ({ ...f, min_warranties: Math.min(MAX, n) }));
                                }}
                                className="h-10 w-24 text-center text-lg font-black"
                            />
                            <Button
                                type="button" variant="outline" size="icon" className="h-10 w-10 rounded-xl"
                                onClick={() => step(1)} disabled={form.min_warranties >= MAX}
                                aria-label="Increase"
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-snug">
                            {form.min_warranties === 0
                                ? "Every store within 15 km is offered, including ones with no approved warranty yet."
                                : `A store needs ${form.min_warranties}+ approved warranties to be offered.`}
                        </p>
                    </div>

                    <div className="border-t border-slate-100 pt-4 space-y-3">
                        <h3 className="text-sm font-black text-slate-800">Customer support</h3>

                        <div className="space-y-1.5">
                            <Label className="text-xs">Name shown to the customer</Label>
                            <Input
                                value={form.support_name}
                                onChange={e => setForm(f => ({ ...f, support_name: e.target.value }))}
                                className="h-9"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs">Customer support number</Label>
                            <Input
                                inputMode="numeric"
                                value={form.support_phone}
                                onChange={e => setForm(f => ({ ...f, support_phone: e.target.value.replace(/\D/g, "").slice(0, 12) }))}
                                placeholder="e.g. 9876543210"
                                className={`h-9 ${phoneError ? "border-red-300" : ""}`}
                            />
                            {phoneError ? (
                                <p className="text-[11px] text-red-600">{phoneError}</p>
                            ) : !form.support_phone ? (
                                /* Allowed, but it is the one number a customer with no
                                   store, ASM or distributor would be given. */
                                <p className="text-[11px] text-amber-700 leading-snug">
                                    Not set — a customer with no store, ASM or distributor is given no number to call.
                                </p>
                            ) : null}
                        </div>
                    </div>

                    <div className="border-t border-slate-100 pt-4 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <h3 className="text-sm font-black text-slate-800 inline-flex items-center gap-1.5">
                                    <MessageCircle className="h-4 w-4 text-emerald-600" /> WhatsApp replies
                                </h3>
                                <p className={`text-[11px] leading-snug mt-0.5 ${form.whatsapp_live ? "text-emerald-700 font-semibold" : "text-slate-400"}`}>
                                    {form.whatsapp_live
                                        ? "Live — every customer who sends a pincode gets the store list."
                                        : "Testing — only the numbers below get replies. Everyone else's enquiry is saved as a lead, nothing is sent."}
                                </p>
                            </div>
                            <Switch
                                checked={form.whatsapp_live}
                                onCheckedChange={v => setForm(f => ({ ...f, whatsapp_live: v }))}
                                aria-label="WhatsApp replies live"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs">Test numbers</Label>
                            <Input
                                value={testText}
                                onChange={e => setTestText(e.target.value)}
                                placeholder="e.g. 9876543210, 9123456789"
                                className={`h-9 ${badNumbers.length ? "border-red-300" : ""}`}
                            />
                            {badNumbers.length ? (
                                <p className="text-[11px] text-red-600">Not a 10-digit mobile number: {badNumbers.join(", ")}</p>
                            ) : (
                                <p className="text-[11px] text-slate-400 leading-snug">
                                    These phones get real replies even while testing. ASMs are only ever messaged when live.
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                        {dirty && (
                            <Button variant="outline" onClick={() => saved && load(saved)} disabled={saving}>
                                Discard
                            </Button>
                        )}
                        <Button
                            onClick={save}
                            disabled={!dirty || saving || Boolean(phoneError) || badNumbers.length > 0}
                            className="bg-orange-500 hover:bg-orange-600"
                        >
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* ── What a customer would get ── */}
            <Card className="lg:col-span-3 rounded-2xl border-slate-200">
                <CardContent className="p-5 space-y-4">
                    <div>
                        <h3 className="text-sm font-black text-slate-800">Try a pincode</h3>
                        <p className="text-xs text-slate-500 mt-1">
                            Shows exactly what a customer from that pincode would be offered,
                            and who would get the lead. Nothing is sent.
                        </p>
                    </div>

                    <form className="flex gap-2" onSubmit={e => { e.preventDefault(); runPreview(); }}>
                        <Input
                            inputMode="numeric"
                            value={pincode}
                            onChange={e => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                            placeholder="e.g. 110085"
                            className="h-10 max-w-[180px] font-mono"
                        />
                        <Button type="submit" disabled={previewing || !/^[1-9][0-9]{5}$/.test(pincode)} className="h-10">
                            {previewing ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Search className="h-4 w-4 mr-1.5" /> Look up</>}
                        </Button>
                    </form>

                    {dirty && preview && (
                        <p className="text-[11px] text-amber-700">
                            Unsaved changes are not reflected here — save to preview them.
                        </p>
                    )}

                    {preview && (
                        <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                                <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                                    <MapPin className="h-3.5 w-3.5 text-orange-500" />
                                    {preview.pincode}
                                </span>
                                {preview.customer && (
                                    <span>{[preview.customer.district, preview.customer.state].filter(Boolean).join(", ")}</span>
                                )}
                                <span className="ml-auto text-[11px] text-slate-400">
                                    within {preview.rules.radius_km} km · {preview.rules.min_warranties}+ warranties
                                </span>
                            </div>

                            {preview.stores.length > 0 ? (
                                <>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700 inline-flex items-center gap-1.5">
                                        <StoreIcon className="h-3.5 w-3.5" />
                                        {preview.stores.length} store{preview.stores.length === 1 ? "" : "s"} — the customer picks one
                                    </p>
                                    <div className="rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
                                        {preview.stores.map(s => (
                                            <div key={s.id} className="px-3.5 py-2.5 flex items-start gap-3 min-w-0">
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-bold text-slate-800 truncate">{s.store_name}</p>
                                                    <p className="text-[11px] text-slate-400 truncate">
                                                        {[s.city, s.phone].filter(Boolean).join(" · ")}
                                                    </p>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p className="text-xs font-semibold text-slate-700">{s.distance_label}</p>
                                                    <p className="text-[10px] text-slate-400">{s.warranties} warranties</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : preview.fallback ? (() => {
                                const f = preview.fallback;
                                const meta = STEP[f.kind];
                                const Icon = meta.icon;
                                return (
                                    <div className="space-y-2">
                                        <p className="text-xs text-slate-500">{preview.reason}</p>
                                        <div className="rounded-xl border border-orange-200 bg-orange-50/40 overflow-hidden">
                                            <div className="px-3.5 py-2.5 border-b border-orange-100 bg-white/60">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-orange-700 inline-flex items-center gap-1.5">
                                                    <Icon className="h-3.5 w-3.5" />
                                                    {f.kind === "distributor"
                                                        ? `${f.contacts.length} distributor${f.contacts.length === 1 ? "" : "s"} — the customer picks one`
                                                        : `Lead goes to ${meta.label}`}
                                                </p>
                                                <p className="text-[11px] text-slate-500 mt-1 leading-snug">{meta.says}</p>
                                            </div>
                                            <div className="divide-y divide-orange-100 bg-white">
                                                {f.contacts.map((c, i) => <ContactRow key={c.id || i} c={c} />)}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })() : (
                                <p className="text-xs text-amber-700">{preview.reason}</p>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
