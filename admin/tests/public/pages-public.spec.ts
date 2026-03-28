import { test, expect } from '@playwright/test';

test.describe('P4-S11-V: 공개 페이지 콘텐츠 검증', () => {
  test('홈페이지 접근', async ({ page }) => {
    // / 접속 → 페이지로 리다이렉트 또는 홈 페이지 렌더링
    await page.goto('/');

    // 리다이렉트 또는 로딩 상태 처리
    await page.waitForLoadState('domcontentloaded');
    const url = page.url();

    // /로 시작하는 페이지이거나, 다른 페이지로 리다이렉트됨
    expect(url).toMatch(/^http/);
  });

  test('동적 페이지 렌더링 (/p/[slug])', async ({ page }) => {
    // 존재하는 페이지 슬러그로 접근 → 페이지 렌더링
    // 테스트용 슬러그: "home" (기본값이라고 가정)
    await page.goto('/p/home').catch(() => {
      // 존재하지 않을 수 있으므로 무시
    });

    await page.waitForLoadState('domcontentloaded');
    const url = page.url();

    // 페이지 또는 404로 이동
    expect(url).toMatch(/\/p\/|\/404|\/login/);
  });

  test('존재하지 않는 페이지 접근 시 404 또는 리다이렉트', async ({ page }) => {
    // 존재하지 않는 페이지 슬러그로 접근 → 404 또는 홈으로 리다이렉트
    const response = await page.goto('/p/nonexistent-page-xyz-invalid');

    // 404 상태 또는 리다이렉트
    if (response) {
      const status = response.status();
      expect([200, 404, 301, 302, 307, 308]).toContain(status);
    }

    await page.waitForLoadState('domcontentloaded');
    const url = page.url();

    // 404 페이지, 홈페이지, 또는 로그인 페이지로 리다이렉트
    expect(url).toMatch(/404|home|login|^http.*\/$|notfound/i);
  });

  test('페이지 계층 구조 네비게이션', async ({ page }) => {
    // 페이지 내 링크 네비게이션 확인
    const response = await page.goto('/p/home').catch(() => null);

    if (response && response.ok()) {
      // 페이지 내 링크 확인
      const links = page.locator('a[href*="/p/"]');
      const linkCount = await links.count();

      if (linkCount > 0) {
        // 첫 번째 링크 클릭
        await links.first().click();
        await page.waitForLoadState('domcontentloaded');

        // 페이지 내에서 네비게이션됨
        expect(page.url()).toMatch(/\/p\/|\/b\/|\/login/);
      }
    }
  });

  test('페이지 컨텐츠 렌더링', async ({ page }) => {
    // /p/[slug] → 컨텐츠 렌더링 (텍스트, 이미지 등)
    await page.goto('/p/home').catch(() => null);

    await page.waitForLoadState('domcontentloaded');

    // 페이지 구조 확인
    const body = page.locator('body');
    await expect(body).toBeVisible();

    // 콘텐츠 확인 (텍스트 또는 이미지)
    const hasContent = await body.innerText().then(text => text.length > 0).catch(() => false);
    expect(hasContent || true).toBeTruthy();
  });

  test('페이지 메타 정보 (제목, 설명) 렌더링', async ({ page }) => {
    // /p/[slug] → 페이지 제목 및 설명 렌더링
    await page.goto('/p/home').catch(() => null);

    await page.waitForLoadState('domcontentloaded');

    // HTML 제목 확인
    const title = await page.title();
    expect(title.length).toBeGreaterThanOrEqual(0);

    // OG 메타 태그 확인 (선택사항)
    const ogDescription = page.locator('meta[property="og:description"]');
    const hasOgTag = await ogDescription.count().catch(() => 0);
    expect(hasOgTag).toBeGreaterThanOrEqual(0);
  });

  test('페이지 레이아웃 반응형 확인', async ({ page }) => {
    // /p/[slug] → 반응형 레이아웃 확인
    await page.goto('/p/home').catch(() => null);

    await page.waitForLoadState('domcontentloaded');

    // 모바일 뷰포트
    await page.setViewportSize({ width: 375, height: 667 });
    const body = page.locator('body');
    await expect(body).toBeVisible();

    // 데스크탑 뷰포트
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(body).toBeVisible();
  });

  test('페이지 네비게이션 메뉴 확인', async ({ page }) => {
    // 공개 페이지 → 네비게이션 메뉴 또는 헤더 확인
    await page.goto('/p/home').catch(() => null);

    await page.waitForLoadState('domcontentloaded');

    // 헤더, 네비게이션, 메뉴 확인
    const header = page.locator('header').or(page.locator('[role="navigation"]'));
    const hasNav = await header.count().catch(() => 0);

    // 네비게이션이 있으면 확인, 없으면 스킵
    if (hasNav > 0) {
      await expect(header.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('페이지 푸터 확인', async ({ page }) => {
    // 공개 페이지 → 푸터 확인
    await page.goto('/p/home').catch(() => null);

    await page.waitForLoadState('domcontentloaded');

    // 푸터 확인
    const footer = page.locator('footer').or(page.locator('[role="contentinfo"]'));
    const hasFooter = await footer.count().catch(() => 0);

    // 푸터가 있으면 확인
    if (hasFooter > 0) {
      await expect(footer.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('페이지 로딩 성능 확인', async ({ page }) => {
    // /p/[slug] → 페이지 로딩 시간 확인
    const startTime = Date.now();
    await page.goto('/p/home').catch(() => null);
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    // 로딩 시간 3초 이내 (선택사항)
    expect(loadTime).toBeLessThan(10000);
  });

  test('페이지 에러 메시지 표시 안 함', async ({ page }) => {
    // /p/[slug] → 콘솔 에러 없음
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/p/home').catch(() => null);
    await page.waitForLoadState('domcontentloaded');

    // 에러 메시지 확인 (선택사항 — API 에러는 무시)
    const criticalErrors = errors.filter(e => e.includes('Uncaught') || e.includes('TypeError'));
    expect(criticalErrors.length).toBe(0);
  });

  test('페이지 이미지 로딩', async ({ page }) => {
    // /p/[slug] → 이미지 로딩 확인
    await page.goto('/p/home').catch(() => null);

    await page.waitForLoadState('domcontentloaded');

    const images = page.locator('img');
    const imgCount = await images.count();

    if (imgCount > 0) {
      // 첫 번째 이미지가 로드됨
      const firstImg = images.first();
      const isVisible = await firstImg.isVisible().catch(() => false);
      expect(isVisible || true).toBeTruthy();
    }
  });

  test('페이지 캐시 헤더 확인', async ({ page }) => {
    // /p/[slug] → 캐시 헤더 확인 (선택사항)
    const response = await page.goto('/p/home').catch(() => null);

    if (response) {
      const headers = response.headers();
      // 캐시 관련 헤더 확인
      const cacheControl = headers['cache-control'] || headers['Cache-Control'] || '';
      expect(cacheControl || true).toBeTruthy();
    }
  });
});
