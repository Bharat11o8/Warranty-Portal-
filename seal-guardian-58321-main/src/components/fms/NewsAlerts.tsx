import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, Calendar, ChevronRight, Info, Megaphone, Zap } from "lucide-react";

export const NewsAlerts = () => {
    const alerts = [
        {
            id: 1,
            type: 'broadcast',
            title: 'New Sun Protection series launched!',
            date: '2026-01-10',
            priority: 'high',
            summary: 'Introducing the Ultra-Cool Pro series with 99% heat rejection. Marketing collateral now available for order.'
        },
        {
            id: 2,
            type: 'update',
            title: 'Dashboard Performance Improvements',
            date: '2026-01-08',
            priority: 'medium',
            summary: 'We have optimized the registration flow. You can now use auto-formatting for vehicle numbers.'
        },
        {
            id: 3,
            type: 'alert',
            title: 'Holiday Notice: Head Office Closed',
            date: '2026-01-05',
            priority: 'low',
            summary: 'Orders placed on 15th January will be processed on the next working day.'
        }
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold">Announcements</h2>
                    <p className="text-sm text-muted-foreground">Stay updated with latest news and headquarters alerts.</p>
                </div>
                <Badge variant="outline" className="rounded-full px-4 h-9 font-bold bg-primary/5 border-primary/20 text-primary">
                    3 Items Unread
                </Badge>
            </div>

            <div className="space-y-4">
                {alerts.map((alert) => (
                    <Card key={alert.id} className="group hover:shadow-lg transition-all border-border/40 overflow-hidden bg-card/60 backdrop-blur-sm">
                        <CardContent className="p-0">
                            <div className="flex">
                                <div className={cn(
                                    "w-2 shrink-0",
                                    alert.priority === 'high' ? "bg-destructive" : alert.priority === 'medium' ? "bg-amber-500" : "bg-blue-500"
                                )} />
                                <div className="p-6 flex-1 flex items-start gap-6">
                                    <div className={cn(
                                        "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 border",
                                        alert.type === 'broadcast' ? "bg-purple-500/5 border-purple-500/10 text-purple-600" :
                                            alert.type === 'update' ? "bg-green-500/5 border-green-500/10 text-green-600" : "bg-blue-500/5 border-blue-500/10 text-blue-600"
                                    )}>
                                        {alert.type === 'broadcast' ? <Megaphone className="h-6 w-6" /> : alert.type === 'update' ? <Zap className="h-6 w-6" /> : <Info className="h-6 w-6" />}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-lg font-bold group-hover:text-primary transition-colors">{alert.title}</h3>
                                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                                <Calendar className="h-3.5 w-3.5" />
                                                <span className="text-xs font-medium">{new Date(alert.date).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{alert.summary}</p>
                                        <button className="mt-4 text-xs font-black uppercase tracking-widest text-primary flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                            Read Details <ChevronRight className="h-3 w-3" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};

const cn = (...classes: string[]) => classes.filter(Boolean).join(' ');
