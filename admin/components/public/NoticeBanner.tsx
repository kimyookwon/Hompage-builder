'use client';

import { useState } from 'react';

interface Props {
  text: string;
  color: string;
}

export default function NoticeBanner({ text, color }: Props) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div
      className="w-full px-4 py-2 text-white text-sm flex items-center justify-between gap-4"
      style={{ backgroundColor: color }}
    >
      <span className="flex-1 text-center leading-snug">{text}</span>
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 opacity-70 hover:opacity-100 transition-opacity"
        aria-label="공지 닫기"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
