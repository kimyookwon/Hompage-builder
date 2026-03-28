import { test, expect } from '@playwright/test';

test.describe('P2-S4-V: 페이지 관리 화면 검증', () => {
  test('페이지 목록이 렌더링된다', async ({ page }) => {
    await page.goto('/admin/pages');
    await expect(page.getByRole('heading', { name: '페이지 관리' })).toBeVisible();
    // 데이터가 없으면 빈 상태 메시지, 있으면 테이블 헤더
    const content = page.getByText('페이지가 없습니다.').or(
      page.getByRole('columnheader', { name: '제목' })
    );
    await expect(content).toBeVisible();
  });

  test('새 페이지 생성 모달이 열린다', async ({ page }) => {
    await page.goto('/admin/pages');
    await expect(page.getByRole('heading', { name: '페이지 관리' })).toBeVisible();
    await page.getByRole('button', { name: /새 페이지/ }).click();
    await expect(page.getByRole('heading', { name: '새 페이지 만들기' })).toBeVisible();
    await expect(page.getByLabel('페이지 제목')).toBeVisible();
  });

  test('페이지 생성 후 목록에 반영된다', async ({ page }) => {
    await page.goto('/admin/pages');
    await expect(page.getByRole('heading', { name: '페이지 관리' })).toBeVisible();
    await page.getByRole('button', { name: /새 페이지/ }).click();
    await expect(page.getByRole('heading', { name: '새 페이지 만들기' })).toBeVisible();
    await page.getByLabel('페이지 제목').fill('Test Page E2E');
    await page.getByRole('button', { name: /페이지 만들기|생성/ }).click();
    await expect(page.getByText('Test Page E2E')).toBeVisible({ timeout: 10000 });
  });

  test('발행 토글이 동작한다', async ({ page }) => {
    await page.goto('/admin/pages');
    const toggle = page.locator('input[type="checkbox"]').first();
    if (await toggle.isVisible()) {
      const initialState = await toggle.isChecked();
      await toggle.click();
      await expect(toggle).toBeChecked({ checked: !initialState });
    }
  });

  test('삭제 확인 모달이 표시된다', async ({ page }) => {
    await page.goto('/admin/pages');
    const deleteButton = page.getByRole('button', { name: /삭제/ }).first();
    if (await deleteButton.isVisible()) {
      await deleteButton.click();
      await expect(page.getByText(/삭제하시겠습니까/)).toBeVisible();
    }
  });
});
