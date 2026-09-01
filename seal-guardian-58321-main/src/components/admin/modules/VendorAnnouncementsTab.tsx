import { useState, useEffect } from "react";
import api, { getErrorMessage } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Loader2, Megaphone, Send, MessageCircle, Mail, CheckCheck, AlertTriangle } from "lucide-react";
import { formatToIST } from "@/lib/utils";

/**
 * What this store has been told, and a way to tell it something.
 *
 * Broadcasts are recorded per recipient in message_logs rather than against a
 * franchise, so the server joins on the store's phone. Sending here is the same
 * broadcast endpoint the Announcements screen uses, aimed at a single user.
 */

interface Props {
    /** profiles.id — the broadcast endpoint targets users by this. */
    franchiseUserId: string | null;
    storeName?: string | null;
}

interface Announcement {
    id: string;
    campaign_id: string | null;
    title: string | null;
    message: string | null;
    sent_by: string | null;
    channel: string;
    status: string;
    error_message: string | null;
    created_at: string;
}

const STATUS_STYLE: Record<string, string> = {
    read: "bg-emerald-50 text-emerald-700 border-emerald-200",
    delivered: "bg-blue-50 text-blue-700 border-blue-200",
    sent: "bg-slate-100 text-slate-600 border-slate-200",
    failed: "bg-red-50 text-red-700 border-red-200",
    pending: "bg-amber-50 text-amber-700 border-amber-200",
};

export const VendorAnnouncementsTab = ({ franchiseUserId, storeName }: Props) => {
    const { toast } = useToast();
    const [rows, setRows] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [composeOpen, setComposeOpen] = useState(false);
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [sending, setSending] = useState(false);

    const load = async () => {
        if (!franchiseUserId) { setRows([]); setLoading(false); return; }
        setLoading(true);
        try {
            const res = await api.get(`/admin/franchises/${franchiseUserId}/announcements`);
            setRows(res.data.announcements || []);
        } catch (error: any) {
            toast({
                title: "Could not load announcements",
                description: getErrorMessage(error, "Failed to load what this store has been sent"),
                variant: "destructive",
            });
            setRows([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [franchiseUserId]);

    const send = async () => {
        if (!franchiseUserId || !title.trim() || !message.trim()) return;
        setSending(true);
        try {
            // Same endpoint as the Announcements screen; targetUsers narrows it
            // to this one store rather than a whole role.
            await api.post("/notifications/broadcast", {
                title: title.trim(),
                message: message.trim(),
                type: "system",
                targetUsers: [franchiseUserId],
                whatsapp: true,
            });
            toast({
                title: "Sent",
                description: `${storeName || "The store"} has been notified.`,
            });
            setComposeOpen(false);
            setTitle("");
            setMessage("");
            // Delivery rows are written as the queue drains, so give it a moment
            // before asking again.
            setTimeout(load, 1500);
        } catch (error: any) {
            toast({
                title: "Could not send",
                description: getErrorMessage(error, "Failed to send the announcement"),
                variant: "destructive",
            });
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12 gap-2 text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" /> <span className="text-sm">Loading announcements…</span>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <p className="text-sm font-bold text-slate-800">Announcements</p>
                    <p className="text-[11px] text-slate-400">
                        {rows.length === 0
                            ? "Nothing has been sent to this store"
                            : `${rows.length} message${rows.length === 1 ? "" : "s"} sent`}
                    </p>
                </div>
                <Button
                    onClick={() => setComposeOpen(true)}
                    disabled={!franchiseUserId}
                    className="h-9 gap-2 bg-orange-600 hover:bg-orange-700"
                >
                    <Send className="h-4 w-4" /> Send to this store
                </Button>
            </div>

            {rows.length === 0 ? (
                <div className="border border-dashed border-slate-200 rounded-2xl py-10 text-center">
                    <Megaphone className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-600">No announcements yet</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                        Broadcasts sent to this store will appear here, with whether they were delivered.
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {rows.map(a => (
                        <div key={a.id} className="p-4 rounded-2xl border border-slate-100 bg-white">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-slate-800 truncate">
                                        {a.title || "(untitled broadcast)"}
                                    </p>
                                    {a.message && (
                                        <p className="text-[12px] text-slate-500 mt-1 line-clamp-2">{a.message}</p>
                                    )}
                                </div>
                                <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${STATUS_STYLE[a.status] || STATUS_STYLE.sent}`}>
                                    {a.status === "read" && <CheckCheck className="h-3 w-3" />}
                                    {a.status === "failed" && <AlertTriangle className="h-3 w-3" />}
                                    {a.status}
                                </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-slate-400">
                                <span className="flex items-center gap-1">
                                    {a.channel === "email" ? <Mail className="h-3 w-3" /> : <MessageCircle className="h-3 w-3" />}
                                    {a.channel}
                                </span>
                                <span>{formatToIST(a.created_at)}</span>
                                {a.sent_by && <span>by {a.sent_by}</span>}
                            </div>
                            {/* A failure is the reason to be looking at this tab,
                                so say what went wrong rather than just "failed". */}
                            {a.status === "failed" && a.error_message && (
                                <p className="mt-2 text-[11px] text-red-600 bg-red-50 border border-red-100 rounded-lg px-2 py-1">
                                    {a.error_message}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <Dialog open={composeOpen} onOpenChange={open => { if (!sending) setComposeOpen(open); }}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-base flex items-center gap-2">
                            <Megaphone className="h-4 w-4 text-orange-500" /> Send to this store
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Goes to {storeName || "this store"} only — an in-app notification and a WhatsApp message.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Title</p>
                            <Input
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder="What is this about?"
                                maxLength={120}
                                className="h-10"
                            />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Message</p>
                            <Textarea
                                value={message}
                                onChange={e => setMessage(e.target.value)}
                                placeholder="What do you want them to know?"
                                rows={5}
                                maxLength={1000}
                                className="resize-none text-sm"
                            />
                            <p className="text-[10px] text-slate-400 mt-1 text-right">{message.length}/1000</p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setComposeOpen(false)} disabled={sending}>
                            Cancel
                        </Button>
                        <Button
                            onClick={send}
                            disabled={sending || !title.trim() || !message.trim()}
                            className="bg-orange-600 hover:bg-orange-700 gap-2"
                        >
                            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            Send
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
