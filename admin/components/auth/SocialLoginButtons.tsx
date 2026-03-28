'use client';

import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';

const providers = [
  { id: 'google', label: 'Google로 로그인', color: 'outline' as const },
  { id: 'kakao', label: 'Kakao로 로그인', color: 'outline' as const },
  { id: 'naver', label: 'Naver로 로그인', color: 'outline' as const },
];

export function SocialLoginButtons() {
  const handleOAuth = async (provider: string) => {
    try {
      const res = await api.get<{ redirect_url: string }>(`/auth/oauth/${provider}/redirect`);
      window.location.href = res.data.redirect_url;
    } catch {
      // 리다이렉트 URL 획득 실패
    }
  };

  return (
    <div className="space-y-2">
      {providers.map(({ id, label, color }) => (
        <Button
          key={id}
          type="button"
          variant={color}
          className="w-full"
          onClick={() => handleOAuth(id)}
        >
          {label}
        </Button>
      ))}
    </div>
  );
}
