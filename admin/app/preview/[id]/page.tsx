'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
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
}

interface PreviewData {
  page: { id: number; title: string; slug: string; isPublished: boolean };
  sections: Section[];
  siteSettings: SiteSettings;
}

export default function PreviewPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<PreviewData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<PreviewData>(`/pages/${id}/preview`)
      .then((res) => setData(res.data))
      .catch(() => setError('페이지 데이터를 불러오지 못했습니다.'));
  }, [id]);

  // 부모 편집기에서 새로고침 메시지 수신
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data === 'preview:refresh') {
        api.get<PreviewData>(`/pages/${id}/preview`)
          .then((res) => setData(res.data))
          .catch(() => {});
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [id]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-500 text-sm">
        {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-400 text-sm">
        불러오는 중...
      </div>
    );
  }

  const { sections, siteSettings } = data;
  const bgColor = siteSettings.backgroundColor || '#ffffff';

  const headerSection = sections.find((s) => s.type === 'header');
  const footerSection = sections.find((s) => s.type === 'footer');
  const bodySections = sections.filter((s) => s.type !== 'header' && s.type !== 'footer');

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: bgColor }}>
      {headerSection && <SectionRenderer section={headerSection} siteSettings={siteSettings} />}
      <main className="flex-1">
        {bodySections.length > 0 ? (
          bodySections.map((section) => (
            <SectionRenderer key={section.id} section={section} siteSettings={siteSettings} />
          ))
        ) : (
          <div className="max-w-2xl mx-auto px-6 py-32 text-center">
            <p className="text-gray-400">아직 섹션이 없습니다.</p>
            <p className="text-gray-300 text-sm mt-1">왼쪽 패널에서 섹션을 추가해주세요.</p>
          </div>
        )}
      </main>
      {footerSection && <SectionRenderer section={footerSection} siteSettings={siteSettings} />}
    </div>
  );
}
