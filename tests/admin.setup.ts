/**
 * Admin auth setup — signs in as admin once per browser project,
 * saves storage state (cookies) to a file for reuse across admin tests.
 *
 * This avoids repeating a 10-30s signin in every beforeEach.
 */
import { test as setup } from '@playwright/test';
import path from 'path';

export const ADMIN_STORAGE_STATE = path.join(__dirname, '../.playwright/admin-auth.json');

setup('admin signin', async ({ page }) => {
  await page.goto('/signin');
  await page.waitForLoadState('domcontentloaded');

  await page.fill('input[type="email"]', 'rdjerrouf@gmail.com');
  await page.fill('input[type="password"]', 'Montblanc01!');
  await page.click('button[type="submit"]');

  // Wait for redirect away from signin (window.location.href)
  await Promise.race([
    page.waitForURL(url => !url.toString().includes('signin'), { timeout: 30000 }),
    page.waitForTimeout(6000),
  ]).catch(() => {});

  // Save authenticated storage state (cookies)
  await page.context().storageState({ path: ADMIN_STORAGE_STATE });
  console.log('✅ Admin auth state saved to', ADMIN_STORAGE_STATE);
});
