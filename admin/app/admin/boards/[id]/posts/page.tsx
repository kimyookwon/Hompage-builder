'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { AdminLayout } from '@/components/AdminLayout';
import { PostTable } from '@/components/boards/PostTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { Post, Board, PaginatedResponse } from '@/types';
import { useAppStore } from '@/stores/appStore';
import { DeleteConfirmModal } from '@/components/common/DeleteConfirmModal';
import { ArrowLeft, Search, X } from 'lucide-react';

const LIMIT = 20;

type SortOption = 'latest' | 'views' | 'comments';

export default function BoardPostsPage() {
  const { id } = useParams<{ id: string }>();
  const boardId = Number(id);

  const [board, setBoard] = useState<Board | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [sort, setSort] = useState<SortOption>('latest');
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  // 일괄 선택 상태
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const addToast = useAppStore((s) => s.addToast);

  const fetchData = useCallback(async (currentPage: number, q: string, s: SortOption) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(currentPage), limit: String(LIMIT), sort: s });
      if (q) params.set('search', q);

      const [boardRes, postsRes] = await Promise.all([
        api.get<Board>(`/boards/${boardId}`),
        api.get<PaginatedResponse<Post>['data']>(`/boards/${boardId}/posts?${params.toString()}`),
      ]);
      setBoard(boardRes.data);
      setPosts(postsRes.data.items);
      setTotal(postsRes.data.pagination.total);
    } catch {
      addToast('데이터를 불러오지 못했습니다.', 'destructive');
    } finally {
      setIsLoading(false);
    }
  }, [boardId, addToast]);

  useEffect(() => { fetchData(page, search, sort); }, [boardId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchInput.trim();
    setSearch(q);
    setPage(1);
    fetchData(1, q, sort);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearch('');
    setPage(1);
    fetchData(1, '', sort);
  };

  const handleSortChange = (newSort: SortOption) => {
    setSort(newSort);
    setPage(1);
    fetchData(1, search, newSort);
  };

  const handleNoticeToggle = async (postId: number, current: boolean) => {
    try {
      await api.patch(`/posts/${postId}/notice`, {});
      setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, isNotice: !current } : p));
      addToast(current ? '공지가 해제되었습니다.' : '공지로 설정되었습니다.');
    } catch {
      addToast('공지 설정에 실패했습니다.', 'destructive');
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await api.delete(`/posts/${deletingId}`);
      setPosts((prev) => prev.filter((p) => p.id !== deletingId));
      setTotal((t) => t - 1);
      addToast('게시글이 삭제되었습니다.');
    } catch {
      addToast('삭제에 실패했습니다.', 'destructive');
    } finally {
      setIsDeleting(false);
      setDeletingId(null);
    }
  };

  // 전체 선택 / 해제
  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? new Set(posts.map((p) => p.id)) : new Set());
  };

  // 개별 선택 토글
  const handleSelectOne = (id: number, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  // 선택 일괄 삭제
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`선택한 ${selectedIds.size}개의 게시글을 삭제하시겠습니까?`)) return;
    setIsBulkDeleting(true);
    try {
      await api.post('/admin/posts/bulk', { ids: [...selectedIds], action: 'delete' });
      setPosts((prev) => prev.filter((p) => !selectedIds.has(p.id)));
      setTotal((t) => t - selectedIds.size);
      setSelectedIds(new Set());
      addToast(`${selectedIds.size}개의 게시글이 삭제되었습니다.`);
    } catch {
      addToast('일괄 삭제에 실패했습니다.', 'destructive');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/boards">
            <Button variant="ghost" size="icon"><ArrowLeft size={18} /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{board?.name ?? '게시판'} — 게시글</h1>
            <p className="text-muted-foreground text-sm">
              {search ? `"${search}" 검색 결과 ${total}개` : `총 ${total}개`}
            </p>
          </div>
        </div>

        {/* 검색 + 정렬 */}
        <div className="flex flex-col sm:flex-row gap-2">
          <form onSubmit={handleSearch} className="flex gap-2 flex-1">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-2.5 top-2.5 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="제목 또는 내용 검색..."
                className="pl-8 pr-8 h-9 text-sm"
              />
              {searchInput && (
                <button type="button" onClick={handleClearSearch} className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground">
                  <X size={14} />
                </button>
              )}
            </div>
            <Button type="submit" variant="outline" size="sm" className="h-9">검색</Button>
          </form>

          {/* 정렬 */}
          <div className="flex rounded-md border overflow-hidden shrink-0">
            {([
              { value: 'latest', label: '최신순' },
              { value: 'views', label: '조회순' },
              { value: 'comments', label: '댓글순' },
            ] as const).map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => handleSortChange(value)}
                className={`px-3 py-1.5 text-xs transition-colors ${
                  sort === value
                    ? 'bg-primary text-primary-foreground font-medium'
                    : 'bg-background text-muted-foreground hover:bg-muted'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* 일괄 작업 툴바 */}
        {!isLoading && posts.length > 0 && (
          <div className="flex items-center gap-3 py-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={posts.length > 0 && selectedIds.size === posts.length}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className="text-sm text-muted-foreground">전체 선택</span>
            </label>
            {selectedIds.size > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                disabled={isBulkDeleting}
              >
                {isBulkDeleting ? '삭제 중...' : `선택 삭제 (${selectedIds.size})`}
              </Button>
            )}
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">불러오는 중...</div>
        ) : (
          <PostTable
            posts={posts}
            onDeleteClick={setDeletingId}
            onNoticeToggle={handleNoticeToggle}
            selectedIds={selectedIds}
            onSelectOne={handleSelectOne}
          />
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => { setPage(page - 1); fetchData(page - 1, search, sort); }}>이전</Button>
            <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => { setPage(page + 1); fetchData(page + 1, search, sort); }}>다음</Button>
          </div>
        )}
      </div>

      <DeleteConfirmModal
        isOpen={deletingId !== null}
        title="게시글을 삭제하시겠습니까?"
        description="게시글과 모든 댓글이 삭제됩니다."
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeletingId(null)}
      />
    </AdminLayout>
  );
}
