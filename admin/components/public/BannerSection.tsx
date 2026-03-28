interface BannerContent {
  title?: string;
  subtitle?: string;
  description?: string;
  background_image?: string;
  background_color?: string;
  cta_label?: string;
  cta_url?: string;
  align?: 'left' | 'center' | 'right';
}

interface Props {
  content: BannerContent;
  siteSettings?: { primaryColor?: string };
}

export default function BannerSection({ content, siteSettings }: Props) {
  const primaryColor = siteSettings?.primaryColor || '#2563eb';
  const align = content.align || 'center';
  const alignClass = align === 'left' ? 'text-left' : align === 'right' ? 'text-right' : 'text-center';
  const itemsClass = align === 'left' ? 'items-start' : align === 'right' ? 'items-end' : 'items-center';

  return (
    <section
      className="w-full relative overflow-hidden"
      style={{
        backgroundColor: content.background_color || '#f8fafc',
        backgroundImage: content.background_image ? `url(${content.background_image})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* 배경 이미지 오버레이 */}
      {content.background_image && (
        <div className="absolute inset-0 bg-black/40" />
      )}

      <div className={`relative max-w-4xl mx-auto px-6 py-24 flex flex-col gap-4 ${itemsClass} ${alignClass}`}>
        {content.title && (
          <h1 className={`text-4xl md:text-5xl font-extrabold leading-tight ${content.background_image ? 'text-white' : 'text-gray-900'}`}>
            {content.title}
          </h1>
        )}
        {content.subtitle && (
          <p className={`text-xl font-medium ${content.background_image ? 'text-white/90' : 'text-gray-700'}`}>
            {content.subtitle}
          </p>
        )}
        {content.description && (
          <p className={`text-base max-w-xl ${content.background_image ? 'text-white/80' : 'text-gray-600'}`}>
            {content.description}
          </p>
        )}
        {content.cta_label && (
          <a
            href={content.cta_url || '#'}
            className="mt-4 inline-block px-8 py-3 rounded-lg text-white font-semibold text-sm transition-opacity hover:opacity-90"
            style={{ backgroundColor: primaryColor }}
          >
            {content.cta_label}
          </a>
        )}
      </div>
    </section>
  );
}
