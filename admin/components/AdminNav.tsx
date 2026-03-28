'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  MessageCircle,
  Users,
  Image,
  Settings,
  LogOut,
  Menu,
  X,
  Moon,
  Sun,
  Flag,
  Paperclip,
  Bell,
  History,
  HeartPulse,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { SiteSettings } from '@/types';
import { NotificationBell } from '@/components/NotificationBell';

const navItems = [
  { href: '/admin', label: '대시보드', icon: LayoutDashboard },
  { href: '/admin/pages', label: '페이지 관리', icon: FileText },
  { href: '/admin/boards', label: '게시판 관리', icon: MessageSquare },
  { href: '/admin/comments', label: '댓글 관리', icon: MessageCircle },
  { href: '/admin/members', label: '회원 관리', icon: Users },
  { href: '/admin/media', label: '미디어 관리', icon: Image },
  { href: '/admin/attachments', label: '첨부파일 통계', icon: Paperclip },
  { href: '/admin/reports', label: '신고 관리', icon: Flag },
  { href: '/admin/notices', label: '공지 관리', icon: Bell },
  { href: '/admin/logs', label: '활동 로그', icon: History },
  { href: '/admin/settings', label: '사이트 설정', icon: Settings },
  { href: '/admin/health', label: '시스템 상태', icon: HeartPulse },
];

export function AdminNav() {
  const pathname = usePathname();
  const { user, clearAuth } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [siteName, setSiteName] = useState<string | null>(null);
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    api.get<SiteSettings>('/site-settings')
      .then((res) => setSiteName(res.data.siteName ?? null))
      .catch(() => {});
  }, []);

  const handleLogout = () => {
    clearAuth();
    window.location.href = '/login';
  };

  const NavContent = () => (
    <>
      {/* 로고 + 알림 */}
      <div className="flex items-center justify-between px-4 py-5 border-b">
        <span className="font-bold text-lg truncate">{siteName ?? '홈페이지 빌더'}</span>
        {user && <NotificationBell />}
      </div>

      {/* 사용자 정보 */}
      {user && (
        <div className="px-4 py-3 border-b">
          <p className="text-sm font-medium truncate">{user.name}</p>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        </div>
      )}

      {/* 네비게이션 메뉴 */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          // 대시보드는 정확히 /admin일 때만 활성화
          const isActive = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setIsMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* 다크모드 토글 + 로그아웃 */}
      <div className="px-2 py-4 border-t space-y-1">
        {mounted && (
          <button
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            className="flex items-center gap-3 px-3 py-2 w-full rounded-md text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            {resolvedTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            {resolvedTheme === 'dark' ? '라이트 모드' : '다크 모드'}
          </button>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-md text-sm text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut size={18} />
          로그아웃
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* 데스크톱 사이드바 */}
      <aside className="hidden md:flex flex-col w-60 border-r bg-background h-screen sticky top-0">
        <NavContent />
      </aside>

      {/* 모바일 헤더 */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 border-b bg-background sticky top-0 z-40">
        <span className="font-bold truncate">{siteName ?? '홈페이지 빌더'}</span>
        <div className="flex items-center gap-1">
          {user && <NotificationBell />}
          <Button variant="ghost" size="icon" onClick={() => setIsMobileOpen(!isMobileOpen)}>
            {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>
        </div>
      </div>

      {/* 모바일 드로어 */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-black/50" onClick={() => setIsMobileOpen(false)}>
          <aside
            className="flex flex-col w-60 h-full bg-background border-r"
            onClick={(e) => e.stopPropagation()}
          >
            <NavContent />
          </aside>
        </div>
      )}
    </>
  );
}
