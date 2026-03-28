'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useRef } from 'react';
import { useSearchSuggest } from '@/hooks/useSearchSuggest';
import { useAuthStore } from '@/stores/authStore';
import NotificationBell from './NotificationBell';

interface Props {
  siteName?: string;
  logoUrl?: string;
  primaryColor?: string;
  homeHref?: string;
}

export default function PublicHeader({ siteName, logoUrl, primaryColor = '#2563eb', homeHref = '/' }: Props) {
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [showSuggest, setShowSuggest] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestions = useSearchSuggest(searchInput);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchInput.trim();
    if (!q) return;
    setSearchOpen(false);
    setShowSuggest(false);
    setSearchInput('');
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  const handleSuggestSelect = (title: string) => {
    setSearchOpen(false);
    setShowSuggest(false);
    setSearchInput('');
    router.push(`/search?q=${encodeURIComponent(title)}`);
  };

  const handleSearchOpen = () => {
    setSearchOpen(true);
    setTimeout(() => searchInputRef.current?.focus(), 50);
  };

  const handleLogout = () => {
    clearAuth();
    window.location.replace(homeHref);
  };

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  const navLinkClass = (href: string) =>
    `text-sm transition-colors ${
      isActive(href)
        ? 'font-semibold text-gray-900'
        : 'text-gray-500 hover:text-gray-800'
    }`;

  return (
    <header className="w-full sticky top-0 z-50 shadow-sm bg-white border-b">
      <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
        {/* 로고 + 홈 링크 */}
        <a href={homeHref} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity shrink-0">
          {logoUrl && (
            <Image
              src={logoUrl}
              alt="로고"
              width={28}
              height={28}
              className="object-contain"
              unoptimized
            />
          )}
          {(siteName || !logoUrl) && (
            <span className="font-semibold text-base" style={{ color: primaryColor }}>
              {siteName || '홈'}
            </span>
          )}
        </a>

        {/* 중앙 네비게이션 — 데스크톱 */}
        <nav className="hidden sm:flex items-center gap-5">
          <Link href="/boards" className={navLinkClass('/boards')}>게시판</Link>
        </nav>

        {/* 검색 버튼 + 인라인 폼 — 데스크톱 */}
        <div className="hidden sm:flex items-center">
          {searchOpen ? (
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-1">
              <div className="relative">
                <input
                  ref={searchInputRef}
                  type="search"
                  value={searchInput}
                  onChange={(e) => { setSearchInput(e.target.value); setShowSuggest(true); }}
                  onFocus={() => setShowSuggest(true)}
                  onBlur={() => setTimeout(() => setShowSuggest(false), 150)}
                  onKeyDown={(e) => e.key === 'Escape' && setSearchOpen(false)}
                  placeholder="검색..."
                  className="w-44 px-3 py-1.5 text-xs border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-400 transition-all"
                  autoComplete="off"
                />
                {/* 자동완성 드롭다운 */}
                {showSuggest && suggestions.length > 0 && (
                  <ul className="absolute left-0 top-full mt-1 z-50 w-64 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                    {suggestions.map((title, i) => (
                      <li key={i}>
                        <button
                          type="button"
                          onMouseDown={() => handleSuggestSelect(title)}
                          className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors truncate flex items-center gap-1.5"
                        >
                          <svg className="w-3 h-3 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M16.65 16.65A7.5 7.5 0 1116.65 2a7.5 7.5 0 010 14.65z" />
                          </svg>
                          <span className="truncate">{title}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <button
                type="submit"
                className="p-1.5 text-gray-500 hover:text-blue-600 transition-colors"
                aria-label="검색 실행"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M16.65 16.65A7.5 7.5 0 1116.65 2a7.5 7.5 0 010 14.65z" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="닫기"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </form>
          ) : (
            <button
              onClick={handleSearchOpen}
              className="p-1.5 text-gray-500 hover:text-gray-800 transition-colors"
              aria-label="검색"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M16.65 16.65A7.5 7.5 0 1116.65 2a7.5 7.5 0 010 14.65z" />
              </svg>
            </button>
          )}
        </div>

        {/* 우측 사용자 메뉴 — 데스크톱 */}
        <div className="hidden sm:flex items-center gap-3 text-sm shrink-0">
          {user ? (
            <>
              {/* 알림 벨 */}
              <NotificationBell />
              <Link href="/my" className={`flex items-center gap-2 ${navLinkClass('/my')}`}>
                {user.avatarUrl ? (
                  <Image
                    src={user.avatarUrl}
                    alt={user.name}
                    width={24}
                    height={24}
                    className="w-6 h-6 rounded-full object-cover border"
                    unoptimized
                  />
                ) : (
                  <span className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-semibold text-blue-600 border shrink-0">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                )}
                {user.name}
              </Link>
              <button
                onClick={handleLogout}
                className="text-gray-400 hover:text-gray-600 transition-colors text-xs"
              >
                로그아웃
              </button>
            </>
          ) : (
            <>
              <Link
                href="/register"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                회원가입
              </Link>
              <Link
                href="/login"
                className="px-3 py-1.5 text-white rounded-lg text-xs font-medium hover:opacity-90 transition-opacity"
                style={{ backgroundColor: primaryColor }}
              >
                로그인
              </Link>
            </>
          )}
        </div>

        {/* 모바일 햄버거 버튼 */}
        <button
          className="sm:hidden p-1.5 rounded text-gray-500 hover:bg-gray-100 transition-colors"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="메뉴"
        >
          {menuOpen ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* 모바일 드롭다운 메뉴 */}
      {menuOpen && (
        <div className="sm:hidden border-t bg-white px-6 py-3 space-y-3">
          {/* 모바일 검색 폼 */}
          <form
            onSubmit={(e) => { setMenuOpen(false); handleSearchSubmit(e); }}
            className="flex gap-1"
          >
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="검색..."
              className="flex-1 px-3 py-1.5 text-xs border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs"
            >
              검색
            </button>
          </form>
          <Link
            href="/boards"
            className={`block text-sm ${isActive('/boards') ? 'font-semibold text-gray-900' : 'text-gray-600'}`}
            onClick={() => setMenuOpen(false)}
          >
            게시판
          </Link>
          {user ? (
            <>
              <Link
                href="/my"
                className={`block text-sm ${isActive('/my') ? 'font-semibold text-gray-900' : 'text-gray-600'}`}
                onClick={() => setMenuOpen(false)}
              >
                {user.name} (마이페이지)
              </Link>
              <button
                onClick={() => { setMenuOpen(false); handleLogout(); }}
                className="block text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                로그아웃
              </button>
            </>
          ) : (
            <>
              <Link
                href="/register"
                className="block text-sm text-gray-600"
                onClick={() => setMenuOpen(false)}
              >
                회원가입
              </Link>
              <Link
                href="/login"
                className="block text-sm font-medium"
                style={{ color: primaryColor }}
                onClick={() => setMenuOpen(false)}
              >
                로그인
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
