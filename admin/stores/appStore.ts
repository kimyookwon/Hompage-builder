import { create } from 'zustand';

type ToastVariant = 'default' | 'destructive';

interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface AppState {
  isLoading: boolean;
  toasts: Toast[];

  setLoading: (loading: boolean) => void;
  // 알림 메시지 추가
  addToast: (message: string, variant?: ToastVariant) => void;
  removeToast: (id: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isLoading: false,
  toasts: [],

  setLoading: (loading) => set({ isLoading: loading }),

  addToast: (message, variant = 'default') => {
    const id = crypto.randomUUID();
    set((state) => ({
      toasts: [...state.toasts, { id, message, variant }],
    }));
    // 3초 후 자동 제거
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, 3000);
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));
