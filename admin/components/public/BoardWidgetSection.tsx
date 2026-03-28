import Link from 'next/link';
import Image from 'next/image';

interface Post {
  id: number;
  title: string;
  authorName: string;
  commentCount: number;
  viewCount: number;
  thumbnailUrl?: string | null;
  createdAt: string;
}

interface BoardWidgetContent {
  boardId?: number | string;
  title?: string;
  maxPosts?: number;
  displayStyle?: 'list' | 'card';
}

async function fetchPosts(boardId: string | number, limit: number): Promise<Post[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  try {
    const res = await fetch(
      `${apiUrl}/api/boards/${boardId}/posts?page=1&limit=${limit}&sort=latest`,
      { cache: 'no-store' }
    );
    if (!res.ok) return [];
    const json = await res.json();
    return json.success ? (json.data.items ?? []) : [];
  } catch {
    return [];
  }
}

function formatBoardDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (date >= todayStart) {
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
  }
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' });
  }
  return date.toLocaleDateString('ko-KR', { year: '2-digit', month: 'numeric', day: 'numeric' });
}

export default async function BoardWidgetSection({ content }: { content: BoardWidgetContent }) {
  const { boardId, title, maxPosts = 5, displayStyle = 'list' } = content;

  if (!boardId) {
    return (
      <section className="max-w-4xl mx-auto px-6 py-12">
        <p className="text-gray-400 text-sm text-center">게시판이 선택되지 않았습니다.</p>
      </section>
    );
  }

  const posts = await fetchPosts(boardId, maxPosts);

  return (
    <section className="max-w-4xl mx-auto px-6 py-12">
      {title && (
        <h2 className="text-xl font-bold text-gray-900 mb-5">{title}</h2>
      )}

      {posts.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-8">게시글이 없습니다.</p>
      ) : displayStyle === 'card' ? (
        /* 카드형 */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/b/${boardId}/${post.id}`}
              className="group rounded-xl border bg-white hover:shadow-md transition-all overflow-hidden"
            >
              {post.thumbnailUrl ? (
                <div className="aspect-video relative overflow-hidden bg-gray-100">
                  <Image
                    src={post.thumbnailUrl}
                    alt={post.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              )}
              <div className="p-3">
                <p className="text-sm font-medium text-gray-800 group-hover:text-blue-600 line-clamp-2">{post.title}</p>
                <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                  <span>{post.authorName}</span>
                  <span>{formatBoardDate(post.createdAt)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        /* 목록형 */
        <div className="border rounded-lg overflow-hidden divide-y">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/b/${boardId}/${post.id}`}
              className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors group"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 truncate">
                  {post.title}
                  {post.commentCount > 0 && (
                    <span className="ml-1 text-xs text-blue-500 font-normal">[{post.commentCount}]</span>
                  )}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{post.authorName}</p>
              </div>
              <div className="shrink-0 text-xs text-gray-400">{formatBoardDate(post.createdAt)}</div>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-4 text-right">
        <Link
          href={`/b/${boardId}`}
          className="text-xs text-blue-500 hover:text-blue-700 transition-colors"
        >
          더 보기 →
        </Link>
      </div>
    </section>
  );
}
