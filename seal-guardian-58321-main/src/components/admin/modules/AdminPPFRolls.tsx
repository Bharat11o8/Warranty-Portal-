import { useState, useEffect } from "react";
import api, { getErrorMessage } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Search, Loader2, Layers, ArrowRight, AlertTriangle } from "lucide-react";
import { formatToIST } from "@/lib/utils";

/**
 * Where each PPF roll's film has gone.
 *
 * A roll is fitted across several vehicles, and each registration draws down
 * part of it. Installers are never shown how much is left — that is what stops
 * a serial being probed for the area it can still absorb — so this screen is
 * the only place the balance is visible, and it is the answer to "why was this
 * registration refused?".
 */

interface Roll {
    serialNumber: string;
    firstSeenAt: string;
    usedSqft: number;
    remainingSqft: number;
    draws: number;
    rejectedDraws: number;
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
    const [capacity, setCapacity] = useState(250);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const [openSerial, setOpenSerial] = useState<string | null>(null);
    const [detail, setDetail] = useState<{ draws: Draw[]; usedSqft: number; remainingSqft: number } | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);

    const fetchRolls = async (term: string) => {
        setLoading(true);
        try {
            const res = await api.get('/admin/warranties/ppf-rolls', {
                params: term ? { search: term } : {},
            });
            if (res.data.success) {
                setRolls(res.data.rolls);
                setCapacity(res.data.capacity);
            }
        } catch (error: any) {
            toast({
                title: "Could not load rolls",
                description: getErrorMessage(error, "Failed to fetch PPF rolls"),
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchRolls(""); }, []);

    // Debounced so typing a serial does not fire a request per keystroke.
    useEffect(() => {
        const timer = setTimeout(() => fetchRolls(search.trim()), 300);
        return () => clearTimeout(timer);
    }, [search]);

    const openRoll = async (serial: string) => {
        setOpenSerial(serial);
        setDetail(null);
        setDetailLoading(true);
        try {
            const res = await api.get(`/admin/warranties/ppf-rolls/${encodeURIComponent(serial)}`);
            if (res.data.success) setDetail(res.data);
        } catch (error: any) {
            toast({
                title: "Could not load that roll",
                description: getErrorMessage(error, "Failed to fetch roll detail"),
                variant: "destructive",
            });
        } finally {
            setDetailLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">PPF Rolls</h2>
                <p className="text-slate-500">
                    How much of each roll has been used, and which registrations used it.
                </p>
            </div>

            <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search serial number..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 h-10"
                    />
                </div>
                <Badge variant="outline" className="h-10 px-3 font-bold text-slate-600">
                    {capacity} sq.ft per roll
                </Badge>
            </div>

            {loading ? (
                <div className="py-16 text-center text-slate-400 text-sm">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                    Loading rolls...
                </div>
            ) : rolls.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center border rounded-xl border-dashed bg-slate-50/50">
                    <Layers className="h-8 w-8 text-slate-300 mb-3" />
                    <h3 className="text-sm font-semibold text-slate-700">
                        {search ? 'No roll matches that serial' : 'No rolls registered yet'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm">
                        {search
                            ? 'Check the serial number, or clear the search to see every roll.'
                            : 'A roll appears here the first time a PPF warranty is registered against its serial number.'}
                    </p>
                </div>
            ) : (
                <div className="grid gap-3">
                    {rolls.map((roll) => {
                        const spent = roll.remainingSqft <= 0;

                        return (
                            <button
                                key={roll.serialNumber}
                                onClick={() => openRoll(roll.serialNumber)}
                                className="text-left rounded-xl border border-slate-200 bg-white p-4 hover:border-orange-200 hover:bg-orange-50/30 transition-colors group"
                            >
                                <div className="flex items-center justify-between gap-4 mb-3">
                                    <div className="min-w-0">
                                        <p className="font-mono font-bold text-sm text-slate-900 truncate">
                                            {roll.serialNumber}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            {roll.draws} vehicle{roll.draws === 1 ? '' : 's'}
                                            {roll.rejectedDraws > 0 && (
                                                <span className="text-slate-400">
                                                    {' '}· {roll.rejectedDraws} rejected, not counted
                                                </span>
                                            )}
                                            {' '}· first used {formatToIST(roll.firstSeenAt)}
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

            <Sheet open={openSerial !== null} onOpenChange={(open) => !open && setOpenSerial(null)}>
                <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle className="font-mono">{openSerial}</SheetTitle>
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
                            Nothing has been registered against this roll.
                        </p>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
};

export default AdminPPFRolls;
