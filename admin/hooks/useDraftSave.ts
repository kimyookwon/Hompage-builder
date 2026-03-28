// @TASK 임시저장 훅 — 30초 디바운스 자동저장 + localStorage 관리
import { useCallback, useEffect, useRef, useState } from 'react';

interface DraftData {
  title: string;
  content: string;
}

interface StoredDraft extends DraftData {
  savedAt: number;
}

interface UseDraftSaveOptions {
  postId?: number;
}

interface UseDraftSaveReturn {
  hasDraft: boolean;
  loadDraft: () => DraftData | null;
  clearDraft: () => void;
  lastSaved: Date | null;
}

/**
 * 30초마다 자동저장 + 페이지 떠날 때 저장하는 임시저장 훅
 *
 * @param boardId  게시판 ID (localStorage 키 구분용)
 * @param data     저장할 제목/내용 데이터
 * @param options  postId가 있으면 수정 모드 키 사용
 */
export function useDraftSave(
  boardId: number | string,
  data: DraftData,
  options?: UseDraftSaveOptions,
): UseDraftSaveReturn {
  const draftKey = options?.postId
    ? `draft_edit_${options.postId}`
    : `draft_${boardId}`;

  // 초기 hasDraft는 localStorage에 값이 있는지로 결정
  const [hasDraft, setHasDraft] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(draftKey) !== null;
  });

  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // data의 최신 값을 타이머 콜백에서 참조하기 위한 ref
  const dataRef = useRef<DraftData>(data);
  dataRef.current = data;

  const saveDraft = useCallback(() => {
    const { title, content } = dataRef.current;
    // 둘 다 비어있으면 저장하지 않음
    if (!title.trim() && !content.trim()) return;

    const stored: StoredDraft = { title, content, savedAt: Date.now() };
    localStorage.setItem(draftKey, JSON.stringify(stored));
    setLastSaved(new Date());
    setHasDraft(true);
  }, [draftKey]);

  // 30초마다 자동저장
  useEffect(() => {
    const interval = setInterval(saveDraft, 30_000);
    return () => clearInterval(interval);
  }, [saveDraft]);

  // 페이지 떠날 때 저장 (beforeunload)
  useEffect(() => {
    const handleBeforeUnload = () => saveDraft();
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveDraft]);

  const loadDraft = useCallback((): DraftData | null => {
    const raw = localStorage.getItem(draftKey);
    if (!raw) return null;
    try {
      const stored = JSON.parse(raw) as StoredDraft;
      return { title: stored.title ?? '', content: stored.content ?? '' };
    } catch {
      return null;
    }
  }, [draftKey]);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(draftKey);
    setHasDraft(false);
    setLastSaved(null);
  }, [draftKey]);

  return { hasDraft, loadDraft, clearDraft, lastSaved };
}
