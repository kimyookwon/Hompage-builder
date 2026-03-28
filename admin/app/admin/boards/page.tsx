'use client';

import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { BoardListTable } from '@/components/boards/BoardListTable';
import { BoardFormModal } from '@/components/boards/BoardFormModal';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { Board } from '@/types';
import { useAppStore } from '@/stores/appStore';
import { Plus } from 'lucide-react';

export default function BoardsPage() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBoard, setEditingBoard] = useState<Board | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const addToast = useAppStore((s) => s.addToast);

  const fetchBoards = async () => {
    try {
      const res = await api.get<Board[]>('/boards');
      setBoards(res.data);
    } catch {
      addToast('게시판 목록을 불러오지 못했습니다.', 'destructive');
    }
  };

  useEffect(() => { fetchBoards(); }, []);

  const handleSubmit = async (data: { name: string; description?: string; type: string; read_permission: string; write_permission: string }) => {
    setIsSaving(true);
    try {
      if (editingBoard) {
        const res = await api.patch<Board>(`/boards/${editingBoard.id}`, data);
        setBoards((prev) => prev.map((b) => (b.id === editingBoard.id ? res.data : b)));
        addToast('게시판이 수정되었습니다.');
      } else {
        await api.post('/boards', data);
        addToast('게시판이 생성되었습니다.');
        fetchBoards();
      }
      setIsFormOpen(false);
      setEditingBoard(null);
    } catch (err) {
      addToast(err instanceof Error ? err.message : '저장에 실패했습니다.', 'destructive');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/boards/${id}`);
      setBoards((prev) => prev.filter((b) => b.id !== id));
      addToast('게시판이 삭제되었습니다.');
    } catch {
      addToast('게시판 삭제에 실패했습니다.', 'destructive');
    }
  };

  const handleMove = async (id: number, direction: 'up' | 'down') => {
    try {
      const res = await api.patch<Board[]>(`/boards/${id}/move`, { direction });
      setBoards(res.data);
    } catch {
      addToast('순서 변경에 실패했습니다.', 'destructive');
    }
  };

  const handleEdit = (board: Board) => {
    setEditingBoard(board);
    setIsFormOpen(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">게시판 관리</h1>
            <p className="text-muted-foreground text-sm">총 {boards.length}개의 게시판</p>
          </div>
          <Button onClick={() => { setEditingBoard(null); setIsFormOpen(true); }}>
            <Plus size={16} className="mr-1" /> 새 게시판
          </Button>
        </div>

        <BoardListTable boards={boards} onEdit={handleEdit} onDelete={handleDelete} onMove={handleMove} />
      </div>

      <BoardFormModal
        isOpen={isFormOpen}
        board={editingBoard}
        isLoading={isSaving}
        onSubmit={handleSubmit}
        onCancel={() => { setIsFormOpen(false); setEditingBoard(null); }}
      />
    </AdminLayout>
  );
}
