import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, X, Plus, Trash2, ChevronUp, ChevronDown, ExternalLink, FileText, ZoomIn, ZoomOut, Inbox, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Scheme, EntryFile } from "@/lib/schemes";
import type { AdminEntry } from "./adminTypes";

/**
 * Reviewing entries one after another: the waiting list on the left, the
 * open entry on the right with its invoice shown in place, what the store
 * said, and approve / reject. After each decision the next entry opens.
 *
 * Keys (when not typing): A approve, R reject, J or ↓ next, K or ↑ previous.
 */

type Lines = { product_id: string; qty: string }[];

const when = (d: string) => new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
const isImage = (f: EntryFile) => /^(jpe?g|png|webp|gif)$/i.test(f.ext) || /\.(jpe?g|png|webp|gif)$/i.test(f.url);
const isPdf = (f: EntryFile) => /^pdf$/i.test(f.ext) || /\.pdf$/i.test(f.url);

export function ReviewQueue({ scheme, entries, busy, onReview }: {
    scheme: Scheme; entries: AdminEntry[]; busy: string | null;
    onReview: (e: AdminEntry, status: "approved" | "rejected", opts: { note?: string; lines?: { product_id: string; qty: number }[]; score?: string }) => Promise<void>;
}) {
    const products = scheme.score_rule.mode === "products" ? scheme.score_rule.products : [];
    const hasScore = scheme.score_rule.mode !== "none";
    /* Oldest first: the store that has waited longest is seen first. */
    const queue = useMemo(() => [...entries].sort((a, b) => a.created_at.localeCompare(b.created_at)), [entries]);
    const [openId, setOpenId] = useState<string | null>(queue[0]?.id ?? null);
    const lastIndex = useRef(0);
    const open = queue.find(e => e.id === openId) ?? null;

    /* The open entry left the queue (decided): open the one now in its place. */
    useEffect(() => {
        if (open) { lastIndex.current = queue.indexOf(open); return; }
        setOpenId(queue[Math.min(lastIndex.current, queue.length - 1)]?.id ?? null);
    }, [queue, open]);

    const step = (by: number) => {
        if (!queue.length) return;
        const i = open ? queue.indexOf(open) : -1;
        const next = queue[Math.max(0, Math.min(queue.length - 1, i + by))];
        if (next) setOpenId(next.id);
    };

    if (!queue.length) {
        return (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
                <Inbox className="h-9 w-9 text-slate-300 mx-auto mb-2" />
                <p className="font-medium text-slate-700">Nothing waiting</p>
                <p className="text-sm text-slate-500 mt-0.5">Every entry that matches these filters has been reviewed.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4 items-start">
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden lg:sticky lg:top-4">
                <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-200 bg-slate-50">
                    <p className="text-sm font-semibold text-slate-800">Waiting <span className="tabular-nums text-slate-500">({queue.length})</span></p>
                    <span className="text-[11px] text-slate-400">oldest first</span>
                </div>
                <ul className="max-h-[calc(100vh-360px)] min-h-[200px] overflow-y-auto divide-y divide-slate-100">
                    {queue.map(e => (
                        <li key={e.id}>
                            <button type="button" onClick={() => setOpenId(e.id)}
                                className={cn("w-full text-left px-3 py-2.5 border-l-[3px] transition-colors",
                                    e.id === openId ? "border-orange-500 bg-orange-50" : "border-transparent hover:bg-slate-50")}>
                                <div className="flex items-baseline justify-between gap-2">
                                    <span className="font-medium text-sm text-slate-900 truncate">{e.store_name}</span>
                                    {hasScore && <span className="shrink-0 text-xs font-semibold tabular-nums text-slate-600">{e.score} pts</span>}
                                </div>
                                <div className="flex items-baseline justify-between gap-2 text-xs text-slate-500">
                                    <span className="truncate">{[e.city, e.state].filter(Boolean).join(", ") || "—"}</span>
                                    <span className="shrink-0">{when(e.created_at)}</span>
                                </div>
                            </button>
                        </li>
                    ))}
                </ul>
            </div>

            {open && <EntryPanel key={open.id} e={open} scheme={scheme} products={products} hasScore={hasScore}
                busy={busy === open.id} position={`${queue.indexOf(open) + 1} of ${queue.length}`}
                onPrev={() => step(-1)} onNext={() => step(1)} onReview={onReview} />}
        </div>
    );
}

function EntryPanel({ e, scheme, products, hasScore, busy, position, onPrev, onNext, onReview }: {
    e: AdminEntry; scheme: Scheme; products: { id: string; name: string; points: number }[]; hasScore: boolean; busy: boolean; position: string;
    onPrev: () => void; onNext: () => void;
    onReview: (e: AdminEntry, status: "approved" | "rejected", opts: { note?: string; lines?: { product_id: string; qty: number }[]; score?: string }) => Promise<void>;
}) {
    const files = Object.entries(e.files).flatMap(([fid, list]) => list.map(f => ({ ...f, field: scheme.fields.find(x => x.id === fid)?.label ?? fid })));
    const [fileIdx, setFileIdx] = useState(0);
    const [zoom, setZoom] = useState(1);
    const [lines, setLines] = useState<Lines>(() =>
        (e.claimed_lines ?? []).length
            ? e.claimed_lines!.map(l => ({ product_id: l.product_id, qty: String(l.qty) }))
            : products.length ? [{ product_id: products[0].id, qty: "" }] : []);
    const [score, setScore] = useState(String(e.score));
    const [rejecting, setRejecting] = useState(false);
    const [note, setNote] = useState("");
    const noteRef = useRef<HTMLInputElement>(null);
    const file = files[fileIdx];

    const total = lines.reduce((n, l) => n + (Number(l.qty) || 0) * (products.find(p => p.id === l.product_id)?.points ?? 0), 0);
    const claimedTotal = (e.claimed_lines ?? []).reduce((n, l) => n + (Number(l.subtotal) || 0), 0);
    const changed = products.length > 0 && (e.claimed_lines ?? []).length > 0 && total !== claimedTotal;
    const canApprove = !busy && (!products.length || lines.some(l => Number(l.qty) > 0));

    const approve = () => {
        if (!canApprove) return;
        if (products.length) onReview(e, "approved", { lines: lines.filter(l => Number(l.qty) > 0).map(l => ({ product_id: l.product_id, qty: Number(l.qty) })) });
        else onReview(e, "approved", hasScore ? { score } : {});
    };
    const reject = () => { if (note.trim() && !busy) onReview(e, "rejected", { note: note.trim() }); };

    /* Keyboard: only when the reviewer isn't typing in a box. */
    useEffect(() => {
        const onKey = (ev: KeyboardEvent) => {
            const t = ev.target as HTMLElement;
            if (t.closest("input, textarea, select, [role=combobox], [role=listbox]") || ev.ctrlKey || ev.metaKey || ev.altKey) return;
            const k = ev.key.toLowerCase();
            if (k === "a") { ev.preventDefault(); approve(); }
            else if (k === "r") { ev.preventDefault(); setRejecting(true); setTimeout(() => noteRef.current?.focus(), 0); }
            else if (k === "j" || ev.key === "ArrowDown") { ev.preventDefault(); onNext(); }
            else if (k === "k" || ev.key === "ArrowUp") { ev.preventDefault(); onPrev(); }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    });

    return (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-slate-200">
                <div className="min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{e.store_name}</p>
                    <p className="text-xs text-slate-500">
                        {[e.city, e.state].filter(Boolean).join(", ")}{e.city || e.state ? " · " : ""}sent {when(e.created_at)}
                        {e.source !== "store" && <span className="ml-2 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-500">{e.source === "import" ? "Imported" : "Added by admin"}</span>}
                    </p>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-500">
                    <span className="tabular-nums mr-1">{position}</span>
                    <Button size="icon" variant="outline" className="h-8 w-8" onClick={onPrev} aria-label="Previous entry" title="Previous (K)"><ChevronUp className="h-4 w-4" /></Button>
                    <Button size="icon" variant="outline" className="h-8 w-8" onClick={onNext} aria-label="Next entry" title="Next (J)"><ChevronDown className="h-4 w-4" /></Button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px]">
                {/* The invoice, in place. */}
                <div className="bg-slate-100 min-h-[360px] flex flex-col border-b xl:border-b-0 xl:border-r border-slate-200">
                    {files.length > 1 && (
                        <div className="flex gap-1 overflow-x-auto p-2 border-b border-slate-200 bg-white">
                            {files.map((f, i) => (
                                <button key={f.url} type="button" onClick={() => { setFileIdx(i); setZoom(1); }}
                                    className={cn("shrink-0 rounded-md border px-2 py-1 text-xs max-w-[180px] truncate", i === fileIdx ? "border-orange-400 bg-orange-50 text-orange-800" : "border-slate-200 text-slate-600 hover:border-slate-300")}>
                                    {f.name}
                                </button>
                            ))}
                        </div>
                    )}
                    {!file ? (
                        <div className="flex-1 flex items-center justify-center text-sm text-slate-400">No file with this entry.</div>
                    ) : (
                        <>
                            <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-white border-b border-slate-200 text-xs text-slate-500">
                                <span className="truncate">{file.field} · {file.name}</span>
                                <span className="flex items-center gap-1 shrink-0">
                                    {isImage(file) && <>
                                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setZoom(z => Math.max(0.5, z - 0.25))} aria-label="Zoom out"><ZoomOut className="h-4 w-4" /></Button>
                                        <span className="tabular-nums w-10 text-center">{Math.round(zoom * 100)}%</span>
                                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setZoom(z => Math.min(3, z + 0.25))} aria-label="Zoom in"><ZoomIn className="h-4 w-4" /></Button>
                                    </>}
                                    <a href={file.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded px-1.5 py-1 hover:bg-slate-100 text-sky-700"><ExternalLink className="h-3.5 w-3.5" /> Open</a>
                                </span>
                            </div>
                            <div className="flex-1 overflow-auto max-h-[calc(100vh-300px)] min-h-[420px]">
                                {isImage(file) ? (
                                    <img src={file.url} alt={file.name} className="mx-auto origin-top transition-transform" style={{ width: `${zoom * 100}%`, maxWidth: "none" }} />
                                ) : isPdf(file) ? (
                                    <iframe src={file.url} title={file.name} className="w-full h-full min-h-[560px] bg-white" />
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center gap-2 py-16 text-sm text-slate-500">
                                        <FileText className="h-8 w-8 text-slate-300" />
                                        This file can't be shown here.
                                        <a href={file.url} target="_blank" rel="noreferrer" className="text-sky-700 hover:underline">Open it in a new tab</a>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* What the store said, and the decision. */}
                <div className="p-4 space-y-4 text-sm">
                    {scheme.fields.filter(f => f.type !== "file" && e.answers[f.id]).length > 0 && (
                        <dl className="space-y-1">
                            {scheme.fields.filter(f => f.type !== "file" && e.answers[f.id]).map(f => (
                                <div key={f.id} className="flex gap-2"><dt className="text-slate-500 shrink-0">{f.label}:</dt><dd className="text-slate-800 font-medium break-words min-w-0">{e.answers[f.id]}</dd></div>
                            ))}
                            {e.invoice_no && <div className="flex gap-2"><dt className="text-slate-500">Invoice no:</dt><dd className="text-slate-800">{e.invoice_no}</dd></div>}
                        </dl>
                    )}

                    {products.length > 0 ? (
                        <div className="space-y-2">
                            {(e.claimed_lines ?? []).length > 0 && (
                                <div className="rounded-lg bg-sky-50 border border-sky-100 px-3 py-2 text-xs text-sky-900">
                                    <p className="font-semibold mb-0.5">The store said</p>
                                    {(e.claimed_lines ?? []).map(l => `${l.name} × ${l.qty}`).join(", ")} = <b>{claimedTotal} pts</b>
                                </div>
                            )}
                            <p className="font-medium text-slate-800">Approve as</p>
                            <div className="rounded-lg border border-slate-200 divide-y divide-slate-100">
                                {lines.map((l, i) => (
                                    <div key={i} className="flex items-center gap-1.5 px-2 py-1.5">
                                        <Select value={l.product_id} onValueChange={v => setLines(ls => ls.map((x, j) => j === i ? { ...x, product_id: v } : x))}>
                                            <SelectTrigger className="h-8 text-xs flex-1 min-w-0" aria-label="Series"><SelectValue /></SelectTrigger>
                                            <SelectContent>{products.map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.points} pts)</SelectItem>)}</SelectContent>
                                        </Select>
                                        <Input type="number" min={1} className="h-8 w-16 text-xs" placeholder="Qty" aria-label="Quantity" value={l.qty}
                                            onChange={ev => setLines(ls => ls.map((x, j) => j === i ? { ...x, qty: ev.target.value } : x))} />
                                        <Button type="button" size="icon" variant="ghost" className="h-7 w-7 text-slate-400 hover:text-rose-600" disabled={lines.length === 1}
                                            onClick={() => setLines(ls => ls.filter((_, j) => j !== i))} aria-label="Remove line"><Trash2 className="h-3.5 w-3.5" /></Button>
                                    </div>
                                ))}
                                <div className="flex items-center justify-between px-2 py-1.5 bg-slate-50">
                                    <button type="button" className="text-xs font-medium text-sky-700 flex items-center gap-1 hover:underline"
                                        onClick={() => setLines(ls => [...ls, { product_id: products[0].id, qty: "" }])}><Plus className="h-3 w-3" /> Add series</button>
                                    <span className="text-sm">Total <b className="tabular-nums">{total} pts</b></span>
                                </div>
                            </div>
                            {changed && <p className="text-xs text-amber-700">Changed from what the store said ({claimedTotal} pts).</p>}
                        </div>
                    ) : hasScore && (
                        <label className="flex items-center gap-2">
                            <span className="text-slate-600">Score</span>
                            <Input type="number" min={0} className="h-9 w-24" value={score} onChange={ev => setScore(ev.target.value)} aria-label="Score" />
                        </label>
                    )}

                    {rejecting ? (
                        <div className="space-y-2 rounded-lg border border-rose-200 bg-rose-50 p-3">
                            <Input ref={noteRef} autoFocus className="h-9 bg-white" placeholder="Why? The store sees this" value={note}
                                onChange={ev => setNote(ev.target.value)} onKeyDown={ev => { if (ev.key === "Enter") reject(); if (ev.key === "Escape") setRejecting(false); }} />
                            <div className="flex gap-2">
                                <Button size="sm" variant="destructive" disabled={!note.trim() || busy} onClick={reject}>Reject entry</Button>
                                <Button size="sm" variant="ghost" onClick={() => setRejecting(false)}>Cancel</Button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" disabled={!canApprove} onClick={approve} title="Approve (A)">
                                {busy ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Check className="h-4 w-4 mr-1.5" />}
                                Approve{products.length ? ` · ${total} pts` : ""}
                            </Button>
                            <Button variant="outline" className="text-rose-600 hover:text-rose-700" disabled={busy}
                                onClick={() => setRejecting(true)} title="Reject (R)"><X className="h-4 w-4 mr-1" /> Reject</Button>
                        </div>
                    )}
                    <p className="text-[11px] text-slate-400">Keys: <b>A</b> approve · <b>R</b> reject · <b>J</b>/<b>↓</b> next · <b>K</b>/<b>↑</b> previous</p>
                </div>
            </div>
        </div>
    );
}
