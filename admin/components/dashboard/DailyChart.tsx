'use client';

import { useState } from 'react';
import { BarChart } from './BarChart';

interface DailyStat {
  date: string;
  posts: number;
  users: number;
  comments: number;
}

interface Props {
  data: DailyStat[];
  days?: number;
  onDaysChange?: (days: number) => void;
}

const DAY_OPTIONS = [7, 14, 30, 90] as const;

type Metric = 'posts' | 'users' | 'comments';

const METRICS: { key: Metric; label: string; color: string }[] = [
  { key: 'posts',    label: '게시글', color: '#3b82f6' },
  { key: 'users',    label: '신규 가입', color: '#10b981' },
  { key: 'comments', label: '댓글',   color: '#f59e0b' },
];

export function DailyChart({ data, days = 14, onDaysChange }: Props) {
  const [active, setActive] = useState<Metric>('posts');

  const metric = METRICS.find((m) => m.key === active)!;
  const chartData = data.map((d) => ({ date: d.date, value: d[active] }));
  const total = chartData.reduce((sum, d) => sum + d.value, 0);
  const today = chartData[chartData.length - 1]?.value ?? 0;

  return (
    <div className="rounded-lg border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-sm font-semibold">최근 {days}일 추이</h2>
        <div className="flex gap-2">
          {/* 기간 선택 */}
          {onDaysChange && (
            <div className="flex gap-1 border-r pr-2 mr-1">
              {DAY_OPTIONS.map((d) => (
                <button
                  key={d}
                  onClick={() => onDaysChange(d)}
                  className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                    days === d
                      ? 'bg-foreground text-background'
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {d}일
                </button>
              ))}
            </div>
          )}
          {/* 메트릭 선택 */}
          <div className="flex gap-1">
            {METRICS.map((m) => (
              <button
                key={m.key}
                onClick={() => setActive(m.key)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  active === m.key
                    ? 'text-white'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
                style={active === m.key ? { backgroundColor: m.color } : {}}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 요약 숫자 */}
      <div className="flex items-end gap-4">
        <div>
          <p className="text-2xl font-bold tabular-nums" style={{ color: metric.color }}>
            {total.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground">{days}일 합계</p>
        </div>
        <div className="pb-0.5">
          <p className="text-sm font-semibold tabular-nums text-foreground">
            {today > 0 ? `+${today}` : today}
          </p>
          <p className="text-xs text-muted-foreground">오늘</p>
        </div>
      </div>

      {/* 차트 */}
      <BarChart data={chartData} color={metric.color} height={72} />
    </div>
  );
}
