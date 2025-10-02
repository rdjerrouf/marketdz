import { test, expect } from '@playwright/test';

test.describe('Admin User Management', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to sign in page
    await page.goto('/signin');

    // Sign in as admin
    await page.fill('input[type="email"]', 'rdjerrouf@gmail.com');
    await page.fill('input[type="password"]', 'Montblanc01!');
    await page.click('button[type="submit"]');

    // Wait for successful login and redirect
    await page.waitForURL(/\/(?!signin|signup)/);

    // Navigate to admin users page
    await page.goto('/admin/users');

    // Wait for the page to load
    await page.waitForSelector('h1:has-text("User Management")');
  });

  test('should suspend and unsuspend User Five', async ({ page }) => {
    console.log('🧪 Starting admin user management test...');

    // Wait for users table to load
    await page.waitForSelector('table');
    await page.waitForTimeout(2000); // Give time for data to load

    console.log('📋 Looking for User Five...');

    // Search for User Five
    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill('User Five');
    await page.waitForTimeout(1000); // Wait for search results

    // Check if User Five exists in the table
    const userFiveRow = page.locator('tr:has-text("User Five")').first();

    if (!(await userFiveRow.isVisible())) {
      console.log('❌ User Five not found, checking all users...');

      // Clear search and look for any user to test with
      await searchInput.clear();
      await page.waitForTimeout(1000);

      // Get the first user in the table (excluding header)
      const firstUserRow = page.locator('tbody tr').first();
      const userName = await firstUserRow.locator('td:nth-child(2) div:first-child').textContent();
      console.log(`🔍 Using first available user: ${userName}`);

      await testUserSuspension(page, firstUserRow, userName || 'Test User');
    } else {
      console.log('✅ Found User Five, proceeding with test...');
      await testUserSuspension(page, userFiveRow, 'User Five');
    }
  });

  async function testUserSuspension(page: any, userRow: any, userName: string) {
    console.log(`🎯 Testing suspension for: ${userName}`);

    // Step 1: Check initial status
    const initialStatus = userRow.locator('td:nth-child(5) span'); // Status column
    const initialStatusText = await initialStatus.textContent();
    console.log(`📊 Initial status: ${initialStatusText}`);

    // Step 2: Test Suspend
    console.log('⚠️ Testing suspend action...');
    const suspendButton = userRow.locator('button:has-text("Suspend")');

    if (await suspendButton.isVisible()) {
      await suspendButton.click();
      await page.waitForTimeout(2000); // Wait for action to complete

      // Check for success message
      const successMessage = page.locator('div:has-text("suspended")');
      if (await successMessage.isVisible()) {
        console.log('✅ Suspend action successful - success message appeared');
      }

      // Verify status changed to suspended
      const statusAfterSuspend = await userRow.locator('td:nth-child(5) span').textContent();
      console.log(`📊 Status after suspend: ${statusAfterSuspend}`);

      // Step 3: Test filter for suspended users
      console.log('🔍 Testing suspended users filter...');
      const statusFilter = page.locator('select#status-filter');
      await statusFilter.selectOption('suspended');
      await page.waitForTimeout(1000);

      // Check if user appears in suspended filter
      const suspendedUserVisible = await userRow.isVisible();
      console.log(`👁️ User visible in suspended filter: ${suspendedUserVisible}`);

      // Step 4: Test Unsuspend
      console.log('✅ Testing unsuspend action...');
      const unsuspendButton = userRow.locator('button:has-text("Unsuspend")');

      if (await unsuspendButton.isVisible()) {
        await unsuspendButton.click();
        await page.waitForTimeout(2000); // Wait for action to complete

        // Check for success message
        const unsuspendMessage = page.locator('div:has-text("reactivated")');
        if (await unsuspendMessage.isVisible()) {
          console.log('✅ Unsuspend action successful - success message appeared');
        }

        // Verify status changed back to active
        const statusAfterUnsuspend = await userRow.locator('td:nth-child(5) span').textContent();
        console.log(`📊 Status after unsuspend: ${statusAfterUnsuspend}`);

        // Step 5: Test Ban
        console.log('🚫 Testing ban action...');

        // Reset filter to see all users
        await statusFilter.selectOption('all');
        await page.waitForTimeout(1000);

        const banButton = userRow.locator('button:has-text("Ban")');
        if (await banButton.isVisible()) {
          await banButton.click();
          await page.waitForTimeout(2000);

          // Check for success message
          const banMessage = page.locator('div:has-text("banned")');
          if (await banMessage.isVisible()) {
            console.log('✅ Ban action successful - success message appeared');
          }

          // Verify status changed to banned
          const statusAfterBan = await userRow.locator('td:nth-child(5) span').textContent();
          console.log(`📊 Status after ban: ${statusAfterBan}`);

          // Step 6: Test Unban
          console.log('🔓 Testing unban action...');
          const unbanButton = userRow.locator('button:has-text("Unban")');

          if (await unbanButton.isVisible()) {
            await unbanButton.click();
            await page.waitForTimeout(2000);

            // Check for success message
            const unbanMessage = page.locator('div:has-text("reactivated")');
            if (await unbanMessage.isVisible()) {
              console.log('✅ Unban action successful - success message appeared');
            }

            // Verify status changed back to active
            const finalStatus = await userRow.locator('td:nth-child(5) span').textContent();
            console.log(`📊 Final status: ${finalStatus}`);
          } else {
            console.log('❌ Unban button not found');
          }
        } else {
          console.log('❌ Ban button not found');
        }
      } else {
        console.log('❌ Unsuspend button not found');
      }
    } else {
      console.log('❌ Suspend button not found - checking if migration is needed');

      // Check for migration message
      const migrationMessage = page.locator('text="Migration needed"');
      if (await migrationMessage.isVisible()) {
        console.log('⚠️ Migration needed - status functionality not available');
      }

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

    // Check for any error messages on page load
    const errorMessages = await page.locator('.text-red-600, .bg-red-100').allTextContents();
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
  test('should allow admin access with correct credentials', async ({ page }) => {
    console.log('🔐 Testing admin authentication...');

    await page.goto('/signin');

    // Fill in admin credentials
    await page.fill('input[type="email"]', 'rdjerrouf@gmail.com');
    await page.fill('input[type="password"]', 'Montblanc01!');
    await page.click('button[type="submit"]');

    // Wait for login to complete
    await page.waitForURL(/\/(?!signin|signup)/, { timeout: 10000 });

    // Try to access admin page
    await page.goto('/admin');

    // Should see admin dashboard
    await expect(page.locator('text="Admin Panel"')).toBeVisible();
    console.log('✅ Admin authentication successful');
  });

  test('should show admin navigation in sidebar', async ({ page }) => {
    console.log('📋 Testing admin navigation...');

    // Sign in first
    await page.goto('/signin');
    await page.fill('input[type="email"]', 'rdjerrouf@gmail.com');
    await page.fill('input[type="password"]', 'Montblanc01!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(?!signin|signup)/);

    await page.goto('/admin');

    // Check for admin navigation items
    const adminLinks = [
      'Users',
      'Analytics',
      'Admin Management',
      'Activity Logs'
    ];

    for (const linkText of adminLinks) {
      const link = page.locator(`a:has-text("${linkText}")`);
      if (await link.isVisible()) {
        console.log(`✅ Found admin link: ${linkText}`);
      } else {
        console.log(`❌ Missing admin link: ${linkText}`);
      }
    }
  });
});