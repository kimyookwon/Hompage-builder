import { Suspense } from 'react';

// useSearchParams()는 Suspense 경계 필요
export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    }>
      {children}
    </Suspense>
  );
}
