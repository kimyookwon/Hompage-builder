import { useAuthStore } from '@/stores/authStore';

// 인증 상태 및 액션을 반환하는 훅
export function useAuth() {
  const { user, token, isAuthenticated, setAuth, clearAuth } = useAuthStore();
  return { user, token, isAuthenticated, setAuth, clearAuth };
}
