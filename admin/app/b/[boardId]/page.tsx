'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/date';
import { useAuthStore } from '@/stores/authStore';
import { Board, Post, Pagination as PaginationData } from '@/types';
import PaginationUI from '@/components/common/Pagination';

interface PostsData {
  items: Post[];
  pagination: PaginationData;
}

export default function PublicBoardPage() {
  const { boardId } = useParams<{ boardId: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);

  const [board, setBoard] = useState<Board | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [sort, setSort] = useState<'latest' | 'views' | 'comments'>('latest');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const abortRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async (p: number, q: string, s: 'latest' | 'views' | 'comments') => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(p), limit: '20', sort: s });
      if (q) params.set('search', q);

      const [boardRes, postsRes] = await Promise.all([
        api.get<Board>(`/boards/${boardId}`),
        api.get<PostsData>(`/boards/${boardId}/posts?${params.toString()}`),
      ]);
      setBoard(boardRes.data);
      setPosts(postsRes.data.items);
      setPagination(postsRes.data.pagination);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '불러오기 실패';
      if (msg.includes('로그인')) setError('로그인이 필요한 게시판입니다.');
      else if (msg.includes('권한')) setError('접근 권한이 없습니다.');
      else setError(msg);
    } finally {
      setLoading(false);
    }
  }, [boardId]);

  useEffect(() => {
    if (!hasHydrated) return;
    fetchData(page, search, sort);
  }, [hasHydrated, fetchData, page, search, sort]);  // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const handleSortChange = (newSort: 'latest' | 'views' | 'comments') => {
    setSort(newSort);
    setPage(1);
  };

  const handleWrite = () => {
    if (!user) {
      sessionStorage.setItem('redirect_after_login', `/b/${boardId}/new`);
      router.push('/login');
    } else {
      router.push(`/b/${boardId}/new`);
    }
  };

  if (!hasHydrated) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        {error.includes('로그인') && (
          <button
            onClick={() => {
              sessionStorage.setItem('redirect_after_login', `/b/${boardId}`);
              router.push('/login');
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
          >
            로그인하기
          </button>
        )}
      </div>
    );
  }

  const isGallery = board?.type === 'gallery';

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* 게시판 헤더 */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{board?.name}</h1>
          {board?.description && (
            <p className="text-sm text-gray-500 mt-0.5">{board.description}</p>
          )}
          <p className="text-xs text-gray-400 mt-0.5">
            {search ? `"${search}" 검색 결과 ${pagination?.total ?? 0}개` : `총 ${pagination?.total ?? 0}개`}
          </p>
        </div>
        {board?.writePermission !== 'admin_only' && (
          <button
            onClick={handleWrite}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            글쓰기
          </button>
        )}
      </div>

      {/* 검색 + 정렬 */}
      <div className="flex flex-col sm:flex-row gap-2 mb-5">
        {/* 정렬 버튼 */}
        <div className="flex rounded-lg border overflow-hidden shrink-0">
          {([
            { value: 'latest', label: '최신순' },
            { value: 'views', label: '조회순' },
            { value: 'comments', label: '댓글순' },
          ] as const).map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => handleSortChange(value)}
              className={`px-3 py-2 text-xs transition-colors ${
                sort === value
                  ? 'bg-blue-600 text-white font-medium'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <form onSubmit={handleSearch} className="flex gap-2 mb-5">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="제목 또는 내용 검색..."
            className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
          <svg className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchInput && (
            <button type="button" onClick={() => { setSearchInput(''); setSearch(''); setPage(1); }} className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600">✕</button>
          )}
        </div>
        <button type="submit" className="px-4 py-2 bg-gray-100 border rounded-lg text-sm text-gray-700 hover:bg-gray-200 transition-colors">검색</button>
      </form>

      {/* 게시글 목록 */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-6 w-6 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          {search ? `"${search}"에 해당하는 게시글이 없습니다.` : '아직 게시글이 없습니다.'}
        </div>
      ) : isGallery ? (
        /* ── 갤러리 뷰 ── */
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/b/${boardId}/${post.id}`}
              className="group rounded-xl overflow-hidden border hover:shadow-md transition-all"
            >
              {/* 썸네일 */}
              <div className="aspect-video bg-gray-100 overflow-hidden relative">
                {post.thumbnailUrl ? (
                  <Image
                    src={post.thumbnailUrl}
                    alt={post.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                {post.isNotice && (
                  <span className="absolute top-2 left-2 px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded">공지</span>
                )}
              </div>
              {/* 정보 */}
              <div className="p-3">
                <p className="text-sm font-medium text-gray-800 group-hover:text-blue-600 truncate">{post.title}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-gray-400">{post.authorName}</span>
                  {post.commentCount > 0 && (
                    <span className="text-xs text-blue-500">[{post.commentCount}]</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        /* ── 일반 목록 뷰 ── */
        <div className="border rounded-lg overflow-hidden divide-y">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/b/${boardId}/${post.id}`}
              className={`flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors group ${
                post.isNotice ? 'bg-amber-50/60' : ''
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 truncate flex items-center gap-1.5">
                  {post.isNotice && (
                    <span className="shrink-0 px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded">공지</span>
                  )}
                  <span className={post.isNotice ? 'font-semibold' : ''}>
                    {search ? highlightText(post.title, search) : post.title}
                  </span>
                  {post.commentCount > 0 && (
                    <span className="ml-0.5 text-xs text-blue-500 font-normal">[{post.commentCount}]</span>
                  )}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{post.authorName}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0 text-xs text-gray-400">
                {(post.likeCount ?? 0) > 0 && (
                  <span className="text-red-400">♥ {post.likeCount}</span>
                )}
                <span>조회 {post.viewCount ?? 0}</span>
                <span>{formatDate(post.createdAt)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* 페이지네이션 */}
      {pagination && (
        <PaginationUI
          page={page}
          totalPages={pagination.totalPages}
          onChange={(p) => setPage(p)}
          className="mt-6"
        />
      )}
    </div>
  );
}

function highlightText(text: string, query: string): React.ReactNode {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-200 text-gray-900">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}
