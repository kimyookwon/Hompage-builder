'use client';

import { useEffect, useState, useCallback } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { RecentPostsTable } from '@/components/dashboard/RecentPostsTable';
import { PopularPostsTable, type PopularPost } from '@/components/dashboard/PopularPostsTable';
import { QuickLinks } from '@/components/dashboard/QuickLinks';
import { DailyChart } from '@/components/dashboard/DailyChart';
import { MultiLineChart } from '@/components/dashboard/MultiLineChart';
import { BoardDistributionChart } from '@/components/dashboard/BoardDistributionChart';
import { MonthlyComparisonCard } from '@/components/dashboard/MonthlyComparisonCard';
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

interface BoardDistItem {
  boardName: string;
  count: number;
}

interface MonthlyComparison {
  postsThisMonth: number;
  postsLastMonth: number;
  usersThisMonth: number;
  usersLastMonth: number;
}

interface DashboardData {
  stats: DashboardStats;
  recentPosts: RecentPost[];
  dailyStats: DailyStat[];
  boardDistribution: BoardDistItem[];
  monthlyComparison: MonthlyComparison;
  // 인기 게시글 TOP 10 (조회수 기준)
  popularPosts: PopularPost[];
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [days, setDays] = useState(14);
  const [error, setError] = useState('');

  const fetchStats = useCallback((d: number) => {
    setError('');
    api.get<DashboardData>(`/admin/stats?days=${d}`)
      .then((res) => setData(res.data))
      .catch(() => setError('통계 데이터를 불러오지 못했습니다.'));
  }, []);

  useEffect(() => {
    fetchStats(days);
  }, [days, fetchStats]);

  const handleDaysChange = (newDays: number) => {
    setDays(newDays);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">대시보드</h1>
          <p className="text-muted-foreground text-sm">안녕하세요, {user?.name}님!</p>
        </div>

        <QuickLinks />

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950 dark:border-red-800 dark:text-red-400">
            {error}
          </div>
        )}

        {data ? (
          <>
            <StatsCards stats={data.stats} />

            {/* 일별 바 차트 (기간 선택 포함) */}
            {data.dailyStats?.length > 0 && (
              <DailyChart
                data={data.dailyStats}
                days={days}
                onDaysChange={handleDaysChange}
              />
            )}

            {/* 종합 추이 라인 차트 */}
            {data.dailyStats?.length > 0 && (
              <MultiLineChart data={data.dailyStats} />
            )}

            {/* 게시판 분포 + 월간 비교 (2열) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {data.boardDistribution && (
                <BoardDistributionChart data={data.boardDistribution} />
              )}
              {data.monthlyComparison && (
                <MonthlyComparisonCard data={data.monthlyComparison} />
              )}
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-3">최근 게시글</h2>
              <RecentPostsTable posts={data.recentPosts} />
            </div>

            {/* 인기 게시글 TOP 10 */}
            {data.popularPosts?.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-3">인기 게시글 TOP 10</h2>
                <PopularPostsTable posts={data.popularPosts} />
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 text-muted-foreground">불러오는 중...</div>
        )}
      </div>
    </AdminLayout>
  );
}
