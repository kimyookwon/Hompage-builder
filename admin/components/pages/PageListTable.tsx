'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DeleteConfirmModal } from '@/components/common/DeleteConfirmModal';
import { Page } from '@/types';
import { Copy, ExternalLink, Pencil, Trash2 } from 'lucide-react';

interface PageListTableProps {
  pages: Page[];
  onTogglePublish: (id: number) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onDuplicate: (id: number) => Promise<void>;
}

export function PageListTable({ pages, onTogglePublish, onDelete, onDuplicate }: PageListTableProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteConfirm = async () => {
    if (deletingId === null) return;
    setIsDeleting(true);
    await onDelete(deletingId);
    setIsDeleting(false);
    setDeletingId(null);
  };

  if (pages.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        페이지가 없습니다. 새 페이지를 만들어보세요.
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">제목</th>
              <th className="px-4 py-3 text-left font-medium">슬러그</th>
              <th className="px-4 py-3 text-left font-medium">발행 여부</th>
              <th className="px-4 py-3 text-left font-medium">생성일</th>
              <th className="px-4 py-3 text-right font-medium">작업</th>
            </tr>
          </thead>
          <tbody>
            {pages.map((page) => (
              <tr key={page.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-medium">{page.title}</td>
                <td className="px-4 py-3 text-muted-foreground">/{page.slug}</td>
                <td className="px-4 py-3">
                  <button onClick={() => onTogglePublish(page.id)} className="cursor-pointer">
                    <Badge variant={page.isPublished ? 'default' : 'secondary'}>
                      {page.isPublished ? '발행' : '임시'}
                    </Badge>
                  </button>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(page.createdAt).toLocaleDateString('ko-KR')}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 justify-end">
                    {page.isPublished && (
                      <Link href={`/p/${page.slug}`} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="icon" title="공개 페이지 보기">
                          <ExternalLink size={16} />
                        </Button>
                      </Link>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      title="복제"
                      onClick={() => onDuplicate(page.id)}
                    >
                      <Copy size={16} />
                    </Button>
                    <Link href={`/admin/pages/${page.id}/edit`}>
                      <Button variant="ghost" size="icon" title="편집">
                        <Pencil size={16} />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      title="삭제"
                      onClick={() => setDeletingId(page.id)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <DeleteConfirmModal
        isOpen={deletingId !== null}
        title="페이지를 삭제하시겠습니까?"
        description="페이지와 모든 섹션이 영구적으로 삭제됩니다."
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingId(null)}
      />
    </>
  );
}
