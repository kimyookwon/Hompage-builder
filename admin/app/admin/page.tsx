'use client';

import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { RecentPostsTable } from '@/components/dashboard/RecentPostsTable';
import { QuickLinks } from '@/components/dashboard/QuickLinks';
import { DailyChart } from '@/components/dashboard/DailyChart';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

interface DashboardStats {
  totalUsers: number;
  blockedUsers: number;
  totalPosts: number;
  totalComments: number;
  totalPages: number;
  publishedPages: number;
}

interface RecentPost {
  id: number;
  title: string;
  authorName: string;
  boardName: string;
  commentCount: number;
  createdAt: string;
}

interface DailyStat {
  date: string;
  posts: number;
  users: number;
  comments: number;
}

interface DashboardData {
  stats: DashboardStats;
  recentPosts: RecentPost[];
  dailyStats: DailyStat[];
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    api.get<DashboardData>('/admin/stats')
      .then((res) => setData(res.data))
      .catch(() => {});
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">대시보드</h1>
          <p className="text-muted-foreground text-sm">안녕하세요, {user?.name}님!</p>
        </div>

        <QuickLinks />

        {data ? (
          <>
            <StatsCards stats={data.stats} />
            {data.dailyStats?.length > 0 && (
              <DailyChart data={data.dailyStats} />
            )}
            <div>
              <h2 className="text-lg font-semibold mb-3">최근 게시글</h2>
              <RecentPostsTable posts={data.recentPosts} />
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-muted-foreground">불러오는 중...</div>
        )}
      </div>
    </AdminLayout>
  );
}
