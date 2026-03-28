'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { User } from '@/types';
import { DeleteConfirmModal } from '@/components/common/DeleteConfirmModal';

interface MemberTableProps {
  members: User[];
  onRoleChange: (id: number, role: string) => Promise<void>;
  onStatusChange: (id: number, status: string) => Promise<void>;
  onRowClick?: (member: User) => void;
}

export function MemberTable({ members, onRoleChange, onStatusChange, onRowClick }: MemberTableProps) {
  const [pending, setPending] = useState<{ id: number; field: string; value: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirm = async () => {
    if (!pending) return;
    setIsProcessing(true);
    if (pending.field === 'role') await onRoleChange(pending.id, pending.value);
    else await onStatusChange(pending.id, pending.value);
    setIsProcessing(false);
    setPending(null);
  };

  if (members.length === 0) {
    return <p className="text-center py-12 text-muted-foreground">회원이 없습니다.</p>;
  }

  const providerLabel = (provider: string | null) => {
    if (!provider) return null;
    const map: Record<string, string> = { google: 'Google', kakao: 'Kakao', naver: 'Naver' };
    return map[provider] ?? provider;
  };

  return (
    <>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">이메일</th>
              <th className="px-4 py-3 text-left font-medium">이름</th>
              <th className="px-4 py-3 text-left font-medium">소셜</th>
              <th className="px-4 py-3 text-left font-medium">역할</th>
              <th className="px-4 py-3 text-left font-medium">상태</th>
              <th className="px-4 py-3 text-left font-medium">가입일</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr
                key={member.id}
                className="border-b last:border-0 hover:bg-muted/30 cursor-pointer"
                onClick={() => onRowClick?.(member)}
              >
                <td className="px-4 py-3">{member.email}</td>
                <td className="px-4 py-3">{member.name}</td>
                <td className="px-4 py-3">
                  {providerLabel(member.oauthProvider ?? null) && (
                    <Badge variant="outline" className="text-xs">
                      {providerLabel(member.oauthProvider ?? null)}
                    </Badge>
                  )}
                </td>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <select
                    value={member.role}
                    onChange={(e) => setPending({ id: member.id, field: 'role', value: e.target.value })}
                    className="border rounded px-2 py-1 text-xs bg-background"
                  >
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <select
                    value={member.status}
                    onChange={(e) => setPending({ id: member.id, field: 'status', value: e.target.value })}
                    className="border rounded px-2 py-1 text-xs bg-background"
                  >
                    <option value="active">active</option>
                    <option value="blocked">blocked</option>
                  </select>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(member.createdAt).toLocaleDateString('ko-KR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <DeleteConfirmModal
        isOpen={pending !== null}
        title="변경하시겠습니까?"
        description={`${pending?.field === 'role' ? '역할' : '상태'}을 "${pending?.value}"으로 변경합니다.`}
        isLoading={isProcessing}
        onConfirm={handleConfirm}
        onCancel={() => setPending(null)}
      />
    </>
  );
}
