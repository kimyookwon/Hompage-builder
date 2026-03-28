'use client';

import { useState, useEffect, useRef } from 'react';

/**
 * 검색어 자동완성 훅 — 디바운스 300ms
 * @returns suggestions 제목 배열 (최대 5개)
 */
export function useSearchSuggest(query: string, delay = 300): string[] {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    clearTimeout(timerRef.current);
    if (query.trim().length < 1) {
      setSuggestions([]);
      return;
    }
    timerRef.current = setTimeout(async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? '';
        const res = await fetch(
          `${apiUrl}/api/search/suggest?q=${encodeURIComponent(query)}`,
          { cache: 'no-store' }
        );
        const json = await res.json();
        if (json.success) setSuggestions(json.data as string[]);
        else setSuggestions([]);
      } catch {
        setSuggestions([]);
      }
    }, delay);
    return () => clearTimeout(timerRef.current);
  }, [query, delay]);

  return suggestions;
}
