'use client';

import { useEffect, useState, useCallback } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useAppStore } from '@/stores/appStore';
import { Report } from '@/types';

// 신고 상태 탭 목록
type StatusTab = 'all' | 'pending' | 'reviewed' | 'dismissed';

const STATUS_TABS: { value: StatusTab; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'pending', label: '처리대기' },
  { value: 'reviewed', label: '검토완료' },
  { value: 'dismissed', label: '기각' },
];

const REASON_LABELS: Record<Report['reason'], string> = {
  spam: '스팸',
  abuse: '욕설/비방',
  inappropriate: '부적절한 내용',
  other: '기타',
};

const STATUS_LABELS: Record<Report['status'], string> = {
  pending: '처리대기',
  reviewed: '검토완료',
  dismissed: '기각',
};

const LIMIT = 20;

interface ReportsResponse {
  items: Report[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusTab, setStatusTab] = useState<StatusTab>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const addToast = useAppStore((s) => s.addToast);

  const fetchReports = useCallback(async (currentPage = 1, tab = statusTab) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(currentPage), limit: String(LIMIT) });
      if (tab !== 'all') params.set('status', tab);
      const res = await api.get<ReportsResponse>(`/admin/reports?${params}`);
      setReports(res.data.items);
      setTotal(res.data.pagination.total);
    } catch {
      addToast('신고 목록을 불러오지 못했습니다.', 'destructive');
    } finally {
      setIsLoading(false);
    }
  }, [statusTab, addToast]);

  useEffect(() => {
    fetchReports(1, statusTab);
    setPage(1);
  }, [statusTab]);

  // 신고 상태 변경 (검토완료 / 기각)
  const handleUpdateStatus = async (id: number, status: 'reviewed' | 'dismissed') => {
    setProcessingId(id);
    try {
      await api.patch(`/admin/reports/${id}`, { status });
      setReports((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status } : r))
      );
      addToast('처리되었습니다.');
    } catch {
      addToast('처리에 실패했습니다.', 'destructive');
    } finally {
      setProcessingId(null);
    }
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">신고 관리</h1>
          <p className="text-muted-foreground text-sm">총 {total}건</p>
        </div>

        {/* 상태 탭 필터 */}
        <div className="flex gap-2 border-b">
          {STATUS_TABS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setStatusTab(value)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                statusTab === value
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">불러오는 중...</div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">신고 내역이 없습니다.</div>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">댓글 내용</th>
                  <th className="px-4 py-3 text-left font-medium">신고자</th>
                  <th className="px-4 py-3 text-left font-medium">신고 사유</th>
                  <th className="px-4 py-3 text-left font-medium">접수일</th>
                  <th className="px-4 py-3 text-left font-medium">상태</th>
                  <th className="px-4 py-3 text-left font-medium">처리</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id} className="border-b last:border-0 hover:bg-muted/30">
                    {/* 댓글 내용 — 최대 60자 */}
                    <td className="px-4 py-3 max-w-xs">
                      <p className="truncate text-muted-foreground">
                        {report.commentContent.length > 60
                          ? `${report.commentContent.slice(0, 60)}…`
                          : report.commentContent}
                      </p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{report.reporterName}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{REASON_LABELS[report.reason]}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                      {new Date(report.createdAt).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          report.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                            : report.status === 'reviewed'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                        }`}
                      >
                        {STATUS_LABELS[report.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {report.status === 'pending' && (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={processingId === report.id}
                            onClick={() => handleUpdateStatus(report.id, 'reviewed')}
                          >
                            검토완료
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={processingId === report.id}
                            onClick={() => handleUpdateStatus(report.id, 'dismissed')}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            기각
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => { setPage(page - 1); fetchReports(page - 1); }}
            >
              이전
            </Button>
            <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => { setPage(page + 1); fetchReports(page + 1); }}
            >
              다음
            </Button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
