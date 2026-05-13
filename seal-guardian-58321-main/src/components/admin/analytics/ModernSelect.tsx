import { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export const ModernSelect = ({ value, onChange, options, label }: { value: string, onChange: (val: string) => void, options: { value: string, label: string }[], label?: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(o => o.value === value) || options[0];

    return (
        <div className="relative" ref={containerRef}>
            <div className="flex items-center gap-2">
                {label && <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}:</span>}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="bg-white border border-slate-200 text-slate-700 text-[11px] font-black uppercase tracking-wider rounded-xl px-4 py-2 flex items-center gap-3 hover:border-slate-300 hover:shadow-sm transition-all outline-none min-w-[140px] justify-between"
                >
                    <span className="truncate">{selectedOption.label}</span>
                    <ChevronDown className={cn("h-3.5 w-3.5 text-slate-400 transition-transform duration-300 shrink-0", isOpen && "rotate-180")} />
                </button>
            </div>

            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-full min-w-[200px] bg-white/80 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden z-[110] animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-1.5 max-h-[300px] overflow-y-auto custom-scrollbar">
                        {options.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => {
                                    onChange(opt.value);
                                    setIsOpen(false);
                                }}
                                className={cn(
                                    "w-full text-left px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-between group",
                                    value === opt.value
                                        ? "bg-slate-900 text-white"
                                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                )}
                            >
                                <span className="truncate">{opt.label}</span>
                                {value === opt.value && <div className="h-1 w-1 rounded-full bg-white animate-pulse" />}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
