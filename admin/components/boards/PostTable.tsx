'use client';

import { Button } from '@/components/ui/button';
import { Post } from '@/types';
import { Trash2, Pin, PinOff } from 'lucide-react';

interface PostTableProps {
  posts: Post[];
  onDeleteClick: (id: number) => void;
  onNoticeToggle?: (id: number, current: boolean) => void;
}

export function PostTable({ posts, onDeleteClick, onNoticeToggle }: PostTableProps) {
  if (posts.length === 0) {
    return <p className="text-center py-12 text-muted-foreground">게시글이 없습니다.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-3 text-left font-medium">제목</th>
            <th className="px-4 py-3 text-left font-medium">작성자</th>
            <th className="px-4 py-3 text-left font-medium">조회</th>
            <th className="px-4 py-3 text-left font-medium">댓글</th>
            <th className="px-4 py-3 text-left font-medium">작성일</th>
            <th className="px-4 py-3 text-right font-medium">작업</th>
          </tr>
        </thead>
        <tbody>
          {posts.map((post) => (
            <tr key={post.id} className={`border-b last:border-0 hover:bg-muted/30 ${post.isNotice ? 'bg-amber-50/50' : ''}`}>
              <td className="px-4 py-3 font-medium max-w-xs truncate">
                {post.isNotice && (
                  <span className="mr-1.5 inline-block px-1 py-0.5 bg-red-500 text-white text-[9px] font-bold rounded align-middle">공지</span>
                )}
                {post.title}
              </td>
              <td className="px-4 py-3 text-muted-foreground">{post.authorName}</td>
              <td className="px-4 py-3 text-muted-foreground">{post.viewCount ?? 0}</td>
              <td className="px-4 py-3 text-muted-foreground">{post.commentCount}</td>
              <td className="px-4 py-3 text-muted-foreground">
                {new Date(post.createdAt).toLocaleDateString('ko-KR')}
              </td>
              <td className="px-4 py-3 text-right flex items-center justify-end gap-0.5">
                {onNoticeToggle && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className={post.isNotice ? 'text-amber-500 hover:text-amber-600' : 'text-muted-foreground hover:text-amber-500'}
                    title={post.isNotice ? '공지 해제' : '공지로 설정'}
                    onClick={() => onNoticeToggle(post.id, post.isNotice)}
                  >
                    {post.isNotice ? <PinOff size={15} /> : <Pin size={15} />}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  onClick={() => onDeleteClick(post.id)}
                >
                  <Trash2 size={15} />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
