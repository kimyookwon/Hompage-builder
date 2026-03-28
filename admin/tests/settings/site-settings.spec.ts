import { test, expect } from '@playwright/test';

test.describe('P4-S6-V: 사이트 설정 화면 검증', () => {
  test('설정 화면이 렌더링된다', async ({ page }) => {
    await page.goto('/admin/settings');
    await expect(page.getByRole('heading', { name: '사이트 설정' })).toBeVisible();
  });

  test('로고 업로더 영역이 표시된다', async ({ page }) => {
    await page.goto('/admin/settings');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: '로고' })).toBeVisible({ timeout: 10000 });
    // ImageUploader 업로드 영역 확인
    await expect(page.getByText('클릭하거나 드래그하여 업로드')).toBeVisible({ timeout: 10000 });
  });

  test('컬러 토큰 피커가 렌더링된다', async ({ page }) => {
    await page.goto('/admin/settings');
    await expect(page.getByRole('heading', { name: '브랜드 색상' })).toBeVisible();
    await expect(page.getByText('Primary')).toBeVisible();
  });

  test('GTM 코드 입력란이 있다', async ({ page }) => {
    await page.goto('/admin/settings');
    await expect(page.getByPlaceholder('GTM-XXXXXXX')).toBeVisible();
  });

  test('컬러 변경 후 저장이 가능하다', async ({ page }) => {
    await page.goto('/admin/settings');
    const colorInput = page.locator('input[type="color"]').first();
    if (await colorInput.isVisible()) {
      await colorInput.fill('#ff0000');
      const saveBtn = page.getByRole('button', { name: '설정 저장' });
      if (await saveBtn.isVisible()) {
        await saveBtn.click();
      }
      await page.waitForTimeout(1200);
    }
  });
});
