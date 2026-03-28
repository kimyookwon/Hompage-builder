'use client';

interface DataPoint {
  date: string;
  posts: number;
  users: number;
  comments: number;
}

interface Props {
  data: DataPoint[];
}

const LINES = [
  { key: 'posts' as const, label: '게시글', color: '#3b82f6' },
  { key: 'users' as const, label: '신규 가입', color: '#10b981' },
  { key: 'comments' as const, label: '댓글', color: '#f59e0b' },
];

const CHART_W = 400;
const CHART_H = 160;
const PAD = { top: 16, right: 16, bottom: 28, left: 36 };

export function MultiLineChart({ data }: Props) {
  if (data.length === 0) return null;

  const innerW = CHART_W - PAD.left - PAD.right;
  const innerH = CHART_H - PAD.top - PAD.bottom;

  // y축 최대값 계산
  const allValues = data.flatMap((d) => [d.posts, d.users, d.comments]);
  const maxVal = Math.max(...allValues, 1);

  // y축 그리드 계산 (4등분)
  const yTicks = [0, Math.round(maxVal / 4), Math.round(maxVal / 2), Math.round((maxVal * 3) / 4), maxVal];

  // x 좌표 계산
  const xStep = data.length > 1 ? innerW / (data.length - 1) : 0;

  // 포인트 → SVG polyline 문자열
  const buildPoints = (key: 'posts' | 'users' | 'comments'): string => {
    return data
      .map((d, i) => {
        const x = PAD.left + i * xStep;
        const y = PAD.top + innerH - (d[key] / maxVal) * innerH;
        return `${x},${y}`;
      })
      .join(' ');
  };

  // x축 레이블 (최대 5개)
  const labelIndices: number[] = [];
  if (data.length <= 5) {
    data.forEach((_, i) => labelIndices.push(i));
  } else {
    const step = (data.length - 1) / 4;
    for (let i = 0; i < 5; i++) {
      labelIndices.push(Math.round(i * step));
    }
  }

  return (
    <div className="rounded-lg border bg-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">종합 추이</h2>
        {/* 범례 */}
        <div className="flex gap-3">
          {LINES.map((l) => (
            <div key={l.key} className="flex items-center gap-1.5">
              <span
                className="inline-block w-3 h-[3px] rounded-full"
                style={{ backgroundColor: l.color }}
              />
              <span className="text-xs text-muted-foreground">{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} className="w-full" preserveAspectRatio="xMidYMid meet">
        {/* y축 그리드 + 레이블 */}
        {yTicks.map((tick) => {
          const y = PAD.top + innerH - (tick / maxVal) * innerH;
          return (
            <g key={tick}>
              <line
                x1={PAD.left}
                y1={y}
                x2={PAD.left + innerW}
                y2={y}
                stroke="#e5e7eb"
                strokeWidth="0.5"
                strokeDasharray="3,3"
              />
              <text x={PAD.left - 4} y={y + 3} textAnchor="end" className="text-[9px] fill-gray-400">
                {tick}
              </text>
            </g>
          );
        })}

        {/* 라인 */}
        {LINES.map((l) => (
          <polyline
            key={l.key}
            points={buildPoints(l.key)}
            fill="none"
            stroke={l.color}
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}

        {/* x축 레이블 */}
        {labelIndices.map((idx) => {
          const x = PAD.left + idx * xStep;
          const d = new Date(data[idx].date);
          const label = `${d.getMonth() + 1}/${d.getDate()}`;
          return (
            <text
              key={idx}
              x={x}
              y={CHART_H - 4}
              textAnchor="middle"
              className="text-[9px] fill-gray-400"
            >
              {label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
