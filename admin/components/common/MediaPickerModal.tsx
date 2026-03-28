'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { PaginatedResponse } from '@/types';
import { Check, X } from 'lucide-react';

interface MediaAsset {
  id: number;
  filename: string;
  file_url: string;
  file_size: number;
  created_at: string;
}

interface MediaPickerModalProps {
  isOpen: boolean;
  onSelect: (url: string) => void;
  onClose: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const LIMIT = 24;

export function MediaPickerModal({ isOpen, onSelect, onClose }: MediaPickerModalProps) {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUrl, setSelectedUrl] = useState('');

  const fetchAssets = useCallback(async (currentPage: number) => {
    setIsLoading(true);
    try {
      const res = await api.get<PaginatedResponse<MediaAsset>['data']>(
        `/media?page=${currentPage}&limit=${LIMIT}`
      );
      setAssets(res.data.items);
      setTotal(res.data.pagination.total);
    } catch {
      // 조용히 실패
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setSelectedUrl('');
      setPage(1);
      fetchAssets(1);
    }
  }, [isOpen, fetchAssets]);

  if (!isOpen) return null;

  const totalPages = Math.ceil(total / LIMIT);

  const handleConfirm = () => {
    if (selectedUrl) {
      onSelect(selectedUrl);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-xl shadow-xl w-full max-w-3xl mx-4 flex flex-col max-h-[85vh]">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
          <h2 className="font-semibold text-lg">미디어 라이브러리</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* 이미지 그리드 */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
              불러오는 중...
            </div>
          ) : assets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground text-sm gap-2">
              <p>업로드된 이미지가 없습니다.</p>
              <p className="text-xs opacity-60">미디어 관리 페이지에서 먼저 이미지를 업로드하세요.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {assets.map((asset) => {
                const isSelected = selectedUrl === asset.file_url;
                return (
                  <button
                    key={asset.id}
                    onClick={() => setSelectedUrl(isSelected ? '' : asset.file_url)}
                    className={`
                      relative aspect-square rounded-lg overflow-hidden border-2 transition-all
                      ${isSelected ? 'border-primary ring-2 ring-primary/30' : 'border-transparent hover:border-muted-foreground/30'}
                    `}
                    title={asset.filename}
                  >
                    <Image
                      src={asset.file_url}
                      alt={asset.filename}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <div className="bg-primary text-primary-foreground rounded-full p-1">
                          <Check size={14} />
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 페이지네이션 + 선택 정보 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 px-4 py-2 border-t shrink-0">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => { const p = page - 1; setPage(p); fetchAssets(p); }}>이전</Button>
            <span className="text-xs text-muted-foreground">{page} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => { const p = page + 1; setPage(p); fetchAssets(p); }}>다음</Button>
          </div>
        )}

        {/* 푸터 */}
        <div className="flex items-center justify-between px-5 py-3 border-t bg-muted/20 shrink-0 rounded-b-xl">
          <p className="text-sm text-muted-foreground">
            {selectedUrl ? (
              <span className="text-foreground font-medium">1개 선택됨</span>
            ) : (
              '이미지를 클릭하여 선택하세요'
            )}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>취소</Button>
            <Button size="sm" disabled={!selectedUrl} onClick={handleConfirm}>선택 완료</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
