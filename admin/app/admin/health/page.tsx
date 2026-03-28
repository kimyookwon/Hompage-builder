'use client';

import { useEffect, useState, useCallback } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import {
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Database,
  HardDrive,
  Cpu,
  FolderOpen,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// 개별 헬스 체크 항목 타입
interface HealthCheck {
  status: 'ok' | 'warn' | 'critical' | 'error';
  latency_ms?: number;
  version?: string;
  free_gb?: number;
  total_gb?: number;
  usage_percent?: number;
  php_memory_mb?: number;
  php_peak_mb?: number;
  php_limit_mb?: number;
  writable?: boolean;
}

// 전체 헬스 응답 타입
interface HealthData {
  status: 'ok' | 'degraded' | 'error';
  version: string;
  timestamp: string;
  checks: {
    database: HealthCheck;
    disk: HealthCheck;
    memory: HealthCheck;
    upload_dir: HealthCheck;
  };
}

// 상태별 색상/아이콘 매핑
function getStatusStyle(status: HealthCheck['status']) {
  switch (status) {
    case 'ok':
      return {
        bg: 'bg-green-50 dark:bg-green-950/30',
        border: 'border-green-200 dark:border-green-800',
        badge: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        icon: <CheckCircle2 size={16} className="text-green-600 dark:text-green-400" />,
        label: '정상',
      };
    case 'warn':
      return {
        bg: 'bg-yellow-50 dark:bg-yellow-950/30',
        border: 'border-yellow-200 dark:border-yellow-800',
        badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
        icon: <AlertTriangle size={16} className="text-yellow-600 dark:text-yellow-400" />,
        label: '주의',
      };
    case 'critical':
    case 'error':
      return {
        bg: 'bg-red-50 dark:bg-red-950/30',
        border: 'border-red-200 dark:border-red-800',
        badge: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        icon: <XCircle size={16} className="text-red-600 dark:text-red-400" />,
        label: '장애',
      };
  }
}

// 전체 상태 배너 스타일
function getOverallStyle(status: HealthData['status']) {
  switch (status) {
    case 'ok':
      return {
        className: 'bg-green-100 dark:bg-green-900/40 border-green-300 dark:border-green-700 text-green-800 dark:text-green-200',
        icon: <CheckCircle2 size={20} />,
        text: '모든 시스템이 정상입니다.',
      };
    case 'degraded':
      return {
        className: 'bg-yellow-100 dark:bg-yellow-900/40 border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200',
        icon: <AlertTriangle size={20} />,
        text: '일부 서비스에 주의가 필요합니다.',
      };
    case 'error':
      return {
        className: 'bg-red-100 dark:bg-red-900/40 border-red-300 dark:border-red-700 text-red-800 dark:text-red-200',
        icon: <XCircle size={20} />,
        text: '시스템에 장애가 발생했습니다.',
      };
  }
}

// 데이터베이스 체크 카드
function DatabaseCard({ check }: { check: HealthCheck }) {
  const style = getStatusStyle(check.status);
  return (
    <div className={cn('rounded-lg border p-5', style.bg, style.border)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 font-semibold text-sm">
          <Database size={18} />
          데이터베이스
        </div>
        <span className={cn('text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1', style.badge)}>
          {style.icon}
          {style.label}
        </span>
      </div>
      <dl className="space-y-1.5 text-sm">
        {check.latency_ms !== undefined && (
          <div className="flex justify-between">
            <dt className="text-muted-foreground">응답 시간</dt>
            <dd className="font-mono font-medium">{check.latency_ms} ms</dd>
          </div>
        )}
        {check.version && (
          <div className="flex justify-between">
            <dt className="text-muted-foreground">버전</dt>
            <dd className="font-mono font-medium">{check.version}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}

// 디스크 체크 카드
function DiskCard({ check }: { check: HealthCheck }) {
  const style = getStatusStyle(check.status);
  return (
    <div className={cn('rounded-lg border p-5', style.bg, style.border)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 font-semibold text-sm">
          <HardDrive size={18} />
          디스크
        </div>
        <span className={cn('text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1', style.badge)}>
          {style.icon}
          {style.label}
        </span>
      </div>
      <dl className="space-y-1.5 text-sm">
        {check.usage_percent !== undefined && (
          <>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">사용률</dt>
              <dd className="font-mono font-medium">{check.usage_percent}%</dd>
            </div>
            {/* 사용률 바 */}
            <div className="w-full bg-muted rounded-full h-1.5 mt-1">
              <div
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  check.usage_percent >= 90 ? 'bg-red-500' :
                  check.usage_percent >= 75 ? 'bg-yellow-500' : 'bg-green-500'
                )}
                style={{ width: `${Math.min(check.usage_percent, 100)}%` }}
              />
            </div>
          </>
        )}
        {check.free_gb !== undefined && check.total_gb !== undefined && (
          <div className="flex justify-between">
            <dt className="text-muted-foreground">여유 공간</dt>
            <dd className="font-mono font-medium">
              {check.free_gb.toFixed(1)} GB / {check.total_gb.toFixed(1)} GB
            </dd>
          </div>
        )}
      </dl>
    </div>
  );
}

// 메모리 체크 카드
function MemoryCard({ check }: { check: HealthCheck }) {
  const style = getStatusStyle(check.status);
  return (
    <div className={cn('rounded-lg border p-5', style.bg, style.border)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 font-semibold text-sm">
          <Cpu size={18} />
          메모리 (PHP)
        </div>
        <span className={cn('text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1', style.badge)}>
          {style.icon}
          {style.label}
        </span>
      </div>
      <dl className="space-y-1.5 text-sm">
        {check.php_memory_mb !== undefined && (
          <div className="flex justify-between">
            <dt className="text-muted-foreground">현재 사용</dt>
            <dd className="font-mono font-medium">{check.php_memory_mb.toFixed(1)} MB</dd>
          </div>
        )}
        {check.php_peak_mb !== undefined && (
          <div className="flex justify-between">
            <dt className="text-muted-foreground">피크 사용</dt>
            <dd className="font-mono font-medium">{check.php_peak_mb.toFixed(1)} MB</dd>
          </div>
        )}
        {check.php_limit_mb !== undefined && (
          <div className="flex justify-between">
            <dt className="text-muted-foreground">한도</dt>
            <dd className="font-mono font-medium">{check.php_limit_mb} MB</dd>
          </div>
        )}
      </dl>
    </div>
  );
}

// 업로드 디렉터리 체크 카드
function UploadDirCard({ check }: { check: HealthCheck }) {
  const style = getStatusStyle(check.status);
  return (
    <div className={cn('rounded-lg border p-5', style.bg, style.border)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 font-semibold text-sm">
          <FolderOpen size={18} />
          업로드 디렉터리
        </div>
        <span className={cn('text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1', style.badge)}>
          {style.icon}
          {style.label}
        </span>
      </div>
      <dl className="space-y-1.5 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">쓰기 권한</dt>
          <dd className="font-medium">
            {check.writable === true ? (
              <span className="text-green-600 dark:text-green-400">가능</span>
            ) : check.writable === false ? (
              <span className="text-red-600 dark:text-red-400">불가</span>
            ) : (
              <span className="text-muted-foreground">-</span>
            )}
          </dd>
        </div>
        {check.latency_ms !== undefined && (
          <div className="flex justify-between">
            <dt className="text-muted-foreground">확인 시간</dt>
            <dd className="font-mono font-medium">{check.latency_ms} ms</dd>
          </div>
        )}
      </dl>
    </div>
  );
}

// 폴링 간격 (30초)
const POLL_INTERVAL_MS = 30_000;

export default function HealthPage() {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 헬스 API 호출
  const fetchHealth = useCallback(async (manual = false) => {
    if (manual) setIsRefreshing(true);
    try {
      const res = await fetch('/api/health');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: HealthData = await res.json();
      setData(json);
      setError(null);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : '헬스 체크 요청 실패');
    } finally {
      setLoading(false);
      if (manual) setIsRefreshing(false);
    }
  }, []);

  // 최초 로드 + 30초 폴링
  useEffect(() => {
    fetchHealth();
    const timer = setInterval(() => fetchHealth(), POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [fetchHealth]);

  const overall = data ? getOverallStyle(data.status) : null;

  return (
    <AdminLayout>
      <div className="max-w-4xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">시스템 상태</h1>
            <p className="text-sm text-muted-foreground mt-1">
              서버 헬스 체크 — 30초마다 자동 갱신
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchHealth(true)}
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw size={14} className={cn(isRefreshing && 'animate-spin')} />
            새로고침
          </Button>
        </div>

        {/* 로딩 상태 */}
        {loading && (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <RefreshCw size={20} className="animate-spin mr-2" />
            헬스 체크 중...
          </div>
        )}

        {/* 에러 상태 */}
        {!loading && error && (
          <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-5 text-sm text-red-700 dark:text-red-300">
            <div className="flex items-center gap-2 font-semibold mb-1">
              <XCircle size={16} />
              헬스 체크 실패
            </div>
            {error}
          </div>
        )}

        {/* 헬스 데이터 */}
        {!loading && data && overall && (
          <div className="space-y-6">
            {/* 전체 상태 배너 */}
            <div className={cn('flex items-center gap-3 px-5 py-4 rounded-lg border font-medium', overall.className)}>
              {overall.icon}
              <span>{overall.text}</span>
              {data.version && (
                <span className="ml-auto text-xs font-normal opacity-75">v{data.version}</span>
              )}
            </div>

            {/* 체크 카드 2열 그리드 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DatabaseCard check={data.checks.database} />
              <DiskCard check={data.checks.disk} />
              <MemoryCard check={data.checks.memory} />
              <UploadDirCard check={data.checks.upload_dir} />
            </div>

            {/* 마지막 업데이트 시간 */}
            {lastUpdated && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock size={12} />
                마지막 업데이트: {lastUpdated.toLocaleTimeString('ko-KR')}
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
