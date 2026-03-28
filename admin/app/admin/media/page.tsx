'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { AdminLayout } from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { DeleteConfirmModal } from '@/components/common/DeleteConfirmModal';
import { api } from '@/lib/api';
import { useAppStore } from '@/stores/appStore';
import { PaginatedResponse } from '@/types';
import { Copy, Trash2, Upload } from 'lucide-react';

interface MediaAsset {
  id: number;
  filename: string;
  file_url: string;
  thumb_url: string | null;
  mime_type: string;
  file_size: number;
  created_at: string;
}

const LIMIT = 24;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MediaPage() {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const addToast = useAppStore((s) => s.addToast);

  const fetchAssets = async (currentPage = page) => {
    setIsLoading(true);
    try {
      const res = await api.get<PaginatedResponse<MediaAsset>['data']>(
        `/media?page=${currentPage}&limit=${LIMIT}`
      );
      setAssets(res.data.items);
      setTotal(res.data.pagination.total);
    } catch {
      addToast('미디어 목록을 불러오지 못했습니다.', 'destructive');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchAssets(); }, []);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    let successCount = 0;
    for (const file of Array.from(files)) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        await api.upload<MediaAsset>('/media/upload', formData);
        successCount++;
      } catch (e) {
        addToast(e instanceof Error ? e.message : `${file.name} 업로드 실패`, 'destructive');
      }
    }
    setIsUploading(false);
    if (successCount > 0) {
      addToast(`${successCount}개 파일이 업로드되었습니다.`);
      setPage(1);
      fetchAssets(1);
    }
  };

  const handleDelete = async () => {
    if (deletingId === null) return;
    try {
      await api.delete(`/media/${deletingId}`);
      addToast('파일이 삭제되었습니다.');
      setDeletingId(null);
      fetchAssets(page);
    } catch {
      addToast('파일 삭제에 실패했습니다.', 'destructive');
    }
  };

  const handleCopyUrl = (fileUrl: string) => {
    navigator.clipboard.writeText(fileUrl);
    addToast('URL이 복사되었습니다.');
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">미디어 관리</h1>
            <p className="text-muted-foreground text-sm">총 {total}개의 파일</p>
          </div>
          <Button onClick={() => inputRef.current?.click()} disabled={isUploading}>
            <Upload size={16} className="mr-1" />
            {isUploading ? '업로드 중...' : '파일 업로드'}
          </Button>
        </div>

        {/* 드래그&드롭 업로드 영역 */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleUpload(e.dataTransfer.files); }}
          onClick={() => inputRef.current?.click()}
          className={`
            flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl h-28 cursor-pointer transition-colors
            ${isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/20 hover:border-muted-foreground/40 hover:bg-muted/20'}
          `}
        >
          <Upload size={20} className="text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            클릭하거나 파일을 드래그하여 업로드 <span className="opacity-60">(JPEG · PNG · WebP · 최대 10MB, 자동 WebP 변환 + 썸네일 생성)</span>
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => handleUpload(e.target.files)}
        />

        {/* 이미지 그리드 */}
        {isLoading ? (
          <div className="text-center py-16 text-muted-foreground">불러오는 중...</div>
        ) : assets.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p>업로드된 파일이 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {assets.map((asset) => (
              <div
                key={asset.id}
                className="group relative aspect-square rounded-lg overflow-hidden border bg-muted/20"
              >
                <Image
                  src={asset.thumb_url ?? asset.file_url}
                  alt={asset.filename}
                  fill
                  className="object-cover"
                  unoptimized
                />
                {/* 호버 오버레이 */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                  <p className="text-white text-xs text-center leading-tight line-clamp-2">{asset.filename}</p>
                  <p className="text-white/60 text-xs">{formatBytes(asset.file_size)}</p>
                  <div className="flex gap-1.5 mt-1">
                    <button
                      onClick={() => handleCopyUrl(asset.file_url)}
                      className="bg-white/20 hover:bg-white/30 text-white rounded p-1.5 transition-colors"
                      title="URL 복사"
                    >
                      <Copy size={12} />
                    </button>
                    <button
                      onClick={() => setDeletingId(asset.id)}
                      className="bg-red-500/80 hover:bg-red-500 text-white rounded p-1.5 transition-colors"
                      title="삭제"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => { setPage(page - 1); fetchAssets(page - 1); }}>이전</Button>
            <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => { setPage(page + 1); fetchAssets(page + 1); }}>다음</Button>
          </div>
        )}
      </div>

      <DeleteConfirmModal
        isOpen={deletingId !== null}
        title="파일을 삭제하시겠습니까?"
        description="삭제된 파일은 복구할 수 없습니다. 해당 이미지를 사용 중인 페이지에서도 표시되지 않습니다."
        isLoading={false}
        onConfirm={handleDelete}
        onCancel={() => setDeletingId(null)}
      />
    </AdminLayout>
  );
}
