'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { AdminLayout } from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { Pagination } from '@/types';
import { useAppStore } from '@/stores/appStore';
import { DeleteConfirmModal } from '@/components/common/DeleteConfirmModal';
import { Trash2, Search, X } from 'lucide-react';

interface AdminComment {
  id: number;
  content: string;
  authorName: string;
  postId: number;
  postTitle: string;
  boardId: number;
  boardName: string;
  createdAt: string;
}

interface CommentsData {
  items: AdminComment[];
  pagination: Pagination;
}

const LIMIT = 20;

export default function AdminCommentsPage() {
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const addToast = useAppStore((s) => s.addToast);

  const fetchComments = useCallback(async (p: number, q: string) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(LIMIT) });
      if (q) params.set('search', q);
      const res = await api.get<CommentsData>(`/admin/comments?${params.toString()}`);
      setComments(res.data.items);
      setPagination(res.data.pagination);
    } catch {
      addToast('댓글을 불러오지 못했습니다.', 'destructive');
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => { fetchComments(1, ''); }, [fetchComments]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchInput.trim();
    setSearch(q);
    setPage(1);
    fetchComments(1, q);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearch('');
    setPage(1);
    fetchComments(1, '');
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await api.delete(`/comments/${deletingId}`);
      setComments((prev) => prev.filter((c) => c.id !== deletingId));
      setPagination((prev) => prev ? { ...prev, total: prev.total - 1 } : prev);
      addToast('댓글이 삭제되었습니다.');
    } catch {
      addToast('삭제에 실패했습니다.', 'destructive');
    } finally {
      setIsDeleting(false);
      setDeletingId(null);
    }
  };

  const totalPages = pagination?.totalPages ?? 1;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">댓글 관리</h1>
            <p className="text-muted-foreground text-sm">
              {search ? `"${search}" 검색 결과 ${pagination?.total ?? 0}개` : `총 ${pagination?.total ?? 0}개`}
            </p>
          </div>

          {/* 검색 */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-2.5 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="내용 · 작성자 · 게시글 검색..."
                className="pl-8 pr-8 h-9 text-sm w-64"
              />
              {searchInput && (
                <button type="button" onClick={handleClearSearch} className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground">
                  <X size={14} />
                </button>
              )}
            </div>
            <Button type="submit" variant="outline" size="sm" className="h-9">검색</Button>
          </form>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">불러오는 중...</div>
        ) : comments.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">댓글이 없습니다.</div>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">내용</th>
                  <th className="px-4 py-3 text-left font-medium">작성자</th>
                  <th className="px-4 py-3 text-left font-medium">게시글</th>
                  <th className="px-4 py-3 text-left font-medium">작성일</th>
                  <th className="px-4 py-3 text-right font-medium">작업</th>
                </tr>
              </thead>
              <tbody>
                {comments.map((comment) => (
                  <tr key={comment.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 max-w-xs">
                      <p className="truncate text-gray-800">{comment.content}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {comment.authorName}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/b/${comment.boardId}/${comment.postId}`}
                        target="_blank"
                        className="text-blue-600 hover:underline text-xs truncate block max-w-[180px]"
                      >
                        [{comment.boardName}] {comment.postTitle}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap text-xs">
                      {new Date(comment.createdAt).toLocaleString('ko-KR')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeletingId(comment.id)}
                      >
                        <Trash2 size={15} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => { setPage(page - 1); fetchComments(page - 1, search); }}>이전</Button>
            <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => { setPage(page + 1); fetchComments(page + 1, search); }}>다음</Button>
          </div>
        )}
      </div>

      <DeleteConfirmModal
        isOpen={deletingId !== null}
        title="댓글을 삭제하시겠습니까?"
        description="삭제된 댓글은 복구할 수 없습니다."
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeletingId(null)}
      />
    </AdminLayout>
  );
}
