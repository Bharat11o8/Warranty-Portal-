import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

export interface Notification {
    id: number;
    title: string;
    message: string;
    type: 'product' | 'alert' | 'system' | 'posm' | 'order' | 'scheme' | 'warranty';
    link?: string;
    metadata?: {
        images?: string[];
        videos?: string[];
    };
    is_read: boolean;
    created_at: string;
}

interface NotificationContextType {
    notifications: Notification[];
    fullHistory: Notification[];
    unreadCount: number;
    loading: boolean;
    markAsRead: (id: number) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    clearAllNotifications: () => Promise<void>;
    refreshNotifications: () => Promise<void>;
    fetchFullHistory: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [fullHistory, setFullHistory] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [socket, setSocket] = useState<Socket | null>(null);

    const parseMetadata = (notifs: Notification[]) => {
        return notifs.map(n => ({
            ...n,
            metadata: n.metadata ? (typeof n.metadata === 'string' ? JSON.parse(n.metadata) : n.metadata) : null
        }));
    };

    const fetchNotifications = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const [notifRes, countRes, historyRes] = await Promise.all([
                api.get("/notifications"),
                api.get("/notifications/unread-count"),
                api.get("/notifications?includeCleared=true")
            ]);
            if (notifRes.data.success) {
                setNotifications(parseMetadata(notifRes.data.notifications));
            }
            if (countRes.data.success) setUnreadCount(countRes.data.count);
            if (historyRes.data.success) {
                setFullHistory(parseMetadata(historyRes.data.notifications));
            }
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    const fetchFullHistory = async () => {
        if (!user) return;
        try {
            const res = await api.get("/notifications?includeCleared=true");
            if (res.data.success) setFullHistory(parseMetadata(res.data.notifications));
        } catch (error) {
            console.error("Failed to fetch full history:", error);
        }
    };

    useEffect(() => {
        if (user && localStorage.getItem("auth_token")) {
            fetchNotifications();

            // Initialize Socket
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const newSocket = io(baseUrl, {
                auth: {
                    token: localStorage.getItem("auth_token")
                }
            });

            newSocket.on("connect", () => {
                console.log("📡 Connected to notification socket");
            });

            newSocket.on("notification:new", (notification: Notification) => {
                const parsedNotif = {
                    ...notification,
                    metadata: notification.metadata ? (typeof notification.metadata === 'string' ? JSON.parse(notification.metadata) : notification.metadata) : null
                };
                setNotifications(prev => [parsedNotif, ...prev]);
                setFullHistory(prev => [parsedNotif, ...prev]);
                setUnreadCount(prev => prev + 1);

                toast({
                    title: parsedNotif.title,
                    description: parsedNotif.message,
                });

                // Play notification sound if desired
                try {
                    const audio = new Audio('/notification-sound.mp3');
                    audio.play();
                } catch (e) {
                    // Ignore sound errors
                }
            });

            setSocket(newSocket);

            return () => {
                newSocket.disconnect();
            };
        } else {
            setNotifications([]);
            setUnreadCount(0);
            if (socket) socket.disconnect();
        }
    }, [user, fetchNotifications]);

    const markAsRead = async (id: number) => {
        try {
            await api.patch(`/notifications/${id}/read`);
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, is_read: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Failed to mark notification as read:", error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.patch("/notifications/read-all");
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error("Failed to mark all as read:", error);
        }
    };

    const clearAllNotifications = async () => {
        try {
            await api.delete("/notifications");
            setNotifications([]);
            setUnreadCount(0);
            toast({
                title: "Notifications cleared",
                description: "All notifications have been removed.",
            });
        } catch (error) {
            console.error("Failed to clear notifications:", error);
            toast({
                title: "Error",
                description: "Failed to clear notifications.",
                variant: "destructive"
            });
        }
    };

    return (
        <NotificationContext.Provider value={{
            notifications,
            fullHistory,
            unreadCount,
            loading,
            markAsRead,
            markAllAsRead,
            clearAllNotifications,
            refreshNotifications: fetchNotifications,
            fetchFullHistory
        }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) throw new Error("useNotifications must be used within NotificationProvider");
    return context;
};
