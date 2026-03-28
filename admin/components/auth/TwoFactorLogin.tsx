'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { User } from '@/types';

interface TwoFactorLoginResponse {
  token: string;
  user: User;
}

interface TwoFactorLoginProps {
  /** 1차 로그인 성공 시 발급된 임시 토큰 */
  tempToken: string;
  /** 2FA 검증 성공 시 최종 토큰과 사용자 정보를 전달하는 콜백 */
  onSuccess: (token: string, user: User) => void;
}

export function TwoFactorLogin({ tempToken, onSuccess }: TwoFactorLoginProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError('6자리 코드를 입력해주세요.');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const res = await api.post<TwoFactorLoginResponse>('/auth/2fa/login', {
        temp_token: tempToken,
        code,
      });
      onSuccess(res.data.token, res.data.user);
    } catch (e) {
      setError(e instanceof Error ? e.message : '인증에 실패했습니다. 코드를 확인해주세요.');
      setCode('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="text-center space-y-1">
        <p className="text-sm font-medium text-gray-700">
          이중 인증 코드 입력
        </p>
        <p className="text-xs text-gray-500">
          Google Authenticator 앱에서 6자리 코드를 입력하세요.
        </p>
      </div>

      <div className="space-y-1">
        <Label htmlFor="2fa-code">인증 코드</Label>
        <Input
          id="2fa-code"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          placeholder="000000"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          className="text-center tracking-[0.5em] text-xl font-mono"
          autoFocus
          autoComplete="one-time-code"
        />
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
          {error}
        </p>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={isLoading || code.length !== 6}
      >
        {isLoading ? '확인 중...' : '확인'}
      </Button>
    </form>
  );
}
