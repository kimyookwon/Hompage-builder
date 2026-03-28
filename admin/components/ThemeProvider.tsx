'use client';

import { ThemeProvider as NextThemeProvider } from 'next-themes';

// next-themes 래퍼 — layout.tsx에서 클라이언트 컴포넌트로 분리
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemeProvider>
  );
}
