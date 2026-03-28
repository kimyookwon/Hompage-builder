'use client';

import { useRef, useState, useCallback } from 'react';
import { PostContent } from '@/lib/post-content';
import { api } from '@/lib/api';
import {
  Bold, Italic, Strikethrough, Code, Link2,
  Heading1, Heading2, List, ListOrdered,
  Minus, Quote, Image as ImageIcon,
  Eye, EyeOff, Columns2,
} from 'lucide-react';

interface MediaAsset { id: number; file_url: string; }

type ViewMode = 'edit' | 'preview' | 'split';

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  error?: string;
}

// 텍스트 삽입/감싸기 헬퍼
function applyWrap(
  el: HTMLTextAreaElement,
  setValue: (v: string) => void,
  prefix: string,
  suffix = '',
  placeholder = ''
) {
  const start = el.selectionStart;
  const end   = el.selectionEnd;
  const sel   = el.value.slice(start, end) || placeholder;
  const newVal = el.value.slice(0, start) + prefix + sel + suffix + el.value.slice(end);
  setValue(newVal);
  setTimeout(() => {
    el.focus();
    const s = start + prefix.length;
    el.selectionStart = s;
    el.selectionEnd   = s + sel.length;
  }, 0);
}

function applyLine(
  el: HTMLTextAreaElement,
  setValue: (v: string) => void,
  linePrefix: string,
  placeholder = ''
) {
  const start = el.selectionStart;
  // 줄의 시작 위치 찾기
  const lineStart = el.value.lastIndexOf('\n', start - 1) + 1;
  const lineEnd   = el.value.indexOf('\n', start);
  const end       = lineEnd === -1 ? el.value.length : lineEnd;
  const lineText  = el.value.slice(lineStart, end) || placeholder;
  const newVal    = el.value.slice(0, lineStart) + linePrefix + lineText + el.value.slice(end);
  setValue(newVal);
  setTimeout(() => { el.focus(); el.selectionStart = el.selectionEnd = lineStart + linePrefix.length + lineText.length; }, 0);
}

export function MarkdownEditor({ value, onChange, placeholder = '마크다운으로 내용을 입력하세요...', rows = 14, error }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>('edit');
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInlineImage = useCallback(async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.upload<MediaAsset>('/media/upload', fd);
      const tag = `\n![이미지](${res.data.file_url})\n`;
      const el  = textareaRef.current;
      if (el) {
        const pos = el.selectionStart ?? value.length;
        onChange(value.slice(0, pos) + tag + value.slice(pos));
        setTimeout(() => { el.focus(); el.selectionStart = el.selectionEnd = pos + tag.length; }, 0);
      } else {
        onChange(value + tag);
      }
    } catch {
      alert('이미지 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
    }
  }, [value, onChange]);

  const toolbar = (
    <div className="flex items-center gap-0.5 flex-wrap border-b px-2 py-1.5 bg-muted/30 rounded-t-md">
      {/* 제목 */}
      <ToolBtn title="H1" onClick={() => textareaRef.current && applyLine(textareaRef.current, onChange, '# ', '제목 1')}>
        <Heading1 size={14} />
      </ToolBtn>
      <ToolBtn title="H2" onClick={() => textareaRef.current && applyLine(textareaRef.current, onChange, '## ', '제목 2')}>
        <Heading2 size={14} />
      </ToolBtn>
      <Sep />

      {/* 인라인 서식 */}
      <ToolBtn title="굵게 (Ctrl+B)" onClick={() => textareaRef.current && applyWrap(textareaRef.current, onChange, '**', '**', '굵은 텍스트')}>
        <Bold size={14} />
      </ToolBtn>
      <ToolBtn title="기울임 (Ctrl+I)" onClick={() => textareaRef.current && applyWrap(textareaRef.current, onChange, '*', '*', '기울임 텍스트')}>
        <Italic size={14} />
      </ToolBtn>
      <ToolBtn title="취소선" onClick={() => textareaRef.current && applyWrap(textareaRef.current, onChange, '~~', '~~', '취소선')}>
        <Strikethrough size={14} />
      </ToolBtn>
      <ToolBtn title="인라인 코드" onClick={() => textareaRef.current && applyWrap(textareaRef.current, onChange, '`', '`', '코드')}>
        <Code size={14} />
      </ToolBtn>
      <Sep />

      {/* 목록/인용/HR */}
      <ToolBtn title="글머리 기호" onClick={() => textareaRef.current && applyLine(textareaRef.current, onChange, '- ', '항목')}>
        <List size={14} />
      </ToolBtn>
      <ToolBtn title="번호 목록" onClick={() => textareaRef.current && applyLine(textareaRef.current, onChange, '1. ', '항목')}>
        <ListOrdered size={14} />
      </ToolBtn>
      <ToolBtn title="인용" onClick={() => textareaRef.current && applyLine(textareaRef.current, onChange, '> ', '인용 텍스트')}>
        <Quote size={14} />
      </ToolBtn>
      <ToolBtn title="구분선" onClick={() => { onChange(value + '\n\n---\n\n'); }}>
        <Minus size={14} />
      </ToolBtn>
      <Sep />

      {/* 링크 / 이미지 */}
      <ToolBtn title="링크" onClick={() => textareaRef.current && applyWrap(textareaRef.current, onChange, '[', '](https://)', '링크 텍스트')}>
        <Link2 size={14} />
      </ToolBtn>
      <ToolBtn title="이미지 업로드" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
        <ImageIcon size={14} className={uploading ? 'animate-pulse' : ''} />
      </ToolBtn>

      {/* 미리보기 모드 토글 (오른쪽 정렬) */}
      <div className="ml-auto flex gap-0.5">
        <ToolBtn title="편집" active={viewMode === 'edit'} onClick={() => setViewMode('edit')}>
          <EyeOff size={14} />
        </ToolBtn>
        <ToolBtn title="분할" active={viewMode === 'split'} onClick={() => setViewMode('split')}>
          <Columns2 size={14} />
        </ToolBtn>
        <ToolBtn title="미리보기" active={viewMode === 'preview'} onClick={() => setViewMode('preview')}>
          <Eye size={14} />
        </ToolBtn>
      </div>
    </div>
  );

  const minHeight = `${rows * 1.625}rem`;

  return (
    <div className={`border rounded-md overflow-hidden ${error ? 'border-destructive' : 'border-input'} focus-within:ring-2 focus-within:ring-ring`}>
      {toolbar}

      <div className={`flex ${viewMode === 'split' ? 'divide-x' : ''}`}>
        {/* 편집 영역 */}
        {viewMode !== 'preview' && (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            style={{ minHeight }}
            className={`flex-1 px-4 py-3 text-sm bg-background outline-none resize-y font-mono leading-relaxed ${viewMode === 'split' ? 'w-1/2' : 'w-full'}`}
            onKeyDown={(e) => {
              // Tab → 공백 2칸
              if (e.key === 'Tab') {
                e.preventDefault();
                const el = e.currentTarget;
                const s = el.selectionStart;
                const newVal = el.value.slice(0, s) + '  ' + el.value.slice(el.selectionEnd);
                onChange(newVal);
                setTimeout(() => { el.selectionStart = el.selectionEnd = s + 2; }, 0);
              }
            }}
          />
        )}

        {/* 미리보기 영역 */}
        {viewMode !== 'edit' && (
          <div
            className={`flex-1 px-4 py-3 overflow-y-auto bg-background ${viewMode === 'split' ? 'w-1/2' : 'w-full'}`}
            style={{ minHeight }}
          >
            {value.trim() ? (
              <PostContent content={value} />
            ) : (
              <p className="text-muted-foreground text-sm italic">미리보기가 없습니다...</p>
            )}
          </div>
        )}
      </div>

      {/* 숨겨진 파일 입력 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleInlineImage(f); e.target.value = ''; }}
      />

      {error && <p className="px-3 py-1 text-xs text-destructive border-t">{error}</p>}
    </div>
  );
}

function ToolBtn({ title, onClick, children, disabled, active }: {
  title: string;
  onClick?: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-40 ${
        active ? 'bg-muted text-foreground' : ''
      }`}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <span className="mx-0.5 h-4 w-px bg-border inline-block" />;
}
