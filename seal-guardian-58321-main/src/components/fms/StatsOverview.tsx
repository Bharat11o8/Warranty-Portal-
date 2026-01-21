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
    color: string;
    description?: string;
}

const StatCard = ({ title, value, change, trend, icon: Icon, color, description }: StatCardProps) => (
    <Card className="overflow-hidden hover:shadow-2xl transition-all duration-500 group border-border/40 shadow-sm bg-card/60 backdrop-blur-sm relative">
        <CardContent className="p-6">
            <div className="flex justify-between items-start">
                <div className={cn("p-3 rounded-2xl border-0 shadow-lg ring-4 ring-white/10", color)}>
                    <Icon className="h-6 w-6 text-white" />
                </div>
                {change && (
                    <div className={cn(
                        "flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-tighter",
                        trend === 'up' ? "bg-green-500/10 text-green-600 ring-1 ring-green-500/20" : "bg-red-500/10 text-red-600 ring-1 ring-red-500/20"
                    )}>
                        {trend === 'up' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                        {change}
                    </div>
                )}
            </div>
            <div className="mt-5">
                <h3 className="text-3xl font-black tracking-tighter text-foreground">{value}</h3>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] mt-1">{title}</p>
                {description && <p className="text-[10px] text-muted-foreground/60 mt-2 font-medium line-clamp-1">{description}</p>}
            </div>
            <div className="absolute -right-6 -bottom-6 opacity-5 group-hover:scale-110 group-hover:opacity-10 transition-all duration-700">
                <Icon className="h-28 w-28" />
            </div>
        </CardContent>
    </Card>
);

const cn = (...classes: string[]) => classes.filter(Boolean).join(' ');

export const StatsOverview = ({ stats, recentActivity = [] }: { stats: any, recentActivity?: any[] }) => {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Primary Stats Grid */}
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Registrations"
                    value={stats.total || "0"}
                    change="+14%"
                    trend="up"
                    icon={Activity}
                    color="bg-slate-800 shadow-slate-800/20"
                    description="Lifetime warranty applications"
                />
                <StatCard
                    title="Verified Work"
                    value={stats.approved || "0"}
                    change="+8%"
                    trend="up"
                    icon={ShieldCheck}
                    color="bg-green-600 shadow-green-600/20"
                    description="Approved by head office"
                />
                <StatCard
                    title="Awaiting Action"
                    value={stats.pending || "0"}
                    icon={Clock}
                    color="bg-blue-600 shadow-blue-600/20"
                    description="Requires your verification"
                />
                <StatCard
                    title="Field Experts"
                    value={stats.manpower || "0"}
                    change="+1"
                    trend="up"
                    icon={Users}
                    color="bg-purple-600 shadow-purple-600/20"
                    description="Active trained applicators"
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
