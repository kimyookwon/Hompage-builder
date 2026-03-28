'use client';

import { useEffect, useState } from 'react';
import { useParams, notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { PublicUserProfile } from '@/types';
import { formatDate } from '@/lib/date';

// 역할 배지 레이블
const ROLE_LABEL: Record<string, string> = {
  admin: '관리자',
  user: '회원',
};

// 역할 배지 색상 클래스
const ROLE_BADGE: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  user: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

export default function PublicProfilePage() {
  const { id } = useParams<{ id: string }>();

  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFoundError, setNotFoundError] = useState(false);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api';

    fetch(`${apiUrl}/users/${id}/profile`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok || !json.success) {
          setNotFoundError(true);
          return;
        }
        setProfile(json.data as PublicUserProfile);
      })
      .catch(() => setNotFoundError(true))
      .finally(() => setLoading(false));
  }, [id]);

  // 로딩 스피너
  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  // 사용자 없음 or 차단 → Next.js 404 처리
  if (notFoundError || !profile) {
    notFound();
  }

  const initials = profile.name.charAt(0).toUpperCase();

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      {/* 프로필 카드 */}
      <section className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 space-y-5 bg-white dark:bg-gray-900">
        {/* 아바타 + 기본 정보 */}
        <div className="flex items-center gap-5">
          {/* 아바타 */}
          <div className="shrink-0">
            {profile.avatarUrl ? (
              <Image
                src={profile.avatarUrl}
                alt={`${profile.name} 프로필 이미지`}
                width={72}
                height={72}
                className="w-18 h-18 rounded-full object-cover border border-gray-200 dark:border-gray-700"
                unoptimized
              />
            ) : (
              <div className="w-[72px] h-[72px] rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center border border-blue-200 dark:border-blue-800">
                <span className="text-2xl font-semibold text-blue-600 dark:text-blue-400">
                  {initials}
                </span>
              </div>
            )}
          </div>

          {/* 이름 + 역할 배지 + 가입일 */}
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white truncate">
                {profile.name}
              </h1>
              <span
                className={`px-2 py-0.5 text-xs rounded-full font-medium ${ROLE_BADGE[profile.role] ?? ROLE_BADGE['user']}`}
              >
                {ROLE_LABEL[profile.role] ?? profile.role}
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {new Date(profile.createdAt).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })} 가입
            </p>
          </div>
        </div>

        {/* 통계 (게시글 수 / 댓글 수) */}
        <div className="flex gap-6 pt-2 border-t border-gray-100 dark:border-gray-800">
          <div className="text-center">
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {profile.postCount.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">게시글</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {profile.commentCount.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">댓글</p>
          </div>
        </div>
      </section>

      {/* 최근 게시글 */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-gray-700 dark:text-gray-300">
          최근 게시글
        </h2>

        {profile.recentPosts.length === 0 ? (
          <p className="text-center py-10 text-sm text-gray-400 dark:text-gray-600">
            작성한 게시글이 없습니다.
          </p>
        ) : (
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
            {profile.recentPosts.map((post) => (
              <Link
                key={post.id}
                href={`/b/${post.boardId}/${post.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
                    {post.title}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    {post.boardName}
                  </p>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 shrink-0">
                  {formatDate(post.createdAt)}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
