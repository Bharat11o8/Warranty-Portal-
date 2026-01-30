import { PackageSearch, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ComingSoonProps {
    title: string;
}

export const ComingSoon = ({ title }: ComingSoonProps) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[500px] text-center p-12 bg-white/40 backdrop-blur-md rounded-[40px] border border-dashed border-orange-200 shadow-[inset_0_2px_20px_rgba(244,102,23,0.03)] group overflow-hidden relative">
            {/* Background Polish */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-100/20 blur-[100px] -mr-32 -mt-32 rounded-full" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-100/20 blur-[100px] -ml-32 -mb-32 rounded-full" />

            <div className="h-28 w-28 bg-orange-50 rounded-[32px] flex items-center justify-center mb-8 relative border border-orange-100 overflow-hidden shadow-lg shadow-orange-500/5 group-hover:scale-105 transition-transform duration-500">
                <PackageSearch className="h-12 w-12 text-orange-500 opacity-80" />
                <div className="absolute inset-0 bg-orange-500/5 rounded-full animate-ping opacity-25" />
            </div>

            <h3 className="text-3xl font-black tracking-tight text-slate-800 uppercase mb-3">
                {title} <span className="text-orange-500">Coming Soon</span>
            </h3>
            <p className="text-slate-500 max-w-md mx-auto mb-10 leading-relaxed font-bold uppercase text-[10px] tracking-[0.2em] opacity-60">
                We are crafting a world-class experience for {title.toLowerCase()}. This module will be part of our next major update to streamline your operations.
            </p>
            <div className="flex gap-4">
                <Button variant="outline" className="rounded-2xl px-4 h-14 font-black uppercase tracking-widest text-xs border-orange-100 hover:bg-orange-50 text-slate-600 transition-all">
                    Notify Me
                </Button>
                <Button onClick={() => window.location.href = '/dashboard/vendor'} className="rounded-2xl px-4 h-14 font-black uppercase tracking-widest text-xs bg-orange-600 hover:bg-orange-700 text-white shadow-xl shadow-orange-500/20 group transition-all active:scale-95">
                    Explore Dashboard <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
            </div>
        </div>
    );
};
