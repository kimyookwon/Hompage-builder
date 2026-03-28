import Image from 'next/image';

// ── 공통 타입 ──────────────────────────────────────────────
interface BentoItem {
  id?: number;
  title?: string;
  description?: string;
  image_url?: string;
  size?: 'small' | 'medium' | 'large';
}

interface GlassCard {
  title?: string;
  description?: string;
  icon?: string;
}

interface GalleryImage {
  url: string;
  alt?: string;
  caption?: string;
}

interface ContainerContent {
  // 공통
  title?: string;
  description?: string;
  // bento / organic
  items?: BentoItem[];
  // glassmorphism
  background_image?: string;
  cards?: GlassCard[];
  // text
  subtitle?: string;
  body?: string;
  align?: 'left' | 'center' | 'right';
  // gallery
  images?: GalleryImage[];
}

interface Props {
  format: string;
  content: ContainerContent;
  siteSettings?: { primaryColor?: string; secondaryColor?: string };
}

// ── Bento Grid ─────────────────────────────────────────────
function BentoGrid({ content, primaryColor }: { content: ContainerContent; primaryColor: string }) {
  const items = content.items || [];
  return (
    <section className="max-w-6xl mx-auto px-6 py-16">
      {content.title && (
        <h2 className="text-3xl font-bold text-gray-900 mb-2">{content.title}</h2>
      )}
      {content.description && (
        <p className="text-gray-500 mb-8">{content.description}</p>
      )}
      {items.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[160px]">
          {items.map((item, i) => {
            const span =
              item.size === 'large' ? 'col-span-2 row-span-2' :
              item.size === 'medium' ? 'col-span-2' : '';
            return (
              <div
                key={item.id ?? i}
                className={`${span} relative rounded-2xl overflow-hidden bg-gray-100 flex flex-col justify-end p-4`}
                style={item.image_url ? {
                  backgroundImage: `url(${item.image_url})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                } : { backgroundColor: primaryColor + '18' }}
              >
                {item.image_url && <div className="absolute inset-0 bg-black/30" />}
                <div className="relative">
                  {item.title && (
                    <p className={`font-semibold text-sm ${item.image_url ? 'text-white' : 'text-gray-900'}`}>
                      {item.title}
                    </p>
                  )}
                  {item.description && (
                    <p className={`text-xs mt-0.5 ${item.image_url ? 'text-white/80' : 'text-gray-500'}`}>
                      {item.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="h-40 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
          콘텐츠 없음
        </div>
      )}
    </section>
  );
}

// ── Glassmorphism ──────────────────────────────────────────
function GlassmorphismGrid({ content }: { content: ContainerContent }) {
  const cards = content.cards || [];
  return (
    <section
      className="relative py-20 overflow-hidden"
      style={{
        backgroundImage: content.background_image ? `url(${content.background_image})` : undefined,
        backgroundColor: content.background_image ? undefined : '#1e293b',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative max-w-6xl mx-auto px-6">
        {content.title && (
          <h2 className="text-3xl font-bold text-white mb-2 text-center">{content.title}</h2>
        )}
        {content.description && (
          <p className="text-white/70 mb-10 text-center">{content.description}</p>
        )}
        {cards.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {cards.map((card, i) => (
              <div
                key={i}
                className="rounded-2xl p-6 backdrop-blur-md border border-white/20"
                style={{ background: 'rgba(255,255,255,0.1)' }}
              >
                {card.icon && <p className="text-2xl mb-3">{card.icon}</p>}
                {card.title && <h3 className="text-white font-semibold mb-1">{card.title}</h3>}
                {card.description && <p className="text-white/70 text-sm">{card.description}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ── Organic Shapes ─────────────────────────────────────────
function OrganicSection({ content, primaryColor }: { content: ContainerContent; primaryColor: string }) {
  const items = content.items || [];
  return (
    <section className="max-w-6xl mx-auto px-6 py-16 relative">
      {/* 배경 블롭 */}
      <div
        className="absolute -top-20 -left-20 w-80 h-80 rounded-full opacity-10 blur-3xl"
        style={{ backgroundColor: primaryColor }}
      />
      {content.title && (
        <h2 className="text-3xl font-bold text-gray-900 mb-2 relative">{content.title}</h2>
      )}
      {content.description && (
        <p className="text-gray-500 mb-10 relative">{content.description}</p>
      )}
      {items.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 relative">
          {items.map((item, i) => (
            <div key={item.id ?? i} className="flex flex-col items-start gap-3">
              {item.image_url && (
                <div
                  className="w-16 h-16 rounded-[40%] overflow-hidden flex-shrink-0"
                  style={{ backgroundColor: primaryColor + '30' }}
                >
                  <Image src={item.image_url} alt={item.title || ''} width={64} height={64} className="object-cover w-full h-full" />
                </div>
              )}
              {item.title && <h3 className="font-semibold text-gray-900">{item.title}</h3>}
              {item.description && <p className="text-gray-500 text-sm leading-relaxed">{item.description}</p>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ── Text ───────────────────────────────────────────────────
function TextSection({ content }: { content: ContainerContent }) {
  const align = content.align || 'left';
  const textAlign = align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left';

  return (
    <section className="max-w-3xl mx-auto px-6 py-16">
      <div className={textAlign}>
        {content.title && (
          <h2 className="text-3xl font-bold text-gray-900 mb-2">{content.title}</h2>
        )}
        {content.subtitle && (
          <p className="text-lg text-gray-600 font-medium mb-4">{content.subtitle}</p>
        )}
        {content.body && (
          <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{content.body}</p>
        )}
      </div>
    </section>
  );
}

// ── Gallery ─────────────────────────────────────────────────
function GalleryGrid({ content }: { content: ContainerContent }) {
  const images = content.images || [];
  return (
    <section className="max-w-6xl mx-auto px-6 py-16">
      {content.title && (
        <h2 className="text-3xl font-bold text-gray-900 mb-8">{content.title}</h2>
      )}
      {images.length > 0 ? (
        <div className="columns-2 md:columns-3 gap-4 space-y-4">
          {images.map((img, i) => (
            <div key={i} className="break-inside-avoid rounded-xl overflow-hidden group">
              <div className="relative">
                <Image
                  src={img.url}
                  alt={img.alt || ''}
                  width={600}
                  height={400}
                  className="w-full h-auto object-cover"
                />
                {img.caption && (
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                    <p className="text-white text-sm">{img.caption}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="h-40 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
          이미지 없음
        </div>
      )}
    </section>
  );
}

// ── 메인 디스패처 ──────────────────────────────────────────
export default function ContainerSection({ format, content, siteSettings }: Props) {
  const primaryColor = siteSettings?.primaryColor || '#2563eb';

  switch (format) {
    case 'bento':
      return <BentoGrid content={content} primaryColor={primaryColor} />;
    case 'glassmorphism':
      return <GlassmorphismGrid content={content} />;
    case 'organic':
      return <OrganicSection content={content} primaryColor={primaryColor} />;
    case 'text':
      return <TextSection content={content} />;
    case 'gallery':
      return <GalleryGrid content={content} />;
    default:
      return (
        <section className="max-w-6xl mx-auto px-6 py-12">
          <pre className="text-xs text-gray-400 bg-gray-50 rounded p-4 overflow-auto">
            {JSON.stringify(content, null, 2)}
          </pre>
        </section>
      );
  }
}
