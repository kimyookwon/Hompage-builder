'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import { LoginForm } from '@/components/auth/LoginForm';
import { SocialLoginButtons } from '@/components/auth/SocialLoginButtons';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);

  // 이미 로그인된 경우 리다이렉트
  useEffect(() => {
    if (!hasHydrated) return;
    if (user) {
      router.replace(user.role === 'admin' ? '/admin' : '/');
    }
  }, [hasHydrated, user, router]);

  if (!hasHydrated || user) return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">홈페이지 빌더</CardTitle>
          <CardDescription>계정으로 로그인하세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <LoginForm />

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">또는</span>
            </div>
          </div>

          <SocialLoginButtons />

          <p className="text-center text-sm text-muted-foreground">
            비밀번호를 잊으셨나요?{' '}
            <Link href="/forgot-password" className="text-primary hover:underline font-medium">
              재설정
            </Link>
          </p>

          <p className="text-center text-sm text-muted-foreground">
            계정이 없으신가요?{' '}
            <Link href="/register" className="text-primary hover:underline font-medium">
              회원가입
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
