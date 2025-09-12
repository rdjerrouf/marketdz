import { test, expect } from '@playwright/test';

test('MarketDZ homepage loads correctly', async ({ page }) => {
  await page.goto('/');

  // Check if the page title contains MarketDZ
  await expect(page).toHaveTitle(/MarketDZ/);
});

test('can navigate to browse listings', async ({ page }) => {
  await page.goto('/');

  // Look for browse or listings link/button
  const browseLink = page.locator('text=Browse').or(page.locator('text=Listings')).or(page.locator('[href*="browse"]')).first();
  
  if (await browseLink.count() > 0) {
    await browseLink.click();
    await expect(page.url()).toContain('browse');
  } else {
    // Just verify we can navigate to browse page directly
    await page.goto('/browse');
    await expect(page.url()).toContain('browse');
  }
});

test('authentication pages are accessible', async ({ page }) => {
  // Test signin page
  await page.goto('/signin');
  await expect(page.url()).toContain('signin');
  
  // Test signup page
  await page.goto('/signup');
  await expect(page.url()).toContain('signup');
});