import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, Legend 
} from 'recharts';
import { 
    Users, ShieldCheck, MessageSquare, Package, 
    TrendingUp, TrendingDown, Activity, MapPin 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminModule } from '../layout/AdminSidebar';

const COLORS = ['#f97316', '#3b82f6', '#10b981', '#6366f1', '#ec4899', '#f59e0b'];

export const AdminAnalytics = ({ onNavigate }: { onNavigate: (module: AdminModule) => void }) => {
    const [summary, setSummary] = useState<any>(null);
    const [timeSeries, setTimeSeries] = useState<any>(null);
    const [products, setProducts] = useState<any[]>([]);
    const [franchises, setFranchises] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [sumRes, timeRes, prodRes, franRes] = await Promise.all([
                api.get('/admin/analytics/summary'),
                api.get('/admin/analytics/time-series'),
                api.get('/admin/analytics/products'),
                api.get('/admin/analytics/franchises')
            ]);

            setSummary(sumRes.data.data);
            setTimeSeries(timeRes.data.data);
            setProducts(prodRes.data.data);
            setFranchises(franRes.data.data);
        } catch (error) {
            console.error('Failed to fetch analytics data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-8 animate-pulse">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => (
                        <Skeleton key={i} className="h-32 rounded-3xl" />
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <Skeleton className="h-[400px] rounded-3xl" />
                    <Skeleton className="h-[400px] rounded-3xl" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-10 pb-20">
            {/* Top Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard 
                    title="Total Franchises" 
                    value={summary?.franchise?.total} 
                    icon={StoreIcon} 
                    trend="+12%" 
                    trendUp={true}
                    description="Total registered partners"
                    onClick={() => onNavigate('vendors')}
                    details={[
                        { label: 'Approved', value: summary?.franchise?.approved, color: 'text-emerald-500' },
                        { label: 'Pending', value: summary?.franchise?.pending, color: 'text-amber-500' },
                        { label: 'Rejected', value: summary?.franchise?.disapproved, color: 'text-rose-500' },
                        { label: 'In Warranty', value: summary?.participation?.warranty_participation, color: 'text-blue-500' },
                        { label: 'In Grievance', value: summary?.participation?.grievance_participation, color: 'text-red-500' },
                        { label: 'In POSM', value: summary?.participation?.posm_participation, color: 'text-purple-500' }
                    ]}
                />
                <StatsCard 
                    title="Warranty Management" 
                    value={summary?.warranty?.total} 
                    icon={ShieldCheck} 
                    trend="84%" 
                    description="Total applications"
                    onClick={() => onNavigate('warranties')}
                    details={[
                        { label: 'Validated', value: summary?.warranty?.validated, color: 'text-emerald-500' },
                        { label: 'Pending Admin', value: summary?.warranty?.pending_admin, color: 'text-amber-500' },
                        { label: 'Pending Vendor', value: summary?.warranty?.pending_vendor, color: 'text-blue-500' },
                        { label: 'Rejected', value: summary?.warranty?.rejected, color: 'text-rose-500' }
                    ]}
                />
                <StatsCard 
                    title="Grievance Rate" 
                    value={summary?.other?.total_grievances} 
                    icon={MessageSquare} 
                    trend="-5%" 
                    trendUp={false}
                    description="Support tickets raised"
                    onClick={() => onNavigate('grievances')}
                    details={[
                        { label: 'Active Tickets', value: summary?.other?.total_grievances, color: 'text-slate-600' },
                        { label: 'Participating', value: summary?.participation?.grievance_participation, color: 'text-red-500' }
                    ]}
                />
                <StatsCard 
                    title="POSM Requests" 
                    value={summary?.other?.total_posm} 
                    icon={Package} 
                    trend="+18%" 
                    trendUp={true}
                    description="Materials requested"
                    onClick={() => onNavigate('posm')}
                    details={[
                        { label: 'Open Requests', value: summary?.other?.total_posm, color: 'text-slate-600' },
                        { label: 'Participating', value: summary?.participation?.posm_participation, color: 'text-purple-500' }
                    ]}
                />
            </div>

            {/* Main Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Warranty Trend Line Chart */}
                <Card className="rounded-[32px] border-orange-50 shadow-[0_15px_40px_rgba(0,0,0,0.02)] overflow-hidden">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                            <Activity className="h-5 w-5 text-orange-500" />
                            Registration Trends
                        </CardTitle>
                        <CardDescription>Monthly warranty registration volume</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px] pt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={timeSeries?.warranties}>
                                <defs>
                                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#64748b'}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#64748b'}} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} 
                                />
                                <Area type="monotone" dataKey="total" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                                <Area type="monotone" dataKey="approved" stroke="#10b981" strokeWidth={3} fillOpacity={0} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Product Distribution Bar Chart */}
                <Card className="rounded-[32px] border-orange-50 shadow-[0_15px_40px_rgba(0,0,0,0.02)] overflow-hidden">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                            <Package className="h-5 w-5 text-blue-500" />
                            Top Product Variations
                        </CardTitle>
                        <CardDescription>Performance of specific seat covers & PPF grades</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px] pt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={products?.slice(0, 8)}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="product_name" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 700, fill: '#64748b'}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#64748b'}} />
                                <Tooltip 
                                    cursor={{fill: '#fff7ed'}}
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} 
                                />
                                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                                    {products?.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Bottom Row - Franchise Participation */}
            <Card className="rounded-[40px] border-orange-50 shadow-[0_15px_40px_rgba(0,0,0,0.02)]">
                <CardHeader>
                    <CardTitle className="text-2xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-orange-50 flex items-center justify-center">
                            <Users className="h-5 w-5 text-orange-500" />
                        </div>
                        Franchise Participation Leaderboard
                    </CardTitle>
                    <CardDescription>Detailed activity across all system modules by verified franchises</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-50">
                                    <th className="py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 px-4">Franchise Name</th>
                                    <th className="py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 px-4">Location</th>
                                    <th className="py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 px-4 text-center">Warranties</th>
                                    <th className="py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 px-4 text-center">Grievances</th>
                                    <th className="py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 px-4 text-center">POSM</th>
                                    <th className="py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 px-4 text-right">Score</th>
                                </tr>
                            </thead>
                            <tbody>
                                {franchises?.map((f) => (
                                    <tr key={f.id} className="border-b border-slate-50/50 hover:bg-slate-50/50 transition-colors group">
                                        <td className="py-4 px-4 font-bold text-slate-700 text-sm">{f.store_name}</td>
                                        <td className="py-4 px-4 text-xs text-slate-500 font-medium">
                                            <div className="flex items-center gap-1">
                                                <MapPin className="h-3 w-3" />
                                                {f.city}, {f.state}
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 text-center">
                                            <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black tracking-tight border border-blue-100">
                                                {f.warranty_count}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 text-center">
                                            <span className="px-2.5 py-1 rounded-full bg-red-50 text-red-600 text-[10px] font-black tracking-tight border border-red-100">
                                                {f.grievance_count}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 text-center">
                                            <span className="px-2.5 py-1 rounded-full bg-purple-50 text-purple-600 text-[10px] font-black tracking-tight border border-purple-100">
                                                {f.posm_count}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 text-right">
                                            <span className="font-black text-slate-800 text-sm">
                                                {(f.warranty_count * 10 + f.posm_count * 5 - f.grievance_count * 2).toFixed(0)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

const StatsCard = ({ title, value, icon: Icon, trend, trendUp, description, onClick, details }: any) => (
    <Card 
        onClick={onClick}
        className={`rounded-3xl border-orange-50 shadow-[0_10px_30px_rgba(0,0,0,0.02)] overflow-hidden transition-all duration-300 ${onClick ? 'cursor-pointer hover:border-orange-200 hover:shadow-[0_20px_50px_rgba(249,115,22,0.05)]' : ''}`}
    >
        <CardContent className="p-6">
            <div className="flex justify-between items-start">
                <div className="p-3 rounded-2xl bg-slate-50 text-slate-400 group-hover:bg-orange-50 group-hover:text-orange-500 transition-colors">
                    <Icon className="h-5 w-5" />
                </div>
                {trend && (
                    <div className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-tight ${trendUp === undefined ? 'text-blue-500' : trendUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {trendUp === true && <TrendingUp className="h-3 w-3" />}
                        {trendUp === false && <TrendingDown className="h-3 w-3" />}
                        {trend}
                    </div>
                )}
            </div>
            
            <div className="mt-4 space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{title}</p>
                <h3 className="text-3xl font-black text-slate-800 tracking-tighter">{value || 0}</h3>
                <p className="text-[10px] font-bold text-slate-500/60 mb-4">{description}</p>
            </div>

            {/* Always Visible Details Breakdown */}
            {details && (
                <div className="mt-6 border-t border-slate-50 pt-4">
                    <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                        {details.map((item: any, idx: number) => (
                            <div key={idx} className="flex flex-col">
                                <span className="text-[9px] font-black uppercase tracking-tighter text-slate-400 leading-none mb-1">{item.label}</span>
                                <span className={`text-sm font-black ${item.color || 'text-slate-700'}`}>{item.value || 0}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
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
