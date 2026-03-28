'use client';

// 인기 게시글 위젯 — 조회수/좋아요 탭 전환, 다크모드 대응
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

interface PopularPost {
  id: number;
  title: string;
  viewCount: number;
  likeCount: number;
  authorName: string;
  boardId: number;
  boardName: string;
  commentCount: number;
  createdAt: string;
}

interface PopularPostsProps {
  /** 특정 게시판으로 범위 제한 (선택) */
  boardId?: string | number;
  /** 표시할 최대 게시글 수 */
  limit?: number;
}

type SortType = 'views' | 'likes';

export function PopularPosts({ boardId, limit = 5 }: PopularPostsProps) {
  const [posts, setPosts] = useState<PopularPost[]>([]);
  const [sortType, setSortType] = useState<SortType>('views');
  const [loading, setLoading] = useState(true);

  const fetchPopular = useCallback(async (type: SortType) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ type, limit: String(limit) });
      if (boardId) params.set('boardId', String(boardId));
      const res = await api.get<PopularPost[]>(`/posts/popular?${params.toString()}`);
      setPosts(res.data);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [boardId, limit]);

  useEffect(() => {
    fetchPopular(sortType);
  }, [sortType, fetchPopular]);

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
      {/* 헤더 + 탭 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">인기 게시글</h3>
        <div className="flex rounded-md overflow-hidden border border-gray-200 dark:border-gray-600 text-xs">
          <button
            type="button"
            onClick={() => setSortType('views')}
            className={`px-2.5 py-1 transition-colors ${
              sortType === 'views'
                ? 'bg-blue-600 text-white font-medium'
                : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            조회수
          </button>
          <button
            type="button"
            onClick={() => setSortType('likes')}
            className={`px-2.5 py-1 transition-colors ${
              sortType === 'likes'
                ? 'bg-blue-600 text-white font-medium'
                : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            좋아요
          </button>
        </div>
      </div>

      {/* 목록 */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="h-5 w-5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-8">게시글이 없습니다.</p>
      ) : (
        <ol className="divide-y divide-gray-100 dark:divide-gray-700">
          {posts.map((post, idx) => (
            <li key={post.id}>
              <Link
                href={`/b/${post.boardId}/${post.id}`}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
              >
                {/* 순위 */}
                <span
                  className={`shrink-0 w-5 text-center text-xs font-bold ${
                    idx === 0
                      ? 'text-amber-500'
                      : idx === 1
                      ? 'text-gray-400'
                      : idx === 2
                      ? 'text-amber-700'
                      : 'text-gray-300 dark:text-gray-600'
                  }`}
                >
                  {idx + 1}
                </span>

                {/* 제목 + 게시판 */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    {post.title}
                  </p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 truncate">
                    {post.boardName}
                  </p>
                </div>

                {/* 수치 */}
                <span className="shrink-0 text-[11px] text-gray-400 dark:text-gray-500">
                  {sortType === 'views' ? (
                    <span>조회 {post.viewCount.toLocaleString()}</span>
                  ) : (
                    <span className="text-red-400">♥ {post.likeCount.toLocaleString()}</span>
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
