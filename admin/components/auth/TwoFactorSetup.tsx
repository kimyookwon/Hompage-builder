'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';

// 2FA 설정 단계
type SetupStep = 'loading' | 'qr' | 'confirming' | 'done';

interface SetupData {
  secret: string;
  uri: string;
}

interface TwoFactorSetupProps {
  onSuccess: () => void;
}

export function TwoFactorSetup({ onSuccess }: TwoFactorSetupProps) {
  const [step, setStep] = useState<SetupStep>('loading');
  const [setupData, setSetupData] = useState<SetupData | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // QR 코드 로드 (컴포넌트 마운트 시 자동 실행하지 않고 버튼으로 시작)
  const handleStart = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await api.post<SetupData>('/auth/2fa/setup', {});
      setSetupData(res.data);
      setStep('qr');
    } catch (e) {
      setError(e instanceof Error ? e.message : '2FA 설정을 시작할 수 없습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 6자리 코드 확인 → 2FA 활성화
  const handleConfirm = async () => {
    if (code.length !== 6) {
      setError('6자리 코드를 입력해주세요.');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      await api.post('/auth/2fa/confirm', { code });
      setStep('done');
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : '코드 확인에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  // secret 키를 4자리씩 공백으로 나눠 가독성 향상
  const formatSecret = (secret: string) =>
    secret.match(/.{1,4}/g)?.join(' ') ?? secret;

  if (step === 'loading') {
    return (
      <div className="border rounded-xl p-6 space-y-4 bg-blue-50">
        <p className="text-sm text-gray-600">
          Google Authenticator 또는 Authy 앱을 준비해주세요.
        </p>
        {error && (
          <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
            {error}
          </p>
        )}
        <Button onClick={handleStart} disabled={isLoading} size="sm">
          {isLoading ? '로딩 중...' : 'QR 코드 생성'}
        </Button>
      </div>
    );
  }

  if (step === 'qr' && setupData) {
    return (
      <div className="border rounded-xl p-6 space-y-5 bg-blue-50">
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-700">
            1. Google Authenticator 앱에서 QR 코드를 스캔하세요.
          </p>
          <p className="text-xs text-gray-500">
            앱에서 + 버튼 → QR 코드 스캔
          </p>
        </div>

        {/* QR 코드 */}
        <div className="flex justify-center bg-white p-4 rounded-lg border w-fit mx-auto">
          <QRCodeSVG value={setupData.uri} size={180} />
        </div>

        {/* 직접 입력용 시크릿 */}
        <div className="space-y-1">
          <p className="text-xs text-gray-500">
            또는 앱에서 코드를 직접 입력:
          </p>
          <code className="block bg-white border rounded px-3 py-2 text-sm font-mono tracking-widest text-center select-all">
            {formatSecret(setupData.secret)}
          </code>
        </div>

        <div className="border-t pt-4 space-y-3">
          <p className="text-sm font-medium text-gray-700">
            2. 앱에 표시된 6자리 코드를 입력하세요.
          </p>
          <div className="space-y-1">
            <Label htmlFor="totp-code">인증 코드</Label>
            <Input
              id="totp-code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              className="text-center tracking-widest text-lg font-mono w-40"
            />
          </div>
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
              {error}
            </p>
          )}
          <Button onClick={handleConfirm} disabled={isLoading || code.length !== 6} size="sm">
            {isLoading ? '확인 중...' : '2FA 활성화'}
          </Button>
        </div>
      </div>
    );
  }

  if (step === 'done') {
    return (
      <div className="border border-green-200 rounded-xl p-6 bg-green-50">
        <p className="text-sm text-green-700 font-medium">
          2FA가 성공적으로 활성화되었습니다.
        </p>
      </div>
    );
  }

  return null;
}
