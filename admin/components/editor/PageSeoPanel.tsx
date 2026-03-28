'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ImageUploader } from '@/components/common/ImageUploader';
import { Page } from '@/types';

interface Props {
  page: Page;
  onSave: (data: { seo_description: string; seo_og_image: string }) => Promise<void>;
  onClose: () => void;
}

export function PageSeoPanel({ page, onSave, onClose }: Props) {
  const [description, setDescription] = useState(page.seoDescription ?? '');
  const [ogImage, setOgImage] = useState(page.seoOgImage ?? '');
  const [saving, setSaving] = useState(false);

  // page prop이 바뀌면 동기화
  useEffect(() => {
    setDescription(page.seoDescription ?? '');
    setOgImage(page.seoOgImage ?? '');
  }, [page.seoDescription, page.seoOgImage]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({ seo_description: description, seo_og_image: ogImage });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="absolute top-full left-0 right-0 z-30 bg-background border-b shadow-lg px-6 py-4">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">SEO 설정</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xs">닫기 ✕</button>
        </div>

        {/* 검색 미리보기 */}
        <div className="rounded-lg border bg-muted/30 p-3 space-y-0.5">
          <p className="text-xs text-muted-foreground mb-1">Google 검색 미리보기</p>
          <p className="text-sm text-blue-600 font-medium truncate">{page.title}</p>
          <p className="text-xs text-green-700">example.com/p/{page.slug}</p>
          <p className="text-xs text-muted-foreground truncate">
            {description || '메타 설명을 입력하면 여기에 표시됩니다.'}
          </p>
        </div>

        {/* 메타 설명 */}
        <div className="space-y-1">
          <label className="text-xs font-medium">메타 설명 <span className="text-muted-foreground font-normal">(권장 120-160자)</span></label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="검색 결과에 표시될 페이지 설명..."
            rows={3}
            maxLength={500}
            className="w-full border rounded-lg px-3 py-2 text-sm resize-none outline-none focus:ring-2 focus:ring-primary/50"
          />
          <p className={`text-xs text-right ${description.length > 160 ? 'text-amber-500' : 'text-muted-foreground'}`}>
            {description.length} / 160
          </p>
        </div>

        {/* OG 이미지 */}
        <div className="space-y-1">
          <label className="text-xs font-medium">OG 이미지 <span className="text-muted-foreground font-normal">(소셜 공유 미리보기 이미지)</span></label>
          <ImageUploader
            value={ogImage}
            onChange={setOgImage}
            previewHeight="h-24"
          />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" size="sm" onClick={onClose}>취소</Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? '저장 중...' : 'SEO 저장'}
          </Button>
        </div>
      </div>
    </div>
  );
}
