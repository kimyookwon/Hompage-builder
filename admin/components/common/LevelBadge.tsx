// 레벨 배지 컴포넌트 — 포인트 기반 사용자 레벨을 배지로 표시

interface LevelBadgeProps {
  level: number;
  points?: number;
  size?: 'sm' | 'md';
}

// 레벨별 색상 클래스 매핑
const LEVEL_COLORS: Record<number, string> = {
  1: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  2: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
  3: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  4: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400',
  5: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-500',
};

export function LevelBadge({ level, points, size = 'sm' }: LevelBadgeProps) {
  // 유효 레벨 범위 클램핑 (1~5)
  const clampedLevel = Math.min(Math.max(level, 1), 5);
  const colorClass = LEVEL_COLORS[clampedLevel] ?? LEVEL_COLORS[1];

  const sizeClass = size === 'md'
    ? 'text-sm px-2.5 py-1'
    : 'text-xs px-2 py-0.5';

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${colorClass} ${sizeClass}`}
      title={points !== undefined ? `${points} P` : undefined}
    >
      Lv.{clampedLevel}
    </span>
  );
}
