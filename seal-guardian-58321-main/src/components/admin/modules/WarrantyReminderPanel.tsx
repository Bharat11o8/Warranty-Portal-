import { useState, useEffect } from "react";
import api, { getErrorMessage } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

interface ReminderSettings {
    enabled: boolean;
    firstReminderAfterDays: number;
    repeatEveryDays: number;
    maxReminders: number;
    initialRunAt: string | null;
}

interface Preview {
    warranties: number;
}

/**
 * The schedule half of the Rejection Reminders section.
 *
 * Renders bare — no card of its own — because it sits inside the collapsible
 * section that also holds the two Rejection Reminder message types. Keeping the
 * schedule and the message switches in one place is deliberate: they used to be
 * in separate parts of the page, which made it possible to switch the schedule
 * on while the messages themselves were off and see nothing delivered.
 *
 * The one-time catch-up and the test-send control were taken off screen once the
 * backlog was cleared (283 messages across 143 warranties, 2 Sept 2026). Their
 * endpoints remain — POST /admin/warranty-reminders/test and .../run-initial —
 * so either can be put back with no server work. The catch-up refuses to repeat
 * itself regardless.
 */
export const WarrantyReminderSchedule = ({
    refreshKey = 0,
    onEnabledChange
}: {
    refreshKey?: number;
    onEnabledChange?: (enabled: boolean) => void;
}) => {
    const { toast } = useToast();
    const [settings, setSettings] = useState<ReminderSettings | null>(null);
    const [preview, setPreview] = useState<Preview | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const load = async () => {
        try {
            const res = await api.get("/admin/warranty-reminders");
            setSettings(res.data.settings);
            setPreview(res.data.preview);
            onEnabledChange?.(Boolean(res.data.settings?.enabled));
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

    useEffect(() => { load(); }, [refreshKey]);

    const save = async (updates: Partial<ReminderSettings>) => {
        if (!settings) return;
        const previous = settings;
        setSettings({ ...settings, ...updates });
        setSaving(true);
        try {
            const res = await api.put("/admin/warranty-reminders", updates);
            setSettings(res.data.settings);
            onEnabledChange?.(Boolean(res.data.settings?.enabled));
            load();
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

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
            </div>
        );
    }

    if (!settings) return null;

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
                disabled={saving || !settings.enabled}
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
        <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <p className="text-sm font-bold text-slate-700">Schedule</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Head-office rejections only — a warranty the dealer turned down is never chased.
                    </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[11px] font-bold uppercase tracking-wider ${settings.enabled ? "text-emerald-600" : "text-slate-400"}`}>
                        {settings.enabled ? "Running" : "Paused"}
                    </span>
                    <Switch checked={settings.enabled} disabled={saving} onCheckedChange={v => save({ enabled: v })} />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {numberField("Reminder time", "firstReminderAfterDays", "Days after rejection before the first reminder.", 1, 180)}
                {numberField("Repeat days", "repeatEveryDays", "Gap between reminders after the first.", 1, 180)}
                {numberField("Repeat attempts", "maxReminders", "Total reminders one warranty may ever get.", 1, 10)}
            </div>

            <p className="text-[11px] text-slate-400 leading-snug">
                {preview && preview.warranties > 0 ? (
                    <>
                        <span className="font-semibold tabular-nums text-slate-600">{preview.warranties}</span>
                        {preview.warranties === 1 ? " rejected warranty is" : " rejected warranties are"} waiting to be chased.
                    </>
                ) : "Nothing is waiting to be chased right now."}
                {" "}Who receives them is set by the two switches below.
            </p>
        </div>
    );
};
