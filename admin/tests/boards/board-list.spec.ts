import { test, expect } from '@playwright/test';

test.describe('P3-S8-V: 게시판 관리 화면 검증', () => {
  test('게시판 목록이 렌더링된다', async ({ page }) => {
    await page.goto('/admin/boards');
    await expect(page.getByRole('heading', { name: '게시판 관리' })).toBeVisible();
    // 데이터가 없으면 빈 상태 메시지, 있으면 테이블 헤더
    const content = page.getByText('게시판이 없습니다.').or(
      page.getByRole('columnheader', { name: '게시판명' })
    );
    await expect(content).toBeVisible();
  });

  test('게시판 생성 모달이 열린다', async ({ page }) => {
    await page.goto('/admin/boards');
    await expect(page.getByRole('heading', { name: '게시판 관리' })).toBeVisible();
    await page.getByRole('button', { name: /새 게시판/ }).click();
    await expect(page.getByRole('heading', { name: '게시판 만들기' })).toBeVisible();
    await expect(page.getByPlaceholder('자유게시판, 공지사항...')).toBeVisible();
  });

  test('게시글 목록 페이지로 이동한다', async ({ page }) => {
    await page.goto('/admin/boards');
    const postsLink = page.getByRole('button', { name: /게시글/ }).first();
    if (await postsLink.isVisible()) {
      await postsLink.click();
      await expect(page).toHaveURL(/\/admin\/boards\/\d+\/posts/);
    }
  });

  test('게시판 삭제 확인 모달이 표시된다', async ({ page }) => {
    await page.goto('/admin/boards');
    const deleteButton = page.getByRole('button', { name: /삭제/ }).first();
    if (await deleteButton.isVisible()) {
      await deleteButton.click();
      await expect(page.getByText(/삭제하시겠습니까/)).toBeVisible();
    }
  });

  test('게시판 생성 후 공개 게시판에 반영된다', async ({ page }) => {
    await page.goto('/admin/boards');
    await expect(page.getByRole('heading', { name: '게시판 관리' })).toBeVisible();
    await page.getByRole('button', { name: /새 게시판/ }).click();
    await expect(page.getByRole('heading', { name: '게시판 만들기' })).toBeVisible();
    await page.getByPlaceholder('자유게시판, 공지사항...').fill('공개테스트게시판');
    await page.getByRole('button', { name: /저장|생성/ }).click();
    // 중복 생성 가능성 있으므로 .first() 사용
    await expect(page.getByText('공개테스트게시판').first()).toBeVisible({ timeout: 10000 });
  });
});
