'use client';

// 사이트 공개 공지 배너 — 활성 공지를 상단에 표시, 개별 닫기 가능

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface SiteNotice {
  id: number;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'error' | 'success';
}

// 공지 타입별 배경/텍스트 색상
const TYPE_STYLES: Record<SiteNotice['type'], string> = {
  info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/60 dark:border-blue-800 dark:text-blue-200',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-950/60 dark:border-yellow-800 dark:text-yellow-200',
  error: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/60 dark:border-red-800 dark:text-red-200',
  success: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-950/60 dark:border-green-800 dark:text-green-200',
};

// 닫기 버튼 색상
const CLOSE_STYLES: Record<SiteNotice['type'], string> = {
  info: 'hover:bg-blue-100 dark:hover:bg-blue-900/40',
  warning: 'hover:bg-yellow-100 dark:hover:bg-yellow-900/40',
  error: 'hover:bg-red-100 dark:hover:bg-red-900/40',
  success: 'hover:bg-green-100 dark:hover:bg-green-900/40',
};

export function SiteNoticeBanner() {
  const [notices, setNotices] = useState<SiteNotice[]>([]);
  // 닫은 공지 ID 목록 (세션 내 유지)
  const [dismissedIds, setDismissedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api';
    fetch(`${apiUrl}/notices`)
      .then((res) => {
        if (!res.ok) return [];
        return res.json().then((json) => (Array.isArray(json.data) ? json.data : []));
      })
      .then((data: SiteNotice[]) => setNotices(data))
      .catch(() => {});
  }, []);

  // 표시 대상: 닫히지 않은 공지만
  const visibleNotices = notices.filter((n) => !dismissedIds.has(n.id));

  if (visibleNotices.length === 0) return null;

  const handleDismiss = (id: number) => {
    setDismissedIds((prev) => new Set([...prev, id]));
  };

  return (
    <div className="w-full space-y-px">
      {visibleNotices.map((notice) => (
        <div
          key={notice.id}
          className={`flex items-start gap-3 px-4 py-3 border-b text-sm ${TYPE_STYLES[notice.type]}`}
        >
          <div className="flex-1 min-w-0">
            <span className="font-semibold mr-2">{notice.title}</span>
            <span className="opacity-80">{notice.content}</span>
          </div>
          <button
            type="button"
            onClick={() => handleDismiss(notice.id)}
            aria-label="공지 닫기"
            className={`shrink-0 rounded p-0.5 transition-colors ${CLOSE_STYLES[notice.type]}`}
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
