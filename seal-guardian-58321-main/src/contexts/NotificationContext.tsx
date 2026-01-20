import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

interface Notification {
    id: number;
    title: string;
    message: string;
    type: 'product' | 'alert' | 'system';
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
    unreadCount: number;
    loading: boolean;
    markAsRead: (id: number) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [socket, setSocket] = useState<Socket | null>(null);

    const fetchNotifications = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const [notifRes, countRes] = await Promise.all([
                api.get("/notifications"),
                api.get("/notifications/unread-count")
            ]);
            if (notifRes.data.success) setNotifications(notifRes.data.notifications);
            if (countRes.data.success) setUnreadCount(countRes.data.count);
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        } finally {
            setLoading(false);
        }
    }, [user]);

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
                setNotifications(prev => [notification, ...prev]);
                setUnreadCount(prev => prev + 1);

                toast({
                    title: notification.title,
                    description: notification.message,
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

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            loading,
            markAsRead,
            markAllAsRead,
            refreshNotifications: fetchNotifications
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
