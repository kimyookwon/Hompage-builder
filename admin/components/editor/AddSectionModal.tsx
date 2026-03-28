'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

const SECTION_TYPES = ['header', 'container', 'banner', 'footer'] as const;
const SECTION_FORMATS = ['bento', 'glassmorphism', 'organic', 'text', 'gallery', 'board_widget'] as const;

const FORMAT_LABELS: Record<string, string> = {
  bento: 'Bento Grid',
  glassmorphism: 'Glassmorphism',
  organic: 'Organic',
  text: '텍스트',
  gallery: '갤러리',
  board_widget: '게시판 위젯',
};

type SectionType = (typeof SECTION_TYPES)[number];
type SectionFormat = (typeof SECTION_FORMATS)[number];

interface AddSectionModalProps {
  isOpen: boolean;
  isLoading?: boolean;
  onSubmit: (type: SectionType, format: SectionFormat) => void;
  onCancel: () => void;
}

export function AddSectionModal({ isOpen, isLoading = false, onSubmit, onCancel }: AddSectionModalProps) {
  const [selectedType, setSelectedType] = useState<SectionType>('container');
  const [selectedFormat, setSelectedFormat] = useState<SectionFormat>('bento');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg border p-6 w-full max-w-sm shadow-lg">
        <h3 className="text-lg font-semibold mb-4">섹션 추가</h3>

        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-2">섹션 타입</p>
            <div className="grid grid-cols-2 gap-2">
              {SECTION_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`px-3 py-2 rounded-md border text-sm capitalize transition-colors ${
                    selectedType === type
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'hover:bg-muted'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">포맷</p>
            <div className="grid grid-cols-2 gap-2">
              {SECTION_FORMATS.map((format) => (
                <button
                  key={format}
                  onClick={() => setSelectedFormat(format)}
                  className={`px-3 py-2 rounded-md border text-sm transition-colors ${
                    selectedFormat === format
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'hover:bg-muted'
                  }`}
                >
                  {FORMAT_LABELS[format] ?? format}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2 justify-end mt-6">
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            취소
          </Button>
          <Button onClick={() => onSubmit(selectedType, selectedFormat)} disabled={isLoading}>
            {isLoading ? '추가 중...' : '추가'}
          </Button>
        </div>
      </div>
    </div>
  );
}
