'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Board } from '@/types';
import { DeleteConfirmModal } from '@/components/common/DeleteConfirmModal';
import { Pencil, Trash2, List, ExternalLink, ChevronUp, ChevronDown } from 'lucide-react';

interface BoardListTableProps {
  boards: Board[];
  onEdit: (board: Board) => void;
  onDelete: (id: number) => Promise<void>;
  onMove?: (id: number, direction: 'up' | 'down') => Promise<void>;
}

const permissionLabel: Record<string, string> = {
  public: '전체 공개', user: '로그인 사용자', admin_only: '관리자만',
};

export function BoardListTable({ boards, onEdit, onDelete, onMove }: BoardListTableProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    await onDelete(deletingId);
    setIsDeleting(false);
    setDeletingId(null);
  };

  if (boards.length === 0) {
    return <p className="text-center py-12 text-muted-foreground">게시판이 없습니다.</p>;
  }

  return (
    <>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              {onMove && <th className="px-2 py-3 text-center font-medium w-16">순서</th>}
              <th className="px-4 py-3 text-left font-medium">게시판명</th>
              <th className="px-4 py-3 text-left font-medium">타입</th>
              <th className="px-4 py-3 text-left font-medium">읽기</th>
              <th className="px-4 py-3 text-left font-medium">쓰기</th>
              <th className="px-4 py-3 text-left font-medium">게시글</th>
              <th className="px-4 py-3 text-right font-medium">작업</th>
            </tr>
          </thead>
          <tbody>
            {boards.map((board) => (
              <tr key={board.id} className="border-b last:border-0 hover:bg-muted/30">
                {onMove && (
                  <td className="px-2 py-3">
                    <div className="flex flex-col items-center gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        disabled={board.id === boards[0].id}
                        onClick={() => onMove(board.id, 'up')}
                        title="위로"
                      >
                        <ChevronUp size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        disabled={board.id === boards[boards.length - 1].id}
                        onClick={() => onMove(board.id, 'down')}
                        title="아래로"
                      >
                        <ChevronDown size={14} />
                      </Button>
                    </div>
                  </td>
                )}
                <td className="px-4 py-3">
                  <p className="font-medium">{board.name}</p>
                  {board.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 max-w-xs truncate">{board.description}</p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className="capitalize">{board.type}</Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{permissionLabel[board.readPermission ?? ''] ?? board.readPermission}</td>
                <td className="px-4 py-3 text-muted-foreground">{permissionLabel[board.writePermission ?? ''] ?? board.writePermission}</td>
                <td className="px-4 py-3">{(board.postCount ?? 0).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 justify-end">
                    <Link href={`/admin/boards/${board.id}/posts`}>
                      <Button variant="ghost" size="icon" title="게시글 보기"><List size={15} /></Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="공개 게시판 보기"
                      onClick={() => window.open(`/b/${board.id}`, '_blank')}
                    >
                      <ExternalLink size={15} />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onEdit(board)} title="수정"><Pencil size={15} /></Button>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeletingId(board.id)} title="삭제"><Trash2 size={15} /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <DeleteConfirmModal
        isOpen={deletingId !== null}
        title="게시판을 삭제하시겠습니까?"
        description="게시판과 모든 게시글/댓글이 삭제됩니다."
        isLoading={isDeleting}
        onConfirm={handleConfirm}
        onCancel={() => setDeletingId(null)}
      />
    </>
  );
}
