'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Monitor, Tablet, Smartphone, RefreshCw, ExternalLink } from 'lucide-react';

const BREAKPOINTS = [
  { label: 'mobile', width: 375, icon: Smartphone },
  { label: 'tablet', width: 768, icon: Tablet },
  { label: 'desktop', width: 1200, icon: Monitor },
] as const;

type Breakpoint = (typeof BREAKPOINTS)[number]['label'];

interface PreviewPanelProps {
  pageId: string | number;
  slug?: string;
  refreshKey?: number;
}

export function PreviewPanel({ pageId, slug, refreshKey }: PreviewPanelProps) {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('desktop');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const current = BREAKPOINTS.find((b) => b.label === breakpoint)!;

  const previewUrl = `/preview/${pageId}`;
  const publicUrl = slug ? `/p/${slug}` : null;

  const refresh = useCallback(() => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage('preview:refresh', '*');
    }
  }, []);

  useEffect(() => {
    if (refreshKey !== undefined && refreshKey > 0) {
      refresh();
    }
  }, [refreshKey, refresh]);

  return (
    <div className="flex flex-col h-full">
      {/* 툴바 */}
      <div className="flex items-center gap-1 p-2 border-b bg-background shrink-0">
        {BREAKPOINTS.map(({ label, icon: Icon }) => (
          <Button
            key={label}
            size="sm"
            variant={breakpoint === label ? 'default' : 'ghost'}
            onClick={() => setBreakpoint(label)}
            title={`${label} (${BREAKPOINTS.find((b) => b.label === label)!.width}px)`}
          >
            <Icon size={16} />
          </Button>
        ))}
        <span className="ml-1 text-xs text-muted-foreground">{current.width}px</span>
        <div className="flex-1" />
        <Button size="sm" variant="ghost" onClick={refresh} title="미리보기 새로고침">
          <RefreshCw size={14} />
        </Button>
        {publicUrl && (
          <Button size="sm" variant="ghost" asChild title="공개 페이지 열기">
            <a href={publicUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink size={14} />
            </a>
          </Button>
        )}
      </div>

      {/* 미리보기 iframe */}
      <div className="flex-1 overflow-auto bg-muted/30 flex items-start justify-center p-4">
        <iframe
          ref={iframeRef}
          src={previewUrl}
          style={{ width: current.width, maxWidth: '100%' }}
          className="border bg-white rounded shadow-sm min-h-[500px] transition-all duration-300"
          title="페이지 미리보기"
        />
      </div>
    </div>
  );
}
