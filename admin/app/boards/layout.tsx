import type { Metadata } from 'next';
import PublicHeader from '@/components/public/PublicHeader';
import NoticeBanner from '@/components/public/NoticeBanner';
import { SiteNoticeBanner } from '@/components/common/SiteNoticeBanner';

interface SiteSettingsRaw {
  site_name?: string;
  logo_url?: string;
  primary_color?: string;
  background_color?: string;
  home_slug?: string;
  notice_enabled?: boolean | number;
  notice_text?: string;
  notice_color?: string;
}

async function fetchSiteSettings(): Promise<SiteSettingsRaw> {
  const apiUrl = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api').replace(/\/api$/, '');
  try {
    const res = await fetch(`${apiUrl}/api/site-settings`, { cache: 'no-store' });
    if (!res.ok) return {};
    const json = await res.json();
    return json.success ? json.data : {};
  } catch {
    return {};
  }
}

export const metadata: Metadata = {
  title: '게시판',
  description: '전체 게시판 목록',
  openGraph: { title: '게시판', type: 'website' },
};

export default async function BoardsLayout({ children }: { children: React.ReactNode }) {
  const settings = await fetchSiteSettings();
  const showNotice = (settings.notice_enabled === true || settings.notice_enabled === 1) && !!settings.notice_text;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: settings.background_color || '#ffffff' }}>
      {/* 다이나믹 공지 배너 (API /notices 기반) */}
      <SiteNoticeBanner />
      {showNotice && (
        <NoticeBanner
          text={settings.notice_text!}
          color={settings.notice_color || '#1d4ed8'}
        />
      )}
      <PublicHeader
        siteName={settings.site_name}
        logoUrl={settings.logo_url}
        primaryColor={settings.primary_color}
        homeHref={settings.home_slug ? `/p/${settings.home_slug}` : '/'}
      />
      <main className="flex-1">
        {children}
      </main>
      <footer className="border-t bg-white py-6 text-center text-xs text-gray-400">
        Powered by Homepage Builder
      </footer>
    </div>
  );
}
