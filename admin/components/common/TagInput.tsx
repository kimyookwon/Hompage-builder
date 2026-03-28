'use client';

import { KeyboardEvent, useState } from 'react';
import { X } from 'lucide-react';

interface Props {
  value: string[];         // 현재 태그 배열
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
}

// 태그 입력 컴포넌트 — Enter/쉼표로 추가, X 버튼으로 삭제
export function TagInput({ value, onChange, placeholder = '태그 입력 후 Enter', maxTags = 10 }: Props) {
  const [input, setInput] = useState('');

  const addTag = (raw: string) => {
    const tag = raw.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-가-힣]/g, '').slice(0, 30);
    if (!tag) return;
    if (value.includes(tag)) { setInput(''); return; }
    if (value.length >= maxTags) return;
    onChange([...value, tag]);
    setInput('');
  };

  const removeTag = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(input);
    } else if (e.key === 'Backspace' && !input && value.length > 0) {
      removeTag(value.length - 1);
    }
  };

  return (
    <div className={`flex flex-wrap gap-1.5 min-h-[38px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-within:ring-2 focus-within:ring-ring transition-shadow`}>
      {value.map((tag, i) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-medium"
        >
          #{tag}
          <button
            type="button"
            onClick={() => removeTag(i)}
            className="hover:text-destructive transition-colors"
          >
            <X size={10} />
          </button>
        </span>
      ))}
      {value.length < maxTags && (
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          onBlur={() => { if (input.trim()) addTag(input); }}
          placeholder={value.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] bg-transparent outline-none placeholder:text-muted-foreground"
        />
      )}
    </div>
  );
}
