import { X, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface FraudAnalysisModalProps {
    selectedFranchise: string | null;
    onClose: () => void;
    drilldownLoading: boolean;
    drilldownData: any;
}

export const FraudAnalysisModal = ({ 
    selectedFranchise, 
    onClose, 
    drilldownLoading, 
    drilldownData 
}: FraudAnalysisModalProps) => {
    if (!selectedFranchise) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-md">
            <div className="bg-white rounded-[40px] w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-white/20 animate-in fade-in zoom-in duration-300">
                {/* Modal Header */}
                <div className="p-8 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">{selectedFranchise}</h2>
                        <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mt-1">Detailed Fraud Intelligence Profile</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="h-12 w-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors shadow-sm"
                    >
                        <X className="h-6 w-6 text-slate-400" />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                    {drilldownLoading ? (
                        <div className="space-y-8 animate-pulse">
                            <div className="grid grid-cols-4 gap-4">
                                {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-slate-50 rounded-3xl" />)}
                            </div>
                            <div className="h-64 bg-slate-50 rounded-[40px]" />
                        </div>
                    ) : drilldownData ? (
                        <>
                            {/* Stats Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-white border border-slate-100 p-6 rounded-[32px] shadow-sm">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Avg Trust Score</p>
                                    <p className={cn(
                                        "text-3xl font-black tracking-tighter",
                                        drilldownData.stats.avg_score < 40 ? "text-red-600" : drilldownData.stats.avg_score >= 80 ? "text-emerald-600" : "text-amber-500"
                                    )}>{drilldownData.stats.avg_score}</p>
                                </div>
                                <div className="bg-white border border-slate-100 p-6 rounded-[32px] shadow-sm">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Audited</p>
                                    <p className="text-3xl font-black tracking-tighter text-slate-800">{drilldownData.stats.total}</p>
                                </div>
                                <div className="bg-white border border-slate-100 p-6 rounded-[32px] shadow-sm">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Risky Subs</p>
                                    <p className="text-3xl font-black tracking-tighter text-red-600">{drilldownData.stats.high_risk_count}</p>
                                </div>
                                <div className="bg-white border border-slate-100 p-6 rounded-[32px] shadow-sm">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Clean Subs</p>
                                    <p className="text-3xl font-black tracking-tighter text-emerald-600">{drilldownData.stats.low_risk_count}</p>
                                </div>
                            </div>

                            {/* Penalty & Distribution Section */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                {/* Penalty Breakdown */}
                                <div className="space-y-6">
                                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 border-b pb-4">Cumulative Penalty Points</h3>
                                    <div className="space-y-5">
                                        {Object.entries(drilldownData.penalty_totals).map(([key, value]: any) => (
                                            <div key={key} className="space-y-2">
                                                <div className="flex justify-between items-center px-1">
                                                    <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight">{key.toUpperCase()} PENALTY</span>
                                                    <span className="text-[11px] font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-lg">{value} pts</span>
                                                </div>
                                                <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                                                    <div
                                                        className={cn(
                                                            "h-full rounded-full transition-all duration-1000",
                                                            key === 'ip' ? "bg-red-500" : key === 'distance' ? "bg-amber-500" : "bg-blue-500"
                                                        )}
                                                        style={{ width: `${Math.min(100, (value / (drilldownData.stats.total * 100)) * 100 * 5)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Score Distribution Histogram */}
                                <div className="space-y-6">
                                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 border-b pb-4">Trust Score Histogram</h3>
                                    <div className="h-48 flex items-end justify-between px-2 bg-slate-50/50 rounded-2xl relative pt-10">
                                        {/* Background Grid Lines */}
                                        {[0, 25, 50, 75, 100].map(p => (
                                            <div key={p} className="absolute left-0 right-0 border-t border-slate-200/40 pointer-events-none" style={{ bottom: `${p}%` }} />
                                        ))}

                                        {/* Histogram Bars */}
                                        {Array.from({ length: 11 }).map((_, i) => {
                                            const bucketStart = i * 10;
                                            const h = drilldownData.histogram.find((hist: any) => hist.bucket === bucketStart);
                                            const count = h ? h.count : 0;
                                            const heightPct = (count / drilldownData.stats.total) * 100;

                                            return (
                                                <div key={bucketStart} className="flex-1 flex flex-col items-center group h-full justify-end px-0.5">
                                                    <div
                                                        className={cn(
                                                            "w-full rounded-t-lg transition-all duration-500 group-hover:brightness-90 relative",
                                                            bucketStart < 40 ? "bg-gradient-to-t from-red-600 to-red-400" : bucketStart >= 80 ? "bg-gradient-to-t from-emerald-600 to-emerald-400" : "bg-gradient-to-t from-amber-500 to-amber-300"
                                                        )}
                                                        style={{ height: count > 0 ? `${Math.max(8, heightPct)}%` : '0%' }}
                                                    >
                                                        {count > 0 && (
                                                            <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] px-1.5 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity font-black z-10">
                                                                {count}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="flex justify-between px-1 text-[9px] font-black text-slate-400 uppercase tracking-widest pt-2">
                                        <span>0 (Risky)</span>
                                        <span>50 (Avg)</span>
                                        <span>100 (Clean)</span>
                                    </div>
                                </div>
                            </div>

                            {/* Evidence Log */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between border-b pb-4">
                                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Complete Audit Trail ({drilldownData.recent_submissions.length})</h3>
                                    <span className="text-[9px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border italic">Scroll to view history ↓</span>
                                </div>
                                <div className="space-y-2 pr-2" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                                    {drilldownData.recent_submissions.map((s: any) => (
                                        <div key={s.id} className="bg-white border border-slate-100 p-4 rounded-2xl flex items-center justify-between hover:border-slate-300 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "h-10 w-10 rounded-xl flex items-center justify-center text-[11px] font-black border",
                                                    s.fraud_score < 40 ? "bg-red-50 text-red-600 border-red-100" : s.fraud_score >= 80 ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-500 border-amber-100"
                                                )}>
                                                    {s.fraud_score}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-800">{s.customer_name}</p>
                                                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                                                        <Clock className="h-3 w-3" />
                                                        {new Date(s.created_at).toLocaleDateString()}
                                                        <span className="h-1 w-1 rounded-full bg-slate-300" />
                                                        <span className={cn(
                                                            "px-1.5 py-0.5 rounded-md text-[8px]",
                                                            s.status === 'approved' ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"
                                                        )}>{s.status.toUpperCase()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-1 shrink-0">
                                                {s.fraud_flags.ip_penalty > 0 && <Badge className="bg-red-50 text-red-600 border-red-100 text-[8px] uppercase px-1">IP</Badge>}
                                                {s.fraud_flags.distance_penalty > 0 && <Badge className="bg-amber-50 text-amber-600 border-amber-100 text-[8px] uppercase px-1">Dist</Badge>}
                                                {s.fraud_flags.time_penalty > 0 && <Badge className="bg-blue-50 text-blue-600 border-blue-100 text-[8px] uppercase px-1">Time</Badge>}
                                                {s.fraud_flags.is_missing_data && <Badge className="bg-slate-100 text-slate-500 border-slate-200 text-[8px] uppercase px-1">No GPS</Badge>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-20 text-slate-400 font-bold">No drilldown data available</div>
                    )}
                </div>
            </div>
        </div>
    );
};
