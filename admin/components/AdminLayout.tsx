'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/authStore';
import { AdminNav } from '@/components/AdminNav';

interface AdminLayoutProps {
  children: React.ReactNode;
}

// 관리자 레이아웃 — 미인증 시 /login 리다이렉트
export function AdminLayout({ children }: AdminLayoutProps) {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  // Zustand persist 수화 완료 여부 추적 (SSR에서는 false로 시작)
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    if (hasHydrated) return;
    // 클라이언트에서 persist 수화 완료 여부 확인
    if (useAuthStore.persist?.hasHydrated()) {
      setHasHydrated(true);
      return;
    }
    // 아직 완료되지 않은 경우 완료 콜백 등록
    const unsub = useAuthStore.persist?.onFinishHydration(() => {
      setHasHydrated(true);
    });
    return unsub;
  }, [hasHydrated]);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    // 관리자 역할 체크
    if (user && user.role !== 'admin') {
      router.replace('/');
    }
  }, [hasHydrated, isAuthenticated, user, router]);

  // 수화 전 또는 미인증 상태면 아무것도 렌더링하지 않음
  if (!hasHydrated || !isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminNav />
      <main className="flex-1 overflow-auto">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
