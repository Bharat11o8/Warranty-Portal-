import { useState, useEffect } from "react";
import api, { getErrorMessage } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import {
    Search, Loader2, Layers, ArrowRight, AlertTriangle,
    Plus, RefreshCw, Copy, CheckCircle2, Store,
} from "lucide-react";
import { formatToIST } from "@/lib/utils";

/**
 * PPF serial numbers: the ones issued to stores, and the ones already in use.
 *
 * A roll is fitted across several vehicles, and each registration draws down
 * part of it. Installers are never shown how much is left — that is what stops
 * a serial being probed for the area it can still absorb — so this screen is
 * the only place the balance is visible, and it is the answer to "why was this
 * registration refused?".
 *
 * Serials arrive here two ways. An admin issues one to a store ahead of the
 * roll being fitted, and it waits here unused until someone registers against
 * it. Or an installer types a serial nobody issued, and it appears the moment
 * that warranty is filed — which is also what a mistyped serial looks like.
 */

interface Roll {
    serialNumber: string;
    firstSeenAt: string;
    storeCode: string | null;
    storeName: string | null;
    isIssued: boolean;
    usedSqft: number;
    remainingSqft: number;
    draws: number;
    rejectedDraws: number;
    status: 'available' | 'partial' | 'spent';
}

interface Draw {
    warrantyUid: string;
    sqftUsed: number;
    createdAt: string;
    status: string;
    customerName: string;
    registrationNumber: string;
    installerName: string;
    purchaseDate: string;
    countsAgainstRoll: boolean;
    installArea: string;
}

interface Stats {
    total: number;
    available: number;
    partial: number;
    spent: number;
    issued: number;
}

const STATUS_TABS = [
    { id: 'all', label: 'All' },
    { id: 'available', label: 'Unused' },
    { id: 'partial', label: 'Part used' },
    { id: 'spent', label: 'Finished' },
] as const;

/** How full a roll is, as a bar. Red once there is nothing useful left. */
const UsageBar = ({ used, capacity }: { used: number; capacity: number }) => {
    const pct = capacity > 0 ? Math.min(100, (used / capacity) * 100) : 0;
    const tone = pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-emerald-500';

    return (
        <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
            <div className={`h-full rounded-full transition-all ${tone}`} style={{ width: `${pct}%` }} />
        </div>
    );
};

const statusTone = (status: string) => {
    if (status === 'rejected') return 'bg-red-50 text-red-700 border-red-200';
    if (status === 'validated') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    return 'bg-amber-50 text-amber-700 border-amber-200';
};

export const AdminPPFRolls = () => {
    const { toast } = useToast();
    const [rolls, setRolls] = useState<Roll[]>([]);
    const [stats, setStats] = useState<Stats>({ total: 0, available: 0, partial: 0, spent: 0, issued: 0 });
    const [capacity, setCapacity] = useState(250);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>('all');

    const [openSerial, setOpenSerial] = useState<string | null>(null);
    const [detail, setDetail] = useState<{ draws: Draw[]; usedSqft: number; remainingSqft: number } | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);

    // Generate dialog
    const [generateOpen, setGenerateOpen] = useState(false);
    const [stores, setStores] = useState<any[]>([]);
    const [storeCode, setStoreCode] = useState("");
    const [quantity, setQuantity] = useState("1");
    const [generating, setGenerating] = useState(false);
    const [justIssued, setJustIssued] = useState<string[]>([]);
    const [copied, setCopied] = useState(false);

    const fetchRolls = async (term: string, status: string) => {
        setLoading(true);
        try {
            const res = await api.get('/admin/warranties/ppf-rolls', {
                params: { ...(term ? { search: term } : {}), status },
            });
            if (res.data.success) {
                setRolls(res.data.rolls);
                setCapacity(res.data.capacity);
                if (res.data.stats) setStats(res.data.stats);
            }
        } catch (error: any) {
            toast({
                title: "Could not load serial numbers",
                description: getErrorMessage(error, "Failed to fetch PPF serial numbers"),
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    // Debounced so typing a serial does not fire a request per keystroke.
    useEffect(() => {
        const timer = setTimeout(() => fetchRolls(search.trim(), statusFilter), 300);
        return () => clearTimeout(timer);
    }, [search, statusFilter]);

    // Stores are only needed once the dialog is opened.
    const [storesLoading, setStoresLoading] = useState(false);

    useEffect(() => {
        if (!generateOpen || stores.length > 0) return;
        setStoresLoading(true);
        api.get('/admin/warranties/ppf-serials/stores')
            .then(res => { if (res.data.success) setStores(res.data.stores || []); })
            .catch((error) => {
                toast({
                    title: "Could not load stores",
                    description: getErrorMessage(error, "Please close the dialog and try again."),
                    variant: "destructive",
                });
            })
            .finally(() => setStoresLoading(false));
    }, [generateOpen]);

    const openRoll = async (serial: string) => {
        setOpenSerial(serial);
        setDetail(null);
        setDetailLoading(true);
        try {
            const res = await api.get(`/admin/warranties/ppf-rolls/${encodeURIComponent(serial)}`);
            if (res.data.success) setDetail(res.data);
        } catch (error: any) {
            toast({
                title: "Could not load that serial",
                description: getErrorMessage(error, "Failed to fetch roll detail"),
                variant: "destructive",
            });
        } finally {
            setDetailLoading(false);
        }
    };

    const handleGenerate = async () => {
        const count = Number(quantity);
        if (!storeCode) {
            toast({ title: "Choose a store", description: "Serial numbers are issued to one store.", variant: "destructive" });
            return;
        }
        if (!Number.isInteger(count) || count < 1 || count > 100) {
            toast({ title: "Check the quantity", description: "Between 1 and 100.", variant: "destructive" });
            return;
        }

        setGenerating(true);
        try {
            const res = await api.post('/admin/warranties/ppf-serials/generate', { storeCode, quantity: count });
            if (res.data.success) {
                setJustIssued(res.data.serials.map((s: any) => s.serialNumber));
                setCopied(false);
                toast({ title: "Serial numbers issued", description: res.data.message });
                fetchRolls(search.trim(), statusFilter);
            }
        } catch (error: any) {
            toast({
                title: "Could not issue serial numbers",
                description: getErrorMessage(error, "Failed to generate"),
                variant: "destructive",
            });
        } finally {
            setGenerating(false);
        }
    };

    const closeGenerate = () => {
        setGenerateOpen(false);
        // Cleared on close rather than on open, so the numbers stay readable
        // while the dialog is still up and the admin is writing them down.
        setJustIssued([]);
        setStoreCode("");
        setQuantity("1");
        setCopied(false);
    };

    const copyIssued = async () => {
        try {
            await navigator.clipboard.writeText(justIssued.join('\n'));
            setCopied(true);
        } catch {
            toast({ title: "Could not copy", description: "Select the numbers and copy them manually.", variant: "destructive" });
        }
    };

    return (
        <div className="animate-in fade-in duration-500 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">Serial Number Management</h2>
                    <p className="text-sm text-slate-500">
                        Issue PPF roll serial numbers to stores, and see how much of each roll is left
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchRolls(search.trim(), statusFilter)}
                        disabled={loading}
                        className="h-9 px-4 rounded-xl border-orange-100 text-orange-600 hover:bg-orange-50"
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                    <Button
                        size="sm"
                        onClick={() => setGenerateOpen(true)}
                        className="h-9 px-4 rounded-xl bg-[#f46617] hover:bg-[#d85512] text-white shadow-lg shadow-orange-500/20"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Generate Serial Numbers
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm text-center">
                    <div className="text-2xl font-black text-slate-800">{stats.total.toLocaleString()}</div>
                    <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mt-1">Total</div>
                </div>
                <div className="bg-white rounded-2xl border border-emerald-100 p-4 shadow-sm text-center">
                    <div className="text-2xl font-black text-emerald-600">{stats.available.toLocaleString()}</div>
                    <div className="text-xs font-medium text-emerald-400 uppercase tracking-wider mt-1">Unused</div>
                </div>
                <div className="bg-white rounded-2xl border border-amber-100 p-4 shadow-sm text-center">
                    <div className="text-2xl font-black text-amber-600">{stats.partial.toLocaleString()}</div>
                    <div className="text-xs font-medium text-amber-400 uppercase tracking-wider mt-1">Part Used</div>
                </div>
                <div className="bg-white rounded-2xl border border-red-100 p-4 shadow-sm text-center">
                    <div className="text-2xl font-black text-red-600">{stats.spent.toLocaleString()}</div>
                    <div className="text-xs font-medium text-red-400 uppercase tracking-wider mt-1">Finished</div>
                </div>
                <div className="bg-white rounded-2xl border border-indigo-100 p-4 shadow-sm text-center">
                    <div className="text-2xl font-black text-indigo-600">{stats.issued.toLocaleString()}</div>
                    <div className="text-xs font-medium text-indigo-400 uppercase tracking-wider mt-1">Issued by Admin</div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search serial number..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 h-10 rounded-xl border-slate-200 bg-white"
                    />
                </div>
                <div className="flex items-center gap-1 bg-slate-100/60 rounded-xl p-1">
                    {STATUS_TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setStatusFilter(tab.id)}
                            className={`px-3 h-8 rounded-lg text-xs font-bold transition-colors ${
                                statusFilter === tab.id
                                    ? 'bg-white text-slate-800 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
                <Badge variant="outline" className="h-10 px-3 font-bold text-slate-600 justify-center">
                    {capacity} sq.ft per roll
                </Badge>
            </div>

            {loading ? (
                <div className="py-16 text-center text-slate-400 text-sm">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                    Loading serial numbers...
                </div>
            ) : rolls.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center border rounded-xl border-dashed bg-slate-50/50">
                    <Layers className="h-8 w-8 text-slate-300 mb-3" />
                    <h3 className="text-sm font-semibold text-slate-700">
                        {search ? 'No serial matches that search' : 'No serial numbers yet'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm">
                        {search
                            ? 'Check the serial number, or clear the search to see every one.'
                            : 'Generate serial numbers for a store, or one will appear here the first time an installer registers a roll.'}
                    </p>
                </div>
            ) : (
                <div className="grid gap-3">
                    {rolls.map((roll) => {
                        const spent = roll.remainingSqft <= 0;
                        const unused = roll.draws === 0;

                        return (
                            <button
                                key={roll.serialNumber}
                                onClick={() => openRoll(roll.serialNumber)}
                                className="text-left rounded-xl border border-slate-200 bg-white p-4 hover:border-orange-200 hover:bg-orange-50/30 transition-colors group"
                            >
                                <div className="flex items-center justify-between gap-4 mb-3">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="font-mono font-bold text-sm text-slate-900 truncate">
                                                {roll.serialNumber}
                                            </p>
                                            {roll.isIssued ? (
                                                <Badge variant="outline" className="text-[10px] bg-indigo-50 text-indigo-600 border-indigo-100">
                                                    Issued
                                                </Badge>
                                            ) : (
                                                /* Nobody issued this one — an installer typed it. Worth
                                                   marking, because that is also what a typo looks like. */
                                                <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-500 border-slate-200">
                                                    Entered on a form
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            {roll.storeName && <>{roll.storeName} · </>}
                                            {unused
                                                ? 'Not used yet'
                                                : `${roll.draws} vehicle${roll.draws === 1 ? '' : 's'}`}
                                            {roll.rejectedDraws > 0 && (
                                                <span className="text-slate-400">
                                                    {' '}· {roll.rejectedDraws} rejected, not counted
                                                </span>
                                            )}
                                            {' '}· {roll.isIssued ? 'issued' : 'first used'} {formatToIST(roll.firstSeenAt)}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-3 shrink-0">
                                        <div className="text-right">
                                            <p className={`text-sm font-bold ${spent ? 'text-red-600' : 'text-slate-900'}`}>
                                                {roll.remainingSqft} sq.ft left
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {roll.usedSqft} of {capacity} used
                                            </p>
                                        </div>
                                        <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-orange-500 transition-colors" />
                                    </div>
                                </div>

                                <UsageBar used={roll.usedSqft} capacity={capacity} />

                                {roll.usedSqft > capacity && (
                                    <p className="flex items-center gap-1.5 text-xs text-red-600 mt-2 font-medium">
                                        <AlertTriangle className="h-3.5 w-3.5" />
                                        This roll has given out more than its size — the roll size may have been lowered after these registrations.
                                    </p>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Generate dialog */}
            <Dialog open={generateOpen} onOpenChange={(open) => { if (!open) closeGenerate(); }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold">Generate Serial Numbers</DialogTitle>
                        <DialogDescription>
                            Each number is stamped with today's date, the store's code, and a counter
                            that continues from that store's last one.
                        </DialogDescription>
                    </DialogHeader>

                    {justIssued.length > 0 ? (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm font-medium text-emerald-700">
                                <CheckCircle2 className="h-4 w-4" />
                                {justIssued.length} serial number{justIssued.length === 1 ? '' : 's'} issued
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 max-h-56 overflow-y-auto space-y-1">
                                {justIssued.map((serial) => (
                                    <p key={serial} className="font-mono text-sm text-slate-800">{serial}</p>
                                ))}
                            </div>
                            <Button variant="outline" size="sm" onClick={copyIssued} className="w-full gap-2">
                                {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                                {copied ? 'Copied' : 'Copy all'}
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500">Store</label>
                                <Combobox
                                    options={stores.map((s: any) => ({
                                        value: s.store_code,
                                        label: `${s.store_name} — ${s.store_code}`,
                                    }))}
                                    value={storeCode}
                                    onChange={setStoreCode}
                                    placeholder={storesLoading ? "Loading stores..." : "Select a store"}
                                    searchPlaceholder="Search store name or code..."
                                    emptyMessage={storesLoading ? "Loading..." : "No store found."}
                                />
                                {/* A store with no code cannot be issued a serial, since the
                                    code is part of the number. Saying so beats an empty list
                                    that looks like a broken screen. */}
                                {!storesLoading && stores.length === 0 && (
                                    <p className="text-xs text-amber-600">
                                        No verified store has a store code set. Add one on the franchise
                                        record before issuing serial numbers.
                                    </p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500">How many</label>
                                <Input
                                    type="number"
                                    min={1}
                                    max={100}
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    className="h-10"
                                />
                            </div>

                            {storeCode && (
                                <div className="flex items-start gap-2 rounded-xl bg-slate-50 border border-slate-100 p-3">
                                    <Store className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                                    <div className="text-xs text-slate-600">
                                        <p className="font-medium">They will look like</p>
                                        <p className="font-mono text-slate-800 mt-0.5">
                                            {new Date().getFullYear()}
                                            {String(new Date().getMonth() + 1).padStart(2, '0')}
                                            {String(new Date().getDate()).padStart(2, '0')}
                                            {storeCode}_<span className="text-slate-400">n</span>
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter>
                        {justIssued.length > 0 ? (
                            <Button onClick={closeGenerate} className="bg-[#f46617] hover:bg-[#d85512]">Done</Button>
                        ) : (
                            <>
                                <Button variant="outline" onClick={closeGenerate} disabled={generating}>Cancel</Button>
                                <Button
                                    onClick={handleGenerate}
                                    disabled={generating || !storeCode}
                                    className="bg-[#f46617] hover:bg-[#d85512]"
                                >
                                    {generating
                                        ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        : <Plus className="h-4 w-4 mr-2" />}
                                    Generate
                                </Button>
                            </>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Roll detail */}
            <Sheet open={openSerial !== null} onOpenChange={(open) => !open && setOpenSerial(null)}>
                <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle className="font-mono break-all">{openSerial}</SheetTitle>
                        <SheetDescription>
                            {detail
                                ? `${detail.usedSqft} of ${capacity} sq.ft used · ${detail.remainingSqft} left`
                                : 'Loading...'}
                        </SheetDescription>
                    </SheetHeader>

                    {detailLoading ? (
                        <div className="py-16 text-center">
                            <Loader2 className="h-5 w-5 animate-spin mx-auto text-slate-400" />
                        </div>
                    ) : detail && detail.draws.length > 0 ? (
                        <div className="mt-6 space-y-3">
                            {detail.draws.map((draw) => (
                                <div
                                    key={draw.warrantyUid}
                                    className={`rounded-xl border p-3 ${draw.countsAgainstRoll ? 'border-slate-200 bg-white' : 'border-slate-100 bg-slate-50/60'}`}
                                >
                                    <div className="flex items-start justify-between gap-3 mb-1.5">
                                        <p className="font-mono text-xs font-bold text-slate-900 truncate">
                                            {draw.warrantyUid}
                                        </p>
                                        <Badge variant="outline" className={`text-[10px] shrink-0 ${statusTone(draw.status)}`}>
                                            {draw.status || 'unknown'}
                                        </Badge>
                                    </div>

                                    <p className="text-sm font-semibold text-slate-800">
                                        {draw.sqftUsed} sq.ft
                                        {draw.installArea && (
                                            <span className="font-normal text-slate-500">
                                                {' '}on {draw.installArea}
                                            </span>
                                        )}
                                        {!draw.countsAgainstRoll && (
                                            <span className="font-normal text-xs text-slate-500">
                                                {' '}— returned to the roll
                                            </span>
                                        )}
                                    </p>

                                    <p className="text-xs text-slate-500 mt-1">
                                        {draw.registrationNumber || '—'} · {draw.customerName || '—'}
                                    </p>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        {draw.installerName || '—'} · {formatToIST(draw.createdAt)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="py-16 text-center text-sm text-slate-400">
                            Nothing has been registered against this serial number yet.
                        </p>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
};

export default AdminPPFRolls;
