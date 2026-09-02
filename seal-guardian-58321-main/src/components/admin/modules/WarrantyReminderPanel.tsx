import { useState, useEffect, useRef } from "react";
import api, { getErrorMessage } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Loader2, BellRing, Send, Ban, AlertTriangle, CheckCircle2 } from "lucide-react";

interface ReminderSettings {
    enabled: boolean;
    firstReminderAfterDays: number;
    repeatEveryDays: number;
    maxReminders: number;
    remindCustomer: boolean;
    remindStore: boolean;
    includeUnclassified: boolean;
    initialRunAt: string | null;
}

interface Preview {
    warranties: number;
    withCustomerPhone: number;
    withStorePhone: number;
    unclassifiedIncluded: number;
    oldestRejection: string | null;
    newestRejection: string | null;
    excluded: { dealerRejected: number; unclassified: number; alreadyResubmitted: number };
}

interface Progress {
    mode: 'initial' | 'scheduled';
    total: number;
    processed: number;
    sent: number;
    failed: number;
    skipped: number;
    status: 'running' | 'completed' | 'aborted';
}

const fmtDate = (v: string | null) =>
    v ? new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

/**
 * Schedule and one-time catch-up for rejection reminders.
 *
 * The catch-up is the only control here that can message thousands of people in
 * one go, so it shows what it is about to do, asks for confirmation, and can be
 * stopped mid-run.
 */
export const WarrantyReminderPanel = () => {
    const { toast } = useToast();
    const [settings, setSettings] = useState<ReminderSettings | null>(null);
    const [preview, setPreview] = useState<Preview | null>(null);
    const [progress, setProgress] = useState<Progress | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [testPhone, setTestPhone] = useState("");
    const [testUid, setTestUid] = useState("");
    const [testing, setTesting] = useState(false);
    const poll = useRef<ReturnType<typeof setInterval> | null>(null);

    const load = async () => {
        try {
            const res = await api.get("/admin/warranty-reminders");
            setSettings(res.data.settings);
            setPreview(res.data.preview);
            setProgress(res.data.progress || null);
        } catch (error: any) {
            toast({
                title: "Could not load reminder settings",
                description: getErrorMessage(error, "Failed to load"),
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    // Only poll while something is actually running.
    useEffect(() => {
        const running = progress?.status === 'running';
        if (running && !poll.current) {
            poll.current = setInterval(async () => {
                try {
                    const res = await api.get("/admin/warranty-reminders/progress");
                    setProgress(res.data.progress || null);
                    if (res.data.progress?.status !== 'running') load();
                } catch { /* transient — the next tick retries */ }
            }, 2000);
        }
        if (!running && poll.current) {
            clearInterval(poll.current);
            poll.current = null;
        }
        return () => {
            if (poll.current) { clearInterval(poll.current); poll.current = null; }
        };
    }, [progress?.status]);

    const save = async (updates: Partial<ReminderSettings>) => {
        if (!settings) return;
        const previous = settings;
        setSettings({ ...settings, ...updates });
        setSaving(true);
        try {
            const res = await api.put("/admin/warranty-reminders", updates);
            setSettings(res.data.settings);
        } catch (error: any) {
            setSettings(previous);
            toast({
                title: "Could not save",
                description: getErrorMessage(error, "Failed to update reminder settings"),
                variant: "destructive"
            });
        } finally {
            setSaving(false);
        }
    };

    const runInitial = async () => {
        setConfirmOpen(false);
        try {
            const res = await api.post("/admin/warranty-reminders/run-initial");
            toast({ title: "Catch-up started", description: res.data.message });
            setProgress({ mode: 'initial', total: res.data.preview.warranties, processed: 0, sent: 0, failed: 0, skipped: 0, status: 'running' });
        } catch (error: any) {
            toast({ title: "Could not start", description: getErrorMessage(error, "Failed to start"), variant: "destructive" });
        }
    };

    const sendTest = async () => {
        setTesting(true);
        try {
            const res = await api.post("/admin/warranty-reminders/test", {
                phone: testPhone.trim(),
                uid: testUid.trim() || undefined
            });
            toast({
                title: res.data.success ? "Test sent" : "Not sent",
                description: res.data.message,
                variant: res.data.success ? undefined : "destructive"
            });
        } catch (error: any) {
            toast({
                title: "Test failed",
                description: getErrorMessage(error, "Could not send the test message"),
                variant: "destructive"
            });
        } finally {
            setTesting(false);
        }
    };

    const abort = async () => {
        try {
            const res = await api.post("/admin/warranty-reminders/abort");
            toast({ title: res.data.success ? "Stopping" : "Nothing running", description: res.data.message });
        } catch (error: any) {
            toast({ title: "Could not stop", description: getErrorMessage(error, "Failed"), variant: "destructive" });
        }
    };

    if (loading) {
        return (
            <Card className="border-orange-100 shadow-sm">
                <CardContent className="flex items-center justify-center py-10">
                    <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
                </CardContent>
            </Card>
        );
    }

    if (!settings) return null;

    const running = progress?.status === 'running';
    const pct = progress && progress.total > 0
        ? Math.round((progress.processed / progress.total) * 100)
        : 0;

    const numberField = (
        label: string,
        field: 'firstReminderAfterDays' | 'repeatEveryDays' | 'maxReminders',
        hint: string,
        min: number,
        max: number
    ) => (
        <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600">{label}</label>
            <Input
                type="number"
                min={min}
                max={max}
                value={settings[field]}
                disabled={saving}
                onChange={e => setSettings({ ...settings, [field]: Number(e.target.value) })}
                onBlur={e => {
                    const n = Math.min(max, Math.max(min, Math.round(Number(e.target.value) || min)));
                    save({ [field]: n } as Partial<ReminderSettings>);
                }}
                className="h-9 tabular-nums"
            />
            <p className="text-[11px] text-slate-400 leading-snug">{hint}</p>
        </div>
    );

    return (
        <Card className="border-orange-100 shadow-sm">
            <CardHeader className="pb-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500">
                            <BellRing className="h-5 w-5" />
                        </div>
                        <div>
                            <CardTitle className="text-[15px] font-bold leading-tight">Rejection Reminders</CardTitle>
                            <CardDescription className="text-xs mt-0.5">
                                Chases warranties HO rejected that nobody has corrected. Head-office rejections only —
                                a warranty the dealer turned down is never chased.
                            </CardDescription>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[11px] font-bold uppercase tracking-wider ${settings.enabled ? "text-emerald-600" : "text-slate-400"}`}>
                            {settings.enabled ? "On" : "Off"}
                        </span>
                        <Switch checked={settings.enabled} disabled={saving} onCheckedChange={v => save({ enabled: v })} />
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-5 pt-0">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {numberField("Reminder time", "firstReminderAfterDays", "Days after rejection before the first reminder.", 1, 180)}
                    {numberField("Repeat days", "repeatEveryDays", "Gap between reminders after the first.", 1, 180)}
                    {numberField("Repeat attempts", "maxReminders", "Total reminders one warranty may ever get.", 1, 10)}
                </div>

                <div className="flex flex-wrap gap-5 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <Switch checked={settings.remindCustomer} disabled={saving} onCheckedChange={v => save({ remindCustomer: v })} />
                        <span className="text-xs font-bold text-slate-600">Remind the customer</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <Switch checked={settings.remindStore} disabled={saving} onCheckedChange={v => save({ remindStore: v })} />
                        <span className="text-xs font-bold text-slate-600">Remind the dealer</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <Switch checked={settings.includeUnclassified} disabled={saving} onCheckedChange={v => save({ includeUnclassified: v })} />
                        <span className="text-xs font-bold text-slate-600">Include unattributed rejections</span>
                    </label>
                </div>
                {settings.includeUnclassified && (preview?.unclassifiedIncluded || 0) > 0 && (
                    <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                        <span className="font-semibold tabular-nums">{preview?.unclassifiedIncluded}</span> of the warranties
                        below are older rejections where the records don't show whether head office or the dealer rejected
                        them. They're being chased because this switch is on.
                    </p>
                )}

                {/* Test send — the only way to see the finished message without
                    messaging a real customer. */}
                <div className="rounded-xl border border-sky-100 bg-sky-50/60 p-4 space-y-2">
                    <p className="text-sm font-bold text-slate-700">Send yourself a test</p>
                    <p className="text-xs text-slate-500">
                        Sends both messages — customer and dealer version — to one number, built from a real
                        rejected warranty. Nobody else is messaged and nothing is counted, so the warranty
                        still gets its proper reminder later.
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                        <Input
                            value={testPhone}
                            onChange={e => setTestPhone(e.target.value)}
                            placeholder="Your mobile number"
                            className="h-9 max-w-[220px]"
                        />
                        <Input
                            value={testUid}
                            onChange={e => setTestUid(e.target.value)}
                            placeholder="UID (optional)"
                            className="h-9 max-w-[200px]"
                        />
                        <Button
                            size="sm"
                            variant="outline"
                            disabled={testing || !testPhone.trim()}
                            onClick={sendTest}
                            className="h-9 border-sky-200 text-sky-700"
                        >
                            {testing
                                ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                                : <Send className="h-3.5 w-3.5 mr-1.5" />}
                            Send test
                        </Button>
                    </div>
                </div>

                {/* One-time catch-up over the existing backlog */}
                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 space-y-3">
                    {settings.initialRunAt ? (
                        <div className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-bold text-slate-700">Catch-up done</p>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    The existing backlog was reminded on {fmtDate(settings.initialRunAt)}. From here the
                                    schedule above handles everything, including newly rejected warranties.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-start gap-2">
                                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-bold text-slate-700">One-time catch-up not yet run</p>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        The schedule stays parked until this is done, so switching it on can't fire the
                                        whole backlog by itself. This sends to everyone currently waiting, once.
                                    </p>
                                </div>
                            </div>

                            {preview && (
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                                    <div className="rounded-lg bg-white border border-slate-100 p-2">
                                        <p className="text-lg font-black text-slate-800 tabular-nums">{preview.warranties}</p>
                                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Warranties</p>
                                    </div>
                                    <div className="rounded-lg bg-white border border-slate-100 p-2">
                                        <p className="text-lg font-black text-slate-800 tabular-nums">{preview.withCustomerPhone}</p>
                                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Customers</p>
                                    </div>
                                    <div className="rounded-lg bg-white border border-slate-100 p-2">
                                        <p className="text-lg font-black text-slate-800 tabular-nums">{preview.withStorePhone}</p>
                                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Dealers</p>
                                    </div>
                                    <div className="rounded-lg bg-white border border-slate-100 p-2">
                                        <p className="text-xs font-bold text-slate-700 leading-tight pt-1">{fmtDate(preview.oldestRejection)}</p>
                                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mt-1">Oldest</p>
                                    </div>
                                </div>
                            )}

                            {preview && (
                                <p className="text-[11px] text-slate-400 leading-snug">
                                    Not included: <span className="font-semibold">{preview.excluded.dealerRejected}</span> rejected by the dealer,{" "}
                                    <span className="font-semibold">{preview.excluded.alreadyResubmitted}</span> already resubmitted
                                    {!settings.includeUnclassified && (
                                        <>, <span className="font-semibold">{preview.excluded.unclassified}</span> where who rejected it couldn't be established</>
                                    )}.
                                </p>
                            )}

                            <Button
                                size="sm"
                                disabled={running || !preview || preview.warranties === 0}
                                onClick={() => setConfirmOpen(true)}
                                className="bg-orange-500 hover:bg-orange-600 h-9"
                            >
                                <Send className="h-3.5 w-3.5 mr-1.5" />
                                Run the one-time catch-up
                            </Button>
                        </>
                    )}

                    {progress && (
                        <div className="pt-1 space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-slate-600">
                                    {running ? "Sending…" : progress.status === 'aborted' ? "Stopped" : "Finished"}
                                    {" "}<span className="tabular-nums font-normal text-slate-400">
                                        {progress.processed}/{progress.total}
                                    </span>
                                </span>
                                {running && (
                                    <Button size="sm" variant="outline" onClick={abort} className="h-7 text-xs border-rose-200 text-rose-600">
                                        <Ban className="h-3 w-3 mr-1" /> Stop
                                    </Button>
                                )}
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                                <div className="h-full bg-orange-500 transition-all" style={{ width: `${pct}%` }} />
                            </div>
                            <p className="text-[11px] text-slate-400 tabular-nums">
                                {progress.sent} sent · {progress.failed} failed · {progress.skipped} had no number
                            </p>
                        </div>
                    )}
                </div>
            </CardContent>

            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Send reminders to the whole backlog?</AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-2 text-sm">
                                <p>
                                    This sends up to{" "}
                                    <span className="font-bold text-slate-800 tabular-nums">
                                        {(preview?.withCustomerPhone || 0) + (preview?.withStorePhone || 0)}
                                    </span>{" "}
                                    WhatsApp messages across{" "}
                                    <span className="font-bold text-slate-800 tabular-nums">{preview?.warranties || 0}</span>{" "}
                                    warranties, some rejected as long ago as {fmtDate(preview?.oldestRejection || null)}.
                                </p>
                                <p className="text-slate-500">
                                    It can only be run once, and messages already sent cannot be recalled. You can stop it
                                    part-way, but whatever has gone out stays out.
                                </p>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={runInitial} className="bg-orange-500 hover:bg-orange-600">
                            Send them
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    );
};
