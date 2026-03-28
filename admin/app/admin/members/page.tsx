'use client';

import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { MemberTable } from '@/components/members/MemberTable';
import { MemberSearchFilter } from '@/components/members/MemberSearchFilter';
import { MemberDetailModal } from '@/components/members/MemberDetailModal';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { User, PaginatedResponse } from '@/types';
import { useAppStore } from '@/stores/appStore';

const LIMIT = 20;

export default function MembersPage() {
  const [members, setMembers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [detailMember, setDetailMember] = useState<User | null>(null);
  const addToast = useAppStore((s) => s.addToast);

  const fetchMembers = async (currentPage = page) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(currentPage), limit: String(LIMIT) });
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      const res = await api.get<PaginatedResponse<User>['data']>(`/users?${params}`);
      setMembers(res.data.items);
      setTotal(res.data.pagination.total);
    } catch {
      addToast('회원 목록을 불러오지 못했습니다.', 'destructive');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchMembers(); }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchMembers(1);
  };

  const handleRoleChange = async (id: number, role: string) => {
    try {
      const res = await api.patch<User>(`/users/${id}/role`, { role });
      setMembers((prev) => prev.map((m) => (m.id === id ? res.data : m)));
      addToast('역할이 변경되었습니다.');
    } catch {
      addToast('역할 변경에 실패했습니다.', 'destructive');
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    try {
      const res = await api.patch<User>(`/users/${id}/status`, { status });
      setMembers((prev) => prev.map((m) => (m.id === id ? res.data : m)));
      addToast('상태가 변경되었습니다.');
    } catch {
      addToast('상태 변경에 실패했습니다.', 'destructive');
    }
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">회원 관리</h1>
          <p className="text-muted-foreground text-sm">총 {total}명</p>
        </div>

        <MemberSearchFilter
          search={search}
          statusFilter={statusFilter}
          onSearchChange={setSearch}
          onStatusChange={(v) => { setStatusFilter(v); setPage(1); fetchMembers(1); }}
          onSearch={handleSearch}
        />

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">불러오는 중...</div>
        ) : (
          <MemberTable members={members} onRoleChange={handleRoleChange} onStatusChange={handleStatusChange} onRowClick={setDetailMember} />
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => { setPage(page - 1); fetchMembers(page - 1); }}>이전</Button>
            <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => { setPage(page + 1); fetchMembers(page + 1); }}>다음</Button>
          </div>
        )}
      </div>
      <MemberDetailModal
        member={detailMember}
        isOpen={detailMember !== null}
        onClose={() => setDetailMember(null)}
      />
    </AdminLayout>
  );
}
