'use client';

import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { PageListTable } from '@/components/pages/PageListTable';
import { PageCreateModal } from '@/components/pages/PageCreateModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { Page, PaginatedResponse } from '@/types';
import { Plus, Search } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';

const LIMIT = 20;

export default function PagesPage() {
  const [pages, setPages] = useState<Page[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const addToast = useAppStore((s) => s.addToast);

  const fetchPages = async (currentPage = page, currentSearch = search) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(currentPage), limit: String(LIMIT) });
      if (currentSearch) params.set('search', currentSearch);
      const res = await api.get<PaginatedResponse<Page>['data']>(`/pages?${params}`);
      setPages(res.data.items);
      setTotal(res.data.pagination.total);
    } catch {
      addToast('페이지 목록을 불러오지 못했습니다.', 'destructive');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchPages(); }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchPages(1, search);
  };

  const handleTogglePublish = async (id: number) => {
    try {
      const res = await api.patch<Page>(`/pages/${id}/publish`, {});
      setPages((prev) => prev.map((p) => (p.id === id ? res.data : p)));
    } catch {
      addToast('발행 상태 변경에 실패했습니다.', 'destructive');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/pages/${id}`);
      addToast('페이지가 삭제되었습니다.');
      fetchPages();
    } catch {
      addToast('페이지 삭제에 실패했습니다.', 'destructive');
    }
  };

  const handleDuplicate = async (id: number) => {
    try {
      const res = await api.post<Page>(`/pages/${id}/duplicate`, {});
      addToast(`"${res.data.title}" 페이지가 복제되었습니다.`);
      fetchPages();
    } catch {
      addToast('페이지 복제에 실패했습니다.', 'destructive');
    }
  };

  const handleCreate = async (data: { title: string; slug: string }) => {
    setIsCreating(true);
    try {
      await api.post('/pages', data);
      addToast('페이지가 생성되었습니다.');
      setIsCreateOpen(false);
      fetchPages();
    } catch (err) {
      addToast(err instanceof Error ? err.message : '페이지 생성에 실패했습니다.', 'destructive');
    } finally {
      setIsCreating(false);
    }
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">페이지 관리</h1>
            <p className="text-muted-foreground text-sm">총 {total}개의 페이지</p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus size={16} className="mr-1" /> 새 페이지
          </Button>
        </div>

        {/* 검색 */}
        <form onSubmit={handleSearch} className="flex gap-2 max-w-sm">
          <Input
            placeholder="제목 또는 슬러그 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button type="submit" variant="outline" size="icon">
            <Search size={16} />
          </Button>
        </form>

        {/* 테이블 */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">불러오는 중...</div>
        ) : (
          <PageListTable
            pages={pages}
            onTogglePublish={handleTogglePublish}
            onDelete={handleDelete}
            onDuplicate={handleDuplicate}
          />
        )}

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => { setPage(page - 1); fetchPages(page - 1); }}
            >
              이전
            </Button>
            <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => { setPage(page + 1); fetchPages(page + 1); }}
            >
              다음
            </Button>
          </div>
        )}
      </div>

      <PageCreateModal
        isOpen={isCreateOpen}
        isLoading={isCreating}
        onSubmit={handleCreate}
        onCancel={() => setIsCreateOpen(false)}
      />
    </AdminLayout>
  );
}
