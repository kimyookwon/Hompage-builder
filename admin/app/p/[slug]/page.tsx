import { notFound } from 'next/navigation';
import SectionRenderer from '@/components/public/SectionRenderer';

interface Section {
  id: number;
  type: 'header' | 'container' | 'banner' | 'footer';
  format: string;
  content: Record<string, unknown>;
  order: number;
}

interface SiteSettings {
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  backgroundColor?: string;
  gtmCode?: string;
}

interface PublicPageData {
  page: {
    id: number;
    title: string;
    slug: string;
    isPublished: boolean;
    seoDescription?: string | null;
    seoOgImage?: string | null;
  };
  sections: Section[];
  siteSettings: SiteSettings;
}

// 공개 페이지 데이터 가져오기 (서버 컴포넌트)
async function fetchPublicPage(slug: string): Promise<PublicPageData | null> {
  // NEXT_PUBLIC_API_URL은 /api 접미어 포함 — base URL만 추출
  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api').replace(/\/api$/, '');
  try {
    const res = await fetch(`${baseUrl}/public/pages/${slug}`, {
      cache: 'no-store', // 항상 최신 데이터
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.success ? json.data : null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await fetchPublicPage(slug);
  if (!data) return { title: '페이지를 찾을 수 없습니다' };

  // SEO 필드 우선, 없으면 banner 섹션에서 추출
  const banner = data.sections.find((s) => s.type === 'banner');
  const description = data.page.seoDescription
    || (banner?.content?.subtitle as string)
    || (banner?.content?.description as string)
    || '';
  const ogImage = data.page.seoOgImage
    || (banner?.content?.background_image as string)
    || data.siteSettings.logoUrl
    || '';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  return {
    title: data.page.title,
    description: description || undefined,
    openGraph: {
      title: data.page.title,
      description: description || undefined,
      url: `${siteUrl}/p/${slug}`,
      type: 'website',
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
  };
}

export default async function PublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await fetchPublicPage(slug);

  if (!data) notFound();

  const { sections, siteSettings } = data;
  const bgColor = siteSettings.backgroundColor || '#ffffff';

  // header/footer 분리, 나머지 body 섹션
  const headerSection = sections.find((s) => s.type === 'header');
  const footerSection = sections.find((s) => s.type === 'footer');
  const bodySections = sections.filter((s) => s.type !== 'header' && s.type !== 'footer');

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: bgColor }}>
      {/* GTM 스크립트 */}
      {siteSettings.gtmCode && (
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${siteSettings.gtmCode}');`,
          }}
        />
      )}

      {/* 헤더 */}
      {headerSection && (
        <SectionRenderer section={headerSection} siteSettings={siteSettings} />
      )}

      {/* 본문 섹션 */}
      <main className="flex-1">
        {bodySections.length > 0 ? (
          bodySections.map((section) => (
            <SectionRenderer key={section.id} section={section} siteSettings={siteSettings} />
          ))
        ) : (
          <div className="max-w-2xl mx-auto px-6 py-32 text-center">
            <p className="text-gray-400 text-lg">아직 콘텐츠가 없습니다.</p>
            <p className="text-gray-300 text-sm mt-2">관리자 편집기에서 섹션을 추가해주세요.</p>
          </div>
        )}
      </main>

      {/* 푸터 */}
      {footerSection && (
        <SectionRenderer section={footerSection} siteSettings={siteSettings} />
      )}
    </div>
  );
}
