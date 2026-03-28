'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { User } from '@/types';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { TwoFactorLogin } from '@/components/auth/TwoFactorLogin';

// 1차 로그인 응답 타입 (2FA 분기 포함)
type LoginResponse =
  | { token: string; user: User; requires_2fa?: false }
  | { requires_2fa: true; temp_token: string };

const loginSchema = z.object({
  email: z.string().email('유효한 이메일을 입력해주세요.'),
  password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다.'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const { setAuth } = useAuth();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  // 2FA가 필요한 경우 임시 토큰 보관
  const [tempToken, setTempToken] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  // 로그인 완료 후 리디렉션 처리 (2FA 성공 콜백에서도 재사용)
  const handleAuthComplete = (user: User, token: string) => {
    setAuth(user, token);
    const redirectTo = sessionStorage.getItem('redirect_after_login');
    sessionStorage.removeItem('redirect_after_login');
    router.replace(redirectTo ?? (user.role === 'admin' ? '/admin' : '/'));
  };

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null);
    try {
      const res = await api.post<LoginResponse>('/auth/login', values);
      // 2FA 활성화 사용자 — 2FA 입력 단계로 전환
      if (res.data.requires_2fa) {
        setTempToken(res.data.temp_token);
        return;
      }
      handleAuthComplete(res.data.user, res.data.token);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : '로그인에 실패했습니다.');
    }
  };

  // 2FA 입력 단계 렌더링
  if (tempToken) {
    return (
      <TwoFactorLogin
        tempToken={tempToken}
        onSuccess={(token, user) => handleAuthComplete(user, token)}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="email">이메일</Label>
        <Input
          id="email"
          type="email"
          placeholder="admin@example.com"
          autoComplete="email"
          {...register('email')}
        />
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="password">비밀번호</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          {...register('password')}
        />
        {errors.password && (
          <p className="text-xs text-destructive">{errors.password.message}</p>
        )}
      </div>

      {serverError && (
        <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
          {serverError}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? '로그인 중...' : '로그인'}
      </Button>
    </form>
  );
}
