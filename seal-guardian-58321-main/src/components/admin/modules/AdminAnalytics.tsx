import { useState, useEffect, useMemo, useRef } from 'react';
import api from '@/lib/api';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, Legend 
} from 'recharts';
import { 
    Users, ShieldCheck, ShieldAlert, MessageSquare, Package, Box,
    TrendingUp, TrendingDown, Activity, MapPin, ChevronDown, ChevronRight, X, Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AdminModule } from '../layout/AdminSidebar';

const COLORS = ['#f97316', '#3b82f6', '#10b981', '#6366f1', '#ec4899', '#f59e0b'];

const ModernSelect = ({ value, onChange, options, label }: { value: string, onChange: (val: string) => void, options: { value: string, label: string }[], label?: string }) => {
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

export const AdminAnalytics = ({ onNavigate }: { onNavigate: (module: AdminModule) => void }) => {
    const [summary, setSummary] = useState<any>(null);
    const [timeSeries, setTimeSeries] = useState<any>(null);
    const [products, setProducts] = useState<any[]>([]);
    const [franchises, setFranchises] = useState<any[]>([]);
    const [fraudData, setFraudData] = useState<any>(null);
    const [selectedView, setSelectedView] = useState<string | null>('franchise');
    const [visibleLines, setVisibleLines] = useState<string[]>(['total', 'approved', 'pending_admin', 'pending_vendor', 'rejected']);
    // Trend Section Filters
    const [trendPeriod, setTrendPeriod] = useState<string>('year');
    const [trendYear, setTrendYear] = useState<string>(new Date().getFullYear().toString());
    const [trendMonth, setTrendMonth] = useState<string>((new Date().getMonth() + 1).toString());
    const [trendStart, setTrendStart] = useState<string>(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]);
    const [trendEnd, setTrendEnd] = useState<string>(new Date().toISOString().split('T')[0]);

    // Product Section Filters
    const [prodPeriod, setProdPeriod] = useState<string>('year');
    const [prodYear, setProdYear] = useState<string>(new Date().getFullYear().toString());
    const [prodMonth, setProdMonth] = useState<string>((new Date().getMonth() + 1).toString());
    const [prodStart, setProdStart] = useState<string>(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]);
    const [prodEnd, setProdEnd] = useState<string>(new Date().toISOString().split('T')[0]);

    // Geographic Section Filters
    const [geoPeriod, setGeoPeriod] = useState<string>('year');
    const [geoMetric, setGeoMetric] = useState<'warranty' | 'grievance' | 'posm' | 'product'>('warranty');
    const [geoYear, setGeoYear] = useState<string>(new Date().getFullYear().toString());
    const [geoMonth, setGeoMonth] = useState<string>((new Date().getMonth() + 1).toString());
    const [geoStart, setGeoStart] = useState<string>(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]);
    const [geoEnd, setGeoEnd] = useState<string>(new Date().toISOString().split('T')[0]);
    const [selectedState, setSelectedState] = useState<string | null>(null);
    const [expandedItem, setExpandedItem] = useState<string | null>(null);
    const [geoData, setGeoData] = useState<any[]>([]);
    const [geoLoading, setGeoLoading] = useState(false);
    const [selectedFranchise, setSelectedFranchise] = useState<string | null>(null);
    const [drilldownData, setDrilldownData] = useState<any>(null);
    const [drilldownLoading, setDrilldownLoading] = useState(false);
    const [fraudFlag, setFraudFlag] = useState('all');
    const [fraudLoading, setFraudLoading] = useState(false);

    const fetchFranchiseDrilldown = async (name: string) => {
        setSelectedFranchise(name);
        setDrilldownData(null); // Reset previous data so we don't flash "No data"
        setDrilldownLoading(true);
        try {
            const response = await api.get(`/admin/analytics/fraud/franchise/${encodeURIComponent(name)}`);
            if (response.data.success) {
                setDrilldownData(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch fraud drilldown:', error);
        } finally {
            setDrilldownLoading(false);
        }
    };

    // Memoized totals for the selected period
    const trendTotals = useMemo(() => {
        if (!timeSeries?.warranties) return { total: 0, approved: 0, pending_admin: 0, pending_vendor: 0, rejected: 0 };
        return timeSeries.warranties.reduce((acc: any, curr: any) => ({
            total: Number(acc.total) + Number(curr.total || 0),
            approved: Number(acc.approved) + Number(curr.approved || 0),
            pending_admin: Number(acc.pending_admin) + Number(curr.pending_admin || 0),
            pending_vendor: Number(acc.pending_vendor) + Number(curr.pending_vendor || 0),
            rejected: Number(acc.rejected) + Number(curr.rejected || 0)
        }), { total: 0, approved: 0, pending_admin: 0, pending_vendor: 0, rejected: 0 });
    }, [timeSeries]);

    // Data Scientist Normalization: Find max values to scale the bars correctly
    const geoMaxValues = useMemo(() => {
        if (!geoData || geoData.length === 0) return { warranty: 1, product: 1, grievance: 1, posm: 1 };
        return geoData.reduce((acc, curr) => ({
            warranty: Math.max(acc.warranty, curr.warranty?.total_warranties || 0),
            product: Math.max(acc.product, curr.product?.total_products || 0),
            grievance: Math.max(acc.grievance, curr.grievance?.total_grievances || 0),
            posm: Math.max(acc.posm, curr.posm?.total_posm || 0),
        }), { warranty: 1, product: 1, grievance: 1, posm: 1 });
    }, [geoData]);

    const [trendLoading, setTrendLoading] = useState(false);
    const [prodLoading, setProdLoading] = useState(false);

    const toggleLine = (line: string) => {
        setVisibleLines(prev => 
            prev.includes(line) ? prev.filter(l => l !== line) : [...prev, line]
        );
    };

    const LINE_CONFIG = [
        { id: 'total', name: 'Total Registrations', color: '#64748b' },
        { id: 'approved', name: 'Approved', color: '#10b981' },
        { id: 'pending_admin', name: 'Pending Admin', color: '#f59e0b' },
        { id: 'pending_vendor', name: 'Pending Vendor', color: '#3b82f6' },
        { id: 'rejected', name: 'Rejected', color: '#ef4444' }
    ];

    const MONTHS = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const YEARS = ["2024", "2025", "2026"];

    // Independent Fetching Logic
    const fetchTrendData = async () => {
        try {
            setTrendLoading(true);
            const params = new URLSearchParams({
                period: trendPeriod,
                year: trendYear,
                month: trendMonth,
                startDate: trendStart,
                endDate: trendEnd
            });

            const [sumRes, timeRes, franRes] = await Promise.all([
                api.get(`/admin/analytics/summary?${params}`),
                api.get(`/admin/analytics/time-series?${params}`),
                api.get(`/admin/analytics/franchises?${params}`)
            ]);

            if (sumRes.data.success) setSummary(sumRes.data.data);
            if (timeRes.data.success) setTimeSeries(timeRes.data.data);
            if (franRes.data.success) setFranchises(franRes.data.data);
        } catch (error) {
            console.error('Fetch trend error:', error);
        } finally {
            setTrendLoading(false);
        }
    };

    const fetchFraudData = async () => {
        try {
            setFraudLoading(true);
            const params = new URLSearchParams({
                period: trendPeriod,
                year: trendYear,
                month: trendMonth,
                startDate: trendStart,
                endDate: trendEnd,
                flag: fraudFlag
            });

            const res = await api.get(`/admin/analytics/fraud?${params}`);
            if (res.data.success) setFraudData(res.data.data);
        } catch (error) {
            console.error('Fetch fraud error:', error);
        } finally {
            setFraudLoading(false);
        }
    };

    const fetchProdData = async () => {
        try {
            setProdLoading(true);
            const params = new URLSearchParams({
                period: prodPeriod,
                year: prodYear,
                month: prodMonth,
                startDate: prodStart,
                endDate: prodEnd
            });

            const prodRes = await api.get(`/admin/analytics/products?${params}`);
            if (prodRes.data.success) setProducts(prodRes.data.data);
        } catch (error) {
            console.error('Fetch products error:', error);
        } finally {
            setProdLoading(false);
        }
    };

    const fetchGeoData = async () => {
        try {
            setGeoData([]); // Clear old data to prevent stale view
            setGeoLoading(true);
            const params = new URLSearchParams({
                period: geoPeriod,
                year: geoYear,
                month: geoMonth,
                startDate: geoStart,
                endDate: geoEnd
            });
            if (selectedState) params.append('state', selectedState);

            const res = await api.get(`/admin/analytics/geographic?${params}`);
            if (res.data.success) setGeoData(res.data.data);
        } catch (error) {
            console.error('Fetch geo error:', error);
        } finally {
            setGeoLoading(false);
        }
    };

    useEffect(() => {
        fetchTrendData();
    }, [trendPeriod, trendYear, trendMonth, trendStart, trendEnd]);

    useEffect(() => {
        fetchFraudData();
    }, [trendPeriod, trendYear, trendMonth, trendStart, trendEnd, fraudFlag]);

    useEffect(() => {
        fetchProdData();
    }, [prodPeriod, prodYear, prodMonth, prodStart, prodEnd]);

    useEffect(() => {
        fetchGeoData();
    }, [geoPeriod, geoYear, geoMonth, geoStart, geoEnd, selectedState, geoMetric]);

    // Initial load for everything
    useEffect(() => {
        const init = async () => {
            await Promise.all([fetchTrendData(), fetchProdData(), fetchGeoData(), fetchFraudData()]);
        };
        init();
    }, []);

    const getViewDetails = () => {
        switch (selectedView) {
            case 'franchise':
                return [
                    { label: 'Approved', value: summary?.franchise?.approved, color: 'text-emerald-500' },
                    { label: 'Pending', value: summary?.franchise?.pending, color: 'text-amber-500' },
                    { label: 'Rejected', value: summary?.franchise?.disapproved, color: 'text-rose-500' },
                    { label: 'In Warranty', value: summary?.participation?.warranty_participation, color: 'text-blue-500' },
                    { label: 'In Grievance', value: summary?.participation?.grievance_participation, color: 'text-red-500' },
                    { label: 'In POSM', value: summary?.participation?.posm_participation, color: 'text-purple-500' }
                ];
            case 'warranty':
                return [
                    { label: 'Validated', value: summary?.warranty?.validated, color: 'text-emerald-500' },
                    { label: 'Pending Admin', value: summary?.warranty?.pending_admin, color: 'text-amber-500' },
                    { label: 'Pending Vendor', value: summary?.warranty?.pending_vendor, color: 'text-blue-500' },
                    { label: 'Rejected', value: summary?.warranty?.rejected, color: 'text-rose-500' }
                ];
            case 'grievance':
                return [
                    { label: 'Submitted', value: summary?.grievance?.submitted, color: 'text-blue-500' },
                    { label: 'In Progress', value: summary?.grievance?.in_progress, color: 'text-amber-500' },
                    { label: 'Resolved', value: summary?.grievance?.resolved, color: 'text-emerald-500' },
                    { label: 'Rejected', value: summary?.grievance?.rejected, color: 'text-rose-500' },
                    { label: 'Participating', value: summary?.participation?.grievance_participation, color: 'text-red-500' },
                    { label: 'Total Tickets', value: summary?.grievance?.total, color: 'text-slate-600' }
                ];
            case 'posm':
                return [
                    { label: 'Open', value: summary?.posm?.open, color: 'text-blue-500' },
                    { label: 'Processing', value: summary?.posm?.processing, color: 'text-amber-500' },
                    { label: 'Shipped/Deliv.', value: summary?.posm?.shipped, color: 'text-emerald-500' },
                    { label: 'Closed/Rej.', value: summary?.posm?.closed, color: 'text-rose-500' },
                    { label: 'Participating', value: summary?.participation?.posm_participation, color: 'text-purple-500' },
                    { label: 'Total Requests', value: summary?.posm?.total, color: 'text-slate-600' }
                ];
            default:
                return [];
        }
    };

    const LoadingOverlay = () => (
        <div className="absolute inset-0 z-50 bg-white/40 backdrop-blur-[2px] flex items-center justify-center transition-all duration-500 animate-in fade-in">
            <div className="flex flex-col items-center gap-4">
                <div className="h-10 w-10 border-4 border-slate-900/10 border-t-slate-900 rounded-full animate-spin shadow-lg" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-800 animate-pulse">Syncing Data...</span>
            </div>
        </div>
    );

    const EmptyState = ({ message = "No records found for this period" }) => (
        <div className="flex flex-col items-center justify-center h-[350px] w-full bg-slate-50/50 rounded-[32px] border border-dashed border-slate-200 animate-in fade-in zoom-in duration-700">
            <div className="h-20 w-20 rounded-[30px] bg-white shadow-xl shadow-slate-100 flex items-center justify-center mb-6 border border-slate-50">
                <Package className="h-8 w-8 text-slate-200" />
            </div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">{message}</h3>
            <p className="text-[11px] font-bold text-slate-400 mt-2 max-w-[200px] text-center leading-relaxed">
                Try expanding your date range or selecting a different year/month.
            </p>
        </div>
    );

    if (!summary) {
        return (
            <div className="p-8 space-y-8 bg-[#fafafa] min-h-screen">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-32 rounded-[32px] bg-slate-100" />
                    ))}
                </div>
                <Skeleton className="h-[500px] rounded-[40px] bg-slate-100" />
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-20">
            {/* Top Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard 
                    title="Total Franchises" 
                    value={summary?.franchise?.total} 
                    icon={StoreIcon} 
                    trend="+12%" 
                    trendUp={true}
                    isActive={selectedView === 'franchise'}
                    onClick={() => setSelectedView('franchise')}
                />
                <StatsCard 
                    title="Warranty Management" 
                    value={summary?.warranty?.total} 
                    icon={ShieldCheck} 
                    trend="84%" 
                    isActive={selectedView === 'warranty'}
                    onClick={() => setSelectedView('warranty')}
                />
                <StatsCard 
                    title="Grievance Rate" 
                    value={summary?.grievance?.total} 
                    icon={MessageSquare} 
                    trend="-5%" 
                    trendUp={false}
                    isActive={selectedView === 'grievance'}
                    onClick={() => setSelectedView('grievance')}
                />
                <StatsCard 
                    title="POSM Requests" 
                    value={summary?.posm?.total} 
                    icon={Package} 
                    trend="+18%" 
                    trendUp={true}
                    isActive={selectedView === 'posm'}
                    onClick={() => setSelectedView('posm')}
                />
            </div>

            {/* Drill-down Detail Section */}
            {selectedView && (
                <div className="animate-in-slide-up">
                    <Card className="rounded-[32px] border-orange-100 bg-orange-50/20 shadow-sm overflow-hidden">
                        <CardContent className="p-6">
                            <div className="flex flex-wrap gap-8 justify-between">
                                {getViewDetails().map((item, idx) => (
                                    <div key={idx} className="flex flex-col min-w-[120px]">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{item.label}</span>
                                        <span className={`text-2xl font-black ${item.color || 'text-slate-800'}`}>{item.value || 0}</span>
                                    </div>
                                ))}
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="ml-auto self-center text-slate-400 hover:text-orange-500"
                                    onClick={() => onNavigate(
                                        selectedView === 'franchise' ? 'vendors' : 
                                        selectedView === 'warranty' ? 'warranties' : 
                                        selectedView === 'grievance' ? 'grievances' : 'posm' as any
                                    )}
                                >
                                    View Detailed List
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Main Charts Row - Split into individual rows */}
            <div className="grid grid-cols-1 gap-8">
                {/* Warranty Trend - Enterprise Grade Filtering */}
                <Card className="rounded-[40px] border-none bg-white shadow-[0_20px_50px_rgba(0,0,0,0.04)] overflow-hidden relative">
                    {trendLoading && <LoadingOverlay />}

                    <CardHeader className="p-8 space-y-6 border-b border-slate-50">
                        {/* Row 1: Title & Main Period Toggle */}
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

                            {/* Period Segmented Control */}
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

                        {/* Row 2: Contextual Filters & Visibility Toggles */}
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
                                                options={YEARS.map(y => ({ value: y, label: y }))}
                                            />
                                            {trendPeriod === 'month' && (
                                                <ModernSelect
                                                    value={trendMonth}
                                                    onChange={setTrendMonth}
                                                    options={MONTHS.map((m, i) => ({ value: (i + 1).toString(), label: m }))}
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
                                                {LINE_CONFIG.filter(l => visibleLines.includes(l.id)).slice(0, 3).map(l => (
                                                    <div key={l.id} className="h-2 w-2 rounded-full border border-white shadow-sm" style={{ backgroundColor: l.color }} />
                                                ))}
                                            </div>
                                            <span className="text-[11px] font-bold text-slate-700">
                                                {visibleLines.length === LINE_CONFIG.length ? 'All Metrics' : `${visibleLines.length} Selected`}
                                            </span>
                                        </div>
                                        <ChevronDown className="h-4 w-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                                    </button>

                                    {/* Dropdown Menu */}
                                    <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-slate-100 rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 p-3 scale-95 group-hover:scale-100 origin-top-right">
                                        <div className="space-y-1">
                                            {LINE_CONFIG.map((line) => (
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
                                                onClick={() => setVisibleLines(visibleLines.length === LINE_CONFIG.length ? [] : LINE_CONFIG.map(l => l.id))}
                                                className="text-[9px] font-black uppercase text-slate-400 hover:text-slate-900 transition-colors"
                                            >
                                                {visibleLines.length === LINE_CONFIG.length ? 'Deselect All' : 'Select All'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Row 3: Live Period Totals */}
                        <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-3 px-2 border-t border-slate-50 pt-6">
                            <div className="flex flex-col gap-1 pr-6 border-r border-slate-100">
                                <span className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em]">Period Total</span>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-black text-slate-900 leading-none">{trendTotals.total}</span>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Units</span>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-6">
                                {LINE_CONFIG.filter(l => l.id !== 'total').map((line) => (
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
                                        {LINE_CONFIG.map((line) => (
                                            <linearGradient key={line.id} id={`color-${line.id}`} x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={line.color} stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor={line.color} stopOpacity={0}/>
                                            </linearGradient>
                                        ))}
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis 
                                        dataKey="label" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} 
                                        dy={10}
                                        minTickGap={30}
                                        interval="preserveStartEnd"
                                        padding={{ left: 10, right: 10 }}
                                    />
                                    <YAxis 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}}
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
                                    {LINE_CONFIG.map((line) => visibleLines.includes(line.id) && (
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

                {/* Product Distribution List - Row Wise Arrangement */}
                <Card className="rounded-[40px] border-none bg-white shadow-[0_20px_50px_rgba(0,0,0,0.04)] overflow-hidden relative">
                    {prodLoading && <LoadingOverlay />}
                    <CardHeader className="p-8 space-y-6 border-b border-slate-50">
                        {/* Row 1: Title & Main Period Toggle */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-2xl bg-slate-900 flex items-center justify-center shadow-lg shadow-slate-200">
                                        <Package className="h-5 w-5 text-white" />
                                    </div>
                                    <CardTitle className="text-2xl font-black text-slate-800 uppercase tracking-tighter">
                                        Product Inventory Performance
                                    </CardTitle>
                                </div>
                                <CardDescription className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-13">Strategic breakdown of catalog registrations</CardDescription>
                            </div>

                            {/* Period Segmented Control (Localized) */}
                            <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-[22px] border border-slate-200/50 w-fit self-end md:self-auto">
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

                        {/* Row 2: Contextual Filters */}
                        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 pt-2">
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Filter By:</span>
                                <div className="flex items-center gap-2">
                                    {prodPeriod === 'custom' ? (
                                        <div className="flex items-center gap-2">
                                            <input 
                                                type="date"
                                                value={prodStart}
                                                onChange={(e) => setProdStart(e.target.value)}
                                                className="bg-white border border-slate-200 rounded-[16px] px-4 py-2 text-[11px] font-bold text-slate-700 outline-none hover:border-slate-300 transition-all shadow-sm cursor-pointer"
                                            />
                                            <span className="text-slate-400 font-bold text-xs">to</span>
                                            <input 
                                                type="date"
                                                value={prodEnd}
                                                onChange={(e) => setProdEnd(e.target.value)}
                                                className="bg-white border border-slate-200 rounded-[16px] px-4 py-2 text-[11px] font-bold text-slate-700 outline-none hover:border-slate-300 transition-all shadow-sm cursor-pointer"
                                            />
                                        </div>
                                    ) : (prodPeriod === 'year' || prodPeriod === 'month') ? (
                                        <>
                                            {/* Year Selector */}
                                            <select 
                                                value={prodYear}
                                                onChange={(e) => setProdYear(e.target.value)}
                                                className="bg-white border border-slate-200 rounded-[16px] px-4 py-2 text-[11px] font-bold text-slate-700 outline-none hover:border-slate-300 transition-all shadow-sm cursor-pointer min-w-[100px]"
                                            >
                                                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                                            </select>

                                            {/* Month Selector */}
                                            {prodPeriod === 'month' && (
                                                <select 
                                                    value={prodMonth}
                                                    onChange={(e) => setProdMonth(e.target.value)}
                                                    className="bg-white border border-slate-200 rounded-[16px] px-4 py-2 text-[11px] font-bold text-slate-700 outline-none hover:border-slate-300 transition-all shadow-sm cursor-pointer min-w-[120px]"
                                                >
                                                    {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                                                </select>
                                            )}
                                        </>
                                    ) : (
                                        <span className="px-4 py-2 bg-white border border-slate-200 rounded-[16px] text-[11px] font-bold text-slate-500 shadow-sm">
                                            {prodPeriod === 'all' ? '📊 All Time Records' : '📅 Last 7 Days'}
                                        </span>
                                    )}
                                </div>
                            </div>
                            
                            <div className="px-5 py-2.5 bg-slate-50 rounded-[20px] border border-slate-100 flex items-center gap-3">
                                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Variations:</span>
                                <span className="text-sm font-black text-slate-900">{products?.length || 0}</span>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 relative min-h-[400px]">
                        {prodLoading ? (
                            <div className="h-[400px] w-full" /> // Overlay will show
                        ) : !products || products.length === 0 ? (
                            <div className="px-8 py-10">
                                <EmptyState message="No product variations recorded" />
                            </div>
                        ) : (
                            <div className="max-h-[600px] overflow-y-auto px-8 py-6 scrollbar-thin scrollbar-thumb-slate-100 scrollbar-track-transparent">
                                <div className="space-y-2">
                                    {products.map((product: any, index: number) => {
                                        const maxCount = Math.max(...products.map((p: any) => p.count)) || 1;
                                        const percentage = (product.count / maxCount) * 100;
                                        
                                        return (
                                            <div 
                                                key={index} 
                                                className="group flex items-center justify-between p-4 rounded-[24px] hover:bg-slate-50/80 transition-all duration-300 border border-transparent hover:border-slate-100"
                                            >
                                                <div className="flex items-center gap-4 flex-1">
                                                    <div className="h-10 w-10 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-slate-400 text-xs group-hover:bg-white group-hover:text-slate-900 transition-colors shadow-sm">
                                                        {String(index + 1).padStart(2, '0')}
                                                    </div>
                                                    <div className="flex-1 space-y-1.5">
                                                        <div className="flex items-center justify-between pr-8">
                                                            <span className="text-xs font-black text-slate-700 uppercase tracking-tight">{product.product_name}</span>
                                                            <span className="text-[10px] font-black text-slate-900 bg-white px-3 py-1 rounded-full shadow-sm border border-slate-50">
                                                                {product.count} <span className="text-slate-400 ml-1">Warranties</span>
                                                            </span>
                                                        </div>
                                                        <div className="relative h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                            <div 
                                                                className="absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(0,0,0,0.05)]"
                                                                style={{ 
                                                                    width: `${percentage}%`, 
                                                                    backgroundColor: COLORS[index % COLORS.length]
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="ml-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <div className="h-8 w-8 rounded-full bg-white shadow-sm flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all cursor-pointer">
                                                        <ChevronRight className="h-4 w-4" />
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

                {/* Geographic Performance Insights - State/City Drill-down */}
                <Card className="rounded-[40px] border-none bg-white shadow-[0_20px_50px_rgba(0,0,0,0.04)] overflow-hidden relative">
                    {geoLoading && <LoadingOverlay />}
                    <CardHeader className="p-8 space-y-6 border-b border-slate-50">
                        {/* Row 1: Title & Drill-down Control */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="h-14 w-14 rounded-3xl bg-emerald-100 flex items-center justify-center shadow-inner">
                                        <MapPin className="h-7 w-7 text-emerald-600" />
                                    </div>
                                    <div className="space-y-1">
                                        <CardTitle className="text-3xl font-black text-slate-800 uppercase tracking-tighter">Geographic Performance</CardTitle>
                                        <CardDescription className="text-emerald-600/60 text-[11px] font-bold uppercase tracking-[0.2em]">Regional penetration & market share</CardDescription>
                                    </div>
                                </div>

                            {/* Period Segmented Control (Localized) */}
                            <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-[22px] border border-slate-200/50 w-fit self-end md:self-auto">
                                {['all', 'year', 'month', 'week', 'custom'].map((p) => (
                                    <button
                                        key={p}
                                        onClick={() => setGeoPeriod(p)}
                                        className={cn(
                                            "px-6 py-2 rounded-[18px] text-[10px] font-black uppercase tracking-[0.1em] transition-all duration-300",
                                            geoPeriod === p 
                                                ? "bg-white text-slate-900 shadow-md border border-slate-200/20" 
                                                : "text-slate-400 hover:text-slate-600"
                                        )}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Row 2: Geographic Contextual Filters */}
                        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 pt-2">
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Filter By:</span>
                                <div className="flex items-center gap-2">
                                    {geoPeriod === 'custom' ? (
                                        <div className="flex items-center gap-2">
                                            <input 
                                                type="date"
                                                value={geoStart}
                                                onChange={(e) => setGeoStart(e.target.value)}
                                                className="bg-white border border-slate-200 rounded-[16px] px-4 py-2 text-[11px] font-bold text-slate-700 outline-none hover:border-slate-300 transition-all shadow-sm cursor-pointer"
                                            />
                                            <span className="text-slate-400 font-bold text-xs">to</span>
                                            <input 
                                                type="date"
                                                value={geoEnd}
                                                onChange={(e) => setGeoEnd(e.target.value)}
                                            />
                                        </div>
                                    ) : (geoPeriod === 'year' || geoPeriod === 'month') ? (
                                        <>
                                            <ModernSelect
                                                value={geoYear}
                                                onChange={setGeoYear}
                                                options={YEARS.map(y => ({ value: y, label: y }))}
                                            />
                                            {geoPeriod === 'month' && (
                                                <ModernSelect
                                                    value={geoMonth}
                                                    onChange={setGeoMonth}
                                                    options={MONTHS.map((m, i) => ({ value: (i + 1).toString(), label: m }))}
                                                />
                                            )}
                                        </>
                                    ) : (
                                        <div className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-[16px] text-[11px] font-black uppercase tracking-widest text-slate-400">
                                            {geoPeriod === 'all' ? 'Showing All History' : 'Last 7 Days Activity'}
                                        </div>
                                    )}
                                </div>

                                {selectedState && (
                                    <button 
                                        onClick={() => setSelectedState(null)}
                                        className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                                    >
                                        <X className="h-3 w-3" />
                                        Back to National View
                                    </button>
                                )}
                            </div>

                            {/* Metric Selector (New) */}
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Analyze:</span>
                                <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-[16px] border border-slate-200/30">
                                    {[
                                        { id: 'warranty', label: 'Warranty', icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                                        { id: 'product', label: 'Top Products', icon: Box, color: 'text-blue-600', bg: 'bg-blue-50' },
                                        { id: 'grievance', label: 'Grievances', icon: MessageSquare, color: 'text-rose-600', bg: 'bg-rose-50' },
                                        { id: 'posm', label: 'POSM', icon: Package, color: 'text-amber-600', bg: 'bg-amber-50' }
                                    ].map((m) => (
                                        <button
                                            key={m.id}
                                            onClick={() => setGeoMetric(m.id as any)}
                                            className={cn(
                                                "flex items-center gap-2 px-4 py-1.5 rounded-[12px] text-[10px] font-black uppercase tracking-tight transition-all",
                                                geoMetric === m.id 
                                                    ? `${m.bg} ${m.color} shadow-sm border border-slate-200/50` 
                                                    : "text-slate-400 hover:text-slate-600"
                                            )}
                                        >
                                            <m.icon className="h-3 w-3" />
                                            {m.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0 min-h-[500px]">
                        {!geoLoading && geoData.length === 0 ? (
                            <div className="p-12">
                                <EmptyState message={`No ${geoMetric} data found for ${selectedState || 'any state'}`} />
                            </div>
                        ) : (
                            <div className="p-8 space-y-10">
                                {/* Interactive Bar Chart (State/City Ranking) */}
                                <div className="max-h-[500px] overflow-y-auto pr-4 scrollbar-thin">
                                    <div style={{ height: `${Math.max(400, geoData.length * 45)}px`, width: '100%' }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart 
                                                layout="vertical" 
                                                data={geoData
                                                    .map(d => ({
                                                        name: d.label?.toUpperCase(),
                                                        value: geoMetric === 'warranty' ? (d.warranty?.total_warranties || 0) :
                                                               geoMetric === 'product' ? (d.product?.total_products || 0) :
                                                               geoMetric === 'grievance' ? (d.grievance?.total_grievances || 0) :
                                                               (d.posm?.total_posm || 0),
                                                        fullData: d
                                                    }))
                                                    .sort((a, b) => b.value - a.value)
                                                }
                                                margin={{ left: 20, right: 60, top: 20, bottom: 20 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                            <XAxis type="number" hide />
                                            <YAxis 
                                                type="category" 
                                                dataKey="name" 
                                                width={100}
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 800 }}
                                            />
                                            <Tooltip 
                                                cursor={{ fill: '#f8fafc' }}
                                                content={({ active, payload }) => {
                                                    if (active && payload && payload.length) {
                                                        const data = payload[0].payload;
                                                        return (
                                                            <div className="bg-slate-900 text-white p-3 rounded-2xl shadow-2xl border border-slate-800 scale-95 animate-in fade-in zoom-in duration-200">
                                                                <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-1">{selectedState ? 'CITY' : 'STATE'}</p>
                                                                <p className="text-sm font-black mb-2">{data.name}</p>
                                                                <div className="h-px bg-white/10 my-2" />
                                                                <div className="flex items-center gap-3">
                                                                    <div className={cn("h-2 w-2 rounded-full", geoMetric === 'product' ? "bg-blue-500" : "bg-emerald-500")} />
                                                                    <p className="text-xs font-bold">{data.value} {geoMetric === 'product' ? 'SALES' : geoMetric.toUpperCase()}</p>
                                                                </div>
                                                                {geoMetric === 'product' && data.fullData?.product?.mix && (
                                                                    <div className="mt-2 pt-2 border-t border-white/5 space-y-1">
                                                                        <p className="text-[9px] font-black text-blue-400 uppercase tracking-tighter mb-1">Product Breakdown</p>
                                                                        {data.fullData.product.mix.slice(0, 5).map((m: any, i: number) => (
                                                                            <div key={i} className="flex justify-between items-center text-[10px]">
                                                                                <span className="text-white/60 font-bold">{m.name}</span>
                                                                                <span className="text-white font-black">{m.count}</span>
                                                                            </div>
                                                                        ))}
                                                                        {data.fullData.product.mix.length > 5 && (
                                                                            <p className="text-[8px] text-white/30 font-bold italic">+{data.fullData.product.mix.length - 5} more models...</p>
                                                                        )}
                                                                    </div>
                                                                )}
                                                                {!selectedState && <p className="text-[9px] font-bold text-emerald-400 mt-2">Click to view cities →</p>}
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                }}
                                            />
                                            <Bar 
                                                dataKey="value" 
                                                radius={[0, 8, 8, 0]} 
                                                barSize={20}
                                                className="cursor-pointer"
                                                onClick={(data: any) => {
                                                    if (data && data.name && !selectedState) {
                                                        setSelectedState(data.name);
                                                    }
                                                }}
                                            >
                                                {geoData.map((_, index) => (
                                                    <Cell 
                                                        key={`cell-${index}`} 
                                                        fill={geoMetric === 'warranty' ? '#10b981' : geoMetric === 'product' ? '#3b82f6' : geoMetric === 'grievance' ? '#f43f5e' : '#f59e0b'} 
                                                        fillOpacity={0.8}
                                                        className="hover:fill-opacity-100 transition-all duration-300"
                                                    />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Detailed Ranking Table (The Data Scientist View from before) */}
                                <div className="space-y-3">
                                    <div className="flex items-center px-8 py-4 bg-slate-900 rounded-[24px] mb-4 shadow-xl shadow-slate-200/50">
                                        <div className="flex-1 flex flex-col">
                                            <span className="text-[11px] font-black uppercase text-white tracking-[0.2em]">
                                                {selectedState ? `CITY DRILL-DOWN: ${selectedState}` : 'NATIONAL PERFORMANCE'}
                                            </span>
                                            <span className="text-white text-[10px] font-bold opacity-60">High-Fidelity Regional Ranking</span>
                                        </div>
                                    </div>

                                    {geoData.sort((a, b) => {
                                        const valA = geoMetric === 'warranty' ? (a.warranty?.total_warranties || 0) :
                                                     geoMetric === 'product' ? (a.product?.total_products || 0) :
                                                     geoMetric === 'grievance' ? (a.grievance?.total_grievances || 0) :
                                                     (a.posm?.total_posm || 0);
                                        const valB = geoMetric === 'warranty' ? (b.warranty?.total_warranties || 0) :
                                                     geoMetric === 'product' ? (b.product?.total_products || 0) :
                                                     geoMetric === 'grievance' ? (b.grievance?.total_grievances || 0) :
                                                     (b.posm?.total_posm || 0);
                                        return valB - valA;
                                    }).map((item, idx) => {
                                        const total = item.warranty?.total_warranties || 0;
                                        const val = geoMetric === 'warranty' ? total :
                                                   geoMetric === 'product' ? (item.product?.total_products || 0) :
                                                   geoMetric === 'grievance' ? (item.grievance?.total_grievances || 0) :
                                                   (item.posm?.total_posm || 0);
                                        
                                        const isExpanded = expandedItem === item.label;

                                        return (
                                            <div key={idx} className="space-y-2">
                                                <div 
                                                    onClick={() => {
                                                        if (!selectedState) {
                                                            setSelectedState(item.label);
                                                        } else {
                                                            setExpandedItem(isExpanded ? null : item.label);
                                                        }
                                                    }}
                                                    className={cn(
                                                        "flex items-center px-8 py-4 rounded-[28px] border border-slate-100/50 bg-white hover:bg-slate-50 hover:border-slate-200 transition-all duration-500 group relative overflow-hidden cursor-pointer",
                                                        isExpanded ? "border-blue-200 bg-blue-50/30" : ""
                                                    )}
                                                >
                                                    <div className="flex-1 flex items-center gap-5">
                                                        <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-[10px] font-black text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all duration-500 shadow-sm border border-slate-100">
                                                            #{idx + 1}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-black text-slate-900 tracking-tight">{item.label?.toUpperCase()}</span>
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{val} {geoMetric === 'product' ? 'Sales' : geoMetric}</span>
                                                                {item.product?.mix && geoMetric === 'product' && !isExpanded && (
                                                                    <div className="flex gap-1.5 flex-wrap">
                                                                        {item.product.mix.slice(0, 3).map((m: any, i: number) => (
                                                                            <span key={i} className="text-[8px] font-black px-2 py-0.5 bg-slate-50 text-slate-500 rounded-full border border-slate-100">
                                                                                {m.name}: {m.count}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-12 pr-6">
                                                        <div className="flex flex-col items-end">
                                                            <span className={cn("text-sm font-black", 
                                                                geoMetric === 'warranty' ? "text-emerald-600" : 
                                                                geoMetric === 'product' ? "text-blue-600" : 
                                                                geoMetric === 'grievance' ? "text-rose-600" : "text-amber-600")}>
                                                                {val}
                                                            </span>
                                                            <span className="text-[8px] font-black uppercase text-slate-300 tracking-tighter">
                                                                {geoMetric === 'warranty' ? 'Warranties' : geoMetric === 'product' ? 'Total Sales' : geoMetric === 'grievance' ? 'Grievances' : 'POSM Requests'}
                                                            </span>
                                                        </div>

                                                        {selectedState ? (
                                                            <ChevronRight className={cn("h-4 w-4 text-slate-200 transition-all", isExpanded ? "rotate-90 text-blue-500" : "")} />
                                                        ) : (
                                                            <ChevronRight className="h-4 w-4 text-slate-200 group-hover:text-slate-900 transition-all" />
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Expanded Product Breakdown for City */}
                                                {/* Expanded Metric Breakdown for City */}
                                                {isExpanded && (
                                                    <div className="mx-8 p-6 bg-slate-900 rounded-[24px] shadow-inner animate-in slide-in-from-top-2 duration-300">
                                                        {geoMetric === 'warranty' ? (
                                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                                <div className="flex flex-col p-3 rounded-xl bg-white/5 border border-white/10">
                                                                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Validated</span>
                                                                    <span className="text-xl font-black text-white">{item.warranty?.approved_warranties || 0}</span>
                                                                </div>
                                                                <div className="flex flex-col p-3 rounded-xl bg-white/5 border border-white/10">
                                                                    <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Pending</span>
                                                                    <span className="text-xl font-black text-white">{item.warranty?.pending_admin_warranties || 0}</span>
                                                                </div>
                                                                <div className="flex flex-col p-3 rounded-xl bg-white/5 border border-white/10">
                                                                    <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Rejected</span>
                                                                    <span className="text-xl font-black text-white">{item.warranty?.rejected_warranties || 0}</span>
                                                                </div>
                                                                <div className="flex flex-col p-3 rounded-xl bg-white/5 border border-white/10">
                                                                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Total</span>
                                                                    <span className="text-xl font-black text-white">{item.warranty?.total_warranties || 0}</span>
                                                                </div>
                                                            </div>
                                                        ) : geoMetric === 'product' && item.product?.mix ? (
                                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                                {item.product.mix.map((m: any, i: number) => (
                                                                    <div key={i} className="flex flex-col p-3 rounded-xl bg-white/5 border border-white/10">
                                                                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{m.name}</span>
                                                                        <span className="text-xl font-black text-white">{m.count} <span className="text-[10px] opacity-40">units</span></span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                                                                <div className="flex flex-col">
                                                                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Selected Metric: {geoMetric}</span>
                                                                    <span className="text-2xl font-black text-white">{val} Total</span>
                                                                </div>
                                                                <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center">
                                                                    {geoMetric === 'grievance' ? <MessageSquare className="h-6 w-6 text-rose-400" /> : <Package className="h-6 w-6 text-amber-400" />}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Bottom Section - Stacked Full-Width Modules */}
            <div className="space-y-8">
                {/* 1. Franchise Participation Leaderboard - FULL WIDTH */}
                <Card className="rounded-[40px] border-orange-50 shadow-[0_15px_40px_rgba(0,0,0,0.02)] overflow-hidden">
                    <CardHeader className="p-8 border-b border-slate-50">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-2xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-3">
                                <div className="h-10 w-10 rounded-2xl bg-orange-50 flex items-center justify-center">
                                    <Users className="h-5 w-5 text-orange-500" />
                                </div>
                                Franchise Participation Leaderboard
                            </CardTitle>
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Full Network Activity Audit</span>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                            <table className="w-full text-left">
                                <thead className="sticky top-0 z-10 bg-white shadow-sm">
                                    <tr className="bg-slate-50/80 backdrop-blur-md">
                                        <th className="py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 px-8">Franchise Details</th>
                                        <th className="py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 px-8 text-center">Total Warranties</th>
                                        <th className="py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 px-8 text-center">Active Grievances</th>
                                        <th className="py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 px-8 text-center">POSM Requests</th>
                                        <th className="py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 px-8 text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {franchises?.map((f, idx) => (
                                        <tr key={f.id} className="border-b border-slate-50/50 hover:bg-slate-50/80 transition-all group">
                                            <td className="py-5 px-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                                                        #{idx + 1}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-800 text-sm">{f.store_name}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{f.city}, {f.state}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-5 px-8 text-center">
                                                <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[11px] font-black border border-blue-100">
                                                    {f.total_registrations || 0}
                                                </span>
                                            </td>
                                            <td className="py-5 px-8 text-center">
                                                <span className={cn(
                                                    "inline-flex items-center px-3 py-1 rounded-full text-[11px] font-black border",
                                                    f.grievance_count > 0 ? "bg-rose-50 text-rose-600 border-rose-100" : "bg-slate-50 text-slate-400 border-slate-100"
                                                )}>
                                                    {f.grievance_count}
                                                </span>
                                            </td>
                                            <td className="py-5 px-8 text-center">
                                                <span className="inline-flex items-center px-3 py-1 rounded-full bg-amber-50 text-amber-600 text-[11px] font-black border border-amber-100">
                                                    {f.posm_count || 0}
                                                </span>
                                            </td>
                                            <td className="py-5 px-8 text-right">
                                                <div className="flex items-center justify-end">
                                                    {f.is_verified ? (
                                                        <Badge className="bg-emerald-50 text-emerald-600 hover:bg-emerald-50 border-emerald-100 text-[10px] font-black uppercase">Approved</Badge>
                                                    ) : f.verified_at ? (
                                                        <Badge className="bg-rose-50 text-rose-600 hover:bg-rose-50 border-rose-100 text-[10px] font-black uppercase">Rejected</Badge>
                                                    ) : (
                                                        <Badge className="bg-amber-50 text-amber-600 hover:bg-amber-50 border-amber-100 text-[10px] font-black uppercase">Pending</Badge>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* 2. Fraud Detection Analysis - FULL WIDTH */}
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
            </div>

            {/* Fraud Drilldown Modal */}
            {selectedFranchise && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-md">
                    <div className="bg-white rounded-[40px] w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-white/20 animate-in fade-in zoom-in duration-300">
                        {/* Modal Header */}
                        <div className="p-8 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
                            <div>
                                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">{selectedFranchise}</h2>
                                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mt-1">Detailed Fraud Intelligence Profile</p>
                            </div>
                            <button 
                                onClick={() => setSelectedFranchise(null)}
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
                                        {[1,2,3,4].map(i => <div key={i} className="h-24 bg-slate-50 rounded-3xl" />)}
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
            )}
        </div>
    );
};

const StatsCard = ({ title, value, icon: Icon, trend, trendUp, isActive, onClick }: any) => (
    <Card 
        onClick={onClick}
        className={cn(
            "rounded-3xl border-orange-50 shadow-[0_10px_30px_rgba(0,0,0,0.02)] overflow-hidden transition-all duration-500 cursor-pointer relative",
            isActive 
                ? "border-orange-500 shadow-[0_15px_40px_rgba(249,115,22,0.08)] bg-white ring-1 ring-orange-500/10" 
                : "bg-white hover:border-orange-200 hover:shadow-[0_10px_40px_rgba(0,0,0,0.04)]"
        )}
    >
        <CardContent className="p-6">
            <div className="flex justify-between items-start">
                <div className={cn(
                    "p-3 rounded-2xl transition-colors duration-500",
                    isActive ? "bg-orange-500 text-white" : "bg-slate-50 text-slate-400 group-hover:bg-orange-50 group-hover:text-orange-500"
                )}>
                    <Icon className="h-5 w-5" />
                </div>
                {trend && (
                    <div className={cn(
                        "flex items-center gap-1 text-[10px] font-black uppercase tracking-tight",
                        isActive ? "text-orange-500" : (trendUp === undefined ? "text-blue-500" : trendUp ? "text-emerald-500" : "text-rose-500")
                    )}>
                        {trendUp === true && <TrendingUp className="h-3 w-3" />}
                        {trendUp === false && <TrendingDown className="h-3 w-3" />}
                        {trend}
                    </div>
                )}
            </div>
            
            <div className="mt-5 space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{title}</p>
                <div className="flex items-baseline gap-2">
                    <h3 className={cn(
                        "text-3xl font-black tracking-tighter transition-colors duration-500",
                        isActive ? "text-orange-600" : "text-slate-800"
                    )}>{value || 0}</h3>
                    {isActive && (
                        <div className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />
                    )}
                </div>
            </div>
        </CardContent>
    </Card>
);

const StoreIcon = (props: any) => (
    <svg 
        {...props} 
        xmlns="http://www.w3.org/2000/svg" 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
    >
        <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
        <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
        <path d="M2 7h20" />
        <path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7" />
    </svg>
);
