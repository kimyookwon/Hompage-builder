'use client';

import { useEffect, useRef } from 'react';
import { PageSection } from '@/types';
import { SectionFormatEditor } from './SectionFormatEditor';
import { Badge } from '@/components/ui/badge';

interface SectionEditorProps {
  section: PageSection | null;
  onSave: (content: Record<string, unknown>) => void;
}

export function SectionEditor({ section, onSave }: SectionEditorProps) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  if (!section) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        좌측에서 편집할 섹션을 선택하세요
      </div>
    );
  }

  // debounce 1000ms 자동 저장
  const handleChange = (content: Record<string, unknown>) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onSave(content);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-3 border-b">
        <Badge className="capitalize">{section.type}</Badge>
        <Badge variant="outline" className="capitalize">{section.format}</Badge>
        <span className="ml-auto text-xs text-muted-foreground">자동 저장</span>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <SectionFormatEditor key={section.id} section={section} onChange={handleChange} />
      </div>
    </div>
  );
}
