'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { User, Post, Pagination as PaginationData, BookmarkedPost, PointLog, PointHistoryData } from '@/types';
import PaginationUI from '@/components/common/Pagination';
import { formatDate } from '@/lib/date';
import { LevelBadge } from '@/components/common/LevelBadge';

interface MediaAsset { id: number; file_url: string; }

interface MyPostsData {
  items: (Post & { boardId: number; boardName: string })[];
  pagination: PaginationData;
}

interface BookmarksData {
  items: BookmarkedPost[];
  pagination: PaginationData;
}

const PROVIDER_LABEL: Record<string, string> = {
  google: 'Google',
  kakao: 'Kakao',
  naver: 'Naver',
};

export default function MyPage() {
  const router = useRouter();
  const { user, setAuth, clearAuth, hasHydrated } = useAuthStore();

  const [editName, setEditName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameError, setNameError] = useState('');
  const [savingName, setSavingName] = useState(false);

  const [pwCurrent, setPwCurrent] = useState('');
  const [pwNew, setPwNew] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [savingPw, setSavingPw] = useState(false);

  const [withdrawing, setWithdrawing] = useState(false);
  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false);

  // 아바타
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // 탭 상태
  const [activeTab, setActiveTab] = useState<'posts' | 'bookmarks' | 'points'>('posts');

  // 포인트 내역 상태
  const [pointLogs, setPointLogs] = useState<PointLog[]>([]);
  const [pointPagination, setPointPagination] = useState<PaginationData | null>(null);
  const [pointPage, setPointPage] = useState(1);
  const [loadingPoints, setLoadingPoints] = useState(false);
  const [pointsError, setPointsError] = useState('');

  const [posts, setPosts] = useState<MyPostsData['items']>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [page, setPage] = useState(1);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [postsError, setPostsError] = useState('');

  // 북마크 목록 상태
  const [bookmarks, setBookmarks] = useState<BookmarkedPost[]>([]);
  const [bookmarkPagination, setBookmarkPagination] = useState<PaginationData | null>(null);
  const [bookmarkPage, setBookmarkPage] = useState(1);
  const [loadingBookmarks, setLoadingBookmarks] = useState(false);
  const [bookmarksError, setBookmarksError] = useState('');

  // 비로그인 시 로그인 페이지로
  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) {
      sessionStorage.setItem('redirect_after_login', '/my');
      router.replace('/login');
    }
  }, [hasHydrated, user, router]);

  const handleWithdraw = async () => {
    setWithdrawing(true);
    try {
      await api.delete('/me', { confirm: 'WITHDRAW' });
      clearAuth();
      router.replace('/');
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : '탈퇴에 실패했습니다.');
    } finally {
      setWithdrawing(false);
      setShowWithdrawConfirm(false);
    }
  };

  const fetchMyPosts = useCallback(async (p: number) => {
    setLoadingPosts(true);
    setPostsError('');
    try {
      const res = await api.get<MyPostsData>(`/me/posts?page=${p}&limit=10`);
      setPosts(res.data.items);
      setPagination(res.data.pagination);
    } catch {
      setPostsError('게시글을 불러오지 못했습니다.');
    } finally {
      setLoadingPosts(false);
    }
  }, []);

  const fetchBookmarks = useCallback(async (p: number) => {
    setLoadingBookmarks(true);
    setBookmarksError('');
    try {
      const res = await api.get<BookmarksData>(`/me/bookmarks?page=${p}&limit=10`);
      setBookmarks(res.data.items);
      setBookmarkPagination(res.data.pagination);
    } catch {
      setBookmarksError('북마크를 불러오지 못했습니다.');
    } finally {
      setLoadingBookmarks(false);
    }
  }, []);

  useEffect(() => {
    if (!hasHydrated || !user) return;
    setEditName(user.name);
    fetchMyPosts(page);
  }, [hasHydrated, user, fetchMyPosts, page]);

  const fetchPointLogs = useCallback(async (p: number) => {
    setLoadingPoints(true);
    setPointsError('');
    try {
      const res = await api.get<PointHistoryData>(`/me/points?page=${p}&limit=20`);
      setPointLogs(res.data.items);
      setPointPagination(res.data.pagination);
    } catch {
      setPointsError('포인트 내역을 불러오지 못했습니다.');
    } finally {
      setLoadingPoints(false);
    }
  }, []);

  // 북마크 탭 활성화 시 데이터 로드
  useEffect(() => {
    if (!hasHydrated || !user) return;
    if (activeTab === 'bookmarks') {
      fetchBookmarks(bookmarkPage);
    }
  }, [activeTab, bookmarkPage, hasHydrated, user, fetchBookmarks]);

  // 포인트 탭 활성화 시 데이터 로드
  useEffect(() => {
    if (!hasHydrated || !user) return;
    if (activeTab === 'points') {
      fetchPointLogs(pointPage);
    }
  }, [activeTab, pointPage, hasHydrated, user, fetchPointLogs]);

  const handleNameSave = async () => {
    if (!editName.trim()) {
      setNameError('이름을 입력해주세요.');
      return;
    }
    setSavingName(true);
    setNameError('');
    try {
      const res = await api.patch<User>('/me', { name: editName.trim() });
      // 스토어의 user 업데이트
      if (user) {
        setAuth({ ...res.data }, useAuthStore.getState().token!);
      }
      setIsEditingName(false);
    } catch (e: unknown) {
      setNameError(e instanceof Error ? e.message : '저장에 실패했습니다.');
    } finally {
      setSavingName(false);
    }
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');
    if (!pwCurrent) { setPwError('현재 비밀번호를 입력해주세요.'); return; }
    if (pwNew.length < 8) { setPwError('새 비밀번호는 8자 이상이어야 합니다.'); return; }
    if (pwNew !== pwConfirm) { setPwError('새 비밀번호가 일치하지 않습니다.'); return; }

    setSavingPw(true);
    try {
      await api.patch('/me/password', { current_password: pwCurrent, new_password: pwNew });
      setPwSuccess('비밀번호가 변경되었습니다.');
      setPwCurrent(''); setPwNew(''); setPwConfirm('');
    } catch (e: unknown) {
      setPwError(e instanceof Error ? e.message : '변경에 실패했습니다.');
    } finally {
      setSavingPw(false);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    setUploadingAvatar(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const mediaRes = await api.upload<MediaAsset>('/media/upload', fd);
      const res = await api.patch<User>('/me/avatar', { avatar_url: mediaRes.data.file_url });
      if (user) setAuth({ ...res.data }, useAuthStore.getState().token!);
    } catch {
      alert('아바타 업로드에 실패했습니다.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleAvatarRemove = async () => {
    try {
      const res = await api.patch<User>('/me/avatar', { avatar_url: null });
      if (user) setAuth({ ...res.data }, useAuthStore.getState().token!);
    } catch {
      alert('아바타 제거에 실패했습니다.');
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
    <div className="max-w-2xl mx-auto px-6 py-10 space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">마이페이지</h1>

      {/* 프로필 카드 */}
      <section className="border rounded-xl p-6 space-y-4">
        <h2 className="text-base font-semibold text-gray-700">내 정보</h2>

        {/* 아바타 */}
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            {user.avatarUrl ? (
              <Image
                src={user.avatarUrl}
                alt="프로필 이미지"
                width={64}
                height={64}
                className="w-16 h-16 rounded-full object-cover border"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center border">
                <span className="text-xl font-semibold text-blue-600">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            {uploadingAvatar && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full">
                <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
              </div>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="px-3 py-1.5 text-xs border rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              이미지 변경
            </button>
            {user.avatarUrl && (
              <button
                type="button"
                onClick={handleAvatarRemove}
                className="px-3 py-1.5 text-xs text-red-500 hover:text-red-700 transition-colors"
              >
                이미지 제거
              </button>
            )}
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAvatarUpload(f); e.target.value = ''; }}
            />
          </div>
        </div>

        {/* 이메일 */}
        <div className="flex items-center gap-3">
          <span className="w-16 text-xs text-gray-500 shrink-0">이메일</span>
          <span className="text-sm text-gray-800">{user.email}</span>
        </div>

        {/* 로그인 방식 */}
        <div className="flex items-center gap-3">
          <span className="w-16 text-xs text-gray-500 shrink-0">로그인</span>
          <span className="text-sm text-gray-800">
            {user.oauthProvider ? `${PROVIDER_LABEL[user.oauthProvider] ?? user.oauthProvider} 소셜 로그인` : '이메일'}
          </span>
        </div>

        {/* 이름 편집 */}
        <div className="flex items-start gap-3">
          <span className="w-16 text-xs text-gray-500 shrink-0 pt-1.5">이름</span>
          {/* 레벨 배지 + 포인트 */}
          {!isEditingName && (user.level !== undefined || user.points !== undefined) && (
            <div className="flex items-center gap-2 mb-1">
              {user.level !== undefined && (
                <LevelBadge level={user.level} points={user.points} size="md" />
              )}
              {user.points !== undefined && (
                <span className="text-sm text-gray-500">{user.points.toLocaleString()} P</span>
              )}
            </div>
          )}
          {isEditingName ? (
            <div className="flex-1 space-y-2">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleNameSave(); if (e.key === 'Escape') setIsEditingName(false); }}
                className="w-full border rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              {nameError && <p className="text-xs text-red-500">{nameError}</p>}
              <div className="flex gap-2">
                <button
                  onClick={handleNameSave}
                  disabled={savingName}
                  className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {savingName ? '저장 중...' : '저장'}
                </button>
                <button
                  onClick={() => { setIsEditingName(false); setEditName(user.name); setNameError(''); }}
                  className="px-3 py-1.5 border text-xs rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-800">{user.name}</span>
              <button
                onClick={() => setIsEditingName(true)}
                className="text-xs text-blue-600 hover:underline"
              >
                수정
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 비밀번호 변경 — 소셜 로그인 사용자는 숨김 */}
      {!user.oauthProvider && (
        <section className="border rounded-xl p-6 space-y-4">
          <h2 className="text-base font-semibold text-gray-700">비밀번호 변경</h2>
          <form onSubmit={handlePasswordSave} className="space-y-3">
            {[
              { label: '현재 비밀번호', value: pwCurrent, onChange: setPwCurrent },
              { label: '새 비밀번호', value: pwNew, onChange: setPwNew },
              { label: '새 비밀번호 확인', value: pwConfirm, onChange: setPwConfirm },
            ].map(({ label, value, onChange }) => (
              <div key={label} className="flex items-center gap-3">
                <span className="w-28 text-xs text-gray-500 shrink-0">{label}</span>
                <input
                  type="password"
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  className="flex-1 border rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
            {pwError && <p className="text-xs text-red-500">{pwError}</p>}
            {pwSuccess && <p className="text-xs text-green-600">{pwSuccess}</p>}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={savingPw}
                className="px-4 py-2 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {savingPw ? '변경 중...' : '비밀번호 변경'}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* 회원 탈퇴 */}
      <section className="border border-red-100 rounded-xl p-6 space-y-3">
        <h2 className="text-base font-semibold text-gray-700">회원 탈퇴</h2>
        {showWithdrawConfirm ? (
          <div className="space-y-3">
            <p className="text-sm text-red-600">
              탈퇴하면 작성한 게시글과 댓글은 유지되지만 계정 정보가 삭제됩니다. 정말 탈퇴하시겠습니까?
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleWithdraw}
                disabled={withdrawing}
                className="px-4 py-2 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {withdrawing ? '처리 중...' : '탈퇴 확인'}
              </button>
              <button
                onClick={() => setShowWithdrawConfirm(false)}
                className="px-4 py-2 border text-xs rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">계정을 영구적으로 삭제합니다.</p>
            <button
              onClick={() => setShowWithdrawConfirm(true)}
              className="px-3 py-1.5 border border-red-300 text-red-500 text-xs rounded-lg hover:bg-red-50 transition-colors"
            >
              탈퇴하기
            </button>
          </div>
        )}
      </section>

      {/* 내 게시글 / 북마크 탭 */}
      <section className="space-y-3">
        {/* 탭 헤더 */}
        <div className="flex gap-1 border-b">
          <button
            onClick={() => setActiveTab('posts')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === 'posts'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            내 게시글
          </button>
          <button
            onClick={() => setActiveTab('bookmarks')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === 'bookmarks'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            북마크
          </button>
          <button
            onClick={() => setActiveTab('points')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === 'points'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            포인트
          </button>
        </div>

        {/* 내 게시글 탭 */}
        {activeTab === 'posts' && (
          <>
            {postsError && (
              <p className="text-sm text-red-500 py-2">{postsError}</p>
            )}

            {loadingPosts ? (
              <div className="flex justify-center py-8">
                <div className="h-6 w-6 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
              </div>
            ) : posts.length === 0 ? (
              <p className="text-center py-10 text-sm text-gray-400">작성한 게시글이 없습니다.</p>
            ) : (
              <>
                <div className="border rounded-lg divide-y">
                  {posts.map((post) => (
                    <Link
                      key={post.id}
                      href={`/b/${post.boardId}/${post.id}`}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 group-hover:text-blue-600 truncate">
                          {post.title}
                          {post.commentCount > 0 && (
                            <span className="ml-1.5 text-xs text-blue-500 font-normal">[{post.commentCount}]</span>
                          )}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{post.boardName}</p>
                      </div>
                      <p className="text-xs text-gray-400 shrink-0">
                        {formatDate(post.createdAt)}
                      </p>
                    </Link>
                  ))}
                </div>

                {pagination && (
                  <PaginationUI
                    page={page}
                    totalPages={pagination.totalPages}
                    onChange={(p) => setPage(p)}
                    className="pt-2"
                  />
                )}
              </>
            )}
          </>
        )}

        {/* 포인트 내역 탭 */}
        {activeTab === 'points' && (
          <>
            {pointsError && (
              <p className="text-sm text-red-500 py-2">{pointsError}</p>
            )}

            {loadingPoints ? (
              <div className="flex justify-center py-8">
                <div className="h-6 w-6 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
              </div>
            ) : pointLogs.length === 0 ? (
              <p className="text-center py-10 text-sm text-gray-400">포인트 내역이 없습니다.</p>
            ) : (
              <>
                <div className="border rounded-lg divide-y">
                  {pointLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between px-4 py-3"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800">{log.reason}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{formatDate(log.createdAt)}</p>
                      </div>
                      <span
                        className={`text-sm font-semibold shrink-0 ml-4 ${
                          log.points >= 0 ? 'text-green-600' : 'text-red-500'
                        }`}
                      >
                        {log.points >= 0 ? `+${log.points}` : log.points} P
                      </span>
                    </div>
                  ))}
                </div>

                {pointPagination && (
                  <PaginationUI
                    page={pointPage}
                    totalPages={pointPagination.totalPages}
                    onChange={(p) => setPointPage(p)}
                    className="pt-2"
                  />
                )}
              </>
            )}
          </>
        )}

        {/* 북마크 탭 */}
        {activeTab === 'bookmarks' && (
          <>
            {bookmarksError && (
              <p className="text-sm text-red-500 py-2">{bookmarksError}</p>
            )}

            {loadingBookmarks ? (
              <div className="flex justify-center py-8">
                <div className="h-6 w-6 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
              </div>
            ) : bookmarks.length === 0 ? (
              <p className="text-center py-10 text-sm text-gray-400">북마크한 게시글이 없습니다.</p>
            ) : (
              <>
                <div className="border rounded-lg divide-y">
                  {bookmarks.map((item) => (
                    <Link
                      key={item.id}
                      href={`/b/${item.boardId}/${item.id}`}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 group-hover:text-blue-600 truncate">
                          {item.title}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{item.boardName}</p>
                      </div>
                      <p className="text-xs text-gray-400 shrink-0">
                        {formatDate(item.createdAt)}
                      </p>
                    </Link>
                  ))}
                </div>

                {bookmarkPagination && (
                  <PaginationUI
                    page={bookmarkPage}
                    totalPages={bookmarkPagination.totalPages}
                    onChange={(p) => setBookmarkPage(p)}
                    className="pt-2"
                  />
                )}
              </>
            )}
          </>
        )}
      </section>
    </div>
  );
}
