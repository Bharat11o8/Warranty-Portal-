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
import { Calendar, ChevronRight, Info, Megaphone, Search, Filter, ShieldCheck, AlertTriangle, Video, Download, ExternalLink, PlayCircle, FileVideo, FileText, Link, Image as ImageIcon } from "lucide-react";
import { useNotifications } from "@/contexts/NotificationContext";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export const NewsAlerts = () => {
    const { fullHistory, markAsRead, markAllAsRead } = useNotifications();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'alert' | 'system' | 'product'>('all');

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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Announcements</h2>
                    <p className="text-sm text-muted-foreground font-medium">Stay updated with latest news and headquarters alerts.</p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    {/* Search Bar */}
                    <div className="relative flex-1 md:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search announcements..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 bg-background/50 border-border/60 focus:ring-primary/20 backdrop-blur-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Filter Tabs & Actions */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
                <div className="flex flex-wrap gap-2">
                    {tabs.map(tab => (
                        <Button
                            key={tab.id}
                            variant={activeTab === tab.id ? "default" : "outline"}
                            size="sm"
                            onClick={() => setActiveTab(tab.id as any)}
                            className={cn(
                                "rounded-full px-4 font-bold text-xs h-9 transition-all",
                                activeTab === tab.id ? "shadow-md shadow-primary/25" : "bg-transparent border-muted-foreground/20 hover:bg-muted/50"
                            )}
                        >
                            {tab.label}
                            {tab.count !== undefined && tab.count > 0 && (
                                <span className={cn(
                                    "ml-2 px-1.5 py-0.5 rounded-full text-[10px]",
                                    activeTab === tab.id ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
                                )}>
                                    {tab.count}
                                </span>
                            )}
                        </Button>
                    ))}
                </div>

                {unreadCount > 0 && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={markAllAsRead}
                        className="text-muted-foreground hover:text-primary whitespace-nowrap"
                    >
                        Mark all as read
                    </Button>
                )}
            </div>

            <div className="space-y-4">
                {filteredItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-muted/5 rounded-3xl border border-dashed border-muted-foreground/20">
                        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                            <Filter className="h-8 w-8 text-muted-foreground/30" />
                        </div>
                        <h3 className="text-lg font-bold text-muted-foreground uppercase tracking-widest">No Matches Found</h3>
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
                                    "group hover:shadow-xl transition-all duration-300 border-border/40 overflow-hidden bg-white/60 backdrop-blur-md relative cursor-pointer",
                                    !item.is_read && "border-primary/20 bg-primary/5"
                                )}
                            >
                                <CardContent className="p-0">
                                    <div className="flex">
                                        <div className={cn(
                                            "w-1.5 shrink-0",
                                            colors.bar
                                        )} />

                                        <div className="p-6 flex-1 flex items-start gap-6">
                                            <div className={cn(
                                                "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 border shadow-sm",
                                                colors.bg, colors.border, colors.text
                                            )}>
                                                {getIcon(item.type)}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <h3 className={cn(
                                                        "text-lg transition-colors group-hover:text-primary",
                                                        item.is_read ? "font-medium text-muted-foreground" : "font-extrabold text-foreground"
                                                    )}>
                                                        {item.title}
                                                    </h3>
                                                    <div className="flex items-center gap-1.5 text-muted-foreground/60">
                                                        <Calendar className="h-3.5 w-3.5" />
                                                        <span className="text-xs font-bold">{format(new Date(item.created_at), 'dd MMM yyyy')}</span>
                                                    </div>
                                                </div>
                                                <p className={cn(
                                                    "text-sm mt-2 leading-relaxed whitespace-pre-wrap line-clamp-2",
                                                    item.is_read ? "text-muted-foreground/80" : "text-muted-foreground font-medium"
                                                )}>
                                                    {item.message}
                                                </p>

                                                {/* Media Attachments Preview (Thumbnails only) */}
                                                {item.metadata && (
                                                    <div className="mt-3 flex gap-2">
                                                        {item.metadata.images && Array.isArray(item.metadata.images) && item.metadata.images.length > 0 && (
                                                            <div className="flex -space-x-2">
                                                                {item.metadata.images.slice(0, 3).map((img, i) => (
                                                                    <div key={i} className="h-8 w-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center overflow-hidden">
                                                                        <img src={img} className="h-full w-full object-cover" />
                                                                    </div>
                                                                ))}
                                                                {item.metadata.images.length > 3 && (
                                                                    <div className="h-8 w-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                                                                        +{item.metadata.images.length - 3}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                        {item.metadata.videos && Array.isArray(item.metadata.videos) && item.metadata.videos.length > 0 && (
                                                            <Badge variant="secondary" className="text-[10px] h-6">
                                                                {item.metadata.videos.length} Video{item.metadata.videos.length > 1 ? 's' : ''}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                )}

                                                <button className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:translate-x-1">
                                                    View Complete Details <ChevronRight className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Unread Indicator & Actions */}
                                    {!item.is_read && (
                                        <>


                                            <div className="absolute top-3 right-3 h-2 w-2 rounded-full bg-primary animate-pulse" />
                                            {/* Hover Action: Mark Read */}
                                            <div className="absolute top-2 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 px-2 text-xs text-muted-foreground hover:text-primary hover:bg-primary/5"
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
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-0 gap-0 border-none shadow-2xl bg-white/95 backdrop-blur-xl">
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
                                <DialogHeader className={cn("p-6 pb-4 border-b", colors.bg)}>
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border shadow-sm bg-white",
                                                colors.text
                                            )}>
                                                {getIcon(selectedNotification.type)}
                                            </div>
                                            <div>
                                                <Badge variant="outline" className={cn("mb-1 border-0 bg-white/50", colors.text)}>
                                                    {selectedNotification.type.toUpperCase()}
                                                </Badge>
                                                <DialogTitle className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                                                    {selectedNotification.title}
                                                </DialogTitle>
                                            </div>
                                        </div>
                                    </div>
                                    <DialogDescription className="flex items-center gap-2 mt-2 text-foreground/60 font-medium">
                                        <Calendar className="h-4 w-4" />
                                        {format(new Date(selectedNotification.created_at), 'PPP')}
                                        <span className="mx-1">•</span>
                                        {format(new Date(selectedNotification.created_at), 'p')}
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="p-6 space-y-6">
                                    <div className="prose prose-sm max-w-none text-foreground/80 leading-relaxed whitespace-pre-wrap text-base">
                                        {selectedNotification.message}
                                    </div>

                                    {/* Media Gallery */}
                                    {selectedNotification.metadata && (
                                        <div className="space-y-6 pt-4 border-t">
                                            {selectedNotification.metadata.images && Array.isArray(selectedNotification.metadata.images) && selectedNotification.metadata.images.length > 0 && (
                                                <div className="space-y-3">
                                                    <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Attached Images</h4>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        {selectedNotification.metadata.images.map((img: string, i: number) => (
                                                            <div key={i} className="group relative aspect-video rounded-xl overflow-hidden border bg-muted shadow-sm hover:shadow-md transition-all duration-300">
                                                                <img src={img} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />

                                                                {/* Image Hover Overlay */}
                                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                                                    <a
                                                                        href={img}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center hover:bg-white/40 transition-colors"
                                                                        title="View Large"
                                                                    >
                                                                        <ExternalLink className="h-5 w-5" />
                                                                    </a>
                                                                    <button
                                                                        onClick={() => handleDownload(img, `image-${i + 1}.jpg`)}
                                                                        className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:scale-110 transition-transform"
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
                                                <div className="space-y-3">
                                                    <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Attached Videos</h4>
                                                    <div className="grid grid-cols-1 gap-2">
                                                        {selectedNotification.metadata.videos.map((vid: string, i: number) => (
                                                            <div
                                                                key={i}
                                                                className="flex items-center justify-between p-3 rounded-xl border bg-gradient-to-r from-muted/50 to-muted/30 hover:from-muted hover:to-muted/50 transition-all group"
                                                            >
                                                                <div className="flex items-center gap-4">
                                                                    <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 shadow-sm">
                                                                        <FileVideo className="h-6 w-6" />
                                                                    </div>
                                                                    <div className="flex flex-col">
                                                                        <span className="text-sm font-semibold">Video Attachment {i + 1}</span>
                                                                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">MP4 / WEBM Format</span>
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center gap-2">
                                                                    <a
                                                                        href={vid}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="h-9 px-3 rounded-lg border bg-background hover:bg-muted text-xs font-bold flex items-center gap-2 transition-colors"
                                                                    >
                                                                        <PlayCircle className="h-4 w-4" /> Watch
                                                                    </a>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        className="h-9 w-9 p-0 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors"
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
                                        <div className="pt-4 border-t flex justify-end">
                                            <Button onClick={() => navigate(selectedNotification.link)} className="w-full sm:w-auto">
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
