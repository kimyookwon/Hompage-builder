'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { MarkdownEditor } from '@/components/common/MarkdownEditor';
import { Board, Post } from '@/types';

interface MediaAsset {
  id: number;
  file_url: string;
}

export default function NewPostPage() {
  const { boardId } = useParams<{ boardId: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);

  const [board, setBoard] = useState<Board | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; content?: string }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 비로그인 시 로그인 페이지로
  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) {
      sessionStorage.setItem('redirect_after_login', `/b/${boardId}/new`);
      router.replace('/login');
      return;
    }

    api.get<Board>(`/boards/${boardId}`).then((res) => {
      setBoard(res.data);
      // 쓰기 권한 체크
      if (res.data.writePermission === 'admin_only' && user.role !== 'admin') {
        router.replace(`/b/${boardId}`);
      }
    }).catch(() => {
      router.replace(`/b/${boardId}`);
    });
  }, [hasHydrated, user, boardId, router]);

  const validate = () => {
    const e: { title?: string; content?: string } = {};
    if (!title.trim()) e.title = '제목을 입력해주세요.';
    if (!content.trim()) e.content = '내용을 입력해주세요.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleThumbnailUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.upload<MediaAsset>('/media/upload', formData);
      setThumbnailUrl(res.data.file_url);
    } catch {
      alert('이미지 업로드에 실패했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const body: Record<string, string> = { title, content };
      if (thumbnailUrl) body.thumbnail_url = thumbnailUrl;
      const res = await api.post<Post>(`/boards/${boardId}/posts`, body);
      router.push(`/b/${boardId}/${res.data.id}`);
    } catch {
      alert('게시글 작성에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!hasHydrated || !user) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => router.push(`/b/${boardId}`)}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← {board?.name || '게시판'} 목록
        </button>
      </div>

      <h1 className="text-xl font-bold text-gray-900 mb-6">새 게시글 작성</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 제목 */}
        <div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목을 입력하세요"
            className={`w-full px-4 py-3 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
              errors.title ? 'border-red-400' : 'border-gray-300'
            }`}
          />
          {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
        </div>

        {/* 갤러리 게시판: 썸네일 업로드 */}
        {board?.type === 'gallery' && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1.5">썸네일 이미지</p>
            {thumbnailUrl ? (
              <div className="relative h-40 rounded-lg overflow-hidden border bg-gray-50">
                <Image src={thumbnailUrl} alt="썸네일" fill className="object-cover" unoptimized />
                <button
                  type="button"
                  onClick={() => setThumbnailUrl('')}
                  className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="h-40 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-colors"
              >
                {isUploading ? (
                  <div className="h-5 w-5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                ) : (
                  <>
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <p className="text-xs text-gray-500">클릭하여 이미지 업로드<br /><span className="opacity-60">JPEG · PNG · WebP</span></p>
                  </>
                )}
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleThumbnailUpload(f); e.target.value = ''; }}
            />
          </div>
        )}

        {/* 내용 */}
        <div>
          <MarkdownEditor
            value={content}
            onChange={setContent}
            placeholder="내용을 입력하세요 (마크다운 지원)"
            rows={16}
            error={errors.content}
          />
        </div>

        {/* 버튼 */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() => router.push(`/b/${boardId}`)}
            className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {submitting ? '작성 중...' : '게시글 등록'}
          </button>
        </div>
      </form>
    </div>
  );
}
