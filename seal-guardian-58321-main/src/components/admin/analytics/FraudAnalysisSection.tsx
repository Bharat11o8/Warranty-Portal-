import { ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ModernSelect } from './ModernSelect';
import { LoadingOverlay, EmptyState, ExportButton, exportToExcel, SyncButton } from './Common';
import { cn } from '@/lib/utils';

interface FraudAnalysisSectionProps {
    fraudData: any;
    fraudFlag: string;
    setFraudFlag: (val: string) => void;
    fetchFranchiseDrilldown: (name: string) => void;
    onSync: () => void;
    isSyncing?: boolean;
}

export const FraudAnalysisSection = ({ 
    fraudData, 
    fraudFlag, 
    setFraudFlag, 
    fetchFranchiseDrilldown,
    onSync,
    isSyncing
}: FraudAnalysisSectionProps) => {
    return (
        <Card className="rounded-[40px] border-red-50 bg-red-50/5 shadow-[0_15px_40px_rgba(239,68,68,0.03)] overflow-hidden">
            <CardHeader className="p-8 border-b border-red-100/50 bg-red-50/20">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <CardTitle className="text-xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-2">
                            <ShieldAlert className="h-5 w-5 text-red-500" />
                            Fraud Analysis & Risk Intelligence
                        </CardTitle>
                        <CardDescription className="text-red-600/60 text-[11px] font-bold uppercase tracking-widest">Franchise-level trust scoring · Minimum 5 submissions</CardDescription>
                    </div>

                    <div className="flex items-center gap-3">
                        <ModernSelect
                            label="Signal"
                            value={fraudFlag}
                            onChange={setFraudFlag}
                            options={[
                                { value: 'all', label: 'Global (All Signals)' },
                                { value: 'ip', label: 'IP Abuse Patterns' },
                                { value: 'distance', label: 'Location Mismatch' },
                                { value: 'time', label: 'Time/Speed Abuse' },
                                { value: 'consistency', label: 'Consistency Flags' }
                            ]}
                        />
                        <SyncButton 
                            onClick={onSync}
                            loading={isSyncing}
                        />
                        <ExportButton 
                            onClick={() => {
                                const risky = (fraudData?.riskiest_franchises || []).map((f: any) => ({ ...f, Type: 'RISKY' }));
                                const clean = (fraudData?.cleanest_franchises || []).map((f: any) => ({ ...f, Type: 'TRUSTED' }));
                                exportToExcel([...risky, ...clean], `Fraud_Analysis_Risk_Intelligence_${new Date().toISOString().split('T')[0]}`);
                            }} 
                        />
                    </div>
                </div>

                {/* Network Trust Health Bar */}
                <div className="flex-1 min-w-[280px] bg-white rounded-2xl p-4 border border-red-100/50 shadow-sm mt-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Network Trust Health</span>
                        <span className="text-[11px] font-black text-slate-700">
                            Avg: <span className="text-slate-900">{fraudData?.distribution?.network_avg ?? '—'}</span>
                            <span className="text-slate-400 font-bold">/100</span>
                        </span>
                    </div>
                    <div className="flex h-3 w-full rounded-full overflow-hidden gap-0.5">
                        <div
                            className="bg-emerald-500 h-full rounded-l-full transition-all duration-700"
                            style={{ width: `${((fraudData?.distribution?.high_trust || 0) / (fraudData?.distribution?.total || 1)) * 100}%` }}
                        />
                        <div
                            className="bg-amber-400 h-full transition-all duration-700"
                            style={{ width: `${((fraudData?.distribution?.medium_trust || 0) / (fraudData?.distribution?.total || 1)) * 100}%` }}
                        />
                        <div
                            className="bg-red-500 h-full rounded-r-full transition-all duration-700"
                            style={{ width: `${((fraudData?.distribution?.low_trust || 0) / (fraudData?.distribution?.total || 1)) * 100}%` }}
                        />
                    </div>
                    <div className="flex justify-between mt-2 text-[9px] font-black uppercase tracking-widest">
                        <span className="text-emerald-600">✓ {fraudData?.distribution?.high_trust || 0} Trusted</span>
                        <span className="text-amber-500">~ {fraudData?.distribution?.medium_trust || 0} Medium</span>
                        <span className="text-red-500">⚠ {fraudData?.distribution?.low_trust || 0} Risky</span>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-red-100/50">

                    {/* LEFT: Riskiest Franchises */}
                    <div className="p-8 space-y-5">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-red-700">Highest Fraud Risk</h3>
                            <span className="ml-auto text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border">Ranked by Avg Score ↑</span>
                        </div>
                        {fraudData?.riskiest_franchises?.length > 0 ? (
                            <div className="space-y-3 pr-2" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                                {fraudData.riskiest_franchises.map((f: any, i: number) => (
                                    <div key={i}
                                        onClick={() => fetchFranchiseDrilldown(f.installer_name)}
                                        className="group flex items-center gap-4 p-3 rounded-2xl hover:bg-red-50 hover:ring-1 hover:ring-red-100 transition-all cursor-pointer">
                                        <div className="h-8 w-8 rounded-xl bg-red-100 flex items-center justify-center text-[10px] font-black text-red-600 shrink-0">
                                            #{i + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-black text-slate-800 truncate">{f.installer_name}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <div className="flex-1 h-1.5 bg-red-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-red-400 to-red-600 rounded-full"
                                                        style={{ width: `${f.flagged_pct || 0}%` }}
                                                    />
                                                </div>
                                                <span className="text-[10px] font-black text-red-500 shrink-0">{f.flagged_pct || 0}% flagged</span>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0 space-y-0.5">
                                            <div className="text-lg font-black text-red-600">{f.avg_score}</div>
                                            <Badge className="bg-red-50 text-red-600 border-red-100 text-[9px] font-black uppercase px-1.5 py-0">
                                                {f.primary_flag || 'ip'}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-40 text-slate-400 text-sm font-bold">No data for this period</div>
                        )}
                    </div>

                    {/* RIGHT: Cleanest Franchises */}
                    <div className="p-8 space-y-5">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-700">Most Trusted Franchises</h3>
                            <span className="ml-auto text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border">Ranked by Avg Score ↓</span>
                        </div>
                        {fraudData?.cleanest_franchises?.length > 0 ? (
                            <div className="space-y-3 pr-2" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                                {fraudData.cleanest_franchises.map((f: any, i: number) => (
                                    <div key={i}
                                        onClick={() => fetchFranchiseDrilldown(f.installer_name)}
                                        className="group flex items-center gap-4 p-3 rounded-2xl hover:bg-emerald-50 hover:ring-1 hover:ring-emerald-100 transition-all cursor-pointer">
                                        <div className="h-8 w-8 rounded-xl bg-emerald-100 flex items-center justify-center text-[10px] font-black text-emerald-600 shrink-0">
                                            #{i + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-black text-slate-800 truncate">{f.installer_name}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <div className="flex-1 h-1.5 bg-emerald-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full"
                                                        style={{ width: `${f.clean_pct || 0}%` }}
                                                    />
                                                </div>
                                                <span className="text-[10px] font-black text-emerald-600 shrink-0">{f.clean_pct || 0}% clean</span>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0 space-y-0.5">
                                            <div className="text-lg font-black text-emerald-600">{f.avg_score}</div>
                                            <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 text-[9px] font-black uppercase px-1.5 py-0">
                                                {f.total_submissions} subs
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-40 text-slate-400 text-sm font-bold">No data for this period</div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
