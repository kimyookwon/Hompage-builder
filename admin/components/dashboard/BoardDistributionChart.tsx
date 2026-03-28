'use client';

interface BoardData {
  boardName: string;
  count: number;
}

interface Props {
  data: BoardData[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

const BAR_H = 28;
const GAP = 8;
const LABEL_W = 100;
const CHART_W = 400;

export function BoardDistributionChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-5">
        <h2 className="text-sm font-semibold mb-3">게시판별 게시글 분포</h2>
        <p className="text-sm text-muted-foreground">데이터가 없습니다.</p>
      </div>
    );
  }

  const total = data.reduce((sum, d) => sum + d.count, 0);
  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const svgH = data.length * (BAR_H + GAP) + GAP;
  const barAreaW = CHART_W - LABEL_W - 60; // 라벨 + 숫자 영역 제외

  return (
    <div className="rounded-lg border bg-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">게시판별 게시글 분포</h2>
        <span className="text-xs text-muted-foreground">총 {total}건</span>
      </div>

      <svg viewBox={`0 0 ${CHART_W} ${svgH}`} className="w-full" preserveAspectRatio="xMidYMid meet">
        {data.map((d, i) => {
          const y = GAP + i * (BAR_H + GAP);
          const barW = maxCount > 0 ? (d.count / maxCount) * barAreaW : 0;
          const pct = total > 0 ? ((d.count / total) * 100).toFixed(1) : '0.0';
          const color = COLORS[i % COLORS.length];

          return (
            <g key={d.boardName}>
              {/* 게시판 이름 */}
              <text
                x={LABEL_W - 8}
                y={y + BAR_H / 2 + 4}
                textAnchor="end"
                className="text-[11px] fill-foreground"
              >
                {d.boardName.length > 8 ? d.boardName.slice(0, 8) + '...' : d.boardName}
              </text>

              {/* 배경 바 */}
              <rect
                x={LABEL_W}
                y={y}
                width={barAreaW}
                height={BAR_H}
                rx={4}
                fill="#f3f4f6"
              />

              {/* 데이터 바 */}
              <rect
                x={LABEL_W}
                y={y}
                width={Math.max(barW, d.count > 0 ? 4 : 0)}
                height={BAR_H}
                rx={4}
                fill={color}
                opacity={0.85}
              />

              {/* 숫자 + 퍼센트 */}
              <text
                x={LABEL_W + barAreaW + 8}
                y={y + BAR_H / 2 + 4}
                textAnchor="start"
                className="text-[10px] fill-muted-foreground"
              >
                {d.count}건 ({pct}%)
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
