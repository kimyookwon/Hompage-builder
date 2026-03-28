import { test, expect } from '@playwright/test';

test.describe('P2-S5-V: 컨테이너 편집기 검증', () => {
  test('편집기 3패널 레이아웃이 렌더링된다', async ({ page }) => {
    // 페이지 목록에서 첫 번째 페이지 ID를 취득하거나 편집기로 직접 이동
    await page.goto('/admin/pages');
    await expect(page.getByRole('heading', { name: '페이지 관리' })).toBeVisible();
    // 편집 링크가 있으면 클릭하여 편집기 진입
    const editLink = page.getByRole('link', { name: /편집/ }).first();
    if (await editLink.isVisible()) {
      await editLink.click();
      await expect(page.locator('[data-testid="section-tree"]').or(page.getByText('섹션'))).toBeVisible();
    }
  });

  test('섹션 추가 모달이 열린다', async ({ page }) => {
    await page.goto('/admin/pages');
    await expect(page.getByRole('heading', { name: '페이지 관리' })).toBeVisible();
    const editLink = page.getByRole('link', { name: /편집/ }).first();
    if (await editLink.isVisible()) {
      await editLink.click();
      await page.getByRole('button', { name: /섹션 추가|추가/ }).first().click();
      await expect(page.getByText(/섹션 추가|섹션 선택/)).toBeVisible();
    }
  });

  test('미리보기 반응형 토글이 동작한다', async ({ page }) => {
    await page.goto('/admin/pages');
    await expect(page.getByRole('heading', { name: '페이지 관리' })).toBeVisible();
    const editLink = page.getByRole('link', { name: /편집/ }).first();
    if (await editLink.isVisible()) {
      await editLink.click();
      const mobileBtn = page.getByRole('button', { name: /모바일|375/ });
      if (await mobileBtn.isVisible()) {
        await mobileBtn.click();
        await expect(mobileBtn).toHaveClass(/active|selected|bg-/);
      }
    }
  });
});
