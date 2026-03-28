'use client';

interface MonthlyData {
  postsThisMonth: number;
  postsLastMonth: number;
  usersThisMonth: number;
  usersLastMonth: number;
}

interface Props {
  data: MonthlyData;
}

/** 변화율 계산 (소수점 1자리) */
function calcChange(current: number, previous: number): { value: string; isPositive: boolean; isZero: boolean } {
  if (previous === 0 && current === 0) return { value: '0.0', isPositive: false, isZero: true };
  if (previous === 0) return { value: '+100.0', isPositive: true, isZero: false };
  const pct = ((current - previous) / previous) * 100;
  return {
    value: (pct >= 0 ? '+' : '') + pct.toFixed(1),
    isPositive: pct >= 0,
    isZero: pct === 0,
  };
}

export function MonthlyComparisonCard({ data }: Props) {
  const postsChange = calcChange(data.postsThisMonth, data.postsLastMonth);
  const usersChange = calcChange(data.usersThisMonth, data.usersLastMonth);

  const items = [
    {
      label: '게시글',
      thisMonth: data.postsThisMonth,
      lastMonth: data.postsLastMonth,
      change: postsChange,
    },
    {
      label: '신규 가입',
      thisMonth: data.usersThisMonth,
      lastMonth: data.usersLastMonth,
      change: usersChange,
    },
  ];

  return (
    <div className="rounded-lg border bg-card p-5 space-y-4">
      <h2 className="text-sm font-semibold">월간 비교</h2>

      <div className="grid grid-cols-2 gap-4">
        {items.map((item) => (
          <div key={item.label} className="space-y-2">
            <p className="text-xs text-muted-foreground">{item.label}</p>

            <div className="flex items-end gap-2">
              <span className="text-xl font-bold tabular-nums">
                {item.thisMonth.toLocaleString()}
              </span>
              <span
                className={`text-xs font-medium tabular-nums pb-0.5 ${
                  item.change.isZero
                    ? 'text-muted-foreground'
                    : item.change.isPositive
                      ? 'text-emerald-600'
                      : 'text-red-500'
                }`}
              >
                {item.change.value}%
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>이번 달</span>
              <span className="font-medium text-foreground">{item.thisMonth}</span>
              <span>/</span>
              <span>지난달</span>
              <span className="font-medium text-foreground">{item.lastMonth}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
