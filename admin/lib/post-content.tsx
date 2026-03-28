'use client';

import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { useMemo } from 'react';

// marked 설정 — GFM + 줄바꿈 허용
marked.setOptions({ gfm: true, breaks: true });

/** 마크다운 문자열 → 안전한 HTML 변환 */
export function renderMarkdown(content: string): string {
  const raw = marked.parse(content) as string;
  if (typeof window === 'undefined') return raw; // SSR 폴백
  return DOMPurify.sanitize(raw, {
    ALLOWED_TAGS: [
      'h1','h2','h3','h4','h5','h6',
      'p','br','hr',
      'strong','em','del','code','pre','blockquote',
      'ul','ol','li',
      'table','thead','tbody','tr','th','td',
      'a','img',
    ],
    ALLOWED_ATTR: ['href','src','alt','title','target','rel','class'],
    FORCE_BODY: true,
  });
}

/** 게시글 본문 렌더러 컴포넌트 */
export function PostContent({ content }: { content: string }) {
  const html = useMemo(() => renderMarkdown(content), [content]);

  return (
    <div
      className="prose prose-sm max-w-none dark:prose-invert
        prose-headings:font-bold prose-headings:text-foreground
        prose-p:text-foreground prose-p:leading-relaxed
        prose-a:text-blue-500 prose-a:no-underline hover:prose-a:underline
        prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
        prose-pre:bg-muted prose-pre:rounded-lg prose-pre:overflow-x-auto
        prose-blockquote:border-l-4 prose-blockquote:border-primary/30 prose-blockquote:pl-4 prose-blockquote:text-muted-foreground
        prose-img:rounded-lg prose-img:max-w-full prose-img:border
        prose-table:w-full prose-th:border prose-th:px-3 prose-th:py-2 prose-td:border prose-td:px-3 prose-td:py-2
        prose-hr:border-border"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
