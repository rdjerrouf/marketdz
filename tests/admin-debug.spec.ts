import { test } from '@playwright/test';

test.describe('Admin Debug Test', () => {
  test.setTimeout(60000);

  test('should check admin login and user management page', async ({ page }) => {
    console.log('🔍 Starting admin debug test...');
    // Auth state pre-loaded via storageState (admin.setup.ts) — no signin needed

    console.log('📍 Navigating to admin users page...');
    await page.goto('/admin/users');
    await page.waitForTimeout(5000);

    console.log(`📍 Final URL: ${page.url()}`);

    await page.screenshot({ path: 'admin-debug.png', fullPage: true });
    console.log('📸 Screenshot saved: admin-debug.png');

    const pageTitle = await page.title();
    console.log(`📄 Page title: ${pageTitle}`);

    const elements = [
      'h1:has-text("User Management")',
      'text="Admin Panel"',
      'table',
      'select#status-filter',
      'text="Migration needed"',
      'text="suspended"',
      'text="User Five"'
    ];

    for (const selector of elements) {
      const element = page.locator(selector);
      const isVisible = await element.isVisible();
      console.log(`🔍 Element "${selector}": ${isVisible ? '✅ Found' : '❌ Not found'}`);
    }

    const userRows = await page.locator('tbody tr').count();
    console.log(`👥 Number of user rows found: ${userRows}`);

    if (userRows > 0) {
      const firstUserName = await page.locator('tbody tr:first-child td:nth-child(2)').textContent();
      console.log(`👤 First user found: ${firstUserName}`);

      const statusCell = page.locator('tbody tr:first-child td:nth-child(5)');
      if (await statusCell.isVisible()) {
        const statusText = await statusCell.textContent();
        console.log(`📊 First user status: ${statusText}`);
      }

      const actionButtons = await page.locator('tbody tr:first-child td:last-child button').allTextContents();
      console.log(`🔘 Action buttons: ${actionButtons.join(', ')}`);
    }
  });
});
