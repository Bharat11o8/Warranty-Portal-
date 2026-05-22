import { Package, Box } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LoadingOverlay, EmptyState, ExportButton, exportToExcel, SyncButton } from './Common';
import { cn } from '@/lib/utils';

interface ProductDistributionSectionProps {
    prodLoading: boolean;
    prodPeriod: string;
    setProdPeriod: (val: string) => void;
    prodYear: string;
    setProdYear: (val: string) => void;
    prodMonth: string;
    setProdMonth: (val: string) => void;
    prodStart: string;
    setProdStart: (val: string) => void;
    prodEnd: string;
    setProdEnd: (val: string) => void;
    products: any[];
    years: string[];
    months: string[];
    onSync: () => void;
    isSyncing?: boolean;
}

const PRODUCT_COLORS = [
    'linear-gradient(90deg, #6366f1 0%, #a855f7 100%)', // Indigo to Purple
    'linear-gradient(90deg, #0ea5e9 0%, #22d3ee 100%)', // Sky to Cyan
    'linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)', // Amber
    'linear-gradient(90deg, #10b981 0%, #34d399 100%)', // Emerald
    'linear-gradient(90deg, #f43f5e 0%, #fb7185 100%)', // Rose
    'linear-gradient(90deg, #8b5cf6 0%, #c084fc 100%)', // Violet
];

export const ProductDistributionSection = ({
    prodLoading,
    prodPeriod, setProdPeriod,
    prodYear, setProdYear,
    prodMonth, setProdMonth,
    prodStart, setProdStart,
    prodEnd, setProdEnd,
    products,
    years,
    months,
    onSync,
    isSyncing
}: ProductDistributionSectionProps) => {
    return (
        <Card className="rounded-[40px] border-none bg-white shadow-[0_20px_50px_rgba(0,0,0,0.04)] overflow-hidden relative group">
            {prodLoading && <LoadingOverlay />}
            <CardHeader className="p-8 space-y-6 border-b border-slate-50 relative z-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-4">
                            <div className="h-14 w-14 rounded-[22px] bg-indigo-50 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500">
                                <Package className="h-7 w-7 text-indigo-600" />
                            </div>
                            <div>
                                <CardTitle className="text-3xl font-black text-slate-800 uppercase tracking-tighter">
                                    Product Velocity
                                </CardTitle>
                                <CardDescription className="text-indigo-600/60 text-[11px] font-bold uppercase tracking-[0.2em]">Inventory performance & market demand</CardDescription>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-[22px] border border-slate-200/50 w-fit self-end md:self-auto shadow-sm">
                        {['all', 'year', 'month', 'week', 'custom'].map((p) => (
                            <button
                                key={p}
                                onClick={() => setProdPeriod(p)}
                                className={cn(
                                    "px-6 py-2 rounded-[18px] text-[10px] font-black uppercase tracking-[0.1em] transition-all duration-300",
                                    prodPeriod === p
                                        ? "bg-white text-slate-900 shadow-md border border-slate-200/20"
                                        : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 pt-2">
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Temporal Filter:</span>
                        <div className="flex items-center gap-2">
                            {prodPeriod === 'custom' ? (
                                <div className="flex items-center gap-2 bg-white p-1 rounded-2xl border border-slate-100 shadow-sm">
                                    <input
                                        type="date"
                                        value={prodStart}
                                        onChange={(e) => setProdStart(e.target.value)}
                                        className="bg-transparent px-3 py-1.5 text-[11px] font-black text-slate-700 outline-none cursor-pointer"
                                    />
                                    <div className="h-4 w-px bg-slate-200" />
                                    <input
                                        type="date"
                                        value={prodEnd}
                                        onChange={(e) => setProdEnd(e.target.value)}
                                        className="bg-transparent px-3 py-1.5 text-[11px] font-black text-slate-700 outline-none cursor-pointer"
                                    />
                                </div>
                            ) : (prodPeriod === 'year' || prodPeriod === 'month') ? (
                                <div className="flex items-center gap-2">
                                    <select
                                        value={prodYear}
                                        onChange={(e) => setProdYear(e.target.value)}
                                        className="bg-white border border-slate-200 rounded-[16px] px-4 py-2 text-[11px] font-black text-slate-700 outline-none hover:border-indigo-300 transition-all shadow-sm cursor-pointer min-w-[100px] appearance-none"
                                    >
                                        {years.map(y => <option key={y} value={y}>{y} Series</option>)}
                                    </select>

                                    {prodPeriod === 'month' && (
                                        <select
                                            value={prodMonth}
                                            onChange={(e) => setProdMonth(e.target.value)}
                                            className="bg-white border border-slate-200 rounded-[16px] px-4 py-2 text-[11px] font-black text-slate-700 outline-none hover:border-indigo-300 transition-all shadow-sm cursor-pointer min-w-[120px] appearance-none"
                                        >
                                            {months.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                                        </select>
                                    )}
                                </div>
                            ) : (
                                <div className="px-5 py-2.5 bg-slate-50 border border-slate-100 rounded-[20px] text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                                    {prodPeriod === 'all' ? 'Universal History' : 'Rolling 7-Day Window'}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="px-5 py-2.5 bg-indigo-900 rounded-[22px] shadow-xl shadow-indigo-100 flex items-center gap-4 border border-indigo-800">
                        <div className="flex -space-x-2">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-6 w-6 rounded-full border-2 border-indigo-900 bg-indigo-500/20 flex items-center justify-center">
                                    <Box className="h-3 w-3 text-indigo-200" />
                                </div>
                            ))}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[8px] font-black text-indigo-300 uppercase tracking-[0.2em] leading-none mb-1">Stock Portfolio</span>
                            <span className="text-sm font-black text-white leading-none">{products?.length || 0} <span className="opacity-40 text-[10px]">SKUs</span></span>
                        </div>
                    </div>

                    <SyncButton 
                        onClick={onSync}
                        loading={isSyncing}
                    />

                    <ExportButton 
                        onClick={() => exportToExcel(
                            products || [], 
                            `Product_Velocity_${prodPeriod}_${new Date().toISOString().split('T')[0]}`
                        )} 
                    />
                </div>
            </CardHeader>
            <CardContent className="p-0 relative min-h-[400px]">
                {!products || products.length === 0 ? (
                    <div className="px-8 py-20">
                        <EmptyState message="No sales trajectory detected" />
                    </div>
                ) : (
                    <div className="max-h-[600px] overflow-y-auto px-8 py-10 custom-scrollbar space-y-12">
                        <div className="space-y-6">
                            {products.map((product: any, index: number) => {
                                const maxCount = Math.max(...products.map((p: any) => p.count)) || 1;
                                const percentage = (product.count / maxCount) * 100;
                                const colorIndex = index % PRODUCT_COLORS.length;

                                return (
                                    <div
                                        key={index}
                                        className="group/item relative"
                                    >
                                        <div className="flex items-center justify-between mb-3 px-1">
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center font-black text-slate-300 text-sm group-hover/item:bg-slate-900 group-hover/item:text-white transition-all duration-500 shadow-sm border border-slate-100">
                                                    {String(index + 1).padStart(2, '0')}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-slate-800 uppercase tracking-tight group-hover/item:text-indigo-600 transition-colors">{product.product_name}</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-xl font-black text-slate-900">{product.count}</span>
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Registrations</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="relative h-4 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100 shadow-inner group-hover/item:shadow-md transition-all duration-500">
                                            <div
                                                className="absolute top-0 left-0 h-full rounded-full transition-all duration-1500 ease-out flex items-center justify-end pr-4 shadow-[0_0_15px_rgba(0,0,0,0.1)]"
                                                style={{ 
                                                    width: `${percentage}%`,
                                                    background: PRODUCT_COLORS[colorIndex]
                                                }}
                                            >
                                                {percentage > 15 && <div className="h-1 w-1 rounded-full bg-white/50 animate-ping" />}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
