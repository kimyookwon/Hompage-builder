interface RecentPost {
  id: number;
  title: string;
  authorName: string;
  boardName: string;
  commentCount: number;
  createdAt: string;
}

interface RecentPostsTableProps {
  posts: RecentPost[];
}

export function RecentPostsTable({ posts }: RecentPostsTableProps) {
  if (posts.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-6">게시글이 없습니다.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-3 text-left font-medium">제목</th>
            <th className="px-4 py-3 text-left font-medium">작성자</th>
            <th className="px-4 py-3 text-left font-medium">게시판</th>
            <th className="px-4 py-3 text-left font-medium">댓글</th>
            <th className="px-4 py-3 text-left font-medium">날짜</th>
          </tr>
        </thead>
        <tbody>
          {posts.map((post) => (
            <tr key={post.id} className="border-b last:border-0 hover:bg-muted/30">
              <td className="px-4 py-3 max-w-[200px] truncate">{post.title}</td>
              <td className="px-4 py-3 text-muted-foreground">{post.authorName}</td>
              <td className="px-4 py-3 text-muted-foreground">{post.boardName}</td>
              <td className="px-4 py-3">{post.commentCount}</td>
              <td className="px-4 py-3 text-muted-foreground">
                {new Date(post.createdAt).toLocaleDateString('ko-KR')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
