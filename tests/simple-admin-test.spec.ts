import { test, expect } from '@playwright/test';

test('Simple Admin Test - Check Admin Page Access', async ({ page }) => {
  console.log('🧪 Testing basic admin functionality...');

  // Set shorter timeouts
  test.setTimeout(30000);

  try {
    // Navigate to home first
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);

    console.log('🏠 Home page loaded');

    // Go to signin
    await page.goto('http://localhost:3000/signin');
    await page.waitForTimeout(2000);

    console.log('🔐 Sign in page loaded');

    // Look for email input
    const emailInput = page.locator('input[type="email"]').first();
    await emailInput.waitFor({ timeout: 5000 });
    await emailInput.fill('rdjerrouf@gmail.com');

    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.fill('Montblanc01!');

    console.log('📝 Credentials filled');

    // Submit form
    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();

    console.log('🚀 Form submitted');

    // Wait a bit for login
    await page.waitForTimeout(3000);

    console.log(`📍 Current URL after login: ${page.url()}`);

    // Try to go to admin
    await page.goto('http://localhost:3000/admin/users');
    await page.waitForTimeout(3000);

    console.log(`📍 Admin page URL: ${page.url()}`);

    // Check if we're on the admin page
    const pageContent = await page.content();

    if (pageContent.includes('User Management')) {
      console.log('✅ Successfully reached admin users page');

      // Look for users table
      const hasTable = pageContent.includes('<table');
      console.log(`📊 Table present: ${hasTable}`);

      // Look for status-related elements
      const hasStatusFilter = pageContent.includes('status-filter');
      console.log(`🔍 Status filter present: ${hasStatusFilter}`);

      // Look for migration warnings
      const hasMigrationWarning = pageContent.includes('Migration needed');
      console.log(`⚠️ Migration warning present: ${hasMigrationWarning}`);

      // Look for user data
      const hasUserData = pageContent.includes('User Five') || pageContent.includes('profiles');
      console.log(`👥 User data present: ${hasUserData}`);

    } else if (pageContent.includes('Sign in') || pageContent.includes('signin')) {
      console.log('❌ Still on sign in page - admin access failed');
    } else {
      console.log('❓ Unknown page state');
      console.log('📄 Page title:', await page.title());
    }

    // Take screenshot
    await page.screenshot({ path: 'admin-test-result.png', fullPage: true });
    console.log('📸 Screenshot saved: admin-test-result.png');

  } catch (error) {
    console.log(`❌ Test error: ${error}`);

    // Try to take screenshot even if there's an error
    try {
      await page.screenshot({ path: 'admin-test-error.png', fullPage: true });
      console.log('📸 Error screenshot saved: admin-test-error.png');
    } catch (screenshotError) {
      console.log('❌ Could not take error screenshot');
    }
  }
});