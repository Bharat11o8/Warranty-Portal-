import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Calendar as CalendarIcon, ChevronRight, Info, Megaphone, Search, Filter, ShieldCheck, AlertTriangle, Video, Download, ExternalLink, PlayCircle, FileVideo, FileText, Link, Image as ImageIcon, X, RefreshCw, Trash2, Undo2 } from "lucide-react";
import { useNotifications } from "@/contexts/NotificationContext";
import { cn, optimizeCloudinaryUrl } from "@/lib/utils";
import { format, isSameDay } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Pagination } from "./Pagination";

export const NewsAlerts = () => {
    const { fullHistory, markAsRead, markAllAsRead, refreshNotifications, loading, dismissNotification, undoDismissNotification } = useNotifications();
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [swipingId, setSwipingId] = useState<number | null>(null);
    const [undoNotification, setUndoNotification] = useState<any>(null);
    const [showUndo, setShowUndo] = useState(false);
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'alert' | 'system' | 'product'>('all');
    const [date, setDate] = useState<Date | undefined>();
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [selectedNotification, setSelectedNotification] = useState<any>(null);
    const [dismissingIds, setDismissingIds] = useState<Set<number>>(new Set());

    // Base filter: only show alert/system/product types (admin broadcasts, news)
    // Warranty notifications are shown separately in the NotificationPopover, not here
    const baseNotifications = fullHistory.filter(n =>
        (n.type === 'alert' || n.type === 'system' || n.type === 'product') &&
        !n.is_cleared &&
        !n.title.toLowerCase().includes('grievance') // Exclude grievance assignments/updates as per user request
    );

    // Apply active tab filter and search query
    const filteredItems = baseNotifications.filter(item => {
        // Tab Filter
        if (activeTab === 'unread' && item.is_read) return false;
        if (activeTab === 'alert' && item.type !== 'alert') return false;
        if (activeTab === 'system' && item.type !== 'system') return false;
        if (activeTab === 'product' && item.type !== 'product') return false;

        // Search Filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            if (!item.title.toLowerCase().includes(query) && !item.message.toLowerCase().includes(query)) {
                return false;
            }
        }

        // Date Filter
        if (date) {
            const itemDate = new Date(item.created_at);
            if (!isSameDay(itemDate, date)) {
                return false;
            }
        }

        return true;
    });

    const paginatedItems = filteredItems.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
    const totalPages = Math.ceil(filteredItems.length / rowsPerPage);

    const unreadCount = baseNotifications.filter(n => !n.is_read).length;

    const tabs = [
        { id: 'all', label: 'All Messages' },
        { id: 'unread', label: 'Unread', count: unreadCount },
        { id: 'system', label: 'System & News' },
        { id: 'alert', label: 'Alert / Warning' },
        { id: 'product', label: 'Product Launch' },
    ];

    const getIcon = (type: string) => {
        switch (type) {
            case 'product': return <Megaphone className="h-6 w-6 text-purple-600" />;
            case 'alert': return <AlertTriangle className="h-6 w-6 text-amber-600" />;
            default: return <Info className="h-6 w-6 text-gray-600" />;
        }
    };

    const getColors = (type: string) => {
        switch (type) {
            case 'product': return { border: "border-purple-500/20", bg: "bg-purple-500/10", text: "text-purple-600", bar: "bg-purple-500" };
            case 'alert': return { border: "border-amber-500/20", bg: "bg-amber-500/10", text: "text-amber-600", bar: "bg-amber-500" };
            default: return { border: "border-gray-500/20", bg: "bg-gray-500/10", text: "text-gray-600", bar: "bg-gray-500" };
        }
    };

    const handleDismiss = async (notification: any) => {
        if (dismissingIds.has(notification.id)) return; // Prevent double trigger

        setDismissingIds(prev => new Set(prev).add(notification.id));

        // Allow animation to play
        setTimeout(async () => {
            setUndoNotification(notification);
            setShowUndo(true);
            await dismissNotification(notification.id);

            setDismissingIds(prev => {
                const next = new Set(prev);
                next.delete(notification.id);
                return next;
            });

            setTimeout(() => {
                // Only hide undo if it matches the current one (simple logic for now)
                if (undoNotification?.id === notification.id) {
                    setShowUndo(false);
                    setUndoNotification(null);
                }
            }, 1500);
        }, 300); // 300ms for slide out animation
    };

    const handleUndo = async () => {
        if (undoNotification) {
            await undoDismissNotification(undoNotification.id);
            setShowUndo(false);
            setUndoNotification(null);
        }
    };

    const onTouchStart = (e: React.TouchEvent, id: number) => {
        setTouchStart(e.targetTouches[0].clientX);
        setSwipingId(id);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        if (touchStart === null) return;
        const currentTouch = e.targetTouches[0].clientX;
        const diff = currentTouch - touchStart;

        // Visual feedback if needed, but for now we just detect end
    };

    const onTouchEnd = (e: React.TouchEvent, item: any) => {
        if (touchStart === null) return;
        const touchEnd = e.changedTouches[0].clientX;
        const diff = touchEnd - touchStart;

        if (diff > 100) { // Swiped right
            handleDismiss(item);
        }

        setTouchStart(null);
        setSwipingId(null);
    };

    const handleDownload = async (url: string, filename: string) => {
        try {
            const response = await fetch(optimizeCloudinaryUrl(url));
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error('Download failed:', error);
        }
    };

    return (
        <div className="w-full space-y-10 animate-in fade-in duration-700">
            {/* Filter Toolbar */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 top-0 z-30 bg-white py-5 px-5 rounded-3xl border border-orange-100 shadow-[0_8px_30px_rgba(0,0,0,0.02)]">

                {/* Tabs - Scrollable on mobile, Fixed on desktop */}
                <div className="flex-1 flex flex-nowrap overflow-x-auto gap-1 bg-white p-1 rounded-2xl md:rounded-full border border-orange-100 scrollbar-thin scrollbar-thumb-orange-200 scrollbar-track-transparent min-w-0 shadow-sm">
                    {tabs.map(tab => (
                        <Button
                            key={tab.id}
                            variant="ghost"
                            size="sm"
                            onClick={() => setActiveTab(tab.id as any)}
                            className={cn(
                                "rounded-full transition-all duration-300 font-extrabold md:font-black text-[9px] md:text-[10px] uppercase tracking-widest px-3 md:px-4 py-1.5 md:py-2 flex items-center gap-2 whitespace-nowrap",
                                activeTab === tab.id ? "bg-orange-50/50 text-orange-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            {tab.label}
                            {tab.count !== undefined && tab.count > 0 && (
                                <span className="flex h-4 md:h-5 min-w-[16px] md:min-w-[20px] items-center justify-center rounded-full bg-orange-600 px-1 text-[7px] md:text-[8px] font-black text-white">
                                    {tab.count}
                                </span>
                            )}
                        </Button>
                    ))}
                </div>

                <div className="flex items-center gap-2 md:gap-3 w-full xl:w-auto shrink-0 transition-all">
                    {/* Search Bar */}
                    <div className="relative flex-1 xl:w-64 group order-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                        <Input
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 h-10 md:h-11 rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:border-orange-200 focus:ring-4 focus:ring-orange-500/10 transition-all font-semibold text-xs md:text-sm shadow-sm"
                        />
                    </div>

                    {/* Date Filter */}
                    <div className="flex items-center gap-2 relative z-20 shrink-0 order-2">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className={cn(
                                        "h-10 w-10 md:h-11 md:w-11 rounded-xl border-slate-200 bg-white hover:bg-slate-50 shadow-sm transition-all",
                                        date && "border-orange-200 bg-orange-50 text-orange-600 ring-2 ring-orange-100"
                                    )}
                                    title={date ? format(date, "PPP") : "Filter by Date"}
                                >
                                    <CalendarIcon className="h-4 w-4 md:h-5 md:w-5" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="end">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={setDate}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>

                        {date && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDate(undefined)}
                                className="h-10 w-10 md:h-11 md:w-11 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 bg-slate-50 border border-slate-100"
                                title="Clear Date Filter"
                            >
                                <X className="h-4 w-4 md:h-5 md:w-5" />
                            </Button>
                        )}
                    </div>

                    {/* Refresh Button */}
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => refreshNotifications()}
                        disabled={loading}
                        className={cn(
                            "h-10 w-10 md:h-11 md:w-11 rounded-xl border-slate-200 bg-white hover:bg-slate-50 shadow-sm transition-all order-3",
                            loading && "animate-pulse"
                        )}
                        title="Refresh Notifications"
                    >
                        <RefreshCw className={cn("h-4 w-4 md:h-5 md:w-5", loading && "animate-spin")} />
                    </Button>

                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={markAllAsRead}
                            className="hidden md:flex text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-xl font-bold text-xs uppercase tracking-wider whitespace-nowrap order-4"
                        >
                            Mark Read
                        </Button>
                    )}
                </div>
            </div>

            {/* Filter Tabs & Actions */}


            <div className="space-y-4">
                {filteredItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white rounded-[32px] border border-dashed border-slate-200 shadow-sm">
                        <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center mb-6">
                            <Megaphone className="h-8 w-8 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest">No Matches Found</h3>
                        <p className="text-sm text-muted-foreground mt-2 max-w-xs">We couldn't find any announcements matching your current filters.</p>
                        {activeTab !== 'all' && (
                            <Button variant="link" onClick={() => setActiveTab('all')} className="mt-2 text-primary">
                                Clear Filters
                            </Button>
                        )}
                    </div>
                ) : (
                    paginatedItems.map((item) => {
                        const colors = getColors(item.type);
                        const isDismissing = dismissingIds.has(item.id);
                        return (
                            <Card
                                key={item.id}
                                onTouchStart={(e) => onTouchStart(e, item.id)}
                                onTouchEnd={(e) => onTouchEnd(e, item)}
                                onClick={() => {
                                    if (!item.is_read) markAsRead(item.id);
                                    setSelectedNotification(item);
                                }}
                                className={cn(
                                    "group hover:shadow-xl transition-all duration-500 border-slate-200 overflow-hidden bg-white relative cursor-pointer active:scale-[0.98] md:active:scale-100",
                                    !item.is_read ? "border-orange-200 shadow-orange-500/5 ring-1 ring-orange-500/10" : "opacity-80 hover:opacity-100",
                                    isDismissing && "translate-x-full opacity-0 pointer-events-none"
                                )}
                            >
                                <CardContent className="p-0">
                                    <div className="flex">
                                        <div className={cn(
                                            "w-1 shrink-0 transition-all group-hover:w-2",
                                            !item.is_read ? "bg-orange-500" : colors.bar
                                        )} />

                                        <div className="p-4 md:p-6 flex-1 flex items-start gap-4 md:gap-6">
                                            <div className={cn(
                                                "h-10 w-10 md:h-12 md:w-12 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 border shadow-sm transition-transform group-hover:scale-110 duration-500",
                                                !item.is_read ? "bg-orange-50/50 border-orange-100 text-orange-600" : "bg-slate-50 border-slate-100 text-slate-400"
                                            )}>
                                                {getIcon(item.type)}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-col md:flex-row md:items-center justify-between mb-2">
                                                    <h3 className={cn(
                                                        "text-base md:text-lg transition-colors leading-tight mb-1 md:mb-0",
                                                        !item.is_read ? "font-black text-slate-800" : "font-bold text-slate-600"
                                                    )}>
                                                        {item.title}
                                                    </h3>
                                                    <div className="flex items-center gap-1.5 text-slate-400">
                                                        <CalendarIcon className="h-3 md:h-3.5 w-3 md:w-3.5" />
                                                        <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">{format(new Date(item.created_at), 'dd MMM yyyy')}</span>
                                                    </div>
                                                </div>
                                                <p className={cn(
                                                    "text-sm leading-relaxed whitespace-pre-wrap line-clamp-2",
                                                    !item.is_read ? "text-slate-600 font-medium" : "text-slate-400"
                                                )}>
                                                    {item.message}
                                                </p>

                                                {/* Media Attachments Preview */}
                                                {item.metadata && (
                                                    <div className="mt-4 flex gap-2">
                                                        {item.metadata.images && Array.isArray(item.metadata.images) && item.metadata.images.length > 0 && (
                                                            <div className="flex -space-x-3 hover:space-x-1 transition-all">
                                                                {item.metadata.images.slice(0, 3).map((img, i) => (
                                                                    <div key={i} className="h-10 w-10 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center overflow-hidden shadow-sm hover:scale-125 hover:z-10 transition-all duration-300">
                                                                        <img src={optimizeCloudinaryUrl(img, { width: 80 })} loading="lazy" className="h-full w-full object-cover" />
                                                                    </div>
                                                                ))}
                                                                {item.metadata.images.length > 3 && (
                                                                    <div className="h-10 w-10 rounded-full border-2 border-white bg-slate-50 flex items-center justify-center text-[10px] font-black text-slate-400 shadow-sm z-10">
                                                                        +{item.metadata.images.length - 3}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                        {item.metadata.videos && Array.isArray(item.metadata.videos) && item.metadata.videos.length > 0 && (
                                                            <Badge variant="outline" className="text-[10px] font-bold border-slate-200 text-slate-500 bg-slate-50 h-8 px-3 rounded-full">
                                                                <Video className="w-3 h-3 mr-1.5" />
                                                                {item.metadata.videos.length} Video{item.metadata.videos.length > 1 ? 's' : ''}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                )}

                                                <div className="mt-4 flex items-center text-[10px] font-black uppercase tracking-[0.2em] text-orange-600 opacity-60 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                                                    Read More <ChevronRight className="h-3.5 w-3.5 ml-1 transition-transform group-hover:translate-x-1" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Unread Indicator & Clear Button */}
                                    <div className="absolute top-4 right-4 flex items-center gap-2">
                                        {!item.is_read && (
                                            <span className="flex h-2.5 w-2.5 rounded-full bg-orange-500">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500"></span>
                                            </span>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 rounded-full text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDismiss(item);
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    {!item.is_read && (
                                        <div className="absolute top-3 right-14 opacity-0 group-hover:opacity-100 transition-all duration-300 hidden md:block">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-full"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    markAsRead(item.id);
                                                }}
                                            >
                                                Mark Read
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })
                )}
            </div>

            {totalPages > 0 && (
                <div className="mt-8 flex justify-end pb-8">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                </div>
            )}

            {/* Detailed View Modal */}
            <Dialog open={!!selectedNotification} onOpenChange={(open) => !open && setSelectedNotification(null)}>
                <DialogContent className="max-w-2xl bg-white/95 backdrop-blur-xl border-white shadow-2xl rounded-3xl p-0 overflow-hidden">
                    {(() => {
                        const item = selectedNotification;
                        if (!item) return null;
                        const colors = getColors(item.type);

                        return (
                            <>
                                <DialogHeader className="p-6 md:p-8 pb-4 relative overflow-hidden">
                                    <div className={`absolute top-0 left-0 w-full h-1 ${colors.bar}`} />
                                    <div className="relative flex items-start gap-4">
                                        <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 border ${colors.border} ${colors.bg} ${colors.text}`}>
                                            {getIcon(item.type)}
                                        </div>
                                        <div className="flex-1">
                                            <DialogTitle className="text-xl md:text-2xl font-black text-slate-900 leading-tight mb-2">
                                                {item.title}
                                            </DialogTitle>
                                            <div className="flex items-center gap-3 text-slate-500">
                                                <Badge variant="outline" className={`h-6 text-[10px] font-black uppercase tracking-wider border-0 ${colors.bg} ${colors.text}`}>
                                                    {tabs.find(t => t.id === item.type)?.label || item.type}
                                                </Badge>
                                                <span className="text-[10px] font-bold opacity-50">•</span>
                                                <div className="flex items-center gap-1.5">
                                                    <CalendarIcon className="h-3.5 w-3.5" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">
                                                        {format(new Date(item.created_at), 'PPP p')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </DialogHeader>

                                <div className="p-6 md:p-8 pt-0 space-y-6">
                                    <div className="prose prose-sm max-w-none text-slate-600 leading-relaxed whitespace-pre-wrap font-medium">
                                        {item.message}
                                    </div>

                                    {item.metadata && (
                                        <div className="space-y-6">
                                            {item.metadata.images && item.metadata.images.length > 0 && (
                                                <div>
                                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                                                        <ImageIcon className="h-3.5 w-3.5" /> Attached Images
                                                    </h4>
                                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                        {item.metadata.images.map((img: string, i: number) => (
                                                            <div key={i} className="group relative aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                                                                <img
                                                                    src={optimizeCloudinaryUrl(img)}
                                                                    loading="lazy"
                                                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                                />
                                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                                    <Button
                                                                        size="icon"
                                                                        variant="ghost"
                                                                        className="h-8 w-8 rounded-full bg-white/20 text-white hover:bg-white hover:text-black backdrop-blur-md"
                                                                        onClick={() => window.open(optimizeCloudinaryUrl(img), '_blank')}
                                                                    >
                                                                        <ExternalLink className="h-4 w-4" />
                                                                    </Button>
                                                                    <Button
                                                                        size="icon"
                                                                        variant="ghost"
                                                                        className="h-8 w-8 rounded-full bg-white/20 text-white hover:bg-white hover:text-black backdrop-blur-md"
                                                                        onClick={() => handleDownload(img, `image-${i + 1}.jpg`)}
                                                                    >
                                                                        <Download className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {item.metadata.videos && item.metadata.videos.length > 0 && (
                                                <div>
                                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                                                        <Video className="h-3.5 w-3.5" /> Attached Videos
                                                    </h4>
                                                    <div className="space-y-3">
                                                        {item.metadata.videos.map((vid: string, i: number) => (
                                                            <div key={i} className="flex items-center gap-4 p-3 rounded-2xl bg-slate-50 border border-slate-100 group hover:bg-slate-100 transition-colors">
                                                                <div className="h-10 w-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                                                                    <PlayCircle className="h-5 w-5" />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-xs font-bold text-slate-700 truncate">Video Attachment {i + 1}</p>
                                                                    <p className="text-[10px] font-medium text-slate-400">MP4 Format</p>
                                                                </div>
                                                                <div className="flex gap-2">
                                                                    <Button
                                                                        size="icon"
                                                                        variant="ghost"
                                                                        className="h-8 w-8 text-slate-400 hover:text-primary hover:bg-white shadow-sm"
                                                                        onClick={() => window.open(optimizeCloudinaryUrl(vid), '_blank')}
                                                                    >
                                                                        <ExternalLink className="h-4 w-4" />
                                                                    </Button>
                                                                    <Button
                                                                        size="icon"
                                                                        variant="ghost"
                                                                        className="h-8 w-8 text-slate-400 hover:text-primary hover:bg-white shadow-sm"
                                                                        onClick={() => handleDownload(vid, `video-${i + 1}.mp4`)}
                                                                    >
                                                                        <Download className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {item.link && (
                                        <div className="pt-6 border-t border-slate-100 flex justify-end">
                                            <Button
                                                onClick={() => {
                                                    let url;
                                                    if (item.link.startsWith('/')) {
                                                        // Internal link: Prepend origin to open in new tab
                                                        url = `${window.location.origin}${item.link}`;
                                                    } else {
                                                        // External link: Ensure protocol
                                                        url = item.link.startsWith('http') ? item.link : `https://${item.link}`;
                                                    }
                                                    window.open(url, '_blank', 'noopener,noreferrer');
                                                }}
                                                className="w-full sm:w-auto h-12 px-8 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-bold uppercase tracking-wider text-xs shadow-lg shadow-slate-900/20"
                                            >
                                                View Associated Link <ChevronRight className="ml-2 h-4 w-4" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </>
                        );
                    })()}
                </DialogContent>
            </Dialog>

            {/* Undo Toast */}
            {
                showUndo && (
                    <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-bottom-6 zoom-in-95 duration-500">
                        <div className="flex items-center gap-8 bg-slate-900/90 backdrop-blur-2xl px-6 py-3.5 rounded-full shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] border border-white/10 group">
                            <div className="flex items-center gap-3 whitespace-nowrap">
                                <div className="h-1.5 w-1.5 rounded-full bg-orange-50 shadow-[0_0_10px_rgba(249,115,22,0.5)] animate-pulse" />
                                <p className="text-[13px] font-medium text-white/90">
                                    Dismissed <span className="font-black text-white ml-0.5 truncate max-w-[120px] inline-block align-bottom">"{undoNotification?.title}"</span>
                                </p>
                            </div>
                            <div className="h-4 w-[1px] bg-white/10" />
                            <button
                                onClick={handleUndo}
                                className="text-orange-400 hover:text-orange-300 transition-all text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-2 group/undo"
                            >
                                Undo
                                <Undo2 className="h-3.5 w-3.5 group-hover/undo:-translate-x-0.5 transition-transform" />
                            </button>
                        </div>
                    </div>
                )
            }
        </div >
    );
};
