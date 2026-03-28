import type { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: '검색',
  description: '게시글 전체 검색',
  openGraph: { title: '검색', type: 'website' },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={
      <div className="flex justify-center py-20">
        <div className="h-7 w-7 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
      </div>
    }>
      {children}
    </Suspense>
  );
}
