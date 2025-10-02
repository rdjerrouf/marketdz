import { test, expect } from '@playwright/test';

test.describe('Admin Debug Test', () => {
  test('should check admin login and user management page', async ({ page }) => {
    console.log('🔍 Starting admin debug test...');

    // Go to signin page
    console.log('📍 Navigating to signin page...');
    await page.goto('http://localhost:3003/signin');
    await page.waitForLoadState('networkidle');

    // Fill credentials
    console.log('🔐 Filling admin credentials...');
    await page.fill('input[type="email"]', 'rdjerrouf@gmail.com');
    await page.fill('input[type="password"]', 'Montblanc01!');

    // Click sign in
    console.log('🚀 Clicking sign in...');
    await page.click('button[type="submit"]');

    // Wait for redirect
    await page.waitForTimeout(3000);
    console.log(`📍 Current URL: ${page.url()}`);

    // Try to go to admin page
    console.log('📍 Navigating to admin users page...');
    await page.goto('http://localhost:3003/admin/users');
    await page.waitForTimeout(3000);

    console.log(`📍 Final URL: ${page.url()}`);

    // Take a screenshot
    await page.screenshot({ path: 'admin-debug.png', fullPage: true });
    console.log('📸 Screenshot saved: admin-debug.png');

    // Check what's on the page
    const pageTitle = await page.title();
    console.log(`📄 Page title: ${pageTitle}`);

    // Check for key elements
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

    // Check console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`❌ Console error: ${msg.text()}`);
      }
    });

    // Look for any error messages on page
    const errorElements = await page.locator('.text-red-600, .bg-red-100, [class*="error"]').allTextContents();
    if (errorElements.length > 0) {
      console.log(`❌ Error messages found: ${errorElements.join(', ')}`);
    }

    // Check if we can see any users
    const userRows = await page.locator('tbody tr').count();
    console.log(`👥 Number of user rows found: ${userRows}`);

    if (userRows > 0) {
      // Get first user's data
      const firstUserName = await page.locator('tbody tr:first-child td:nth-child(2)').textContent();
      console.log(`👤 First user found: ${firstUserName}`);

      // Check if status column exists and what it contains
      const statusCell = page.locator('tbody tr:first-child td:nth-child(5)');
      if (await statusCell.isVisible()) {
        const statusText = await statusCell.textContent();
        console.log(`📊 First user status: ${statusText}`);
      } else {
        console.log('📊 Status column not found');
      }

      // Check action buttons
      const actionButtons = await page.locator('tbody tr:first-child td:last-child button').allTextContents();
      console.log(`🔘 Action buttons: ${actionButtons.join(', ')}`);
    }
  });
});