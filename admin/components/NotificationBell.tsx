'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';
import { Notification } from '@/types';

// 알림 타입별 라벨
function notificationLabel(type: Notification['type']): string {
  switch (type) {
    case 'comment_on_post':
      return '댓글';
    case 'reply_to_comment':
      return '답글';
    default:
      return '알림';
  }
}

// 알림 클릭 시 이동할 경로
function notificationLink(n: Notification): string {
  return `/admin/boards/${n.boardId}/posts/${n.postId}`;
}

// 상대 시간 포맷
function timeAgo(dateStr: string): string {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}일 전`;
  return new Date(dateStr).toLocaleDateString('ko-KR');
}

export function NotificationBell() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // 알림 클릭 핸들러
  const handleNotificationClick = async (n: Notification) => {
    if (!n.isRead) {
      await markRead(n.id);
    }
    setIsOpen(false);
    window.location.href = notificationLink(n);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 벨 아이콘 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-md hover:bg-accent transition-colors"
        aria-label="알림"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* 드롭다운 패널 */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-background border rounded-lg shadow-lg z-50 overflow-hidden">
          {/* 헤더 */}
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <span className="text-sm font-semibold">알림</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <CheckCheck size={14} />
                모두 읽음
              </button>
            )}
          </div>

          {/* 알림 목록 */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                알림이 없습니다.
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={cn(
                    'w-full text-left px-4 py-3 border-b last:border-b-0 hover:bg-accent/50 transition-colors',
                    !n.isRead && 'bg-accent/20'
                  )}
                >
                  <div className="flex items-start gap-2">
                    {/* 읽음 상태 표시 */}
                    <div className="mt-1 flex-shrink-0">
                      {n.isRead ? (
                        <Check size={14} className="text-muted-foreground/50" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-1" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-snug">
                        <span className="font-medium">{n.actorName}</span>
                        <span className="text-muted-foreground">
                          {n.type === 'comment_on_post'
                            ? '님이 게시글에 댓글을 남겼습니다.'
                            : '님이 댓글에 답글을 남겼습니다.'}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {n.postTitle}
                      </p>
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        {timeAgo(n.createdAt)}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
