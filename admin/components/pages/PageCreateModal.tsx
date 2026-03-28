'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const schema = z.object({
  title: z.string().min(1, '제목을 입력해주세요.'),
  slug: z
    .string()
    .min(1, '슬러그를 입력해주세요.')
    .regex(/^[a-z0-9-]+$/, '영문 소문자, 숫자, 하이픈만 사용 가능합니다.'),
});

type FormValues = z.infer<typeof schema>;

interface PageCreateModalProps {
  isOpen: boolean;
  isLoading?: boolean;
  onSubmit: (data: FormValues) => void;
  onCancel: () => void;
}

export function PageCreateModal({ isOpen, isLoading = false, onSubmit, onCancel }: PageCreateModalProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const title = watch('title', '');

  // 제목 입력 시 슬러그 자동 생성
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const slug = value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    setValue('slug', slug, { shouldValidate: true });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg border p-6 w-full max-w-md shadow-lg">
        <h3 className="text-lg font-semibold mb-4">새 페이지 만들기</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="title">페이지 제목</Label>
            <Input
              id="title"
              placeholder="홈, 소개, 서비스..."
              {...register('title', { onChange: handleTitleChange })}
            />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="slug">슬러그 (URL)</Label>
            <div className="flex items-center gap-1">
              <span className="text-sm text-muted-foreground">/</span>
              <Input id="slug" placeholder="home, about, services..." {...register('slug')} />
            </div>
            {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              취소
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? '생성 중...' : '페이지 만들기'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
