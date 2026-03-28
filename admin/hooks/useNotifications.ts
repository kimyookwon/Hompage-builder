import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Notification } from '@/types';

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  markRead: (id: number) => Promise<void>;
  markAllRead: () => Promise<void>;
  refresh: () => Promise<void>;
}

const POLL_INTERVAL = 30_000; // 30초

// 알림 폴링 훅 — 30초마다 미읽은 수 + 최근 알림 조회
export function useNotifications(): UseNotificationsReturn {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 알림 목록 + 미읽은 수 조회
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const [listRes, countRes] = await Promise.all([
        api.get<Notification[]>('/notifications?limit=20'),
        api.get<{ count: number }>('/notifications/unread-count'),
      ]);
      setNotifications(listRes.data);
      setUnreadCount(countRes.data.count);
    } catch {
      // 폴링 실패는 조용히 무시
    }
  }, [isAuthenticated]);

  // 초기 로드 + 폴링 시작
  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    setIsLoading(true);
    fetchNotifications().finally(() => setIsLoading(false));

    intervalRef.current = setInterval(fetchNotifications, POLL_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isAuthenticated, fetchNotifications]);

  // 단건 읽음 처리
  const markRead = useCallback(async (id: number) => {
    try {
      await api.patch(`/notifications/${id}/read`, {});
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // 실패 시 무시
    }
  }, []);

  // 전체 읽음 처리
  const markAllRead = useCallback(async () => {
    try {
      await api.patch('/notifications/read-all', {});
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // 실패 시 무시
    }
  }, []);

  return {
    notifications,
    unreadCount,
    isLoading,
    markRead,
    markAllRead,
    refresh: fetchNotifications,
  };
}
