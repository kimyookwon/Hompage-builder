'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Board } from '@/types';

const schema = z.object({
  name: z.string().min(1, '게시판 이름을 입력해주세요.'),
  description: z.string().max(200, '200자 이내로 입력해주세요.').optional(),
  type: z.enum(['general', 'gallery']),
  read_permission: z.enum(['admin_only', 'user', 'public']),
  write_permission: z.enum(['admin_only', 'user']),
});

type FormValues = z.infer<typeof schema>;

interface BoardFormModalProps {
  isOpen: boolean;
  board?: Board | null;
  isLoading?: boolean;
  onSubmit: (data: FormValues) => void;
  onCancel: () => void;
}

export function BoardFormModal({ isOpen, board, isLoading = false, onSubmit, onCancel }: BoardFormModalProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: board?.name ?? '',
      description: board?.description ?? '',
      type: (board?.type as 'general' | 'gallery') ?? 'general',
      read_permission: (board?.readPermission as 'admin_only' | 'user' | 'public') ?? 'user',
      write_permission: (board?.writePermission as 'admin_only' | 'user') ?? 'user',
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg border p-6 w-full max-w-md shadow-lg">
        <h3 className="text-lg font-semibold mb-4">{board ? '게시판 수정' : '게시판 만들기'}</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label>게시판 이름</Label>
            <Input {...register('name')} placeholder="자유게시판, 공지사항..." />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-1">
            <Label>게시판 설명 <span className="text-muted-foreground font-normal text-xs">(선택)</span></Label>
            <textarea
              {...register('description')}
              placeholder="게시판에 대한 간단한 설명을 입력하세요."
              rows={2}
              className="w-full border rounded-md px-3 py-2 text-sm bg-background resize-none outline-none focus:ring-2 focus:ring-ring"
            />
            {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
          </div>

          <div className="space-y-1">
            <Label>타입</Label>
            <select {...register('type')} className="w-full border rounded-md px-3 py-2 text-sm bg-background">
              <option value="general">일반</option>
              <option value="gallery">갤러리</option>
            </select>
          </div>

          <div className="space-y-1">
            <Label>읽기 권한</Label>
            <select {...register('read_permission')} className="w-full border rounded-md px-3 py-2 text-sm bg-background">
              <option value="public">전체 공개</option>
              <option value="user">로그인 사용자</option>
              <option value="admin_only">관리자만</option>
            </select>
          </div>

          <div className="space-y-1">
            <Label>쓰기 권한</Label>
            <select {...register('write_permission')} className="w-full border rounded-md px-3 py-2 text-sm bg-background">
              <option value="user">로그인 사용자</option>
              <option value="admin_only">관리자만</option>
            </select>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>취소</Button>
            <Button type="submit" disabled={isLoading}>{isLoading ? '저장 중...' : '저장'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
