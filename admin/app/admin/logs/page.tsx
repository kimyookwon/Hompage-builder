'use client';

import { useEffect, useState, useCallback } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useAppStore } from '@/stores/appStore';
import { AdminLog, Pagination } from '@/types';

// action 한글 레이블
const ACTION_LABEL: Record<string, string> = {
  create: '생성',
  update: '수정',
  delete: '삭제',
  toggle: '토글',
  toggle_notice: '공지토글',
  update_role: '역할변경',
  update_status: '상태변경',
  bulk_delete: '일괄삭제',
  bulk_status: '일괄상태변경',
};

// targetType 한글 레이블
const TARGET_LABEL: Record<string, string> = {
  user: '사용자',
  post: '게시글',
  board: '게시판',
  notice: '공지',
  report: '신고',
  comment: '댓글',
};

// action 배지 색상 클래스 반환
function getActionBadgeClass(action: string): string {
  if (action === 'create') {
    return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
  }
  if (['update', 'update_role', 'update_status', 'toggle', 'toggle_notice'].includes(action)) {
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
  }
  if (['delete', 'bulk_delete'].includes(action)) {
    return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
  }
  if (action === 'bulk_status') {
    return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
  }
  return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
}

// detail JSON 파싱 후 요약 문자열 반환 (최대 100자)
function parseDetail(detail: string | null): string {
  if (!detail) return '-';
  try {
    const obj = JSON.parse(detail) as Record<string, unknown>;
    const text = Object.entries(obj)
      .map(([k, v]) => `${k}: ${String(v)}`)
      .join(', ');
    return text.length > 100 ? `${text.slice(0, 100)}…` : text;
  } catch {
    // JSON 파싱 실패 시 원본 문자열 표시
    return detail.length > 100 ? `${detail.slice(0, 100)}…` : detail;
  }
}

// 날짜+시각 포맷 (ko-KR)
function formatDateTime(isoString: string): string {
  return new Date(isoString).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

// action 필터 옵션
const ACTION_OPTIONS = [
  { value: '', label: '전체 작업' },
  { value: 'create', label: '생성' },
  { value: 'update', label: '수정' },
  { value: 'delete', label: '삭제' },
  { value: 'toggle', label: '토글' },
  { value: 'toggle_notice', label: '공지토글' },
  { value: 'update_role', label: '역할변경' },
  { value: 'update_status', label: '상태변경' },
  { value: 'bulk_delete', label: '일괄삭제' },
  { value: 'bulk_status', label: '일괄상태변경' },
];

// target_type 필터 옵션
const TARGET_OPTIONS = [
  { value: '', label: '전체 대상' },
  { value: 'user', label: '사용자' },
  { value: 'post', label: '게시글' },
  { value: 'board', label: '게시판' },
  { value: 'notice', label: '공지' },
  { value: 'report', label: '신고' },
  { value: 'comment', label: '댓글' },
];

const LIMIT = 50;

interface LogsResponse {
  items: AdminLog[];
  pagination: Pagination;
}

export default function LogsPage() {
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [targetFilter, setTargetFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const addToast = useAppStore((s) => s.addToast);

  const fetchLogs = useCallback(async (
    currentPage: number,
    action: string,
    targetType: string,
  ) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(currentPage), limit: String(LIMIT) });
      if (action) params.set('action', action);
      if (targetType) params.set('target_type', targetType);
      const res = await api.get<LogsResponse>(`/admin/logs?${params}`);
      setLogs(res.data.items);
      setPagination(res.data.pagination);
    } catch {
      addToast('활동 로그를 불러오지 못했습니다.', 'destructive');
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  // 필터 변경 시 page=1로 리셋
  useEffect(() => {
    setPage(1);
    fetchLogs(1, actionFilter, targetFilter);
  }, [actionFilter, targetFilter]);

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
    fetchLogs(nextPage, actionFilter, targetFilter);
  };

  const totalPages = pagination ? pagination.totalPages : 1;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 헤더 */}
        <div>
          <h1 className="text-2xl font-bold">관리자 활동 로그</h1>
          <p className="text-muted-foreground text-sm">
            {pagination ? `총 ${pagination.total.toLocaleString()}건` : '불러오는 중...'}
          </p>
        </div>

        {/* 필터 바 */}
        <div className="flex flex-wrap gap-3">
          {/* action 드롭다운 */}
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {ACTION_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>

          {/* target_type 드롭다운 */}
          <select
            value={targetFilter}
            onChange={(e) => setTargetFilter(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {TARGET_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        {/* 로그 테이블 */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">불러오는 중...</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">활동 로그가 없습니다.</div>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium whitespace-nowrap">시각</th>
                  <th className="px-4 py-3 text-left font-medium whitespace-nowrap">관리자</th>
                  <th className="px-4 py-3 text-left font-medium whitespace-nowrap">작업</th>
                  <th className="px-4 py-3 text-left font-medium whitespace-nowrap">대상</th>
                  <th className="px-4 py-3 text-left font-medium">상세</th>
                  <th className="px-4 py-3 text-left font-medium whitespace-nowrap">IP</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b last:border-0 hover:bg-muted/30">
                    {/* 시각 */}
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground text-xs">
                      {formatDateTime(log.createdAt)}
                    </td>

                    {/* 관리자 */}
                    <td className="px-4 py-3 whitespace-nowrap font-medium">
                      {log.adminName}
                    </td>

                    {/* 작업 배지 */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getActionBadgeClass(log.action)}`}
                      >
                        {ACTION_LABEL[log.action] ?? log.action}
                      </span>
                    </td>

                    {/* 대상 타입 + ID */}
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                      {TARGET_LABEL[log.targetType] ?? log.targetType}
                      {log.targetId !== null && (
                        <span className="ml-1 text-xs text-muted-foreground/70">#{log.targetId}</span>
                      )}
                    </td>

                    {/* 상세 (JSON 파싱 요약) */}
                    <td className="px-4 py-3 text-muted-foreground max-w-xs">
                      <span className="block truncate" title={log.detail ?? undefined}>
                        {parseDetail(log.detail)}
                      </span>
                    </td>

                    {/* IP (monospace) */}
                    <td className="px-4 py-3 whitespace-nowrap font-mono text-xs text-muted-foreground">
                      {log.ip}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1 || isLoading}
              onClick={() => handlePageChange(page - 1)}
            >
              이전
            </Button>
            <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages || isLoading}
              onClick={() => handlePageChange(page + 1)}
            >
              다음
            </Button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
