import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

const NOTIFICATIONS_KEY = 'cifraa_notifications';

function loadNotifications(userId: string): Notification[] {
  try {
    const data = localStorage.getItem(`${NOTIFICATIONS_KEY}_${userId}`);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveNotifications(userId: string, items: Notification[]) {
  localStorage.setItem(`${NOTIFICATIONS_KEY}_${userId}`, JSON.stringify(items));
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>(() =>
    user ? loadNotifications(user.id) : []
  );
  const [isLoading, setIsLoading] = useState(false);

  const fetchNotifications = useCallback(() => {
    if (!user) {
      setNotifications([]);
      return;
    }
    setIsLoading(true);
    setNotifications(loadNotifications(user.id));
    setIsLoading(false);
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    if (user) {
      const items = loadNotifications(user.id);
      const updated = items.map(n => n.id === id ? { ...n, read: true } : n);
      saveNotifications(user.id, updated);
    }
  };

  const markAllAsRead = () => {
    if (!user) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    const items = loadNotifications(user.id);
    const updated = items.map(n => ({ ...n, read: true }));
    saveNotifications(user.id, updated);
  };

  const addNotification = (type: string, title: string, message: string) => {
    if (!user) return;

    const newNotif: Notification = {
      id: `notif_${Date.now()}`,
      user_id: user.id,
      type,
      title,
      message,
      read: false,
      created_at: new Date().toISOString(),
    };

    const items = loadNotifications(user.id);
    const updated = [newNotif, ...items].slice(0, 50);
    saveNotifications(user.id, updated);
    setNotifications(updated);
  };

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    addNotification,
    refreshNotifications: fetchNotifications,
  };
}
