'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [maskedEmail, setMaskedEmail] = useState('');
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  // 토큰 유효성 사전 확인
  useEffect(() => {
    if (!token) {
      setTokenValid(false);
      return;
    }
    api.get<{ email: string }>(`/auth/reset-password/verify?token=${encodeURIComponent(token)}`)
      .then((res) => {
        setMaskedEmail(res.data.email);
        setTokenValid(true);
      })
      .catch(() => setTokenValid(false));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('비밀번호는 8자 이상이어야 합니다.');
      return;
    }
    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      setDone(true);
      setTimeout(() => router.push('/login'), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '재설정에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 토큰 확인 중
  if (tokenValid === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  // 유효하지 않은 토큰
  if (tokenValid === false) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">링크가 만료되었습니다</CardTitle>
            <CardDescription>
              재설정 링크가 유효하지 않거나 만료되었습니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full" asChild>
              <Link href="/forgot-password">새 링크 요청하기</Link>
            </Button>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/login">로그인으로 돌아가기</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">새 비밀번호 설정</CardTitle>
          {maskedEmail && (
            <CardDescription>{maskedEmail} 계정의 비밀번호를 변경합니다.</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {done ? (
            <div className="space-y-4 text-center">
              <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-sm text-green-800">
                비밀번호가 변경되었습니다.<br />
                3초 후 로그인 페이지로 이동합니다.
              </div>
              <Button className="w-full" asChild>
                <Link href="/login">바로 로그인하기</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="password">새 비밀번호</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="8자 이상 입력"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="confirm">비밀번호 확인</Label>
                <Input
                  id="confirm"
                  type="password"
                  placeholder="비밀번호 재입력"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              {/* 강도 표시 */}
              {password.length > 0 && (
                <div className="space-y-1">
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        password.length < 8 ? 'w-1/4 bg-destructive' :
                        password.length < 12 ? 'w-1/2 bg-yellow-400' :
                        'w-full bg-green-500'
                      }`}
                    />
                  </div>
                  <p className={`text-xs ${
                    password.length < 8 ? 'text-destructive' :
                    password.length < 12 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {password.length < 8 ? '너무 짧음' : password.length < 12 ? '보통' : '강함'}
                  </p>
                </div>
              )}

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? '변경 중...' : '비밀번호 변경'}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                <Link href="/login" className="text-primary hover:underline">
                  ← 로그인으로 돌아가기
                </Link>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
