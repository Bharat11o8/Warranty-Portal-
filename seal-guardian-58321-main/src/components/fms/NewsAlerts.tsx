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
import { Calendar as CalendarIcon, ChevronRight, Info, Megaphone, Search, Filter, ShieldCheck, AlertTriangle, Video, Download, ExternalLink, PlayCircle, FileVideo, FileText, Link, Image as ImageIcon, X } from "lucide-react";
import { useNotifications } from "@/contexts/NotificationContext";
import { cn } from "@/lib/utils";
import { format, isSameDay } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

export const NewsAlerts = () => {
    const { fullHistory, markAsRead, markAllAsRead } = useNotifications();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'alert' | 'system' | 'product'>('all');
    const [date, setDate] = useState<Date | undefined>();

    // Base filter: only show alert/system/product types (admin broadcasts, news)
    // Warranty notifications are shown separately in the NotificationPopover, not here
    const baseNotifications = fullHistory.filter(n =>
        n.type === 'alert' || n.type === 'system' || n.type === 'product'
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
            return (
                item.title.toLowerCase().includes(query) ||
                item.message.toLowerCase().includes(query)
            );
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

    const [selectedNotification, setSelectedNotification] = useState<any>(null);

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Filter Toolbar */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 sticky top-0 z-30 bg-white/80 backdrop-blur-xl py-4 -mx-4 px-4 border-b border-slate-50">

                {/* Tabs */}
                <div className="flex-1 flex flex-nowrap overflow-x-auto pb-2 gap-2 bg-slate-50 p-1.5 rounded-full border border-slate-100 [&::-webkit-scrollbar]:hidden min-w-0">
                    {tabs.map(tab => (
                        <Button
                            key={tab.id}
                            variant="ghost"
                            size="sm"
                            onClick={() => setActiveTab(tab.id as any)}
                            className={cn(
                                "rounded-full px-4 font-bold text-xs h-9 transition-all relative shrink-0 flex-1",
                                activeTab === tab.id
                                    ? "bg-white text-orange-600 shadow-sm ring-1 ring-slate-100"
                                    : "text-slate-500 hover:text-orange-600 hover:bg-white/50"
                            )}
                        >
                            {tab.label}
                            {tab.count !== undefined && tab.count > 0 && (
                                <span className={cn(
                                    "ml-2 px-1.5 py-0.5 rounded-full text-[9px] min-w-[1.25rem] inline-flex items-center justify-center",
                                    activeTab === tab.id ? "bg-orange-50 text-orange-600" : "bg-slate-200 text-slate-600"
                                )}>
                                    {tab.count}
                                </span>
                            )}
                        </Button>
                    ))}
                </div>

                <div className="flex items-center gap-3 w-full xl:w-auto shrink-0">
                    {/* Date Filter */}
                    <div className="flex items-center gap-2 relative z-20 shrink-0">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className={cn(
                                        "h-11 w-11 rounded-xl border-slate-200 bg-white hover:bg-slate-50 shadow-sm transition-all",
                                        date && "border-orange-200 bg-orange-50 text-orange-600 ring-2 ring-orange-100"
                                    )}
                                    title={date ? format(date, "PPP") : "Filter by Date"}
                                >
                                    <CalendarIcon className="h-5 w-5" />
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
                                className="h-11 w-11 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 bg-slate-50 border border-slate-100"
                                title="Clear Date Filter"
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        )}
                    </div>

                    {/* Search Bar */}
                    <div className="relative w-40 sm:w-48 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                        <Input
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 h-11 rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:border-orange-200 focus:ring-4 focus:ring-orange-500/10 transition-all font-semibold"
                        />
                    </div>

                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={markAllAsRead}
                            className="hidden md:flex text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-xl font-bold text-xs uppercase tracking-wider whitespace-nowrap"
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
                    filteredItems.map((item) => {
                        const colors = getColors(item.type);
                        return (
                            <Card
                                key={item.id}
                                onClick={() => {
                                    if (!item.is_read) markAsRead(item.id);
                                    setSelectedNotification(item);
                                }}
                                className={cn(
                                    "group hover:shadow-xl transition-all duration-500 border-slate-200 overflow-hidden bg-white relative cursor-pointer",
                                    !item.is_read ? "border-orange-200 shadow-orange-500/5 ring-1 ring-orange-500/10" : "opacity-80 hover:opacity-100"
                                )}
                            >
                                <CardContent className="p-0">
                                    <div className="flex">
                                        <div className={cn(
                                            "w-1 shrink-0 transition-all group-hover:w-2",
                                            !item.is_read ? "bg-orange-500" : colors.bar
                                        )} />

                                        <div className="p-6 flex-1 flex items-start gap-6">
                                            <div className={cn(
                                                "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 border shadow-sm transition-transform group-hover:scale-110 duration-500",
                                                !item.is_read ? "bg-orange-50/50 border-orange-100 text-orange-600" : "bg-slate-50 border-slate-100 text-slate-400"
                                            )}>
                                                {getIcon(item.type)}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-2">
                                                    <h3 className={cn(
                                                        "text-lg transition-colors leading-tight",
                                                        !item.is_read ? "font-black text-slate-800" : "font-bold text-slate-600"
                                                    )}>
                                                        {item.title}
                                                    </h3>
                                                    <div className="flex items-center gap-1.5 text-slate-400">
                                                        <CalendarIcon className="h-3.5 w-3.5" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest">{format(new Date(item.created_at), 'dd MMM yyyy')}</span>
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
                                                                        <img src={img} className="h-full w-full object-cover" />
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

                                    {/* Unread Indicator */}
                                    {!item.is_read && (
                                        <>
                                            <div className="absolute top-4 right-4 flex items-center gap-2">
                                                <span className="flex h-2.5 w-2.5 rounded-full bg-orange-500">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500"></span>
                                                </span>
                                            </div>
                                            <div className="absolute top-3 right-8 opacity-0 group-hover:opacity-100 transition-all duration-300">
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
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })
                )}
            </div>

            {/* Detailed View Dialog */}
            <Dialog open={!!selectedNotification} onOpenChange={(open) => !open && setSelectedNotification(null)}>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-0 gap-0 border-none shadow-2xl bg-white/95 backdrop-blur-xl [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-slate-300">
                    {selectedNotification && (() => {
                        const colors = getColors(selectedNotification.type);

                        const handleDownload = async (url: string, filename: string) => {
                            try {
                                const response = await fetch(url);
                                const blob = await response.blob();
                                const blobUrl = window.URL.createObjectURL(blob);
                                const link = document.createElement('a');
                                link.href = blobUrl;
                                link.download = filename || 'download';
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                                window.URL.revokeObjectURL(blobUrl);
                            } catch (error) {
                                console.error('Download failed:', error);
                                window.open(url, '_blank');
                            }
                        };

                        return (
                            <>
                                <DialogHeader className={cn("p-8 pb-6 border-b border-slate-100", colors.bg)}>
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 border shadow-sm bg-white",
                                                colors.text
                                            )}>
                                                {getIcon(selectedNotification.type)}
                                            </div>
                                            <div>
                                                <Badge variant="outline" className={cn("mb-2 border-0 bg-white/50 backdrop-blur-md shadow-sm font-bold tracking-widest text-[10px]", colors.text)}>
                                                    {selectedNotification.type.toUpperCase()}
                                                </Badge>
                                                <DialogTitle className="text-2xl font-black tracking-tight text-slate-800 leading-tight">
                                                    {selectedNotification.title}
                                                </DialogTitle>
                                            </div>
                                        </div>
                                    </div>
                                    <DialogDescription className="flex items-center gap-2 mt-3 text-slate-500 font-bold ml-1 text-xs uppercase tracking-wider">
                                        <CalendarIcon className="h-3.5 w-3.5" />
                                        {format(new Date(selectedNotification.created_at), 'PPP')}
                                        <span className="mx-1 text-slate-300">•</span>
                                        {format(new Date(selectedNotification.created_at), 'p')}
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="p-8 space-y-8">
                                    <div className="prose prose-sm max-w-none text-slate-600 leading-relaxed whitespace-pre-wrap text-base font-medium">
                                        {selectedNotification.message}
                                    </div>

                                    {/* Media Gallery */}
                                    {selectedNotification.metadata && (
                                        <div className="space-y-6 pt-6 border-t border-slate-100">
                                            {selectedNotification.metadata.images && Array.isArray(selectedNotification.metadata.images) && selectedNotification.metadata.images.length > 0 && (
                                                <div className="space-y-4">
                                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                                                        <ImageIcon className="w-3.5 h-3.5" /> Attached Images
                                                    </h4>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        {selectedNotification.metadata.images.map((img: string, i: number) => (
                                                            <div key={i} className="group relative aspect-video rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 shadow-sm hover:shadow-xl transition-all duration-500">
                                                                <img src={img} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />

                                                                {/* Image Hover Overlay */}
                                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px]">
                                                                    <a
                                                                        href={img}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-md text-white flex items-center justify-center hover:bg-white/40 transition-colors border border-white/20"
                                                                        title="View Large"
                                                                    >
                                                                        <ExternalLink className="h-5 w-5" />
                                                                    </a>
                                                                    <button
                                                                        onClick={() => handleDownload(img, `image-${i + 1}.jpg`)}
                                                                        className="h-10 w-10 rounded-xl bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/30"
                                                                        title="Download Image"
                                                                    >
                                                                        <Download className="h-5 w-5" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {selectedNotification.metadata.videos && Array.isArray(selectedNotification.metadata.videos) && selectedNotification.metadata.videos.length > 0 && (
                                                <div className="space-y-4">
                                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                                                        <Video className="w-3.5 h-3.5" /> Attached Videos
                                                    </h4>
                                                    <div className="grid grid-cols-1 gap-3">
                                                        {selectedNotification.metadata.videos.map((vid: string, i: number) => (
                                                            <div
                                                                key={i}
                                                                className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-md transition-all group"
                                                            >
                                                                <div className="flex items-center gap-4">
                                                                    <div className="h-12 w-12 rounded-xl bg-white border border-slate-100 text-orange-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                                                                        <FileVideo className="h-6 w-6" />
                                                                    </div>
                                                                    <div className="flex flex-col">
                                                                        <span className="text-sm font-bold text-slate-700">Video Attachment {i + 1}</span>
                                                                        <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">MP4 / WEBM Format</span>
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center gap-2">
                                                                    <a
                                                                        href={vid}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="h-10 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold flex items-center gap-2 transition-colors text-slate-600 shadow-sm"
                                                                    >
                                                                        <PlayCircle className="h-4 w-4 text-orange-500" /> Watch
                                                                    </a>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        className="h-10 w-10 p-0 rounded-xl hover:bg-orange-50 text-slate-400 hover:text-orange-600 transition-colors"
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

                                    {selectedNotification.link && (
                                        <div className="pt-6 border-t border-slate-100 flex justify-end">
                                            <Button onClick={() => navigate(selectedNotification.link)} className="w-full sm:w-auto h-12 px-8 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-bold uppercase tracking-wider text-xs shadow-lg shadow-slate-900/20">
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
        </div >
    );
};
