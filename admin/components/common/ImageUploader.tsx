'use client';

import { useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MediaPickerModal } from './MediaPickerModal';
import { api } from '@/lib/api';
import { Upload, X, Link, Images } from 'lucide-react';

interface MediaAsset {
  id: number;
  file_url: string;
}

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  previewHeight?: string;
}

export function ImageUploader({
  value,
  onChange,
  label,
  previewHeight = 'h-32',
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [error, setError] = useState('');

  const uploadFile = useCallback(async (file: File) => {
    setError('');
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.upload<MediaAsset>('/media/upload', formData);
      onChange(res.data.file_url);
    } catch (e) {
      setError(e instanceof Error ? e.message : '업로드 실패');
    } finally {
      setIsUploading(false);
    }
  }, [onChange]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = '';
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  }, [uploadFile]);

  const handleUrlApply = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
      setUrlInput('');
      setShowUrlInput(false);
    }
  };

  return (
    <div className="space-y-2">
      {label && <p className="text-sm font-medium">{label}</p>}

      {value ? (
        <div className={`relative ${previewHeight} rounded-lg overflow-hidden border bg-muted/20`}>
          <Image
            src={value}
            alt="업로드된 이미지"
            fill
            className="object-contain"
            unoptimized
          />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute top-1.5 right-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors"
            title="이미지 제거"
          >
            <X size={12} />
          </button>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onClick={() => inputRef.current?.click()}
          className={`
            ${previewHeight} flex flex-col items-center justify-center gap-2
            border-2 border-dashed rounded-lg cursor-pointer transition-colors
            ${isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/20'}
          `}
        >
          {isUploading ? (
            <p className="text-sm text-muted-foreground animate-pulse">업로드 중...</p>
          ) : (
            <>
              <Upload size={20} className="text-muted-foreground" />
              <p className="text-xs text-muted-foreground text-center px-2">
                클릭하거나 드래그하여 업로드
                <br />
                <span className="opacity-60">JPEG · PNG · WebP · 최대 5MB</span>
              </p>
            </>
          )}
        </div>
      )}

      {/* 보조 버튼 — 라이브러리 선택 / URL 입력 */}
      {!value && (
        <div className="flex items-center gap-1">
          {/* 라이브러리에서 선택 */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-muted-foreground px-1"
            onClick={(e) => { e.stopPropagation(); setShowPicker(true); }}
          >
            <Images size={12} className="mr-1" /> 라이브러리
          </Button>

          {/* URL 직접 입력 */}
          {showUrlInput ? (
            <div className="flex gap-1.5 flex-1">
              <Input
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="text-xs h-7"
                onKeyDown={(e) => e.key === 'Enter' && handleUrlApply()}
                autoFocus
              />
              <Button type="button" size="sm" className="h-7 px-2 text-xs" onClick={handleUrlApply}>확인</Button>
              <Button type="button" size="sm" variant="ghost" className="h-7 px-1" onClick={() => { setShowUrlInput(false); setUrlInput(''); }}>
                <X size={11} />
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground px-1"
              onClick={() => setShowUrlInput(true)}
            >
              <Link size={12} className="mr-1" /> URL 입력
            </Button>
          )}
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      <MediaPickerModal
        isOpen={showPicker}
        onSelect={onChange}
        onClose={() => setShowPicker(false)}
      />
    </div>
  );
}
