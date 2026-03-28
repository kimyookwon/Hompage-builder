'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface MemberSearchFilterProps {
  search: string;
  statusFilter: string;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onSearch: (e: React.FormEvent) => void;
}

export function MemberSearchFilter({
  search,
  statusFilter,
  onSearchChange,
  onStatusChange,
  onSearch,
}: MemberSearchFilterProps) {
  return (
    <div className="flex flex-wrap gap-3">
      <form onSubmit={onSearch} className="flex gap-2">
        <Input
          placeholder="이름 또는 이메일 검색..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-56"
        />
        <Button type="submit" variant="outline" size="icon">
          <Search size={16} />
        </Button>
      </form>
      <select
        value={statusFilter}
        onChange={(e) => onStatusChange(e.target.value)}
        className="border rounded-md px-3 py-2 text-sm bg-background"
      >
        <option value="">전체 상태</option>
        <option value="active">활성</option>
        <option value="blocked">차단</option>
      </select>
    </div>
  );
}
