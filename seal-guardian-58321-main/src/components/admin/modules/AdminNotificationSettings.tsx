import { useState, useEffect } from "react";
import api, { getErrorMessage } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
    Loader2, MessageSquare, RefreshCw, AlertTriangle, CheckCircle2, PowerOff
} from "lucide-react";

interface NotificationTypeRow {
    key: string;
    label: string;
    group: string;
    template: string;
    recipient: string;
    description: string;
    enabled: boolean;
    templateApproved: boolean;
    stats: {
        total: number;
        failed: number;
        delivered: number;
        lastSent: string | null;
    };
}

export const AdminNotificationSettings = () => {
    const { toast } = useToast();
    const [types, setTypes] = useState<NotificationTypeRow[]>([]);
    const [masterEnabled, setMasterEnabled] = useState(true);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);

    const fetchSettings = async (showToast = false) => {
        try {
            const res = await api.get("/admin/notification-settings");
            setTypes(res.data.types || []);
            setMasterEnabled(Boolean(res.data.masterEnabled));
            if (showToast) toast({ title: "Refreshed" });
        } catch (error: any) {
            toast({
                title: "Could not load settings",
                description: getErrorMessage(error, "Failed to load notification settings"),
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchSettings(); }, []);

    const toggle = async (row: NotificationTypeRow, next: boolean) => {
        setSaving(row.key);
        // Optimistic — revert if the save fails.
        setTypes(prev => prev.map(t => t.key === row.key ? { ...t, enabled: next } : t));
        try {
            await api.put("/admin/notification-settings", { updates: { [row.key]: next } });
            toast({
                title: next ? "Messages turned on" : "Messages turned off",
                description: `${row.label} — takes effect within 30 seconds.`
            });
        } catch (error: any) {
            setTypes(prev => prev.map(t => t.key === row.key ? { ...t, enabled: !next } : t));
            toast({
                title: "Could not save",
                description: getErrorMessage(error, "Failed to update setting"),
                variant: "destructive"
            });
        } finally {
            setSaving(null);
        }
    };

    const groups = Array.from(new Set(types.map(t => t.group)));

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* Master kill-switch state — a per-type toggle means nothing if this is off */}
            {!masterEnabled && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-rose-50 border border-rose-200">
                    <PowerOff className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-bold text-rose-800">WhatsApp is switched off globally</p>
                        <p className="text-xs text-rose-700 mt-0.5">
                            No WhatsApp messages are being sent, whatever the switches below say.
                            This is the <code className="font-mono">ENABLE_WHATSAPP</code> server setting and can only be changed on the server.
                        </p>
                    </div>
                </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-500">
                        <MessageSquare className="h-5 w-5" />
                    </div>
                    <div>
                        <CardTitle className="text-[15px] font-bold leading-tight">WhatsApp Messages</CardTitle>
                        <CardDescription className="text-xs mt-0.5">
                            Turn individual message types on or off. Changes apply within 30 seconds — no deploy needed.
                        </CardDescription>
                    </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => fetchSettings(true)} className="h-9 border-slate-200">
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Refresh
                </Button>
            </div>

            {groups.map(group => (
                <Card key={group} className="border-orange-100 shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-xs font-black uppercase tracking-wider text-slate-400">
                            {group}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 pt-0">
                        {types.filter(t => t.group === group).map(row => (
                            <div
                                key={row.key}
                                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border transition-colors ${
                                    row.enabled ? "border-slate-100 bg-white" : "border-slate-100 bg-slate-50/70"
                                }`}
                            >
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className={`font-bold text-sm ${row.enabled ? "text-slate-800" : "text-slate-400"}`}>
                                            {row.label}
                                        </p>
                                        {!row.templateApproved && (
                                            <Badge className="bg-rose-100 text-rose-700 border-rose-200 gap-1">
                                                <AlertTriangle className="h-3 w-3" /> Template not approved
                                            </Badge>
                                        )}
                                        {row.templateApproved && row.stats.total === 0 && (
                                            <Badge variant="secondary" className="bg-slate-100 text-slate-500 border-none">
                                                Never sent
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-0.5">{row.description}</p>
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-400 mt-1">
                                        <span className="font-mono">{row.template}</span>
                                        <span>→ {row.recipient}</span>
                                        {row.stats.total > 0 && (
                                            <span className="tabular-nums">
                                                {row.stats.total} sent (30d)
                                                {row.stats.failed > 0 && (
                                                    <span className="text-rose-500 font-semibold"> · {row.stats.failed} failed</span>
                                                )}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 shrink-0">
                                    <span className={`text-[11px] font-bold uppercase tracking-wider ${
                                        row.enabled ? "text-emerald-600" : "text-slate-400"
                                    }`}>
                                        {row.enabled ? "On" : "Off"}
                                    </span>
                                    {saving === row.key
                                        ? <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
                                        : <Switch checked={row.enabled} onCheckedChange={v => toggle(row, v)} />}
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            ))}

            <div className="flex items-start gap-2 text-xs text-slate-400 px-1">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <p>
                    Templates themselves are created and approved in the Interakt dashboard, not here.
                    A message marked <span className="font-semibold text-rose-500">Template not approved</span> will
                    keep failing until it is approved there, even when switched on.
                </p>
            </div>
        </div>
    );
};
