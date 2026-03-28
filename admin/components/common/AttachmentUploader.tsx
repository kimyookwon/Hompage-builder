'use client';

import { useRef, useState } from 'react';
import { api } from '@/lib/api';
import { PostAttachment } from '@/types';

interface Props {
  postId: number;
  attachments: PostAttachment[];
  canDelete: boolean;
  onAdded: (attachment: PostAttachment) => void;
  onDeleted: (id: number) => void;
}

/** 파일 크기를 읽기 쉬운 단위로 변환 */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** 파일 아이콘 결정 */
function fileIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType === 'application/pdf') return '📄';
  if (mimeType.includes('word')) return '📝';
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📋';
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) return '🗜️';
  if (mimeType.startsWith('video/')) return '🎥';
  if (mimeType === 'text/plain') return '📃';
  return '📎';
}

export default function AttachmentUploader({
  postId,
  attachments,
  canDelete,
  onAdded,
  onDeleted,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleUpload = async (files: FileList) => {
    for (const file of Array.from(files)) {
      if (file.size > 20 * 1024 * 1024) {
        alert(`${file.name}: 파일 크기는 20MB 이하여야 합니다.`);
        continue;
      }
      setUploading(true);
      try {
        const fd = new FormData();
        fd.append('file', file);
        const res = await api.upload<PostAttachment>(`/posts/${postId}/attachments`, fd);
        onAdded(res.data);
      } catch (e: unknown) {
        alert(`${file.name}: ${e instanceof Error ? e.message : '업로드 실패'}`);
      } finally {
        setUploading(false);
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = async (id: number) => {
    if (!confirm('첨부파일을 삭제하시겠습니까?')) return;
    setDeletingId(id);
    try {
      await api.delete(`/attachments/${id}`);
      onDeleted(id);
    } catch {
      alert('삭제에 실패했습니다.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-2">
      {/* 첨부파일 목록 */}
      {attachments.length > 0 && (
        <ul className="border rounded-lg divide-y">
          {attachments.map((att) => (
            <li key={att.id} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 transition-colors">
              <span className="text-lg shrink-0">{fileIcon(att.mimeType)}</span>
              <div className="flex-1 min-w-0">
                <a
                  href={att.fileUrl}
                  download={att.fileName}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline truncate block"
                >
                  {att.fileName}
                </a>
                <span className="text-xs text-gray-400">{formatBytes(att.fileSize)}</span>
              </div>
              {canDelete && (
                <button
                  type="button"
                  onClick={() => handleDelete(att.id)}
                  disabled={deletingId === att.id}
                  className="shrink-0 text-xs text-red-400 hover:text-red-600 disabled:opacity-40 transition-colors"
                >
                  {deletingId === att.id ? '삭제 중...' : '삭제'}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* 업로드 버튼 */}
      {canDelete && (
        <div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs border rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {uploading ? (
              <>
                <span className="w-3.5 h-3.5 rounded-full border-2 border-gray-400 border-t-transparent animate-spin" />
                업로드 중...
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                파일 첨부
              </>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => { if (e.target.files?.length) handleUpload(e.target.files); }}
          />
          <p className="text-xs text-gray-400 mt-1">최대 20MB · 이미지, PDF, Word, Excel, ZIP 등</p>
        </div>
      )}
    </div>
  );
}
