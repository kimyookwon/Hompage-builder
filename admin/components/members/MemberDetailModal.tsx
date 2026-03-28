'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { User } from '@/types';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface MemberDetailModalProps {
  member: User | null;
  isOpen: boolean;
  onClose: () => void;
}

export function MemberDetailModal({ member, isOpen, onClose }: MemberDetailModalProps) {
  const [newPassword, setNewPassword] = useState('');
  const [pwResetError, setPwResetError] = useState('');
  const [pwResetSuccess, setPwResetSuccess] = useState('');
  const [resettingPw, setResettingPw] = useState(false);

  // 모달 닫힐 때 비밀번호 입력 초기화
  useEffect(() => {
    if (!isOpen) {
      setNewPassword('');
      setPwResetError('');
      setPwResetSuccess('');
    }
  }, [isOpen]);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwResetError('');
    setPwResetSuccess('');
    if (newPassword.length < 8) {
      setPwResetError('비밀번호는 8자 이상이어야 합니다.');
      return;
    }
    setResettingPw(true);
    try {
      await api.patch(`/users/${member!.id}/password`, { new_password: newPassword });
      setPwResetSuccess('비밀번호가 초기화되었습니다.');
      setNewPassword('');
    } catch (e: unknown) {
      setPwResetError(e instanceof Error ? e.message : '초기화에 실패했습니다.');
    } finally {
      setResettingPw(false);
    }
  };

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

        {/* 비밀번호 초기화 */}
        <div className="pt-4 border-t mt-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">비밀번호 초기화</h3>
          <form onSubmit={handlePasswordReset} className="flex gap-2">
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="새 비밀번호 (8자 이상)"
              className="flex-1 border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={resettingPw}
              className="px-3 py-2 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors whitespace-nowrap"
            >
              {resettingPw ? '처리 중...' : '초기화'}
            </button>
          </form>
          {pwResetError && <p className="text-xs text-red-500 mt-1">{pwResetError}</p>}
          {pwResetSuccess && <p className="text-xs text-green-600 mt-1">{pwResetSuccess}</p>}
        </div>

        <div className="mt-4 flex justify-end">
          <Button variant="outline" onClick={onClose}>닫기</Button>
        </div>
      </div>
    </div>
  );
}
