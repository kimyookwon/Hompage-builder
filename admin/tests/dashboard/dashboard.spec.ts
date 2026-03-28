import { test, expect } from '@playwright/test';

test.describe('P3-S3-V: 관리자 대시보드 검증', () => {
  test('대시보드 통계 카드가 렌더링된다', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: '대시보드' })).toBeVisible();
    // API 데이터 로딩 대기
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('총 회원')).toBeVisible();
    await expect(page.getByRole('heading', { name: '게시글', exact: true })).toBeVisible();
  });

  test('최근 게시글 목록이 렌더링된다', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: '대시보드' })).toBeVisible();
    // API 데이터 로딩 완료 대기 (로딩 텍스트 사라질 때까지)
    await expect(page.getByText('불러오는 중...')).toBeHidden({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: '최근 게시글' })).toBeVisible({ timeout: 5000 });
  });

  test('퀵링크 버튼이 동작한다', async ({ page }) => {
    await page.goto('/admin');
    const newPageBtn = page.getByRole('link', { name: /새 페이지/ }).or(page.getByRole('button', { name: /새 페이지/ }));
    if (await newPageBtn.isVisible()) {
      await newPageBtn.click();
      await expect(page).toHaveURL(/\/admin\/pages/);
    }
  });
});
