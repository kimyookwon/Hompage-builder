import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ToastContainer } from '@/components/common/ToastContainer';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

interface SiteSettings {
  site_name?: string;
  logo_url?: string;
}

async function fetchSiteSettings(): Promise<SiteSettings> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api';
  try {
    const res = await fetch(`${apiUrl}/site-settings`, { next: { revalidate: 60 } });
    if (!res.ok) return {};
    const json = await res.json();
    return json.data ?? {};
  } catch {
    return {};
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await fetchSiteSettings();
  const siteName = settings.site_name || '홈페이지 빌더';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? '';

  return {
    title: {
      default: siteName,
      template: `%s | ${siteName}`,
    },
    description: `${siteName} 홈페이지`,
    metadataBase: siteUrl ? new URL(siteUrl) : undefined,
    openGraph: {
      siteName,
      type: 'website',
      locale: 'ko_KR',
      ...(settings.logo_url ? { images: [{ url: settings.logo_url }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
    },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        {children}
        <ToastContainer />
      </body>
    </html>
  );
}
