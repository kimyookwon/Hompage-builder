'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface GtmCodeInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function GtmCodeInput({ value, onChange }: GtmCodeInputProps) {
  return (
    <div className="space-y-2">
      <Label>Google Tag Manager 코드</Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="GTM-XXXXXXX"
        className="font-mono"
      />
      <p className="text-xs text-muted-foreground">
        GTM 컨테이너 ID를 입력하면 모든 공개 페이지에 GTM 스크립트가 삽입됩니다.
      </p>
    </div>
  );
}
