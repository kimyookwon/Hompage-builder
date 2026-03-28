/**
 * 다크 모드 토글 스크립트
 * 로컬스토리지 기반 테마 저장, 시스템 설정 자동 감지
 */
(function () {
  const STORAGE_KEY = 'site-theme';
  const DARK = 'dark';
  const LIGHT = 'light';

  // 초기 테마 결정 (깜빡임 방지를 위해 즉시 실행)
  function getInitialTheme() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === DARK || stored === LIGHT) return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? DARK : LIGHT;
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);

    const toggleBtn = document.getElementById('dark-mode-toggle');
    if (toggleBtn) {
      const icon = toggleBtn.querySelector('.dark-mode-toggle__icon');
      if (icon) icon.textContent = theme === DARK ? '☀️' : '🌙';
      toggleBtn.setAttribute('aria-label', theme === DARK ? '라이트 모드로 전환' : '다크 모드로 전환');
    }
  }

  // 페이지 로드 전 즉시 테마 적용
  applyTheme(getInitialTheme());

  // DOM 로드 후 토글 버튼 이벤트 등록
  document.addEventListener('DOMContentLoaded', function () {
    const toggleBtn = document.getElementById('dark-mode-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', function () {
        const current = document.documentElement.getAttribute('data-theme');
        applyTheme(current === DARK ? LIGHT : DARK);
      });
    }

    // reveal 애니메이션 (Intersection Observer)
    const revealEls = document.querySelectorAll('.reveal');
    if (revealEls.length > 0 && 'IntersectionObserver' in window) {
      const observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1 });

      revealEls.forEach(function (el) { observer.observe(el); });
    } else {
      // IntersectionObserver 미지원 시 즉시 표시
      revealEls.forEach(function (el) { el.classList.add('is-visible'); });
    }

    // 모바일 네비게이션 토글
    const hamburger = document.getElementById('nav-hamburger');
    const navMenu = document.getElementById('nav-menu');
    if (hamburger && navMenu) {
      hamburger.addEventListener('click', function () {
        const isOpen = navMenu.classList.toggle('is-open');
        hamburger.setAttribute('aria-expanded', String(isOpen));
        document.body.style.overflow = isOpen ? 'hidden' : '';
      });
    }

    // 시스템 테마 변경 감지
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
      if (!localStorage.getItem(STORAGE_KEY)) {
        applyTheme(e.matches ? DARK : LIGHT);
      }
    });
  });
})();
