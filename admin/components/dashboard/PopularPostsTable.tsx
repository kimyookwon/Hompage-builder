'use client';

// 대시보드 인기 게시글 랭킹 테이블 — 조회수 기준 TOP 10
import Link from 'next/link';

export interface PopularPost {
  id: number;
  title: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  authorName: string;
  boardId: number;
  boardName: string;
  createdAt: string;
}

interface PopularPostsTableProps {
  posts: PopularPost[];
}

export function PopularPostsTable({ posts }: PopularPostsTableProps) {
  if (posts.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">게시글이 없습니다.</p>
    );
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/50 text-muted-foreground text-xs">
            <th className="px-4 py-2.5 text-center w-10 font-medium">순위</th>
            <th className="px-4 py-2.5 text-left font-medium">제목</th>
            <th className="px-4 py-2.5 text-center font-medium hidden sm:table-cell">게시판</th>
            <th className="px-4 py-2.5 text-center font-medium">조회수</th>
            <th className="px-4 py-2.5 text-center font-medium hidden md:table-cell">좋아요</th>
            <th className="px-4 py-2.5 text-center font-medium hidden md:table-cell">댓글</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {posts.map((post, idx) => (
            <tr
              key={post.id}
              className="hover:bg-muted/30 transition-colors"
            >
              {/* 순위 — 1~3위 강조 */}
              <td className="px-4 py-2.5 text-center">
                <span
                  className={`inline-block w-6 h-6 rounded-full text-xs font-bold leading-6 text-center ${
                    idx === 0
                      ? 'bg-amber-400 text-white'
                      : idx === 1
                      ? 'bg-gray-300 text-gray-700'
                      : idx === 2
                      ? 'bg-amber-600/70 text-white'
                      : 'text-muted-foreground'
                  }`}
                >
                  {idx + 1}
                </span>
              </td>

              {/* 제목 */}
              <td className="px-4 py-2.5 max-w-0">
                <Link
                  href={`/b/${post.boardId}/${post.id}`}
                  className="block truncate font-medium hover:text-blue-600 transition-colors"
                  title={post.title}
                >
                  {post.title}
                </Link>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{post.authorName}</p>
              </td>

              {/* 게시판 */}
              <td className="px-4 py-2.5 text-center text-xs text-muted-foreground hidden sm:table-cell whitespace-nowrap">
                {post.boardName}
              </td>

              {/* 조회수 */}
              <td className="px-4 py-2.5 text-center text-xs font-medium whitespace-nowrap">
                {post.viewCount.toLocaleString()}
              </td>

              {/* 좋아요 */}
              <td className="px-4 py-2.5 text-center text-xs text-red-400 hidden md:table-cell whitespace-nowrap">
                ♥ {post.likeCount.toLocaleString()}
              </td>

              {/* 댓글 */}
              <td className="px-4 py-2.5 text-center text-xs text-muted-foreground hidden md:table-cell whitespace-nowrap">
                {post.commentCount.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
