'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';
import { SiteSettings } from '@/types';

// 루트 진입점 — 관리자는 /admin, 그 외는 홈 슬러그 페이지 또는 /login
export default function HomePage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    if (!hasHydrated) return;

    // 관리자는 항상 /admin
    if (user?.role === 'admin') {
      router.replace('/admin');
      return;
    }

    // 비관리자: 홈 슬러그 확인 후 리다이렉트
    api.get<SiteSettings>('/site-settings')
      .then((res) => {
        const slug = res.data.homeSlug;
        if (slug) {
          router.replace(`/p/${slug}`);
        } else {
          router.replace('/login');
        }
      })
      .catch(() => {
        router.replace('/login');
      })
      .finally(() => setResolved(true));
  }, [hasHydrated, user, router]);

  if (!resolved) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return null;
}
