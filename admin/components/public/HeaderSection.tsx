import Image from 'next/image';

interface HeaderContent {
  title?: string;
  subtitle?: string;
  logo_url?: string;
  nav_links?: { label: string; url: string }[];
  background_color?: string;
}

interface Props {
  content: HeaderContent;
  siteSettings?: {
    logoUrl?: string;
    primaryColor?: string;
  };
}

export default function HeaderSection({ content, siteSettings }: Props) {
  const logoUrl = content.logo_url || siteSettings?.logoUrl;
  const primaryColor = siteSettings?.primaryColor || '#2563eb';

  return (
    <header
      className="w-full sticky top-0 z-50 shadow-sm"
      style={{ backgroundColor: content.background_color || '#ffffff' }}
    >
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* 로고 / 사이트명 */}
        <div className="flex items-center gap-3">
          {logoUrl && (
            <Image
              src={logoUrl}
              alt="로고"
              width={40}
              height={40}
              className="object-contain"
            />
          )}
          {content.title && (
            <span className="text-xl font-bold" style={{ color: primaryColor }}>
              {content.title}
            </span>
          )}
        </div>

        {/* 네비게이션 */}
        {content.nav_links && content.nav_links.length > 0 && (
          <nav className="hidden md:flex items-center gap-6">
            {content.nav_links.map((link, i) => (
              <a
                key={i}
                href={link.url}
                className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
