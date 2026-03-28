'use client';

interface DataPoint {
  date: string;
  value: number;
}

interface BarChartProps {
  data: DataPoint[];
  color?: string;
  height?: number;
}

export function BarChart({ data, color = '#3b82f6', height = 80 }: BarChartProps) {
  if (data.length === 0) return null;

  const max = Math.max(...data.map((d) => d.value), 1);
  const barWidth = 100 / data.length;
  const gap = 0.6; // bar width % within slot

  return (
    <div className="w-full select-none">
      <svg
        viewBox={`0 0 100 ${height}`}
        preserveAspectRatio="none"
        className="w-full overflow-visible"
        style={{ height }}
      >
        {data.map((d, i) => {
          const barH = (d.value / max) * (height - 12);
          const x = i * barWidth + barWidth * (1 - gap) / 2;
          const w = barWidth * gap;
          const y = height - 12 - barH;

          return (
            <g key={d.date}>
              <title>{d.date}: {d.value}</title>
              {/* 바 */}
              <rect
                x={x}
                y={barH > 0 ? y : height - 12}
                width={w}
                height={Math.max(barH, barH > 0 ? 1 : 0)}
                rx={1}
                fill={color}
                opacity={0.85}
              />
            </g>
          );
        })}
        {/* x축 선 */}
        <line x1="0" y1={height - 12} x2="100" y2={height - 12} stroke="#e5e7eb" strokeWidth="0.5" />
      </svg>

      {/* x축 날짜 레이블 — 첫/중간/마지막만 */}
      <div className="flex justify-between text-[10px] text-gray-400 mt-0.5 px-0">
        <span>{formatDate(data[0].date)}</span>
        <span>{formatDate(data[Math.floor(data.length / 2)].date)}</span>
        <span>{formatDate(data[data.length - 1].date)}</span>
      </div>
    </div>
  );
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}
