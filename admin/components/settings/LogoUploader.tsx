'use client';

import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X } from 'lucide-react';

interface LogoUploaderProps {
  logoUrl: string | null;
  onUpload: (file: File) => void;
  onRemove: () => void;
}

export function LogoUploader({ logoUrl, onUpload, onRemove }: LogoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
  };

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">사이트 로고</p>
      {logoUrl ? (
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoUrl} alt="로고" className="h-12 w-auto rounded-md border object-contain p-1" />
          <Button variant="outline" size="sm" onClick={onRemove} className="text-destructive hover:text-destructive">
            <X size={14} className="mr-1" /> 제거
          </Button>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          className="flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg h-24 cursor-pointer hover:bg-muted/30 transition-colors"
        >
          <Upload size={20} className="text-muted-foreground" />
          <p className="text-xs text-muted-foreground">클릭하여 로고 업로드 (JPEG, PNG, WebP, 최대 5MB)</p>
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileChange} />
    </div>
  );
}
