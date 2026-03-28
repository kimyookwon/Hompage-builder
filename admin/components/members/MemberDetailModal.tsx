'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User } from '@/types';
import { X } from 'lucide-react';

interface MemberDetailModalProps {
  member: User | null;
  isOpen: boolean;
  onClose: () => void;
}

export function MemberDetailModal({ member, isOpen, onClose }: MemberDetailModalProps) {
  if (!isOpen || !member) return null;

  const providerLabel: Record<string, string> = {
    google: 'Google',
    kakao: 'Kakao',
    naver: 'Naver',
  };

  const rows: { label: string; value: React.ReactNode }[] = [
    { label: 'ID', value: member.id },
    { label: '이메일', value: member.email },
    { label: '이름', value: member.name },
    {
      label: '소셜 로그인',
      value: member.oauthProvider ? (
        <Badge variant="outline">{providerLabel[member.oauthProvider] ?? member.oauthProvider}</Badge>
      ) : (
        <span className="text-muted-foreground text-sm">자체 계정</span>
      ),
    },
    {
      label: '역할',
      value: (
        <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
          {member.role}
        </Badge>
      ),
    },
    {
      label: '상태',
      value: (
        <Badge variant={member.status === 'active' ? 'default' : 'destructive'}>
          {member.status === 'active' ? '활성' : '차단'}
        </Badge>
      ),
    },
    {
      label: '가입일',
      value: new Date(member.createdAt).toLocaleString('ko-KR'),
    },
    {
      label: '수정일',
      value: new Date(member.updatedAt).toLocaleString('ko-KR'),
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-background rounded-lg shadow-xl w-full max-w-md mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold">회원 상세 정보</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X size={18} />
          </Button>
        </div>

        <dl className="space-y-3">
          {rows.map(({ label, value }) => (
            <div key={label} className="flex items-start gap-4">
              <dt className="w-24 shrink-0 text-sm text-muted-foreground">{label}</dt>
              <dd className="text-sm">{value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-6 flex justify-end">
          <Button variant="outline" onClick={onClose}>닫기</Button>
        </div>
      </div>
    </div>
  );
}
