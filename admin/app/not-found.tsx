import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center">
      <p className="text-7xl font-extrabold text-gray-200 select-none">404</p>
      <h1 className="mt-4 text-2xl font-bold text-gray-800">페이지를 찾을 수 없습니다</h1>
      <p className="mt-2 text-sm text-gray-500">
        요청하신 페이지가 존재하지 않거나 이동되었습니다.
      </p>
      <div className="mt-8 flex gap-3">
        <Link
          href="/"
          className="px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          홈으로
        </Link>
        <Link
          href="/boards"
          className="px-5 py-2.5 rounded-lg border text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
        >
          게시판 목록
        </Link>
      </div>
    </div>
  );
}
