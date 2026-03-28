'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { api } from '@/lib/api';
import { formatDateTime } from '@/lib/date';
import { PostContent } from '@/lib/post-content';
import { MarkdownEditor } from '@/components/common/MarkdownEditor';
import { TagInput } from '@/components/common/TagInput';
import { useAuthStore } from '@/stores/authStore';
import { Post, Comment, Board, AdjacentPost, PostAttachment } from '@/types';
import AttachmentUploader from '@/components/common/AttachmentUploader';

interface MediaAsset { id: number; file_url: string; }

export default function PublicPostPage() {
  const { boardId, postId } = useParams<{ boardId: string; postId: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);

  const [post, setPost] = useState<Post | null>(null);
  const [board, setBoard] = useState<Board | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // 댓글 수정 모드
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [savingComment, setSavingComment] = useState(false);

  // 대댓글 작성 모드
  const [replyingToId, setReplyingToId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  // 좋아요
  const [likeCount, setLikeCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [likingPost, setLikingPost] = useState(false);

  // 북마크
  const [bookmarked, setBookmarked] = useState(false);
  const [bookmarking, setBookmarking] = useState(false);

  // 이전/다음 게시글
  const [prevPost, setPrevPost] = useState<AdjacentPost | null>(null);
  const [nextPost, setNextPost] = useState<AdjacentPost | null>(null);

  // 첨부파일
  const [attachments, setAttachments] = useState<PostAttachment[]>([]);

  // 공유
  const [copied, setCopied] = useState(false);

  // 댓글 신고
  const [reportingCommentId, setReportingCommentId] = useState<number | null>(null);
  const [reportReason, setReportReason] = useState<'spam' | 'abuse' | 'inappropriate' | 'other'>('spam');
  const [submittingReport, setSubmittingReport] = useState(false);
  const [reportedIds, setReportedIds] = useState<Set<number>>(new Set());

  // 수정 모드
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editThumbnail, setEditThumbnail] = useState('');
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editErrors, setEditErrors] = useState<{ title?: string; content?: string }>({});
  const [savingEdit, setSavingEdit] = useState(false);
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  const fetchPost = useCallback(async () => {
    try {
      const res = await api.get<Post>(`/posts/${postId}`);
      setPost(res.data);
      setLikeCount(res.data.likeCount ?? 0);
      setLiked(res.data.liked ?? false);
      setBookmarked(res.data.bookmarked ?? false);
      setPrevPost(res.data.prevPost ?? null);
      setNextPost(res.data.nextPost ?? null);
      setAttachments(res.data.attachments ?? []);
      // 게시판 타입 확인 (갤러리 여부)
      api.get<Board>(`/boards/${res.data.boardId}`).then((r) => setBoard(r.data)).catch(() => {});
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '';
      if (msg.includes('로그인')) setError('로그인이 필요한 게시판입니다.');
      else if (msg.includes('권한')) setError('접근 권한이 없습니다.');
      else setError('게시글을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }, [postId]);

  const fetchComments = useCallback(async () => {
    try {
      const res = await api.get<Comment[]>(`/posts/${postId}/comments`);
      setComments(res.data);
    } catch {
      // 댓글 로드 실패는 조용히 처리
    }
  }, [postId]);

  useEffect(() => {
    if (!hasHydrated) return;
    fetchPost();
    fetchComments();
  }, [hasHydrated, fetchPost, fetchComments]);

  const handleLike = async () => {
    if (!user) {
      sessionStorage.setItem('redirect_after_login', `/b/${boardId}/${postId}`);
      router.push('/login');
      return;
    }
    setLikingPost(true);
    try {
      const res = await api.post<{ liked: boolean; likeCount: number }>(`/posts/${postId}/like`, {});
      setLiked(res.data.liked);
      setLikeCount(res.data.likeCount);
    } catch {
      // 조용히 처리
    } finally {
      setLikingPost(false);
    }
  };

  const handleBookmark = async () => {
    if (!user) {
      sessionStorage.setItem('redirect_after_login', `/b/${boardId}/${postId}`);
      router.push('/login');
      return;
    }
    if (bookmarking) return;
    setBookmarking(true);
    try {
      const res = await api.post<{ bookmarked: boolean }>(`/posts/${postId}/bookmark`, {});
      setBookmarked(res.data.bookmarked);
    } catch {
      // 조용히 처리
    } finally {
      setBookmarking(false);
    }
  };

  const handleEditStart = () => {
    if (!post) return;
    setEditTitle(post.title);
    setEditContent(post.content);
    setEditThumbnail(post.thumbnailUrl ?? '');
    setEditTags(post.tags?.map((t) => t.name) ?? []);
    setEditErrors({});
    setIsEditing(true);
  };

  const handleThumbUpload = async (file: File) => {
    setUploadingThumb(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.upload<MediaAsset>('/media/upload', fd);
      setEditThumbnail(res.data.file_url);
    } catch {
      alert('이미지 업로드에 실패했습니다.');
    } finally {
      setUploadingThumb(false);
    }
  };


  const handleEditCancel = () => {
    setIsEditing(false);
    setEditErrors({});
  };

  const handleEditSave = async () => {
    const errors: { title?: string; content?: string } = {};
    if (!editTitle.trim()) errors.title = '제목을 입력해주세요.';
    if (!editContent.trim()) errors.content = '내용을 입력해주세요.';
    if (Object.keys(errors).length > 0) {
      setEditErrors(errors);
      return;
    }

    setSavingEdit(true);
    try {
      const body: Record<string, string | string[] | null> = {
        title: editTitle.trim(),
        content: editContent.trim(),
        tags: editTags,
      };
      if (board?.type === 'gallery') body.thumbnail_url = editThumbnail || null;
      const res = await api.patch<Post>(`/posts/${postId}`, body);
      setPost(res.data);
      setIsEditing(false);
    } catch (e: unknown) {
      setEditErrors({ content: e instanceof Error ? e.message : '저장에 실패했습니다.' });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('게시글을 삭제하시겠습니까?')) return;
    try {
      await api.delete(`/posts/${postId}`);
      router.push(`/b/${boardId}`);
    } catch {
      alert('삭제에 실패했습니다.');
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    if (!user) {
      sessionStorage.setItem('redirect_after_login', `/b/${boardId}/${postId}`);
      router.push('/login');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post<Comment>(`/posts/${postId}/comments`, { content: commentText });
      setComments((prev) => [...prev, res.data]);
      setCommentText('');
    } catch {
      alert('댓글 작성에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReplySubmit = async (parentId: number) => {
    if (!replyText.trim()) return;
    if (!user) {
      sessionStorage.setItem('redirect_after_login', `/b/${boardId}/${postId}`);
      router.push('/login');
      return;
    }
    setSubmittingReply(true);
    try {
      const res = await api.post<Comment>(`/posts/${postId}/comments`, {
        content: replyText,
        parent_id: parentId,
      });
      setComments((prev) => [...prev, res.data]);
      setReplyingToId(null);
      setReplyText('');
    } catch {
      alert('댓글 작성에 실패했습니다.');
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleCommentDelete = async (commentId: number) => {
    if (!confirm('댓글을 삭제하시겠습니까?')) return;
    try {
      await api.delete(`/comments/${commentId}`);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch {
      alert('삭제에 실패했습니다.');
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    // Web Share API 지원 시 네이티브 공유 시트
    if (navigator.share) {
      try {
        await navigator.share({ title: post?.title, url });
        return;
      } catch {
        // 취소 또는 미지원 — URL 복사로 폴백
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 클립보드 접근 실패 시 무시
    }
  };

  // 댓글 신고 핸들러
  const handleReport = async (commentId: number) => {
    if (!user) { router.push('/login'); return; }
    setSubmittingReport(true);
    try {
      await api.post(`/comments/${commentId}/report`, { reason: reportReason });
      setReportedIds((prev) => new Set([...prev, commentId]));
      setReportingCommentId(null);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : '신고 처리 중 오류가 발생했습니다.');
    } finally {
      setSubmittingReport(false);
    }
  };

  const handleCommentEditStart = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditingCommentText(comment.content);
  };

  const handleCommentEditCancel = () => {
    setEditingCommentId(null);
    setEditingCommentText('');
  };

  const handleCommentEditSave = async (commentId: number) => {
    if (!editingCommentText.trim()) return;
    setSavingComment(true);
    try {
      const res = await api.patch<Comment>(`/comments/${commentId}`, { content: editingCommentText });
      setComments((prev) => prev.map((c) => (c.id === commentId ? res.data : c)));
      setEditingCommentId(null);
      setEditingCommentText('');
    } catch {
      alert('수정에 실패했습니다.');
    } finally {
      setSavingComment(false);
    }
  };

  if (!hasHydrated || loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        {error.includes('로그인') && (
          <button
            onClick={() => router.push('/login')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
          >
            로그인하기
          </button>
        )}
      </div>
    );
  }

  if (!post) return null;

  const isAuthor = user && user.id === post.authorId;
  const isAdmin = user?.role === 'admin';
  const canEdit = isAuthor || isAdmin;

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* 뒤로가기 */}
      <Link
        href={`/b/${boardId}`}
        className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-6"
      >
        ← {post.boardName || '게시판'} 목록으로
      </Link>

      {/* 게시글 본문 */}
      <article className="border rounded-lg overflow-hidden">
        {isEditing ? (
          /* ── 수정 모드 ── */
          <div className="p-6 space-y-4">
            <div>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="제목"
                className={`w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 ${
                  editErrors.title ? 'border-red-400' : 'border-gray-300'
                }`}
              />
              {editErrors.title && <p className="text-xs text-red-500 mt-1">{editErrors.title}</p>}
            </div>
            {/* 갤러리 게시판: 썸네일 변경 */}
            {board?.type === 'gallery' && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1.5">썸네일 이미지</p>
                {editThumbnail ? (
                  <div className="relative h-36 rounded-lg overflow-hidden border bg-gray-50">
                    <Image src={editThumbnail} alt="썸네일" fill className="object-cover" unoptimized />
                    <button
                      type="button"
                      onClick={() => setEditThumbnail('')}
                      className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => thumbInputRef.current?.click()}
                    className="h-36 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-colors"
                  >
                    {uploadingThumb ? (
                      <div className="h-5 w-5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                    ) : (
                      <p className="text-xs text-gray-500">클릭하여 이미지 업로드</p>
                    )}
                  </div>
                )}
                <input
                  ref={thumbInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleThumbUpload(f); e.target.value = ''; }}
                />
              </div>
            )}

            <div>
              <MarkdownEditor
                value={editContent}
                onChange={setEditContent}
                placeholder="내용을 입력하세요 (마크다운 지원)"
                rows={14}
                error={editErrors.content}
              />
            </div>
            {/* 태그 수정 */}
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-700">태그</p>
              <TagInput value={editTags} onChange={setEditTags} placeholder="태그 입력 후 Enter (최대 10개)" />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={handleEditCancel}
                className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleEditSave}
                disabled={savingEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {savingEdit ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        ) : (
          /* ── 보기 모드 ── */
          <>
            <div className="px-6 py-5 border-b bg-gray-50">
              <h1 className="text-xl font-bold text-gray-900">{post.title}</h1>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <span>{post.authorName}</span>
                  <span>·</span>
                  <span>{formatDateTime(post.createdAt)}</span>
                  {post.updatedAt !== post.createdAt && (
                    <span className="text-xs text-gray-400">(수정됨)</span>
                  )}
                  <span className="text-xs text-gray-400">조회 {post.viewCount ?? 0}</span>
                </div>
                {canEdit && (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleEditStart}
                      className="text-xs text-blue-500 hover:text-blue-700 transition-colors"
                    >
                      수정
                    </button>
                    <button
                      onClick={handleDelete}
                      className="text-xs text-red-500 hover:text-red-700 transition-colors"
                    >
                      삭제
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 태그 목록 */}
            {post.tags && post.tags.length > 0 && (
              <div className="px-6 py-2 border-b flex flex-wrap gap-1.5">
                {post.tags.map((tag) => (
                  <Link
                    key={tag.id}
                    href={`/b/${boardId}?tag=${encodeURIComponent(tag.name)}`}
                    className="inline-flex items-center rounded-full bg-blue-50 text-blue-600 px-2.5 py-0.5 text-xs font-medium hover:bg-blue-100 transition-colors"
                  >
                    #{tag.name}
                  </Link>
                ))}
              </div>
            )}

            {/* 갤러리 게시판 썸네일 */}
            {board?.type === 'gallery' && post.thumbnailUrl && (
              <div className="px-6 pt-4">
                <div className="relative w-full rounded-lg overflow-hidden bg-gray-100" style={{ maxHeight: '480px' }}>
                  <Image
                    src={post.thumbnailUrl}
                    alt={post.title}
                    width={800}
                    height={480}
                    className="w-full h-auto object-contain"
                    unoptimized
                  />
                </div>
              </div>
            )}

            <div className="px-6 py-6 min-h-[200px]">
              <PostContent content={post.content} />
            </div>

            {/* 첨부파일 */}
            {(attachments.length > 0 || canEdit) && (
              <div className="px-6 pb-4 border-t pt-4">
                <p className="text-xs font-medium text-gray-500 mb-2">
                  첨부파일 {attachments.length > 0 ? `(${attachments.length})` : ''}
                </p>
                <AttachmentUploader
                  postId={post.id}
                  attachments={attachments}
                  canDelete={!!canEdit}
                  onAdded={(att) => setAttachments((prev) => [...prev, att])}
                  onDeleted={(id) => setAttachments((prev) => prev.filter((a) => a.id !== id))}
                />
                {/* 다운로드 링크 목록 — 다운로드 수 포함 */}
                {attachments.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {attachments.map((att) => (
                      <li key={att.id} className="flex items-center gap-2 text-sm">
                        <a
                          href={`/api/attachments/${att.id}/download`}
                          download={att.fileName}
                          className="text-blue-600 hover:underline truncate max-w-xs dark:text-blue-400"
                        >
                          {att.fileName}
                        </a>
                        <span className="text-xs text-gray-400 ml-auto shrink-0 dark:text-gray-500">
                          {att.downloadCount ?? 0}회 다운로드
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* 좋아요 + 공유 버튼 */}
            <div className="px-6 pb-5 flex items-center justify-center gap-3">
              <button
                onClick={handleLike}
                disabled={likingPost}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full border text-sm font-medium transition-all ${
                  liked
                    ? 'bg-red-50 border-red-300 text-red-500'
                    : 'bg-white border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-400 hover:bg-red-50'
                }`}
              >
                <svg
                  className={`w-4 h-4 transition-transform ${liked ? 'scale-110' : ''}`}
                  fill={liked ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span>좋아요 {likeCount > 0 ? likeCount : ''}</span>
              </button>

              {/* 북마크 버튼 */}
              <button
                onClick={handleBookmark}
                disabled={bookmarking}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                  bookmarked
                    ? 'bg-yellow-50 border-yellow-300 text-yellow-600'
                    : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                  fill={bookmarked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                </svg>
                {bookmarked ? '북마크됨' : '북마크'}
              </button>

              {/* 공유 버튼 */}
              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full border bg-white border-gray-200 text-gray-500 text-sm font-medium hover:bg-gray-50 hover:border-gray-300 transition-all"
              >
                {copied ? (
                  <>
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-green-500">복사됨</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    <span>공유</span>
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </article>

      {/* 이전/다음 게시글 네비게이션 */}
      {(prevPost || nextPost) && (
        <div className="mt-6 border rounded-lg divide-y overflow-hidden">
          {nextPost && (
            <Link
              href={`/b/${boardId}/${nextPost.id}`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group"
            >
              <span className="shrink-0 text-xs text-gray-400 w-10">다음글</span>
              <span className="flex-1 text-sm text-gray-700 group-hover:text-blue-600 truncate">{nextPost.title}</span>
              <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          )}
          {prevPost && (
            <Link
              href={`/b/${boardId}/${prevPost.id}`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group"
            >
              <span className="shrink-0 text-xs text-gray-400 w-10">이전글</span>
              <span className="flex-1 text-sm text-gray-700 group-hover:text-blue-600 truncate">{prevPost.title}</span>
              <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          )}
        </div>
      )}

      {/* 댓글 섹션 */}
      <section className="mt-8">
        <h2 className="text-base font-semibold text-gray-800 mb-4">
          댓글 {comments.length}개
        </h2>

        {/* 댓글 목록 */}
        {comments.length > 0 && (
          <div className="border rounded-lg divide-y mb-4">
            {/* 최상위 댓글만 렌더링, 각 댓글 아래 대댓글 표시 */}
            {comments.filter((c) => !c.parentId).map((comment) => {
              const replies = comments.filter((c) => c.parentId === comment.id);
              const isCommentAuthor = user && user.id === comment.authorId;
              const isEditingThis = editingCommentId === comment.id;
              const isReplyingHere = replyingToId === comment.id;

              return (
                <div key={comment.id}>
                  {/* 최상위 댓글 */}
                  <div className="px-4 py-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        {comment.authorAvatarUrl ? (
                          <Image
                            src={comment.authorAvatarUrl}
                            alt={comment.authorName}
                            width={24}
                            height={24}
                            className="w-6 h-6 rounded-full object-cover border shrink-0"
                            unoptimized
                          />
                        ) : (
                          <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-500 border shrink-0">
                            {comment.authorName.charAt(0).toUpperCase()}
                          </span>
                        )}
                        <span className="text-sm font-medium text-gray-800">{comment.authorName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">{formatDateTime(comment.createdAt)}</span>
                        {comment.updatedAt !== comment.createdAt && (
                          <span className="text-xs text-gray-400">(수정됨)</span>
                        )}
                        {/* 답글 버튼 — 수정 모드가 아닐 때만 */}
                        {!isEditingThis && (
                          <button
                            onClick={() => {
                              setReplyingToId(isReplyingHere ? null : comment.id);
                              setReplyText('');
                            }}
                            className="text-xs text-gray-400 hover:text-blue-500 transition-colors"
                          >
                            답글
                          </button>
                        )}
                        {isCommentAuthor && !isEditingThis && (
                          <button
                            onClick={() => handleCommentEditStart(comment)}
                            className="text-xs text-blue-400 hover:text-blue-600 transition-colors"
                          >
                            수정
                          </button>
                        )}
                        {(isCommentAuthor || isAdmin) && !isEditingThis && (
                          <button
                            onClick={() => handleCommentDelete(comment.id)}
                            className="text-xs text-red-400 hover:text-red-600 transition-colors"
                          >
                            삭제
                          </button>
                        )}
                        {/* 신고 버튼 — 본인 댓글 제외 */}
                        {user && user.id !== comment.authorId && !isEditingThis && (
                          <button
                            onClick={() => setReportingCommentId(reportingCommentId === comment.id ? null : comment.id)}
                            className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                          >
                            {reportedIds.has(comment.id) ? '신고됨' : '신고'}
                          </button>
                        )}
                      </div>
                    </div>
                    {isEditingThis ? (
                      <div className="space-y-2">
                        <textarea
                          value={editingCommentText}
                          onChange={(e) => setEditingCommentText(e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleCommentEditSave(comment.id)}
                            disabled={savingComment || !editingCommentText.trim()}
                            className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                          >
                            {savingComment ? '저장 중...' : '저장'}
                          </button>
                          <button
                            onClick={handleCommentEditCancel}
                            className="px-3 py-1.5 border text-xs rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                          >
                            취소
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">{comment.content}</p>
                    )}

                    {/* 답글 입력창 */}
                    {isReplyingHere && (
                      <div className="mt-3 ml-8 border rounded-lg overflow-hidden bg-gray-50">
                        <textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="답글을 입력하세요..."
                          rows={2}
                          className="w-full px-3 py-2 text-sm bg-transparent resize-none outline-none"
                          autoFocus
                        />
                        <div className="flex items-center justify-end gap-2 px-3 py-2 border-t bg-white">
                          <button
                            type="button"
                            onClick={() => { setReplyingToId(null); setReplyText(''); }}
                            className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                          >
                            취소
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReplySubmit(comment.id)}
                            disabled={submittingReply || !replyText.trim()}
                            className="px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                          >
                            {submittingReply ? '작성 중...' : '답글 작성'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 대댓글 목록 */}
                  {replies.map((reply) => {
                    const isReplyAuthor = user && user.id === reply.authorId;
                    const isEditingReply = editingCommentId === reply.id;
                    return (
                      <div key={reply.id} className="ml-8 px-4 py-3 bg-gray-50 border-t">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <svg className="w-3 h-3 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10l9 9 9-9" />
                            </svg>
                            {reply.authorAvatarUrl ? (
                              <Image
                                src={reply.authorAvatarUrl}
                                alt={reply.authorName}
                                width={20}
                                height={20}
                                className="w-5 h-5 rounded-full object-cover border shrink-0"
                                unoptimized
                              />
                            ) : (
                              <span className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-500 border shrink-0">
                                {reply.authorName.charAt(0).toUpperCase()}
                              </span>
                            )}
                            <span className="text-sm font-medium text-gray-700">{reply.authorName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">{formatDateTime(reply.createdAt)}</span>
                            {reply.updatedAt !== reply.createdAt && (
                              <span className="text-xs text-gray-400">(수정됨)</span>
                            )}
                            {isReplyAuthor && !isEditingReply && (
                              <button
                                onClick={() => handleCommentEditStart(reply)}
                                className="text-xs text-blue-400 hover:text-blue-600 transition-colors"
                              >
                                수정
                              </button>
                            )}
                            {(isReplyAuthor || isAdmin) && !isEditingReply && (
                              <button
                                onClick={() => handleCommentDelete(reply.id)}
                                className="text-xs text-red-400 hover:text-red-600 transition-colors"
                              >
                                삭제
                              </button>
                            )}
                            {/* 신고 버튼 — 본인 대댓글 제외 */}
                            {user && user.id !== reply.authorId && !isEditingReply && (
                              <button
                                onClick={() => setReportingCommentId(reportingCommentId === reply.id ? null : reply.id)}
                                className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                              >
                                {reportedIds.has(reply.id) ? '신고됨' : '신고'}
                              </button>
                            )}
                          </div>
                        </div>
                        {isEditingReply ? (
                          <div className="space-y-2">
                            <textarea
                              value={editingCommentText}
                              onChange={(e) => setEditingCommentText(e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-white"
                              autoFocus
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleCommentEditSave(reply.id)}
                                disabled={savingComment || !editingCommentText.trim()}
                                className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                              >
                                {savingComment ? '저장 중...' : '저장'}
                              </button>
                              <button
                                onClick={handleCommentEditCancel}
                                className="px-3 py-1.5 border text-xs rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                              >
                                취소
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-600 whitespace-pre-wrap">{reply.content}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}

        {/* 댓글 입력 */}
        <form onSubmit={handleCommentSubmit} className="border rounded-lg overflow-hidden">
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder={user ? '댓글을 입력하세요...' : '로그인 후 댓글을 작성할 수 있습니다.'}
            rows={3}
            className="w-full px-4 py-3 text-sm resize-none outline-none"
          />
          <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-t">
            {user ? (
              <span className="text-xs text-gray-500">{user.name}으로 작성</span>
            ) : (
              <button
                type="button"
                onClick={() => {
                  sessionStorage.setItem('redirect_after_login', `/b/${boardId}/${postId}`);
                  router.push('/login');
                }}
                className="text-xs text-blue-600 hover:underline"
              >
                로그인하여 댓글 작성
              </button>
            )}
            <button
              type="submit"
              disabled={submitting || !commentText.trim()}
              className="px-4 py-1.5 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? '작성 중...' : '댓글 작성'}
            </button>
          </div>
        </form>
      </section>

      {/* 댓글 신고 모달 */}
      {reportingCommentId && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">댓글 신고</h3>
            <div className="space-y-2">
              {(['spam', 'abuse', 'inappropriate', 'other'] as const).map((r) => (
                <label key={r} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="reason"
                    value={r}
                    checked={reportReason === r}
                    onChange={() => setReportReason(r)}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {{ spam: '스팸', abuse: '욕설/비방', inappropriate: '부적절한 내용', other: '기타' }[r]}
                  </span>
                </label>
              ))}
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setReportingCommentId(null)}
                className="px-4 py-2 border text-sm rounded-lg text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
              >
                취소
              </button>
              <button
                onClick={() => handleReport(reportingCommentId)}
                disabled={submittingReport}
                className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {submittingReport ? '신고 중...' : '신고하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
