'use client';

import { useEffect, useState, useCallback } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useAppStore } from '@/stores/appStore';

// 첨부파일 통계 항목 타입
interface AttachmentStat {
  id: number;
  fileName: string;
  postTitle: string;
  postId: number;
  boardId: number;
  uploaderName: string;
  fileSize: number;
  downloadCount: number;
  createdAt: string;
}

interface AttachmentsResponse {
  items: AttachmentStat[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const LIMIT = 20;

// 파일 크기를 KB/MB로 포맷
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AttachmentsPage() {
  const [items, setItems] = useState<AttachmentStat[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const addToast = useAppStore((s) => s.addToast);

  const fetchItems = useCallback(async (currentPage = 1) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        sort: 'download_count',
        order: 'desc',
        page: String(currentPage),
        limit: String(LIMIT),
      });
      const res = await api.get<AttachmentsResponse>(`/admin/attachments?${params}`);
      setItems(res.data.items);
      setTotal(res.data.pagination.total);
    } catch {
      addToast('첨부파일 목록을 불러오지 못했습니다.', 'destructive');
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => { fetchItems(1); }, [fetchItems]);

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">첨부파일 통계</h1>
          <p className="text-muted-foreground text-sm">총 {total}개 — 다운로드 많은 순</p>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">불러오는 중...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">첨부파일이 없습니다.</div>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">파일명</th>
                  <th className="px-4 py-3 text-left font-medium">게시글 제목</th>
                  <th className="px-4 py-3 text-left font-medium">업로더</th>
                  <th className="px-4 py-3 text-right font-medium">파일 크기</th>
                  <th className="px-4 py-3 text-right font-medium">다운로드 수</th>
                  <th className="px-4 py-3 text-left font-medium">업로드일</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b last:border-0 hover:bg-muted/30">
                    {/* 파일명 — 다운로드 링크 */}
                    <td className="px-4 py-3 max-w-[180px]">
                      <a
                        href={`/api/attachments/${item.id}/download`}
                        download={item.fileName}
                        className="text-blue-600 hover:underline dark:text-blue-400 truncate block"
                        title={item.fileName}
                      >
                        {item.fileName}
                      </a>
                    </td>
                    {/* 게시글 제목 */}
                    <td className="px-4 py-3 max-w-[200px]">
                      <a
                        href={`/b/${item.boardId}/${item.postId}`}
                        className="text-foreground hover:underline truncate block"
                        title={item.postTitle}
                      >
                        {item.postTitle}
                      </a>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{item.uploaderName}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap text-muted-foreground">
                      {formatBytes(item.fileSize)}
                    </td>
                    {/* 다운로드 수 강조 */}
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <span className="font-semibold text-primary">{item.downloadCount.toLocaleString()}</span>
                      <span className="text-muted-foreground text-xs ml-1">회</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                      {new Date(item.createdAt).toLocaleDateString('ko-KR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => { setPage(page - 1); fetchItems(page - 1); }}
            >
              이전
            </Button>
            <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => { setPage(page + 1); fetchItems(page + 1); }}
            >
              다음
            </Button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
