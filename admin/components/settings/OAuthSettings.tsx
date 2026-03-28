'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';

const PROVIDERS = [
  {
    id: 'google',
    name: 'Google',
    consoleUrl: 'https://console.cloud.google.com/apis/credentials',
    callbackUrl: 'http://localhost:3000/auth/callback/google',
    envKeys: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'],
    steps: [
      'Google Cloud Console → APIs & Services → Credentials',
      '"OAuth 2.0 Client ID" 생성 (Web application 타입)',
      '승인된 리디렉션 URI에 아래 콜백 URL 추가',
      'Client ID와 Client Secret을 backend/.env에 입력',
    ],
  },
  {
    id: 'kakao',
    name: 'Kakao',
    consoleUrl: 'https://developers.kakao.com/console/app',
    callbackUrl: 'http://localhost:3000/auth/callback/kakao',
    envKeys: ['KAKAO_CLIENT_ID', 'KAKAO_CLIENT_SECRET'],
    steps: [
      'Kakao Developers → 내 애플리케이션 → 앱 추가',
      '플랫폼 → Web → 사이트 도메인: http://localhost:3000',
      '카카오 로그인 활성화 → Redirect URI에 콜백 URL 추가',
      'REST API 키를 KAKAO_CLIENT_ID에, Client Secret을 KAKAO_CLIENT_SECRET에 입력',
    ],
  },
  {
    id: 'naver',
    name: 'Naver',
    consoleUrl: 'https://developers.naver.com/apps/#/register',
    callbackUrl: 'http://localhost:3000/auth/callback/naver',
    envKeys: ['NAVER_CLIENT_ID', 'NAVER_CLIENT_SECRET'],
    steps: [
      'Naver Developers → Application 등록',
      '사용 API: 네아로(네이버 아이디로 로그인) 선택',
      '서비스 URL: http://localhost:3000, Callback URL: 아래 URL 입력',
      'Client ID와 Client Secret을 backend/.env에 입력',
    ],
  },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="ml-1.5 text-muted-foreground hover:text-foreground transition-colors"
      title="복사"
    >
      {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
    </button>
  );
}

export function OAuthSettings() {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        OAuth 키는 서버의{' '}
        <code className="font-mono bg-muted px-1 py-0.5 rounded text-xs">backend/.env</code>
        {' '}파일에서 직접 설정합니다. 아래 각 제공자의 가이드를 참고하세요.
      </p>

      {PROVIDERS.map((provider) => (
        <div key={provider.id} className="border rounded-lg overflow-hidden">
          <button
            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/30 transition-colors"
            onClick={() => setOpen(open === provider.id ? null : provider.id)}
          >
            <span className="font-medium text-sm">{provider.name} 로그인 설정</span>
            <span className="text-xs text-muted-foreground">{open === provider.id ? '접기 ▲' : '펼치기 ▼'}</span>
          </button>

          {open === provider.id && (
            <div className="px-4 pb-4 space-y-3 border-t bg-muted/10">
              {/* 콜백 URL */}
              <div className="mt-3">
                <p className="text-xs font-medium text-muted-foreground mb-1">콜백 URL — 제공자 콘솔에 등록</p>
                <div className="flex items-center bg-muted rounded-md px-3 py-1.5">
                  <code className="text-xs font-mono flex-1">{provider.callbackUrl}</code>
                  <CopyButton text={provider.callbackUrl} />
                </div>
              </div>

              {/* 설정 단계 */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1.5">설정 순서</p>
                <ol className="space-y-1.5">
                  {provider.steps.map((step, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex gap-2">
                      <span className="shrink-0 w-4 h-4 rounded-full bg-muted-foreground/20 flex items-center justify-center text-[10px]">{i + 1}</span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>

              {/* .env 키 */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">backend/.env 설정 키</p>
                <div className="bg-muted rounded-md px-3 py-2 space-y-0.5">
                  {provider.envKeys.map((key) => (
                    <div key={key} className="flex items-center">
                      <code className="text-xs font-mono flex-1">{key}=여기에입력</code>
                      <CopyButton text={`${key}=`} />
                    </div>
                  ))}
                </div>
              </div>

              <Button
                size="sm"
                variant="outline"
                className="text-xs h-7"
                onClick={() => window.open(provider.consoleUrl, '_blank')}
              >
                {provider.name} 개발자 콘솔 열기 →
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
