
import { useState } from "react";
import { Bell, Check, Package, AlertTriangle, Info, MoreHorizontal, ShieldCheck, Megaphone, Trash2, Video, Download, ExternalLink, PlayCircle, FileVideo, Image as ImageIcon, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
    Popover,
    PopoverContent,
    PopoverTrigger
} from "@/components/ui/popover";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { DownloadCloud } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNotifications } from "@/contexts/NotificationContext";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, format } from "date-fns";

export const NotificationPopover = ({ onNavigate }: { onNavigate?: (module: any) => void }) => {
    const {
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearAllNotifications
    } = useNotifications();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);

    const getIcon = (type: string) => {
        switch (type) {
            case 'product': return <Megaphone className="h-4 w-4 text-purple-600" />;
            case 'warranty': return <ShieldCheck className="h-4 w-4 text-blue-600" />;
            case 'alert': return <AlertTriangle className="h-4 w-4 text-amber-600" />;
            case 'system': return <ShieldCheck className="h-4 w-4 text-blue-600" />;
            default: return <Info className="h-4 w-4 text-gray-600" />;
        }
    };

    const getBgColor = (type: string) => {
        switch (type) {
            case 'product': return "bg-purple-100";
            case 'warranty': return "bg-blue-100";
            case 'alert': return "bg-amber-100";
            case 'system': return "bg-blue-100";
            default: return "bg-gray-100";
        }
    };

    const [selectedNotification, setSelectedNotification] = useState<any>(null);

    const NotificationItem = ({ notification }: { notification: any }) => (
        <div
            className={cn(
                "flex gap-3 p-4 text-left transition-colors border-b last:border-0 hover:bg-muted/50 relative group cursor-pointer",
                !notification.is_read && "bg-primary/5"
            )}
            onClick={() => {
                if (!notification.is_read) markAsRead(notification.id);
                setSelectedNotification(notification);
            }}
        >
            <div className={cn(
                "h-9 w-9 rounded-full flex items-center justify-center shrink-0 shadow-sm border border-white/50",
                getBgColor(notification.type)
            )}>
                {getIcon(notification.type)}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                    <p className={cn(
                        "text-sm tracking-tight truncate pr-2",
                        notification.is_read ? "font-medium text-muted-foreground" : "font-bold text-foreground"
                    )}>
                        {notification.title}
                    </p>
                    <span className="text-[10px] text-muted-foreground font-medium whitespace-nowrap">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </span>
                </div>
                <p className={cn(
                    "text-xs leading-relaxed line-clamp-2",
                    notification.is_read ? "text-muted-foreground/80" : "text-muted-foreground font-medium"
                )}>
                    {notification.message}
                </p>

                {/* Media Preview in List */}
                {notification.metadata && (
                    (Array.isArray(notification.metadata.images) && notification.metadata.images.length > 0) ||
                    (Array.isArray(notification.metadata.videos) && notification.metadata.videos.length > 0)
                ) && (
                        <div className="mt-2 flex gap-1.5 overflow-hidden">
                            {Array.isArray(notification.metadata.images) && notification.metadata.images.slice(0, 3).map((img: string, i: number) => (
                                <div key={i} className="h-10 w-10 rounded border bg-muted flex items-center justify-center overflow-hidden shrink-0">
                                    <img src={img} className="h-full w-full object-cover" alt="" />
                                </div>
                            ))}
                            {Array.isArray(notification.metadata.videos) && notification.metadata.videos.length > 0 && (
                                <div className="h-10 w-10 rounded border bg-purple-500/10 flex items-center justify-center shrink-0">
                                    <Video className="h-4 w-4 text-purple-600" />
                                </div>
                            )}
                        </div>
                    )}
            </div>
            {!notification.is_read && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
            )}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                {!notification.is_read && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 rounded-full hover:bg-background shadow-sm border"
                        onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                        }}
                        title="Mark as read"
                    >
                        <Check className="h-3 w-3 text-primary" />
                    </Button>
                )}
            </div>
        </div>
    );

    const unreadNotifications = notifications.filter(n => !n.is_read);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative rounded-full h-9 w-9 text-muted-foreground hover:text-primary transition-all hover:bg-primary/10">
                    <Bell className={cn("h-5 w-5 transition-transform", unreadCount > 0 && "animate-tada")} />
                    {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border-2 border-background"></span>
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-[min(calc(100vw-2rem),380px)] p-0 overflow-hidden shadow-2xl border-orange-100/50 bg-white/95 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200"
                align="end"
                sideOffset={12}
                collisionPadding={16}
            >
                <Tabs defaultValue="all" className="w-full">
                    <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
                        <h3 className="font-bold text-sm">Notifications</h3>
                        <div className="flex items-center gap-1">
                            {unreadCount > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-[10px] font-bold text-primary hover:bg-primary/10 px-2"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        markAllAsRead();
                                    }}
                                >
                                    Mark all read <Check className="ml-1 h-3 w-3" />
                                </Button>
                            )}
                            {notifications.length > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-[10px] font-bold text-destructive hover:bg-destructive/10 px-2"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (window.confirm("Are you sure you want to clear all notifications?")) {
                                            clearAllNotifications();
                                        }
                                    }}
                                >
                                    Clear all <Trash2 className="ml-1 h-3 w-3" />
                                </Button>
                            )}
                        </div>
                    </div>

                    <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0 h-10">
                        <TabsTrigger value="all" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2 text-xs font-bold w-1/2">
                            All
                        </TabsTrigger>
                        <TabsTrigger value="unread" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2 text-xs font-bold w-1/2">
                            Unread ({unreadCount})
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="all" className="mt-0">
                        <ScrollArea className="h-[400px]">
                            {notifications.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-[300px] text-center p-8">
                                    <Bell className="h-10 w-10 text-muted-foreground/20 mb-4" />
                                    <p className="text-sm font-medium text-muted-foreground">No notifications yet.</p>
                                </div>
                            ) : (
                                notifications.map(n => <NotificationItem key={n.id} notification={n} />)
                            )}
                        </ScrollArea>
                    </TabsContent>

                    <TabsContent value="unread" className="mt-0">
                        <ScrollArea className="h-[400px]">
                            {unreadNotifications.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-[300px] text-center p-8">
                                    <Check className="h-10 w-10 text-green-500/20 mb-4" />
                                    <p className="text-sm font-medium text-muted-foreground">You're all caught up!</p>
                                </div>
                            ) : (
                                unreadNotifications.map(n => <NotificationItem key={n.id} notification={n} />)
                            )}
                        </ScrollArea>
                    </TabsContent>

                    <div className="p-2 border-t bg-muted/10 text-center">
                        <Button
                            variant="ghost"
                            className="w-full h-8 text-xs font-bold text-muted-foreground hover:text-primary transition-colors"
                            onClick={() => {
                                setOpen(false);
                                if (onNavigate) {
                                    onNavigate('news');
                                } else {
                                    navigate('/news-alerts');
                                }
                            }}
                        >
                            View All Activity
                        </Button>
                    </div>
                </Tabs>
            </PopoverContent>

            {/* Detailed View Dialog */}
            <Dialog open={!!selectedNotification} onOpenChange={(open) => !open && setSelectedNotification(null)}>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-0 gap-0 border-none shadow-2xl bg-white/95 backdrop-blur-xl">
                    {selectedNotification && (() => {
                        const bgColors = {
                            product: "bg-purple-100",
                            warranty: "bg-blue-100",
                            alert: "bg-amber-100",
                            system: "bg-blue-100",
                            default: "bg-gray-100"
                        } as any;
                        const textColors = {
                            product: "text-purple-600",
                            warranty: "text-blue-600",
                            alert: "text-amber-600",
                            system: "text-blue-600",
                            default: "text-gray-600"
                        } as any;

                        const type = selectedNotification.type || 'default';
                        const bg = bgColors[type] || bgColors.default;
                        const text = textColors[type] || textColors.default;

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
                                <DialogHeader className={cn("p-6 pb-4 border-b", bg.replace("100", "500/10"))}>
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border shadow-sm bg-white",
                                                text
                                            )}>
                                                {getIcon(selectedNotification.type)}
                                            </div>
                                            <div>
                                                <Badge variant="outline" className={cn("mb-1 border-0 bg-white/50", text)}>
                                                    {selectedNotification.type.toUpperCase()}
                                                </Badge>
                                                <DialogTitle className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                                                    {selectedNotification.title}
                                                </DialogTitle>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 mt-2 text-foreground/60 font-medium text-sm">
                                        <span className="font-bold">{format(new Date(selectedNotification.created_at), 'PPP')}</span>
                                        <span className="mx-1">•</span>
                                        {format(new Date(selectedNotification.created_at), 'p')}
                                    </div>
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
                                            <Button onClick={() => {
                                                setOpen(false);
                                                setSelectedNotification(null);
                                                navigate(selectedNotification.link);
                                            }} className="w-full sm:w-auto">
                                                View Associated Link
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </>
                        );
                    })()}
                </DialogContent>
            </Dialog>
        </Popover>
    );
};
