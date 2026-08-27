import { useState, useRef } from "react";
import api, { getErrorMessage } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Loader2, Upload, FileSpreadsheet, AlertTriangle, CheckCircle2, Link2, Store } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Upload the admin's own store list.
 *
 * A WhatsApp audit arrives carrying little more than the phone that sent it, so
 * a store the portal does not hold shows as "Unmatched" and can never be ticked
 * off a round. This list gives those responses a name and links them to a
 * franchise where one exists.
 *
 * The file is previewed before anything is written: a list of several hundred
 * stores is not worth importing blind, and a phone column mangled by Excel has
 * to be caught here rather than after the fact.
 */
interface Props {
    open: boolean;
    onClose: () => void;
    onUploaded: () => void;
}

interface Summary {
    totalRows: number;
    usable: number;
    skippedNoPhone: number;
    duplicatePhones: number;
    matchedByPhone: number;
    matchedByName: number;
    unmatched: number;
    willUpdate: number;
    willInsert: number;
}

export const AuditContactsUpload = ({ open, onClose, onUploaded }: Props) => {
    const { toast } = useToast();
    const fileRef = useRef<HTMLInputElement>(null);
    const [csv, setCsv] = useState<string>("");
    const [fileName, setFileName] = useState<string>("");
    const [summary, setSummary] = useState<Summary | null>(null);
    const [sample, setSample] = useState<any[]>([]);
    const [busy, setBusy] = useState(false);

    const reset = () => {
        setCsv(""); setFileName(""); setSummary(null); setSample([]);
        if (fileRef.current) fileRef.current.value = "";
    };

    const handleFile = async (file: File) => {
        const text = await file.text();
        setCsv(text);
        setFileName(file.name);
        setBusy(true);
        try {
            const res = await api.post("/admin/audit-contacts/preview", { csv: text });
            setSummary(res.data.summary);
            setSample(res.data.sample || []);
        } catch (error: any) {
            setSummary(null);
            toast({
                title: "Could not read that file",
                description: getErrorMessage(error, "Check the file and try again"),
                variant: "destructive",
            });
        } finally {
            setBusy(false);
        }
    };

    const commit = async () => {
        setBusy(true);
        try {
            const res = await api.post("/admin/audit-contacts", { csv, fileName });
            toast({
                title: "Store list saved",
                description: res.data?.message || "Contacts updated.",
            });
            reset();
            onUploaded();
            onClose();
        } catch (error: any) {
            toast({
                title: "Could not save",
                description: getErrorMessage(error, "Failed to save the store list"),
                variant: "destructive",
            });
        } finally {
            setBusy(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={v => { if (!v && !busy) { reset(); onClose(); } }}>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
                <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100 shrink-0">
                    <DialogTitle className="text-base flex items-center gap-2">
                        <FileSpreadsheet className="h-4 w-4 text-orange-500" /> Upload your store list
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                        Audits arrive with only a phone number. This list names them, so a store
                        the portal does not hold no longer shows as unmatched.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-5">
                    <input
                        ref={fileRef}
                        type="file"
                        accept=".csv,text/csv"
                        className="hidden"
                        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                    />

                    {!summary && (
                        <>
                            <label
                                htmlFor="audit-contacts-file"
                                onClick={() => fileRef.current?.click()}
                                className="border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 hover:border-orange-200 transition-all text-slate-400 hover:text-orange-500"
                            >
                                {busy
                                    ? <Loader2 className="h-8 w-8 mb-2 animate-spin text-orange-500" />
                                    : <Upload className="h-8 w-8 mb-2" />}
                                <span className="text-sm font-semibold">
                                    {busy ? "Reading…" : "Choose a CSV file"}
                                </span>
                                <span className="text-[11px] mt-1">A Google Contacts export works as-is</span>
                            </label>

                            {/* Excel silently destroys long numbers, and a list imported that
                                way is unrecoverable — so say it before, not after. */}
                            <div className="flex gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-100">
                                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                                <div className="text-[11px] text-amber-800 leading-relaxed">
                                    <p className="font-bold">Do not open the file in Excel first.</p>
                                    <p className="mt-0.5">
                                        Excel turns long phone numbers into <span className="font-mono">9.19811E+11</span>,
                                        which loses the real digits for good. Upload the file exactly as exported.
                                    </p>
                                </div>
                            </div>

                            <div className="text-[11px] text-slate-500 leading-relaxed">
                                <p className="font-bold text-slate-600 mb-1">Columns it understands</p>
                                <p>
                                    <span className="font-mono text-slate-700">Phone 1 - Value</span> or{" "}
                                    <span className="font-mono text-slate-700">phone</span> — required, everything else optional:{" "}
                                    store name, contact person, city, state, zone, ASM, brands, category.
                                </p>
                            </div>
                        </>
                    )}

                    {summary && (
                        <>
                            <div className="flex items-center gap-2 text-sm">
                                <FileSpreadsheet className="h-4 w-4 text-slate-400 shrink-0" />
                                <span className="font-semibold text-slate-700 truncate">{fileName}</span>
                                <button
                                    onClick={reset}
                                    className="ml-auto text-[11px] font-bold text-orange-600 hover:text-orange-700 shrink-0"
                                >
                                    Choose another
                                </button>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <Stat label="Rows read" value={summary.totalRows} tone="slate" />
                                <Stat label="Usable" value={summary.usable} tone="emerald" />
                                <Stat label="No phone" value={summary.skippedNoPhone} tone={summary.skippedNoPhone ? "amber" : "slate"} />
                            </div>

                            <div>
                                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
                                    Linking to the portal
                                </p>
                                <div className="space-y-1.5">
                                    <MatchRow icon={Link2} label="Matched a franchise by phone" value={summary.matchedByPhone} tone="text-emerald-600" />
                                    <MatchRow icon={Store} label="Matched by store name" value={summary.matchedByName} tone="text-blue-600" />
                                    <MatchRow icon={AlertTriangle} label="Not in the portal (kept as contacts)" value={summary.unmatched} tone="text-slate-500" />
                                </div>
                            </div>

                            <div className="flex gap-3 text-[11px] text-slate-500 pt-1">
                                <span><span className="font-bold text-slate-700">{summary.willInsert}</span> new</span>
                                <span><span className="font-bold text-slate-700">{summary.willUpdate}</span> will be updated</span>
                                {summary.duplicatePhones > 0 && (
                                    <span><span className="font-bold text-slate-700">{summary.duplicatePhones}</span> duplicate numbers merged</span>
                                )}
                            </div>

                            {sample.length > 0 && (
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
                                        First few rows
                                    </p>
                                    <div className="rounded-xl border border-slate-100 overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-xs">
                                                <thead className="bg-slate-50/70">
                                                    <tr className="text-left text-[10px] font-black uppercase tracking-wider text-slate-400">
                                                        <th className="p-2.5">Phone</th>
                                                        <th className="p-2.5">Store</th>
                                                        <th className="p-2.5">Contact</th>
                                                        <th className="p-2.5">City</th>
                                                        <th className="p-2.5">Link</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {sample.map((c, i) => (
                                                        <tr key={i} className="border-t border-slate-50">
                                                            <td className="p-2.5 font-mono text-slate-600">{c.phone_key}</td>
                                                            <td className="p-2.5 text-slate-700 font-medium">{c.store_name || "—"}</td>
                                                            <td className="p-2.5 text-slate-500">{c.contact_person || "—"}</td>
                                                            <td className="p-2.5 text-slate-500">{c.city || "—"}</td>
                                                            <td className="p-2.5">
                                                                {c.match_method === "phone" && (
                                                                    <span className="text-[9px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">Phone</span>
                                                                )}
                                                                {c.match_method === "store_name" && (
                                                                    <span className="text-[9px] font-black uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">Name</span>
                                                                )}
                                                                {c.match_method === "none" && (
                                                                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded">New</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                <DialogFooter className="px-6 py-4 border-t border-slate-100 shrink-0 sm:justify-between">
                    <p className="text-[11px] text-slate-400 self-center">
                        {summary ? `${summary.usable} contacts ready` : "Nothing selected yet"}
                    </p>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => { reset(); onClose(); }} disabled={busy} className="border-slate-200">
                            Cancel
                        </Button>
                        <Button
                            onClick={commit}
                            disabled={!summary || summary.usable === 0 || busy}
                            className="bg-orange-600 hover:bg-orange-700"
                        >
                            {busy
                                ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                                : <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />}
                            Save list
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const TONES: Record<string, string> = {
    slate: "text-slate-800",
    emerald: "text-emerald-600",
    amber: "text-amber-600",
};

const Stat = ({ label, value, tone }: { label: string; value: number; tone: string }) => (
    <div className="rounded-2xl bg-slate-50/70 border border-slate-100 px-4 py-3">
        <p className={cn("text-2xl font-black leading-none", TONES[tone])}>{value}</p>
        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mt-1.5">{label}</p>
    </div>
);

const MatchRow = ({ icon: Icon, label, value, tone }: { icon: any; label: string; value: number; tone: string }) => (
    <div className="flex items-center gap-2 text-xs">
        <Icon className={cn("h-3.5 w-3.5 shrink-0", tone)} />
        <span className="text-slate-600">{label}</span>
        <span className={cn("ml-auto font-black tabular-nums", tone)}>{value}</span>
    </div>
);
