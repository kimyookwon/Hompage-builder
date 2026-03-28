interface FooterContent {
  text?: string;
  links?: { label: string; url: string }[];
  background_color?: string;
}

interface Props {
  content: FooterContent;
}

export default function FooterSection({ content }: Props) {
  return (
    <footer
      className="w-full mt-auto"
      style={{ backgroundColor: content.background_color || '#1f2937' }}
    >
      <div className="max-w-6xl mx-auto px-6 py-8 text-center">
        {content.links && content.links.length > 0 && (
          <div className="flex justify-center gap-6 mb-4">
            {content.links.map((link, i) => (
              <a
                key={i}
                href={link.url}
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>
        )}
        <p className="text-gray-400 text-sm">
          {content.text || '© 2026 All rights reserved.'}
        </p>
      </div>
    </footer>
  );
}
