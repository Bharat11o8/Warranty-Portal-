import { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Truck, Zap, Building2, ArrowRight, Armchair, ShieldCheck, X, Sparkles } from "lucide-react";

/**
 * Announcement telling franchises the Claim Process is now available.
 *
 * Leads with what changes for the store — claims go direct to the company, the
 * company pays the freight — rather than announcing that a feature exists. A
 * store owner does not care that a tab was added; they care that they no longer
 * chase a distributor and no longer pay courier on approved claims.
 *
 * Kept light throughout: a soft cream wash carries the header rather than a solid
 * block, each benefit gets its own pastel tile so the three read as separate, and
 * saturated orange is spent only on the action. A single flooded colour made
 * everything shout at once with nowhere for the eye to land.
 *
 * Shown on every page load and dismissed for the rest of that visit; nothing is
 * persisted, so a refresh brings it back. Deliberate while the feature is new.
 *
 * To stop showing it later, remove this component from FranchiseDashboard.
 */
const BENEFITS = [
    {
        icon: Building2,
        title: "Direct to the company",
        body: "No distributor coordination. Raise it straight with the AFAC Service Centre.",
        tile: "bg-violet-50 text-violet-600",
    },
    {
        icon: Truck,
        title: "We pay the freight",
        body: "Courier and freight on approved warranty and alteration claims are on us.",
        tile: "bg-emerald-50 text-emerald-600",
    },
    {
        icon: Zap,
        title: "Faster resolution",
        body: "Share photos and documents once, and material ships direct from the plant.",
        tile: "bg-blue-50 text-blue-600",
    },
];

interface ClaimProcessAnnouncementProps {
    /** Takes the franchise straight to the Claim Process tab. */
    onView: () => void;
}

export const ClaimProcessAnnouncement = ({ onView }: ClaimProcessAnnouncementProps) => {
    const [open, setOpen] = useState(true);

    const dismiss = () => setOpen(false);

    const handleView = () => {
        dismiss();
        onView();
    };

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) dismiss(); }}>
            {/* The stock close button collides with the header padding, so it is
                hidden and replaced with one placed against the wash. */}
            <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden rounded-[32px] border border-orange-100 [&>button]:hidden">

                {/* Header — a soft wash, not a solid block */}
                <div className="relative px-8 pt-8 pb-7 bg-gradient-to-br from-orange-50 via-white to-amber-50 overflow-hidden">
                    {/* Warm bloom bleeding from the corner keeps it from looking flat */}
                    <div className="absolute -top-24 -right-16 h-52 w-52 rounded-full bg-orange-100/60 blur-3xl" aria-hidden="true" />

                    <button
                        onClick={dismiss}
                        aria-label="Close"
                        className="absolute right-4 top-4 z-10 h-8 w-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-white transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>

                    <div className="relative">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-orange-100 text-orange-600 text-[10px] font-black uppercase tracking-widest">
                            <Sparkles className="h-3 w-3" /> New
                        </span>

                        <DialogTitle className="mt-4 text-[26px] font-black tracking-tighter leading-[1.15] text-slate-900">
                            Aaj se aapki complaint ka<br />
                            solution <span className="text-orange-600">company directly</span> karegi
                        </DialogTitle>

                        <DialogDescription className="mt-2.5 text-sm text-slate-500 leading-relaxed">
                            All warranty and alteration claims are now handled directly by the
                            AFAC Service Centre.
                        </DialogDescription>
                    </div>
                </div>

                {/* What actually changes for the store */}
                <div className="px-8 py-7 space-y-5 bg-white">
                    {BENEFITS.map(b => (
                        <div key={b.title} className="flex gap-4">
                            <span className={`shrink-0 flex items-center justify-center h-10 w-10 rounded-2xl ${b.tile}`}>
                                <b.icon className="h-[18px] w-[18px]" />
                            </span>
                            <div className="min-w-0 pt-0.5">
                                <p className="text-sm font-bold text-slate-900 leading-tight">{b.title}</p>
                                <p className="text-xs text-slate-500 leading-relaxed mt-1">{b.body}</p>
                            </div>
                        </div>
                    ))}

                    <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Covers</span>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-50 text-[11px] font-bold text-orange-700">
                            <Armchair className="h-3 w-3" /> SAM
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-[11px] font-bold text-blue-700">
                            <ShieldCheck className="h-3 w-3" /> EV Products
                        </span>
                    </div>
                </div>

                {/* The one action — the only saturated colour on the panel */}
                <div className="px-8 pb-8 bg-white">
                    <Button
                        onClick={handleView}
                        className="group w-full h-12 bg-orange-600 hover:bg-orange-700 text-sm font-black rounded-2xl shadow-lg shadow-orange-600/20"
                    >
                        See the claim process
                        <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                    <button
                        onClick={dismiss}
                        className="w-full mt-3 text-[11px] font-bold text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        Maybe later
                    </button>
                    <p className="mt-2 text-center text-[10px] text-slate-400">
                        Always available under <span className="font-bold text-slate-500">Support &rsaquo; Claim Process</span>
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
};
