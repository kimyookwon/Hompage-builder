'use client';

import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { ImageUploader } from '@/components/common/ImageUploader';
import { ColorTokenPicker } from '@/components/settings/ColorTokenPicker';
import { GtmCodeInput } from '@/components/settings/GtmCodeInput';
import { OAuthSettings } from '@/components/settings/OAuthSettings';
import { SiteTransferPanel } from '@/components/settings/SiteTransferPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { SiteSettings, Page } from '@/types';
import { useAppStore } from '@/stores/appStore';

export default function SettingsPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [primaryColor, setPrimaryColor] = useState('#3b82f6');
  const [secondaryColor, setSecondaryColor] = useState('#8b5cf6');
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [siteName, setSiteName] = useState('');
  const [gtmCode, setGtmCode] = useState('');
  const [homeSlug, setHomeSlug] = useState('');
  const [noticeEnabled, setNoticeEnabled] = useState(false);
  const [noticeText, setNoticeText] = useState('');
  const [noticeColor, setNoticeColor] = useState('#1d4ed8');
  const [siteUrl, setSiteUrl] = useState('');
  const [robotsTxt, setRobotsTxt] = useState('');
  const [publishedPages, setPublishedPages] = useState<Page[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const addToast = useAppStore((s) => s.addToast);

  useEffect(() => {
    Promise.all([
      api.get<SiteSettings>('/site-settings'),
      api.get<{ items: Page[]; pagination: unknown }>('/pages?limit=100'),
    ]).then(([settingsRes, pagesRes]) => {
      const s = settingsRes.data;
      setSettings(s);
      setPrimaryColor(s.primaryColor);
      setSecondaryColor(s.secondaryColor);
      setBackgroundColor(s.backgroundColor);
      setSiteName(s.siteName ?? '');
      setGtmCode(s.gtmCode ?? '');
      setHomeSlug(s.homeSlug ?? '');
      setNoticeEnabled(s.noticeEnabled ?? false);
      setNoticeText(s.noticeText ?? '');
      setNoticeColor(s.noticeColor ?? '#1d4ed8');
      setSiteUrl(s.siteUrl ?? '');
      setRobotsTxt(s.robotsTxt ?? '');
      setPublishedPages(pagesRes.data.items.filter((p) => p.isPublished));
    }).catch(() => addToast('설정을 불러오지 못했습니다.', 'destructive'));
  }, [addToast]);

  const handleLogoChange = (url: string) => {
    setSettings((prev) => prev ? { ...prev, logoUrl: url || null } : prev);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await api.patch<SiteSettings>('/site-settings', {
        site_name: siteName || null,
        logo_url: settings?.logoUrl ?? null,
        primary_color: primaryColor,
        secondary_color: secondaryColor,
        background_color: backgroundColor,
        gtm_code: gtmCode || null,
        home_slug: homeSlug || null,
        notice_enabled: noticeEnabled ? 1 : 0,
        notice_text: noticeText || null,
        notice_color: noticeColor,
        site_url: siteUrl || null,
        robots_txt: robotsTxt || null,
      });
      setSettings(res.data);
      addToast('설정이 저장되었습니다.');
    } catch {
      addToast('설정 저장에 실패했습니다.', 'destructive');
    } finally {
      setIsSaving(false);
    }
  };

  if (!settings) {
    return (
      <AdminLayout>
        <div className="text-center py-12 text-muted-foreground">불러오는 중...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold">사이트 설정</h1>
          <p className="text-muted-foreground text-sm">로고, 색상, 트래킹 코드를 관리합니다.</p>
        </div>

        {/* 기본 정보 */}
        <section className="rounded-lg border p-6 space-y-4">
          <h2 className="font-semibold">기본 정보</h2>
          <div className="space-y-1">
            <Label>사이트 이름</Label>
            <Input
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              placeholder="내 홈페이지"
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground">헤더와 브라우저 탭 타이틀에 표시됩니다.</p>
          </div>
        </section>

        {/* 로고 */}
        <section className="rounded-lg border p-6 space-y-4">
          <h2 className="font-semibold">로고</h2>
          <ImageUploader
            value={settings.logoUrl ?? ''}
            onChange={handleLogoChange}
            previewHeight="h-20"
          />
        </section>

        {/* 색상 */}
        <section className="rounded-lg border p-6 space-y-4">
          <h2 className="font-semibold">브랜드 색상</h2>
          <div className="space-y-3">
            <ColorTokenPicker label="Primary" value={primaryColor} onChange={setPrimaryColor} />
            <ColorTokenPicker label="Secondary" value={secondaryColor} onChange={setSecondaryColor} />
            <ColorTokenPicker label="Background" value={backgroundColor} onChange={setBackgroundColor} />
          </div>
        </section>

        {/* 홈 페이지 설정 */}
        <section className="rounded-lg border p-6 space-y-4">
          <div>
            <h2 className="font-semibold">홈 페이지</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              방문자가 <code className="text-xs bg-muted px-1 py-0.5 rounded">/</code> 에 접속할 때 표시할 페이지를 선택합니다.
            </p>
          </div>
          <select
            value={homeSlug}
            onChange={(e) => setHomeSlug(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm bg-background"
          >
            <option value="">— 선택 안 함 (로그인 페이지로 이동) —</option>
            {publishedPages.map((p) => (
              <option key={p.id} value={p.slug}>
                {p.title} ({p.slug})
              </option>
            ))}
          </select>
        </section>

        {/* 공지 배너 */}
        <section className="rounded-lg border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">공지 배너</h2>
              <p className="text-xs text-muted-foreground mt-0.5">모든 공개 페이지 상단에 표시됩니다.</p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <span className="text-sm text-muted-foreground">{noticeEnabled ? '활성' : '비활성'}</span>
              <button
                type="button"
                role="switch"
                aria-checked={noticeEnabled}
                onClick={() => setNoticeEnabled((v) => !v)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  noticeEnabled ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
                    noticeEnabled ? 'translate-x-4' : 'translate-x-1'
                  }`}
                />
              </button>
            </label>
          </div>

          <div className="space-y-1">
            <Label>공지 내용</Label>
            <textarea
              value={noticeText}
              onChange={(e) => setNoticeText(e.target.value)}
              placeholder="공지 내용을 입력하세요. (예: 서버 점검 안내, 이벤트 공지 등)"
              rows={2}
              maxLength={200}
              className="w-full border rounded-md px-3 py-2 text-sm bg-background resize-none outline-none focus:ring-2 focus:ring-ring"
            />
            <p className="text-xs text-muted-foreground text-right">{noticeText.length}/200</p>
          </div>

          <div className="space-y-1">
            <Label>배너 색상</Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={noticeColor}
                onChange={(e) => setNoticeColor(e.target.value)}
                className="h-9 w-14 rounded border cursor-pointer"
              />
              <Input
                value={noticeColor}
                onChange={(e) => setNoticeColor(e.target.value)}
                placeholder="#1d4ed8"
                className="w-32 font-mono text-sm"
                maxLength={7}
              />
              {noticeEnabled && noticeText && (
                <div
                  className="flex-1 rounded px-3 py-1.5 text-white text-xs truncate"
                  style={{ backgroundColor: noticeColor }}
                >
                  {noticeText}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* SEO */}
        <section className="rounded-lg border p-6 space-y-4">
          <div>
            <h2 className="font-semibold">SEO</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              sitemap.xml과 robots.txt를 자동 생성합니다.
            </p>
          </div>
          <div className="space-y-1">
            <Label>사이트 URL</Label>
            <Input
              value={siteUrl}
              onChange={(e) => setSiteUrl(e.target.value)}
              placeholder="https://example.com"
              type="url"
            />
            <p className="text-xs text-muted-foreground">
              <code className="bg-muted px-1 py-0.5 rounded text-xs">/sitemap.xml</code>에 포함될 기본 URL입니다.
              미입력 시 요청 호스트를 사용합니다.
            </p>
          </div>
          <div className="space-y-1">
            <Label>robots.txt 커스텀 내용</Label>
            <textarea
              value={robotsTxt}
              onChange={(e) => setRobotsTxt(e.target.value)}
              placeholder={`User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: https://example.com/sitemap.xml`}
              rows={6}
              className="w-full border rounded-md px-3 py-2 text-sm bg-background font-mono resize-y outline-none focus:ring-2 focus:ring-ring"
            />
            <p className="text-xs text-muted-foreground">
              비워두면 기본값이 사용됩니다.
              <a href="/robots.txt" target="_blank" className="ml-2 underline text-primary">미리보기</a>
            </p>
          </div>
        </section>

        {/* GTM */}
        <section className="rounded-lg border p-6 space-y-4">
          <h2 className="font-semibold">Analytics</h2>
          <GtmCodeInput value={gtmCode} onChange={setGtmCode} />
        </section>

        {/* OAuth 설정 */}
        <section className="rounded-lg border p-6 space-y-4">
          <h2 className="font-semibold">OAuth 설정</h2>
          <OAuthSettings />
        </section>

        {/* 사이트 내보내기/가져오기 */}
        <section className="rounded-lg border p-6 space-y-4">
          <h2 className="font-semibold">사이트 복사 (내보내기 / 가져오기)</h2>
          <SiteTransferPanel />
        </section>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? '저장 중...' : '설정 저장'}
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
