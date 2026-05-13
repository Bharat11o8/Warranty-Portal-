import { Activity, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { ModernSelect } from './ModernSelect';
import { LoadingOverlay, EmptyState } from './Common';
import { cn } from '@/lib/utils';

interface TrendSectionProps {
    trendPeriod: string;
    setTrendPeriod: (val: string) => void;
    trendYear: string;
    setTrendYear: (val: string) => void;
    trendMonth: string;
    setTrendMonth: (val: string) => void;
    trendStart: string;
    setTrendStart: (val: string) => void;
    trendEnd: string;
    setTrendEnd: (val: string) => void;
    trendLoading: boolean;
    timeSeries: any;
    trendTotals: any;
    visibleLines: string[];
    toggleLine: (line: string) => void;
    setVisibleLines: (lines: string[]) => void;
    lineConfig: any[];
    years: string[];
    months: string[];
}

export const TrendSection = ({
    trendPeriod, setTrendPeriod,
    trendYear, setTrendYear,
    trendMonth, setTrendMonth,
    trendStart, setTrendStart,
    trendEnd, setTrendEnd,
    trendLoading,
    timeSeries,
    trendTotals,
    visibleLines,
    toggleLine,
    setVisibleLines,
    lineConfig,
    years,
    months
}: TrendSectionProps) => {
    return (
        <Card className="rounded-[40px] border-none bg-white shadow-[0_20px_50px_rgba(0,0,0,0.04)] overflow-hidden relative">
            {trendLoading && <LoadingOverlay />}

            <CardHeader className="p-8 space-y-6 border-b border-slate-50">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-2xl bg-slate-900 flex items-center justify-center shadow-lg shadow-slate-200">
                                <Activity className="h-5 w-5 text-white" />
                            </div>
                            <CardTitle className="text-2xl font-black text-slate-800 uppercase tracking-tighter">
                                Warranty Registration Trend
                            </CardTitle>
                        </div>
                        <CardDescription className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-13">Strategic Analysis & Forecasting</CardDescription>
                    </div>

                    <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-[22px] border border-slate-200/50 w-fit self-end md:self-auto">
                        {['all', 'year', 'month', 'week', 'custom'].map((p) => (
                            <button
                                key={p}
                                onClick={() => setTrendPeriod(p)}
                                className={cn(
                                    "px-6 py-2 rounded-[18px] text-[10px] font-black uppercase tracking-[0.1em] transition-all duration-300",
                                    trendPeriod === p
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
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Filter By:</span>
                        <div className="flex items-center gap-2">
                            {trendPeriod === 'custom' ? (
                                <div className="flex items-center gap-2">
                                    <input
                                        type="date"
                                        value={trendStart}
                                        onChange={(e) => setTrendStart(e.target.value)}
                                        className="bg-white border border-slate-200 rounded-[16px] px-4 py-2 text-[11px] font-bold text-slate-700 outline-none hover:border-slate-300 transition-all shadow-sm cursor-pointer"
                                    />
                                    <span className="text-slate-400 font-bold text-xs">to</span>
                                    <input
                                        type="date"
                                        value={trendEnd}
                                        onChange={(e) => setTrendEnd(e.target.value)}
                                        className="bg-white border border-slate-200 rounded-[16px] px-4 py-2 text-[11px] font-bold text-slate-700 outline-none hover:border-slate-300 transition-all shadow-sm cursor-pointer"
                                    />
                                </div>
                            ) : (trendPeriod === 'year' || trendPeriod === 'month') ? (
                                <>
                                    <ModernSelect
                                        value={trendYear}
                                        onChange={setTrendYear}
                                        options={years.map(y => ({ value: y, label: y }))}
                                    />
                                    {trendPeriod === 'month' && (
                                        <ModernSelect
                                            value={trendMonth}
                                            onChange={setTrendMonth}
                                            options={months.map((m, i) => ({ value: (i + 1).toString(), label: m }))}
                                        />
                                    )}
                                </>
                            ) : (
                                <div className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-[16px] text-[11px] font-black uppercase tracking-widest text-slate-400">
                                    {trendPeriod === 'all' ? 'Showing All History' : 'Last 7 Days Activity'}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Compare:</span>
                        <div className="relative group">
                            <button className="flex items-center gap-3 px-5 py-2.5 bg-white border border-slate-200 rounded-[20px] shadow-sm hover:border-slate-300 transition-all min-w-[200px] justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="flex -space-x-1">
                                        {lineConfig.filter(l => visibleLines.includes(l.id)).slice(0, 3).map(l => (
                                            <div key={l.id} className="h-2 w-2 rounded-full border border-white shadow-sm" style={{ backgroundColor: l.color }} />
                                        ))}
                                    </div>
                                    <span className="text-[11px] font-bold text-slate-700">
                                        {visibleLines.length === lineConfig.length ? 'All Metrics' : `${visibleLines.length} Selected`}
                                    </span>
                                </div>
                                <ChevronDown className="h-4 w-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                            </button>

                            <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-slate-100 rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 p-3 scale-95 group-hover:scale-100 origin-top-right">
                                <div className="space-y-1">
                                    {lineConfig.map((line) => (
                                        <button
                                            key={line.id}
                                            onClick={() => toggleLine(line.id)}
                                            className={cn(
                                                "w-full flex items-center justify-between p-3 rounded-[16px] transition-all",
                                                visibleLines.includes(line.id)
                                                    ? "bg-slate-50 text-slate-900"
                                                    : "bg-transparent text-slate-400 hover:bg-slate-50/50"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: line.color }} />
                                                <span className="text-[11px] font-bold uppercase tracking-tight">{line.name}</span>
                                            </div>
                                            {visibleLines.includes(line.id) && <div className="h-1.5 w-1.5 rounded-full bg-slate-900" />}
                                        </button>
                                    ))}
                                </div>
                                <div className="mt-3 pt-3 border-t border-slate-50 flex justify-center">
                                    <button
                                        onClick={() => setVisibleLines(visibleLines.length === lineConfig.length ? [] : lineConfig.map(l => l.id))}
                                        className="text-[9px] font-black uppercase text-slate-400 hover:text-slate-900 transition-colors"
                                    >
                                        {visibleLines.length === lineConfig.length ? 'Deselect All' : 'Select All'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-3 px-2 border-t border-slate-50 pt-6">
                    <div className="flex flex-col gap-1 pr-6 border-r border-slate-100">
                        <span className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em]">Period Total</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black text-slate-900 leading-none">{trendTotals.total}</span>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Units</span>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-6">
                        {lineConfig.filter(l => l.id !== 'total').map((line) => (
                            <div key={line.id} className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: line.color }} />
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{line.name}</span>
                                </div>
                                <span className="text-sm font-black text-slate-800 ml-3.5 leading-none">
                                    {trendTotals[line.id as keyof typeof trendTotals]}
                                    <span className="text-[10px] font-bold text-slate-300 ml-1.5">
                                        ({trendTotals.total > 0 ? Math.round((trendTotals[line.id as keyof typeof trendTotals] / trendTotals.total) * 100) : 0}%)
                                    </span>
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </CardHeader>

            <CardContent className="h-[450px] pt-10 px-8 relative">
                {!trendLoading && (!timeSeries?.warranties || timeSeries.warranties.length === 0) ? (
                    <EmptyState message="No registration data found" />
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={timeSeries?.warranties}
                            margin={{ top: 40, right: 40, left: 0, bottom: 0 }}
                        >
                            <defs>
                                {lineConfig.map((line) => (
                                    <linearGradient key={line.id} id={`color-${line.id}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={line.color} stopOpacity={0.3} />
                                        <stop offset="95%" stopColor={line.color} stopOpacity={0} />
                                    </linearGradient>
                                ))}
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis
                                dataKey="label"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                                dy={10}
                                minTickGap={30}
                                interval="preserveStartEnd"
                                padding={{ left: 10, right: 10 }}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                                dx={-10}
                                domain={[0, (dataMax: number) => {
                                    if (dataMax <= 10) return 20;
                                    if (dataMax <= 50) return 75;
                                    if (dataMax <= 100) return 150;
                                    const rounded = Math.ceil(dataMax / 50) * 50;
                                    return rounded + 50;
                                }]}
                                allowDataOverflow={false}
                            />
                            <Tooltip
                                contentStyle={{
                                    borderRadius: '24px',
                                    border: 'none',
                                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
                                    padding: '20px'
                                }}
                            />
                            {lineConfig.map((line) => visibleLines.includes(line.id) && (
                                <Area
                                    key={line.id}
                                    type="monotone"
                                    dataKey={line.id}
                                    name={line.name}
                                    stroke={line.color}
                                    strokeWidth={4}
                                    fillOpacity={1}
                                    fill={`url(#color-${line.id})`}
                                    animationDuration={1500}
                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                />
                            ))}
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
    );
};
