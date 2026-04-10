import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/DlalaDZ/);
});

test.skip('get started link', async ({ page }) => {
  // Stale Playwright starter template — not applicable to this app.
  await page.goto('/');
  await page.getByRole('link', { name: 'Get started' }).click();
  await expect(page.getByRole('heading', { name: 'Installation' })).toBeVisible();
});