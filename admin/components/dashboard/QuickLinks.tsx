import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus, MessageSquare, Users } from 'lucide-react';

export function QuickLinks() {
  return (
    <div className="flex flex-wrap gap-3">
      <Link href="/admin/pages?create=true">
        <Button variant="outline" size="sm">
          <Plus size={14} className="mr-1" /> 새 페이지
        </Button>
      </Link>
      <Link href="/admin/boards">
        <Button variant="outline" size="sm">
          <MessageSquare size={14} className="mr-1" /> 게시판 관리
        </Button>
      </Link>
      <Link href="/admin/members">
        <Button variant="outline" size="sm">
          <Users size={14} className="mr-1" /> 회원 조회
        </Button>
      </Link>
    </div>
  );
}
