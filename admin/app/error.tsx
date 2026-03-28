'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center">
      <p className="text-7xl font-extrabold text-gray-200 select-none">500</p>
      <h1 className="mt-4 text-2xl font-bold text-gray-800">오류가 발생했습니다</h1>
      <p className="mt-2 text-sm text-gray-500">
        일시적인 오류입니다. 잠시 후 다시 시도해주세요.
      </p>
      {error.digest && (
        <p className="mt-1 text-xs text-gray-400">오류 코드: {error.digest}</p>
      )}
      <div className="mt-8 flex gap-3">
        <button
          onClick={reset}
          className="px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          다시 시도
        </button>
        <a
          href="/"
          className="px-5 py-2.5 rounded-lg border text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
        >
          홈으로
        </a>
      </div>
    </div>
  );
}
