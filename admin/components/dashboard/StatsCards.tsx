import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, MessageSquare, Globe, ShieldOff, Layout } from 'lucide-react';

interface Stats {
  totalUsers: number;
  blockedUsers: number;
  totalPosts: number;
  totalComments: number;
  totalPages: number;
  publishedPages: number;
}

interface StatsCardsProps {
  stats: Stats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  const publishRate = stats.totalPages > 0
    ? Math.round((stats.publishedPages / stats.totalPages) * 100)
    : 0;

  const cards = [
    {
      label: '총 회원',
      value: stats.totalUsers.toLocaleString(),
      sub: stats.blockedUsers > 0 ? `차단 ${stats.blockedUsers}명` : '전원 활성',
      subColor: stats.blockedUsers > 0 ? 'text-destructive' : 'text-green-600',
      icon: Users,
    },
    {
      label: '게시글',
      value: stats.totalPosts.toLocaleString(),
      sub: `댓글 ${stats.totalComments.toLocaleString()}개`,
      subColor: 'text-muted-foreground',
      icon: FileText,
    },
    {
      label: '댓글',
      value: stats.totalComments.toLocaleString(),
      sub: stats.totalPosts > 0
        ? `게시글당 평균 ${(stats.totalComments / stats.totalPosts).toFixed(1)}개`
        : '게시글 없음',
      subColor: 'text-muted-foreground',
      icon: MessageSquare,
    },
    {
      label: '페이지',
      value: stats.totalPages.toLocaleString(),
      sub: `발행 ${stats.publishedPages}개 (${publishRate}%)`,
      subColor: publishRate > 0 ? 'text-blue-600' : 'text-muted-foreground',
      icon: stats.publishedPages > 0 ? Globe : Layout,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map(({ label, value, sub, subColor, icon: Icon }) => (
        <Card key={label}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
            <Icon size={16} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">{value}</p>
            <p className={`text-xs mt-1 ${subColor}`}>{sub}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
