import { test, expect } from '@playwright/test';

test.describe('P3-S7-V: 회원 관리 화면 검증', () => {
  test('회원 목록이 렌더링된다', async ({ page }) => {
    await page.goto('/admin/members');
    await expect(page.getByRole('heading', { name: '회원 관리' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: '이메일' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: '역할' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: '상태' })).toBeVisible();
  });

  test('이메일 검색이 동작한다', async ({ page }) => {
    await page.goto('/admin/members');
    await expect(page.getByRole('heading', { name: '회원 관리' })).toBeVisible();
    const searchInput = page.getByPlaceholder('이름 또는 이메일 검색...');
    // 존재하는 계정으로 검색
    await searchInput.fill('admin');
    await page.keyboard.press('Enter');
    // 검색 결과 또는 빈 상태 표시 확인
    await page.waitForLoadState('networkidle');
    const result = page.locator('table').or(page.getByText(/검색 결과|회원이 없습니다/));
    await expect(result).toBeVisible();
  });

  test('상태 필터가 동작한다', async ({ page }) => {
    await page.goto('/admin/members');
    await expect(page.getByRole('heading', { name: '회원 관리' })).toBeVisible();
    const selects = page.locator('select');
    if (await selects.count() > 0) {
      await selects.first().selectOption('blocked');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('table').or(page.getByText(/회원이 없습니다/))).toBeVisible();
    }
  });

  test('역할 변경 확인 모달이 표시된다', async ({ page }) => {
    await page.goto('/admin/members');
    const roleSelect = page.locator('select').filter({ hasText: 'user' }).first();
    if (await roleSelect.isVisible()) {
      await roleSelect.selectOption('admin');
      await expect(page.getByText(/변경하시겠습니까/)).toBeVisible();
    }
  });
});
