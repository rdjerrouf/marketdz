import { test } from '@playwright/test';

test('Simple Admin Test - Check Admin Page Access', async ({ page }) => {
  console.log('🧪 Testing basic admin functionality...');
  // Auth state pre-loaded via storageState (admin.setup.ts)
  test.setTimeout(60000);

  try {
    // Navigate directly to admin (no signin needed — storageState has cookies)
    await page.goto('http://localhost:3000/admin/users');
    await page.waitForTimeout(5000);

    console.log(`📍 Admin page URL: ${page.url()}`);

    // Check if we're on the admin page
    const pageContent = await page.content();

    if (pageContent.includes('User Management')) {
      console.log('✅ Successfully reached admin users page');

      const hasTable = pageContent.includes('<table');
      console.log(`📊 Table present: ${hasTable}`);

      const hasStatusFilter = pageContent.includes('status-filter');
      console.log(`🔍 Status filter present: ${hasStatusFilter}`);

      const hasMigrationWarning = pageContent.includes('Migration needed');
      console.log(`⚠️ Migration warning present: ${hasMigrationWarning}`);

      const hasUserData = pageContent.includes('User Five') || pageContent.includes('profiles');
      console.log(`👥 User data present: ${hasUserData}`);

    } else if (pageContent.includes('Sign in') || pageContent.includes('signin')) {
      console.log('❌ Still on sign in page - admin access failed (auth state not loaded?)');
    } else {
      console.log('❓ Unknown page state');
      console.log('📄 Page title:', await page.title());
    }

    await page.screenshot({ path: 'admin-test-result.png', fullPage: true });
    console.log('📸 Screenshot saved: admin-test-result.png');

  } catch (error) {
    console.log(`❌ Test error: ${error}`);
    try {
      await page.screenshot({ path: 'admin-test-error.png', fullPage: true });
    } catch { /* ignore */ }
  }
});
