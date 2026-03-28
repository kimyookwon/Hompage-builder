'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { formatDate } from '@/lib/date';
import { useSearchSuggest } from '@/hooks/useSearchSuggest';

interface SearchResult {
  id: number;
  title: string;
  excerpt: string;
  boardId: number;
  boardName: string;
  authorName: string;
  commentCount: number;
  viewCount: number;
  createdAt: string;
}

interface SearchResponse {
  items: SearchResult[];
  total: number;
  page: number;
  totalPages: number;
}

const LIMIT = 10;

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialQ = searchParams.get('q') ?? '';
  const initialPage = parseInt(searchParams.get('page') ?? '1', 10);

  const [query, setQuery] = useState(initialQ);
  const [inputValue, setInputValue] = useState(initialQ);
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(initialPage);

  const inputRef = useRef<HTMLInputElement>(null);
  const [showSuggest, setShowSuggest] = useState(false);
  const suggestions = useSearchSuggest(inputValue);

  const fetchResults = useCallback(async (q: string, p: number) => {
    if (!q.trim()) {
      setResults(null);
      return;
    }
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? '';
      const res = await fetch(
        `${apiUrl}/api/search?q=${encodeURIComponent(q)}&page=${p}&limit=${LIMIT}`,
        { cache: 'no-store' }
      );
      const json = await res.json();
      if (json.success) setResults(json.data as SearchResponse);
    } catch {
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // URL 파라미터가 바뀔 때 검색 실행
  useEffect(() => {
    const q = searchParams.get('q') ?? '';
    const p = parseInt(searchParams.get('page') ?? '1', 10);
    setQuery(q);
    setInputValue(q);
    setPage(p);
    fetchResults(q, p);
  }, [searchParams, fetchResults]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = inputValue.trim();
    if (!q) return;
    setShowSuggest(false);
    router.push(`/search?q=${encodeURIComponent(q)}&page=1`);
  };

  const handleSuggestSelect = (title: string) => {
    setShowSuggest(false);
    router.push(`/search?q=${encodeURIComponent(title)}&page=1`);
  };

  const handlePageChange = (p: number) => {
    router.push(`/search?q=${encodeURIComponent(query)}&page=${p}`);
  };

  // 검색어 하이라이트
  const highlight = (text: string, kw: string) => {
    if (!kw) return text;
    const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === kw.toLowerCase()
        ? <mark key={i} className="bg-yellow-200 text-gray-900 rounded-sm px-0.5">{part}</mark>
        : part
    );
  };

  const totalPages = results?.totalPages ?? 0;

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* 검색 폼 */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-8">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="search"
            value={inputValue}
            onChange={(e) => { setInputValue(e.target.value); setShowSuggest(true); }}
            onFocus={() => setShowSuggest(true)}
            onBlur={() => setTimeout(() => setShowSuggest(false), 150)}
            onKeyDown={(e) => e.key === 'Escape' && setShowSuggest(false)}
            placeholder="게시글 제목 또는 내용 검색..."
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            autoFocus
            autoComplete="off"
          />
          {/* 자동완성 드롭다운 */}
          {showSuggest && suggestions.length > 0 && (
            <ul className="absolute left-0 right-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
              {suggestions.map((title, i) => (
                <li key={i}>
                  <button
                    type="button"
                    onMouseDown={() => handleSuggestSelect(title)}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors truncate flex items-center gap-2"
                  >
                    <svg className="w-3.5 h-3.5 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M16.65 16.65A7.5 7.5 0 1116.65 2a7.5 7.5 0 010 14.65z" />
                    </svg>
                    <span className="truncate">{title}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button
          type="submit"
          className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          검색
        </button>
      </form>

      {/* 결과 헤더 */}
      {query && !loading && results && (
        <p className="text-sm text-gray-500 mb-4">
          <span className="font-medium text-gray-800">&ldquo;{query}&rdquo;</span> 검색 결과{' '}
          <span className="font-medium text-blue-600">{results.total.toLocaleString()}</span>건
        </p>
      )}

      {/* 로딩 */}
      {loading && (
        <div className="flex justify-center py-16">
          <div className="h-7 w-7 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
        </div>
      )}

      {/* 결과 없음 */}
      {!loading && query && results?.total === 0 && (
        <div className="text-center py-16 text-gray-400 text-sm">
          <svg className="w-10 h-10 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-4.35-4.35M16.65 16.65A7.5 7.5 0 1116.65 2a7.5 7.5 0 010 14.65z" />
          </svg>
          <p>&ldquo;{query}&rdquo;에 대한 검색 결과가 없습니다.</p>
          <p className="mt-1 text-xs opacity-60">다른 검색어를 입력해보세요.</p>
        </div>
      )}

      {/* 검색 전 안내 */}
      {!loading && !query && (
        <div className="text-center py-16 text-gray-400 text-sm">
          <svg className="w-10 h-10 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-4.35-4.35M16.65 16.65A7.5 7.5 0 1116.65 2a7.5 7.5 0 010 14.65z" />
          </svg>
          <p>검색어를 입력하세요.</p>
        </div>
      )}

      {/* 결과 목록 */}
      {!loading && results && results.items.length > 0 && (
        <div className="space-y-3">
          {results.items.map((item) => (
            <Link
              key={item.id}
              href={`/b/${item.boardId}/${item.id}`}
              className="block p-4 border rounded-lg hover:border-blue-300 hover:bg-blue-50/30 transition-all group"
            >
              {/* 게시판 배지 */}
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                  {item.boardName}
                </span>
              </div>

              {/* 제목 */}
              <p className="text-sm font-semibold text-gray-800 group-hover:text-blue-700 mb-1 line-clamp-1">
                {highlight(item.title, query)}
                {item.commentCount > 0 && (
                  <span className="ml-1 text-xs text-blue-500 font-normal">[{item.commentCount}]</span>
                )}
              </p>

              {/* 본문 미리보기 */}
              {item.excerpt && (
                <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                  {highlight(item.excerpt, query)}
                </p>
              )}

              {/* 메타 */}
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span>{item.authorName}</span>
                <span>{formatDate(item.createdAt)}</span>
                <span>조회 {item.viewCount.toLocaleString()}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* 페이지네이션 */}
      {!loading && totalPages > 1 && (
        <div className="flex justify-center gap-1 mt-8">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page <= 1}
            className="px-3 py-1.5 text-xs border rounded-lg disabled:opacity-30 hover:bg-gray-50 transition-colors"
          >
            ‹ 이전
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => Math.abs(p - page) <= 2 || p === 1 || p === totalPages)
            .reduce<(number | null)[]>((acc, p, i, arr) => {
              if (i > 0 && p - (arr[i - 1] ?? 0) > 1) acc.push(null);
              acc.push(p);
              return acc;
            }, [])
            .map((p, i) =>
              p === null ? (
                <span key={`ellipsis-${i}`} className="px-2 py-1.5 text-xs text-gray-400">…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => handlePageChange(p)}
                  className={`px-3 py-1.5 text-xs border rounded-lg transition-colors ${
                    p === page
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  {p}
                </button>
              )
            )}
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= totalPages}
            className="px-3 py-1.5 text-xs border rounded-lg disabled:opacity-30 hover:bg-gray-50 transition-colors"
          >
            다음 ›
          </button>
        </div>
      )}
    </div>
  );
}
