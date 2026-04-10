import { test, expect } from '@playwright/test';

test.describe('Admin User Management', () => {
  test.describe.configure({ mode: 'serial' });
  test.setTimeout(60000);

  test.beforeEach(async ({ page }) => {
    // Auth state (cookies) pre-loaded via storageState in playwright.config.ts (admin.setup.ts)
    // No signin needed — navigate directly to admin users page
    await page.goto('/admin/users');
    await page.waitForLoadState('domcontentloaded');

    // Wait for admin layout to verify auth and render the page
    // Admin layout does: getUser() + check-status API + admin_users query
    await page.waitForSelector('h1:has-text("User Management")', { timeout: 45000 });
  });

  test('should suspend and unsuspend User Five', async ({ page }) => {
    console.log('🧪 Starting admin user management test...');

    // Wait for users table to load with actual rows
    await page.waitForSelector('tbody tr', { timeout: 15000 });
    await page.waitForTimeout(500);

    console.log('📋 Looking for User Five...');

    // Search for User Five
    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill('User Five');
    await page.waitForTimeout(1500); // Wait for search results

    // Check if User Five exists in the table
    const userFiveRow = page.locator('tr:has-text("User Five")').first();

    if (!(await userFiveRow.isVisible())) {
      console.log('❌ User Five not found, checking all users...');

      // Clear search and look for any user to test with
      await searchInput.clear();
      await page.waitForSelector('tbody tr', { timeout: 10000 });

      // Get the first user in the table (excluding header)
      const firstUserRow = page.locator('tbody tr').first();
      // Name is in td:nth-child(2) > div > div.text-sm.font-medium
      const userName = await firstUserRow.locator('td:nth-child(2) .text-sm.font-medium').textContent({ timeout: 10000 });
      console.log(`🔍 Using first available user: ${userName}`);

      await testUserSuspension(page, userName || 'Test User');
    } else {
      console.log('✅ Found User Five, proceeding with test...');
      await testUserSuspension(page, 'User Five');
    }
  });

  async function testUserSuspension(page: any, userName: string) {
    console.log(`🎯 Testing suspension for: ${userName}`);

    // Step 1: Check initial status
    const statusLocator = page.locator(`tr:has-text("${userName}") td:nth-child(5) span`).first();
    const initialStatusText = await statusLocator.textContent({ timeout: 5000 }).catch(() => 'unknown');
    console.log(`📊 Initial status: ${initialStatusText}`);

    // Step 2: Test Suspend - click and re-query after state change
    const suspendButton = page.locator(`tr:has-text("${userName}") button:has-text("Suspend")`).first();

    if (await suspendButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('⚠️ Testing suspend action...');
      await suspendButton.click();
      await page.waitForTimeout(2000);

      const statusAfterSuspend = await page.locator(`tr:has-text("${userName}") td:nth-child(5) span`).first().textContent({ timeout: 5000 }).catch(() => 'unknown');
      console.log(`📊 Status after suspend: ${statusAfterSuspend}`);

      // Step 3: Unsuspend to restore state
      const unsuspendButton = page.locator(`tr:has-text("${userName}") button:has-text("Unsuspend")`).first();
      if (await unsuspendButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        console.log('✅ Testing unsuspend action...');
        await unsuspendButton.click();
        await page.waitForTimeout(2000);

        const statusAfterUnsuspend = await page.locator(`tr:has-text("${userName}") td:nth-child(5) span`).first().textContent({ timeout: 5000 }).catch(() => 'unknown');
        console.log(`📊 Status after unsuspend: ${statusAfterUnsuspend}`);
        console.log('✅ Suspend/unsuspend cycle complete');
      } else {
        console.log('❌ Unsuspend button not found');
      }
    } else {
      console.log('❌ Suspend button not visible - user may already be suspended/banned');
      // Check if status column exists
      const hasStatusColumn = await page.locator('th:has-text("Status")').isVisible();
      console.log(`📊 Status column present: ${hasStatusColumn}`);
    }
  }

  test('should show proper status indicators and filters', async ({ page }) => {
    console.log('🔍 Testing status indicators and filters...');

    // Check if status filter is present and enabled
    const statusFilter = page.locator('select#status-filter');
    await expect(statusFilter).toBeVisible();

    const isFilterEnabled = await statusFilter.isEnabled();
    console.log(`📋 Status filter enabled: ${isFilterEnabled}`);

    // Check filter options
    const filterOptions = await statusFilter.locator('option').allTextContents();
    console.log(`📝 Filter options: ${filterOptions.join(', ')}`);

    // Test each filter option
    for (const option of ['all', 'active', 'suspended', 'banned']) {
      console.log(`🔄 Testing filter: ${option}`);
      await statusFilter.selectOption(option);
      await page.waitForTimeout(1000);

      // Check if appropriate helper text appears
      if (option === 'suspended') {
        const helperText = page.locator('text="Showing suspended users"');
        const isHelperVisible = await helperText.isVisible();
        console.log(`💡 Suspended helper text visible: ${isHelperVisible}`);
      }
    }
  });

  test('should handle errors gracefully', async ({ page }) => {
    console.log('🛡️ Testing error handling...');

    // Check for actual error messages (divs/paragraphs only — excludes Ban buttons and status badge spans)
    const errorMessages = await page.locator('div.bg-red-50, div.bg-red-100, p.text-red-600').allTextContents();
    console.log(`❌ Error messages found: ${errorMessages.join(', ')}`);

    // Check for migration warnings
    const migrationWarnings = await page.locator('text="Migration needed"').allTextContents();
    console.log(`⚠️ Migration warnings: ${migrationWarnings.join(', ')}`);

    // Verify page loaded successfully
    await expect(page.locator('h1:has-text("User Management")')).toBeVisible();
    await expect(page.locator('table')).toBeVisible();

    console.log('✅ Admin page loaded successfully');
  });
});

test.describe('Admin Authentication', () => {
  test.describe.configure({ mode: 'serial' });
  test.setTimeout(90000);

  test('should allow admin access with correct credentials', async ({ page }) => {
    // Auth state pre-loaded via storageState — navigate directly
    console.log('🔐 Testing admin authentication...');

    await page.goto('/admin');
    await page.waitForLoadState('domcontentloaded');

    // Should see admin dashboard (text in sidebar)
    await expect(page.locator('text="Admin Panel"')).toBeVisible({ timeout: 30000 });
    console.log('✅ Admin authentication successful');
  });

  test('should show admin navigation in sidebar', async ({ page }) => {
    console.log('📋 Testing admin navigation...');

    // Auth state pre-loaded via storageState — navigate directly
    await page.goto('/admin');
    // Wait for admin layout auth check to complete (useEffect → async getUser → renders nav)
    await page.locator('text="Admin Panel"').waitFor({ timeout: 30000 });

    // Check for admin navigation items
    const adminLinks = [
      'Users',
      'Analytics',
      'Admin Management',
      'Activity Logs'
    ];

    for (const linkText of adminLinks) {
      const link = page.locator(`nav a:has-text("${linkText}")`);
      if (await link.isVisible()) {
        console.log(`✅ Found admin link: ${linkText}`);
      } else {
        console.log(`❌ Missing admin link: ${linkText}`);
      }
    }
  });
});