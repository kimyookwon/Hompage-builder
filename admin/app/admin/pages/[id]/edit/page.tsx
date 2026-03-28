'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { AdminLayout } from '@/components/AdminLayout';
import { SectionTree } from '@/components/editor/SectionTree';
import { SectionEditor } from '@/components/editor/SectionEditor';
import { PreviewPanel } from '@/components/editor/PreviewPanel';
import { AddSectionModal } from '@/components/editor/AddSectionModal';
import { DeleteConfirmModal } from '@/components/common/DeleteConfirmModal';
import { PageSeoPanel } from '@/components/editor/PageSeoPanel';
import { api } from '@/lib/api';
import { Page, PageSection } from '@/types';
import { useAppStore } from '@/stores/appStore';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Search } from 'lucide-react';

export default function PageEditPage() {
  const { id } = useParams<{ id: string }>();
  const addToast = useAppStore((s) => s.addToast);

  const [page, setPage] = useState<Page | null>(null);
  const [sections, setSections] = useState<PageSection[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [previewRefreshKey, setPreviewRefreshKey] = useState(0);
  const [isSeoOpen, setIsSeoOpen] = useState(false);

  const selectedSection = sections.find((s) => s.id === selectedId) ?? null;

  useEffect(() => {
    fetchPage();
    fetchSections();
  }, [id]);

  const fetchPage = async () => {
    try {
      const res = await api.get<Page>(`/pages/${id}`);
      setPage(res.data);
    } catch {
      addToast('페이지 정보를 불러오지 못했습니다.', 'destructive');
    }
  };

  const fetchSections = async () => {
    try {
      const res = await api.get<PageSection[]>(`/pages/${id}/sections`);
      setSections(res.data);
    } catch {
      addToast('섹션 목록을 불러오지 못했습니다.', 'destructive');
    }
  };

  const handleAddSection = async (type: string, format: string) => {
    setIsAdding(true);
    try {
      const res = await api.post<PageSection>(`/pages/${id}/sections`, { type, format, content: {} });
      setSections((prev) => [...prev, res.data]);
      setSelectedId(res.data.id);
      setIsAddOpen(false);
      setPreviewRefreshKey((k) => k + 1);
    } catch (err) {
      addToast(err instanceof Error ? err.message : '섹션 추가에 실패했습니다.', 'destructive');
    } finally {
      setIsAdding(false);
    }
  };

  const handleSaveContent = async (content: Record<string, unknown>) => {
    if (!selectedId) return;
    try {
      const res = await api.patch<PageSection>(`/sections/${selectedId}`, { content });
      setSections((prev) => prev.map((s) => (s.id === selectedId ? res.data : s)));
      // 미리보기 새로고침 트리거
      setPreviewRefreshKey((k) => k + 1);
    } catch {
      addToast('저장에 실패했습니다.', 'destructive');
    }
  };

  const handleReorder = async (ids: number[]) => {
    setSections((prev) => {
      const map = new Map(prev.map((s) => [s.id, s]));
      return ids.map((id) => map.get(id)!);
    });
    try {
      await api.patch(`/pages/${id}/sections/reorder`, { ids });
    } catch {
      addToast('순서 변경에 실패했습니다.', 'destructive');
      fetchSections();
    }
  };

  const handleDeleteSection = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await api.delete(`/sections/${deletingId}`);
      setSections((prev) => prev.filter((s) => s.id !== deletingId));
      if (selectedId === deletingId) setSelectedId(null);
      setDeletingId(null);
      setPreviewRefreshKey((k) => k + 1);
    } catch {
      addToast('섹션 삭제에 실패했습니다.', 'destructive');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSeoSave = async (data: { seo_description: string; seo_og_image: string }) => {
    try {
      const res = await api.patch<Page>(`/pages/${id}`, data);
      setPage(res.data);
      addToast('SEO 설정이 저장되었습니다.');
    } catch {
      addToast('SEO 저장에 실패했습니다.', 'destructive');
    }
  };

  const handleTogglePublish = async () => {
    try {
      const res = await api.patch<Page>(`/pages/${id}/publish`, {});
      setPage(res.data);
      addToast(res.data.isPublished ? '페이지가 발행되었습니다.' : '발행이 취소되었습니다.');
    } catch {
      addToast('발행 상태 변경에 실패했습니다.', 'destructive');
    }
  };

  return (
    <AdminLayout>
      <div className="flex flex-col h-[calc(100vh-4rem)] -m-6">
        {/* 상단 툴바 */}
        <div className="relative flex items-center gap-3 px-4 py-2 border-b bg-background shrink-0">
          <div className="flex-1 min-w-0">
            <span className="font-semibold truncate">{page?.title ?? '페이지 편집'}</span>
            {page && (
              <span className="ml-2 text-sm text-muted-foreground">/{page.slug}</span>
            )}
          </div>
          {page && (
            <>
              <Badge variant={page.isPublished ? 'default' : 'secondary'}>
                {page.isPublished ? '발행 중' : '임시'}
              </Badge>
              <Button
                size="sm"
                variant={isSeoOpen ? 'default' : 'outline'}
                onClick={() => setIsSeoOpen((v) => !v)}
                title="SEO 설정"
              >
                <Search size={14} />
                <span className="ml-1">SEO</span>
              </Button>
              <Button size="sm" variant="outline" onClick={handleTogglePublish}>
                {page.isPublished ? <EyeOff size={14} /> : <Eye size={14} />}
                <span className="ml-1">{page.isPublished ? '발행 취소' : '발행'}</span>
              </Button>
            </>
          )}
          {/* SEO 패널 드롭다운 */}
          {isSeoOpen && page && (
            <PageSeoPanel
              page={page}
              onSave={handleSeoSave}
              onClose={() => setIsSeoOpen(false)}
            />
          )}
        </div>

        {/* 에디터 본문 — 3패널 */}
        <div className="flex flex-1 overflow-hidden">
          {/* 섹션 트리 (좌측) */}
          <div className="w-52 shrink-0 border-r overflow-hidden">
            <SectionTree
              sections={sections}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onReorder={handleReorder}
              onDelete={setDeletingId}
              onAddClick={() => setIsAddOpen(true)}
            />
          </div>

          {/* 섹션 편집 (중앙) */}
          <div className="w-72 shrink-0 border-r overflow-hidden">
            <SectionEditor section={selectedSection} onSave={handleSaveContent} />
          </div>

          {/* 미리보기 (우측) */}
          <div className="flex-1 overflow-hidden">
            <PreviewPanel
              pageId={id}
              slug={page?.slug}
              refreshKey={previewRefreshKey}
            />
          </div>
        </div>
      </div>

      <AddSectionModal
        isOpen={isAddOpen}
        isLoading={isAdding}
        onSubmit={handleAddSection}
        onCancel={() => setIsAddOpen(false)}
      />

      <DeleteConfirmModal
        isOpen={deletingId !== null}
        title="섹션을 삭제하시겠습니까?"
        description="이 섹션의 모든 콘텐츠가 삭제됩니다."
        isLoading={isDeleting}
        onConfirm={handleDeleteSection}
        onCancel={() => setDeletingId(null)}
      />
    </AdminLayout>
  );
}
