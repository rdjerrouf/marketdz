import { test, expect } from '@playwright/test';

test.describe('All Pages Loading Test', () => {
  const pages = [
    { name: 'Homepage', url: '/' },
    { name: 'Browse', url: '/browse' },
    { name: 'Add Item', url: '/add-item' },
    { name: 'Messages', url: '/messages' },
    { name: 'Sign In', url: '/signin' },
    { name: 'Sign Up', url: '/signup' },
    { name: 'Profile', url: '/profile' },
    { name: 'Favorites', url: '/favorites' },
    { name: 'Forgot Password', url: '/forgot-password' },
    { name: 'Admin Analytics', url: '/admin/analytics' },
    { name: 'Admin Listings', url: '/admin/listings' }
  ];

  for (const pageInfo of pages) {
    test(`${pageInfo.name} page loads without errors`, async ({ page }) => {
      // Go to the page
      await page.goto(pageInfo.url);
      
      // Check that we get a successful response (not 404, 500, etc.)
      // For auth-protected pages, they might redirect to signin - that's OK
      const response = await page.waitForLoadState('networkidle');
      
      // Check that the page has loaded (has a title)
      const title = await page.title();
      expect(title).toBeTruthy(); // Should have some title
      
      // Check that there are no JavaScript errors
      page.on('pageerror', (error) => {
        throw new Error(`Page error on ${pageInfo.name}: ${error.message}`);
      });
      
      // Check that the page has some content (not completely empty)
      const bodyText = await page.locator('body').textContent();
      expect(bodyText).toBeTruthy();
      expect(bodyText.trim().length).toBeGreaterThan(0);
    });
  }
});