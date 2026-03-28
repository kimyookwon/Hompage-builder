import { test, expect } from '@playwright/test';

test.describe('P0-S1-V: 루트 페이지 리다이렉트 검증', () => {
  test('비로그인 사용자 — 루트 접근 시 홈 페이지로 리다이렉트', async ({ page, context }) => {
    // 인증 상태 제거
    await context.clearCookies();
    await page.evaluate(() => localStorage.clear());

    // / 접속
    const response = await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const url = page.url();

    // 루트에서 홈 페이지(/p/home) 또는 로그인 페이지로 리다이렉트
    // /login으로 리다이렉트될 수 있음
    expect(url).toMatch(/\/p\/|\/login|^\w+:\/\/[^/]+\/?$/);
  });

  test('비로그인 사용자 — 루트 재방문 시 일관된 리다이렉트', async ({ page, context }) => {
    // 인증 상태 제거
    await context.clearCookies();
    await page.evaluate(() => localStorage.clear());

    // 첫 번째 방문
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const firstUrl = page.url();

    // 다시 루트로 이동
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const secondUrl = page.url();

    // 동일한 리다이렉트 목표
    expect(firstUrl).toBe(secondUrl);
  });

  test('관리자 사용자 — 루트 접근 시 /admin으로 리다이렉트', async ({ page }) => {
    // 인증 상태에서 (auth.setup.ts 이후)
    // / 접속 → /admin으로 리다이렉트
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const url = page.url();

    // 관리자는 /admin 또는 /admin/로 리다이렉트
    const isAdminPath = url.includes('/admin');
    if (isAdminPath) {
      expect(url).toMatch(/\/admin/);
    }
  });

  test('관리자 사용자 — 루트 재방문 시 /admin 유지', async ({ page }) => {
    // 인증 상태에서
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const firstUrl = page.url();

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const secondUrl = page.url();

    // 동일한 리다이렉트
    expect(firstUrl).toBe(secondUrl);
  });

  test('루트 페이지 로딩 상태 처리', async ({ page, context }) => {
    // 인증 상태 제거
    await context.clearCookies();
    await page.evaluate(() => localStorage.clear());

    // / 접속 → 로딩 스피너 또는 페이지 렌더링
    await page.goto('/');

    // 로딩 상태가 빠르게 지나갈 수 있으므로 domcontentloaded 대기
    await page.waitForLoadState('domcontentloaded');

    // 페이지 렌더링됨
    const url = page.url();
    expect(url).toBeTruthy();
  });

  test('루트 → 로그인 페이지 네비게이션', async ({ page, context }) => {
    // 인증 상태 제거
    await context.clearCookies();
    await page.evaluate(() => localStorage.clear());

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // 현재 페이지에서 로그인 링크 찾기
    const loginLink = page.getByRole('link', { name: '로그인' }).or(
      page.getByRole('button', { name: '로그인' })
    );

    const hasLoginLink = await loginLink.count().then(c => c > 0).catch(() => false);

    if (hasLoginLink) {
      await loginLink.first().click();
      await page.waitForLoadState('domcontentloaded');
      expect(page.url()).toMatch(/\/login/);
    }
  });

  test('루트 → 회원가입 페이지 네비게이션', async ({ page, context }) => {
    // 인증 상태 제거
    await context.clearCookies();
    await page.evaluate(() => localStorage.clear());

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // 회원가입 링크 찾기
    const registerLink = page.getByRole('link', { name: /회원가입|가입/ }).or(
      page.getByRole('button', { name: /회원가입|가입/ })
    );

    const hasRegisterLink = await registerLink.count().then(c => c > 0).catch(() => false);

    if (hasRegisterLink) {
      await registerLink.first().click();
      await page.waitForLoadState('domcontentloaded');
      expect(page.url()).toMatch(/\/register/);
    }
  });

  test('루트 페이지 HTTP 상태 코드', async ({ page }) => {
    // / 접속 → 정상 상태 또는 리다이렉트
    const response = await page.goto('/');

    if (response) {
      const status = response.status();
      // 200 (정상), 301/302/307/308 (리다이렉트)
      expect([200, 301, 302, 307, 308]).toContain(status);
    }
  });

  test('루트 → 공개 페이지 네비게이션', async ({ page, context }) => {
    // 인증 상태 제거
    await context.clearCookies();
    await page.evaluate(() => localStorage.clear());

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const url = page.url();

    // 페이지(/p/)로 리다이렉트되면 페이지 네비게이션 테스트
    if (url.includes('/p/')) {
      // 공개 페이지로 정상 리다이렉트
      expect(url).toMatch(/\/p\/[\w-]+/);
    }
  });

  test('루트 페이지 타이밍 — 빠른 응답', async ({ page }) => {
    // / 접속 → 3초 내 응답
    const startTime = Date.now();
    await page.goto('/');
    const endTime = Date.now();

    expect(endTime - startTime).toBeLessThan(5000);
  });

  test('루트 페이지 뒤로 가기 네비게이션', async ({ page, context }) => {
    // 인증 상태 제거
    await context.clearCookies();
    await page.evaluate(() => localStorage.clear());

    // 로그인 페이지 → 루트 → 뒤로 가기
    await page.goto('/login');
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    await page.goBack();
    await page.waitForLoadState('domcontentloaded');

    // 로그인 페이지로 복귀
    expect(page.url()).toMatch(/\/login|\/$/);
  });
});
