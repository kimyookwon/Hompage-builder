'use client';

interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  className?: string;
}

// 표시할 페이지 번호 배열 계산 (ellipsis는 null로 표현)
function getPageNumbers(current: number, total: number): (number | null)[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | null)[] = [];
  const delta = 2; // 현재 페이지 좌우로 보여줄 개수

  const left = Math.max(2, current - delta);
  const right = Math.min(total - 1, current + delta);

  pages.push(1);

  if (left > 2) pages.push(null); // 앞 ellipsis

  for (let i = left; i <= right; i++) pages.push(i);

  if (right < total - 1) pages.push(null); // 뒤 ellipsis

  pages.push(total);

  return pages;
}

export default function Pagination({ page, totalPages, onChange, className = '' }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pageNumbers = getPageNumbers(page, totalPages);

  const btnBase =
    'flex items-center justify-center min-w-[2rem] h-8 rounded text-sm transition-colors select-none';
  const activeClass = 'bg-blue-600 text-white font-medium';
  const inactiveClass = 'bg-white border text-gray-600 hover:bg-gray-50';
  const disabledClass = 'opacity-40 cursor-not-allowed';

  return (
    <div className={`flex items-center justify-center gap-1 ${className}`}>
      {/* 이전 */}
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className={`${btnBase} px-2 ${page === 1 ? disabledClass + ' border bg-white text-gray-400' : inactiveClass}`}
        aria-label="이전 페이지"
      >
        ‹
      </button>

      {/* 페이지 번호 */}
      {pageNumbers.map((num, idx) =>
        num === null ? (
          <span key={`ellipsis-${idx}`} className="flex items-center justify-center min-w-[2rem] h-8 text-gray-400 text-sm select-none">
            …
          </span>
        ) : (
          <button
            key={num}
            onClick={() => onChange(num)}
            className={`${btnBase} px-2 ${num === page ? activeClass : inactiveClass}`}
            aria-current={num === page ? 'page' : undefined}
          >
            {num}
          </button>
        )
      )}

      {/* 다음 */}
      <button
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        className={`${btnBase} px-2 ${page === totalPages ? disabledClass + ' border bg-white text-gray-400' : inactiveClass}`}
        aria-label="다음 페이지"
      >
        ›
      </button>
    </div>
  );
}
