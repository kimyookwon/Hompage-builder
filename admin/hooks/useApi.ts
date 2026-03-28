import { useState, useCallback } from 'react';
import { useAppStore } from '@/stores/appStore';

interface UseApiState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}

// API 호출 래퍼 훅 — 로딩/에러 상태 자동 관리
export function useApi<T>() {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    isLoading: false,
    error: null,
  });
  const addToast = useAppStore((s) => s.addToast);

  const execute = useCallback(
    async (apiCall: () => Promise<{ data: T }>, options?: { silent?: boolean }) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        const result = await apiCall();
        setState({ data: result.data, isLoading: false, error: null });
        return result.data;
      } catch (err) {
        const message = err instanceof Error ? err.message : '오류가 발생했습니다.';
        setState((prev) => ({ ...prev, isLoading: false, error: message }));
        if (!options?.silent) {
          addToast(message, 'destructive');
        }
        return null;
      }
    },
    [addToast]
  );

  return { ...state, execute };
}
