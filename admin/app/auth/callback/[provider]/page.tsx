'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { User } from '@/types';

interface OAuthCallbackResponse {
  token: string;
  user: User;
}

// 각 제공자별 콜백 URL
const REDIRECT_URIS: Record<string, string> = {
  google: 'http://localhost:3000/auth/callback/google',
  kakao:  'http://localhost:3000/auth/callback/kakao',
  naver:  'http://localhost:3000/auth/callback/naver',
};

export default function OAuthCallbackPage() {
  const { provider } = useParams<{ provider: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [error, setError] = useState('');

  useEffect(() => {
    const code = searchParams.get('code');
    // Naver는 state 파라미터도 전달
    const error = searchParams.get('error');

    if (error) {
      setError(`소셜 로그인이 취소되었습니다. (${error})`);
      return;
    }

    if (!code) {
      setError('인증 코드가 없습니다.');
      return;
    }

    const redirectUri = REDIRECT_URIS[provider];
    if (!redirectUri) {
      setError('지원하지 않는 로그인 방식입니다.');
      return;
    }

    api.post<OAuthCallbackResponse>(`/auth/oauth/${provider}/callback`, {
      code,
      redirect_uri: redirectUri,
    })
      .then((res) => {
        setAuth(res.data.user, res.data.token);
        // 로그인 전 이동 요청 URL이 있으면 그곳으로
        const redirectTo = sessionStorage.getItem('redirect_after_login');
        sessionStorage.removeItem('redirect_after_login');
        router.replace(redirectTo ?? (res.data.user.role === 'admin' ? '/admin' : '/'));
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : '소셜 로그인에 실패했습니다.');
      });
  }, [provider, searchParams, router, setAuth]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-muted/30 px-4">
        <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-lg px-6 py-4 text-sm max-w-sm text-center">
          {error}
        </div>
        <button
          onClick={() => router.replace('/login')}
          className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground"
        >
          로그인 페이지로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-muted/30">
      <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      <p className="text-sm text-muted-foreground">로그인 처리 중...</p>
    </div>
  );
}
