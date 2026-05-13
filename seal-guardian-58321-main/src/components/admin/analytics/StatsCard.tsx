import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export const StatsCard = ({ title, value, icon: Icon, trend, trendUp, isActive, onClick }: any) => (
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

export const StoreIcon = (props: any) => (
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
