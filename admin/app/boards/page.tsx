'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { Board } from '@/types';

interface BoardsData {
  items: Board[];
  pagination: { total: number };
}

export default function BoardsPage() {
  const user = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasHydrated) return;

    api.get<BoardsData>('/boards?limit=100')
      .then((res) => {
        const all = res.data.items;
        // 비로그인: public만, 로그인: public + user 권한, 관리자: 전체
        const visible = all.filter((b) => {
          if (b.readPermission === 'public') return true;
          if (b.readPermission === 'user' && user) return true;
          if (b.readPermission === 'admin_only' && user?.role === 'admin') return true;
          return false;
        });
        setBoards(visible);
      })
      .catch(() => setBoards([]))
      .finally(() => setLoading(false));
  }, [hasHydrated, user]);

  if (!hasHydrated || loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">게시판</h1>
        <div className="flex justify-center py-20">
          <div className="h-6 w-6 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">게시판</h1>

      {boards.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p>표시할 게시판이 없습니다.</p>
          {!user && (
            <p className="text-sm mt-2">
              <Link href="/login" className="text-blue-500 hover:underline">로그인</Link>하면 더 많은 게시판을 볼 수 있습니다.
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {boards.map((board) => (
            <Link
              key={board.id}
              href={`/b/${board.id}`}
              className="group block rounded-xl border bg-white p-5 hover:shadow-md hover:border-blue-300 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0 mr-3">
                  <h2 className="text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {board.name}
                  </h2>
                  {board.description ? (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{board.description}</p>
                  ) : (
                    <p className="text-xs text-gray-400 mt-1">
                      {board.type === 'gallery' ? '갤러리 게시판' : '일반 게시판'}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  {board.readPermission === 'user' && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-500">회원 전용</span>
                  )}
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                    {board.writePermission === 'admin_only' ? '읽기 전용' : '글쓰기 가능'}
                  </span>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  게시글 {(board.postCount ?? 0).toLocaleString()}개
                </span>
                <span className="text-xs text-blue-500 group-hover:text-blue-700 transition-colors">
                  바로가기 →
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
