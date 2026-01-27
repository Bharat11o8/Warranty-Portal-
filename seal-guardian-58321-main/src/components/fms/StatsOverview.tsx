import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    TrendingUp,
    ShieldCheck,
    Users,
    AlertCircle,
    ArrowUpRight,
    ArrowDownRight,
    Clock,
    CheckCircle2,
    XCircle,
    Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface StatCardProps {
    title: string;
    value: number | string;
    change?: string;
    trend?: 'up' | 'down';
    icon: any;
    color?: string;
    description?: string;
}

const StatCard = ({ title, value, change, trend, icon: Icon, color, description, type }: StatCardProps & { type?: 'red' | 'blue' | 'purple' | 'slate' }) => {
    const isRed = type === 'red';
    const isBlue = type === 'blue';
    const isPurple = type === 'purple';

    return (
        <div className={cn(
            "relative group flex items-center gap-6 p-6 md:p-8 min-h-[160px] rounded-[32px] border transition-all duration-500 hover:shadow-2xl overflow-hidden",
            isRed ? "border-red-50 bg-gradient-to-br from-red-50/50 to-white hover:shadow-red-500/5 shadow-sm" :
                isBlue ? "border-blue-100 bg-gradient-to-r from-white via-white to-blue-50/30 hover:shadow-blue-500/10" :
                    isPurple ? "border-purple-100 bg-gradient-to-r from-white via-white to-purple-50/30 hover:shadow-purple-500/10" :
                        "border-slate-100 bg-gradient-to-r from-white via-white to-slate-50/30 hover:shadow-slate-500/10"
        )}>
            {/* Background Decorations */}
            <div className={cn(
                "absolute top-0 right-0 w-40 h-40 rounded-full blur-2xl -mr-16 -mt-16 group-hover:scale-125 transition-transform duration-700",
                isRed ? "bg-red-100/40" : isBlue ? "bg-blue-100/40" : isPurple ? "bg-purple-100/40" : "bg-slate-100/40"
            )} />

            {/* Icon Container */}
            <div className="relative shrink-0">
                <div className={cn(
                    "w-20 h-20 md:w-24 md:h-24 rounded-3xl border flex items-center justify-center shadow-lg transition-all duration-500 group-hover:scale-105",
                    isRed ? "bg-red-50 border-red-100 shadow-none text-red-500" :
                        isBlue ? "bg-blue-50 border-blue-200/60 shadow-blue-500/10" :
                            isPurple ? "bg-purple-50 border-purple-200/60 shadow-purple-500/10" :
                                "bg-slate-50 border-slate-200/60 shadow-slate-500/10"
                )}>
                    <Icon className={cn(
                        "h-8 w-8 md:h-10 md:w-10 transition-transform duration-500 group-hover:scale-110",
                        isRed ? "text-red-500" : isBlue ? "text-blue-500" : isPurple ? "text-purple-500" : "text-slate-500"
                    )} />
                </div>
                {change && (
                    <div className={cn(
                        "absolute -top-2 -right-2 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-full shadow-lg",
                        trend === 'up' ? "bg-green-500 text-white shadow-green-500/30" : "bg-red-500 text-white shadow-red-500/30"
                    )}>
                        {change}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 text-left relative z-10">
                <div className="flex items-center gap-3 mb-3">
                    {/* Red Vertical Bar for Red Card */}
                    {isRed && <div className="h-8 w-1 bg-red-500 rounded-full" />}

                    {!isRed && (
                        <div className={cn(
                            "w-1 h-6 rounded-full",
                            isBlue ? "bg-blue-500" : isPurple ? "bg-purple-500" : "bg-slate-500"
                        )} />
                    )}
                    <span className={cn(
                        "text-[10px] font-bold uppercase tracking-[0.2em] leading-tight",
                        isRed ? "text-red-500" : isBlue ? "text-blue-500" : isPurple ? "text-purple-500" : "text-slate-500"
                    )}>{title}</span>
                </div>
                <h3 className="text-3xl font-black text-slate-900 tracking-tighter leading-none mb-2">{value}</h3>
                <p className="text-xs text-slate-500 font-medium leading-tight">{description}</p>
            </div>
        </div>
    );
};

const cn = (...classes: string[]) => classes.filter(Boolean).join(' ');

export const StatsOverview = ({ stats, recentActivity = [] }: { stats: any, recentActivity?: any[] }) => {
    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Primary Stats Grid */}
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    title="Total Entries"
                    value={stats.total || "0"}
                    change="+14%"
                    trend="up"
                    icon={Activity}
                    type="slate"
                    description="Lifetime warranty applications under your portal"
                />
                <StatCard
                    title="Verified Done"
                    value={stats.approved || "0"}
                    change="+8%"
                    trend="up"
                    icon={ShieldCheck}
                    type="red"
                    description="Warranties approved and secured for longevity"
                />
                <StatCard
                    title="Action Needed"
                    value={stats.pending || "0"}
                    icon={Clock}
                    type="blue"
                    description="Awaiting your professional verification"
                />
                <StatCard
                    title="Field Fleet"
                    value={stats.manpower || "0"}
                    change="+1"
                    trend="up"
                    icon={Users}
                    type="purple"
                    description="Active trained applicators in your team"
                />
            </div>

            {/* Analytics Visualization Section */}
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
                {/* Performance Visualization */}
                <Card className="lg:col-span-2 border-border/40 shadow-xl shadow-primary/5 bg-card/40 backdrop-blur-md overflow-hidden group">
                    <CardHeader className="flex flex-row items-center justify-between border-b border-border/10 pb-6">
                        <div>
                            <CardTitle className="text-lg font-black uppercase tracking-widest text-foreground/80">Monthly Performance</CardTitle>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight mt-1">Comparing current month vs targets</p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="rounded-xl h-8 text-[10px] font-bold uppercase tracking-widest border-border/40">Full Analytics</Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8">
                        <div className="h-[280px] w-full bg-primary/5 border-dashed border-2 border-primary/10 rounded-3xl flex flex-col items-center justify-center relative group-hover:bg-primary/[0.07] transition-all duration-500 overflow-hidden">
                            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_50%_0%,rgba(var(--primary-rgb),0.3),transparent)]" />
                            <TrendingUp className="h-16 w-16 text-primary/10 mb-4 animate-pulse" />
                            <p className="text-[11px] font-black text-primary/30 uppercase tracking-[0.3em]">Processing Live Trends...</p>

                            {/* Decorative background grid */}
                            <div className="absolute inset-0 grid grid-cols-12 pointer-events-none opacity-20">
                                {[...Array(12)].map((_, i) => <div key={i} className="border-r border-primary/10 h-full w-full" />)}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Real-time Event Feed */}
                <Card className="border-border/40 shadow-xl shadow-primary/5 bg-card/40 backdrop-blur-md overflow-hidden">
                    <CardHeader className="border-b border-border/10 pb-6">
                        <CardTitle className="text-lg font-black uppercase tracking-widest text-foreground/80">Live Activity</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-border/10">
                            {recentActivity.length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground text-xs">No recent activity</div>
                            ) : (
                                recentActivity.map((item, i) => (
                                    <div key={i} className="p-5 flex gap-4 hover:bg-primary/5 transition-colors cursor-default group/item">
                                        <div className={cn(
                                            "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border transition-all duration-500 group-hover/item:scale-110",
                                            item.status === 'primary' ? "bg-primary/10 border-primary/20 text-primary" :
                                                item.status === 'success' ? "bg-green-500/10 border-green-500/20 text-green-600" :
                                                    item.status === 'warning' ? "bg-amber-500/10 border-amber-500/20 text-amber-600" : "bg-slate-500/10 border-slate-500/20 text-slate-600"
                                        )}>
                                            {item.status === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <Activity className="h-5 w-5" />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-foreground/80 tracking-tight">{item.action}</p>
                                            <p className="text-[11px] font-bold text-muted-foreground mt-0.5">{item.sub}</p>
                                            <p className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-widest mt-1">{item.time}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="p-4 bg-muted/20">
                            <Button variant="ghost" className="w-full text-[10px] font-black uppercase tracking-[0.2em] text-primary hover:bg-primary/10 h-10">
                                View System Logs
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
