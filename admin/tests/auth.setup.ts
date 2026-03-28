import { test as setup, expect } from '@playwright/test';
import path from 'path';

export const authFile = path.join(__dirname, '.auth/user.json');

setup('관리자 로그인 상태 저장', async ({ page }) => {
  // 로그인 페이지로 이동
  await page.goto('/login');
  await expect(page.getByRole('button', { name: '로그인', exact: true })).toBeVisible({ timeout: 10000 });

  // 이메일과 비밀번호 입력
  await page.getByPlaceholder('admin@example.com').fill('admin@homepage.local');
  await page.getByPlaceholder('••••••••').fill('Admin1234!');

  // 로그인 버튼 클릭
  await page.getByRole('button', { name: '로그인', exact: true }).click();

  // 관리자 대시보드로 리다이렉트될 때까지 대기
  await page.waitForURL('**/admin', { timeout: 10000 });
  await expect(page.getByRole('heading', { name: '대시보드' })).toBeVisible();

  // 인증 상태 파일로 저장
  await page.context().storageState({ path: authFile });
});
