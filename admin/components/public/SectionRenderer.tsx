import HeaderSection from './HeaderSection';
import FooterSection from './FooterSection';
import BannerSection from './BannerSection';
import ContainerSection from './ContainerSection';
import BoardWidgetSection from './BoardWidgetSection';

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
}

interface Props {
  section: Section;
  siteSettings?: SiteSettings;
}

export default function SectionRenderer({ section, siteSettings }: Props) {
  const { type, format, content } = section;

  switch (type) {
    case 'header':
      return (
        <HeaderSection
          content={content as Parameters<typeof HeaderSection>[0]['content']}
          siteSettings={siteSettings}
        />
      );
    case 'footer':
      return (
        <FooterSection
          content={content as Parameters<typeof FooterSection>[0]['content']}
        />
      );
    case 'banner':
      return (
        <BannerSection
          content={content as Parameters<typeof BannerSection>[0]['content']}
          siteSettings={siteSettings}
        />
      );
    case 'container':
      if (format === 'board_widget') {
        return (
          <BoardWidgetSection
            content={content as Parameters<typeof BoardWidgetSection>[0]['content']}
          />
        );
      }
      return (
        <ContainerSection
          format={format}
          content={content as Parameters<typeof ContainerSection>[0]['content']}
          siteSettings={siteSettings}
        />
      );
    default:
      return null;
  }
}
