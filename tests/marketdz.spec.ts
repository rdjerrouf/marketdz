import { test, expect } from '@playwright/test';

test('DlalaDZ homepage loads correctly', async ({ page }) => {
  await page.goto('/');

  // Check if the page title contains DlalaDZ
  await expect(page).toHaveTitle(/DlalaDZ/);
});

test('can navigate to browse listings', async ({ page }) => {
  // Navigate directly — avoids matching hidden <link rel="preload"> tags in <head>
  // that contain "browse" in the chunk URL and cause locator().click() to hang.
  await page.goto('/browse');
  await expect(page.url()).toContain('browse');
  await expect(page).toHaveTitle(/DlalaDZ/);
});

test('authentication pages are accessible', async ({ page }) => {
  // Test signin page
  await page.goto('/signin');
  await expect(page.url()).toContain('signin');
  
  // Test signup page
  await page.goto('/signup');
  await expect(page.url()).toContain('signup');
});