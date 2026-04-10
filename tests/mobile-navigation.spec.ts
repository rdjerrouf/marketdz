import { test, expect, devices } from '@playwright/test';

test.describe('Mobile Navigation Tests', () => {
  test('should open and close mobile sidebar on iOS Safari', async ({ browser }) => {
    // Firefox does not support isMobile in device emulation
    test.skip(browser.browserType().name() === 'firefox', 'isMobile not supported in Firefox');

    const iPhone = devices['iPhone 12 Pro'];
    const context = await browser.newContext({
      ...iPhone,
    });
    const page = await context.newPage();

    console.log('🍎 Testing on iOS Safari emulation...');
    // Navigate to a page where GlobalMobileNav renders (not '/' or '/browse')
    await page.goto('/add-item');
    await page.waitForLoadState('domcontentloaded');

    // Take initial screenshot
    await page.screenshot({ path: 'mobile-ios-initial.png', fullPage: false });

    // Find the hamburger menu button
    const menuButton = page.locator('button[data-testid="hamburger-menu"]').first();
    await expect(menuButton).toBeVisible({ timeout: 10000 });

    console.log('📍 Found menu button, attempting to click...');

    // Try to open the sidebar
    await menuButton.tap();
    await page.waitForTimeout(1000);

    // Take screenshot after tap
    await page.screenshot({ path: 'mobile-ios-after-tap.png', fullPage: false });

    // Check if sidebar is visible
    const sidebar = page.locator('nav').filter({ hasText: 'DlalaDZ' });
    const isSidebarVisible = await sidebar.isVisible();

    console.log(`📊 Sidebar visible: ${isSidebarVisible ? '✅ YES' : '❌ NO'}`);

    if (isSidebarVisible) {
      console.log('✅ Sidebar opened successfully');

      // Try to close it
      const closeButton = page.locator('button[aria-label*="close" i], button:has(svg.lucide-x)').first();
      await closeButton.tap();
      await page.waitForTimeout(500);

      const isClosed = await sidebar.isHidden();
      console.log(`📊 Sidebar closed: ${isClosed ? '✅ YES' : '❌ NO'}`);
      expect(isClosed).toBeTruthy();
    } else {
      console.log('❌ FAIL: Sidebar did not open on iOS Safari');

      // Debug: Check what's on the page
      const bodyHTML = await page.locator('body').innerHTML();
      console.log('📄 Body contains "DlalaDZ":', bodyHTML.includes('DlalaDZ'));

      // Check for blocking elements
      const blockingElements = await page.locator('[style*="pointer-events"]').count();
      console.log(`🔍 Elements with pointer-events: ${blockingElements}`);
    }

    expect(isSidebarVisible).toBeTruthy();

    await context.close();
  });

  test('should open and close mobile sidebar on Android Chrome', async ({ browser }) => {
    // Firefox does not support isMobile in device emulation
    test.skip(browser.browserType().name() === 'firefox', 'isMobile not supported in Firefox');

    const pixel5 = devices['Pixel 5'];
    const context = await browser.newContext({
      ...pixel5,
    });
    const page = await context.newPage();

    console.log('🤖 Testing on Android Chrome emulation...');
    // Navigate to a page where GlobalMobileNav renders (not '/' or '/browse')
    await page.goto('/add-item');
    await page.waitForLoadState('domcontentloaded');

    // Take initial screenshot
    await page.screenshot({ path: 'mobile-android-initial.png', fullPage: false });

    // Find the hamburger menu button
    const menuButton = page.locator('button[data-testid="hamburger-menu"]').first();
    await expect(menuButton).toBeVisible({ timeout: 10000 });

    console.log('📍 Found menu button, attempting to tap...');

    // Try to open the sidebar
    await menuButton.tap();
    await page.waitForTimeout(1000);

    // Take screenshot after tap
    await page.screenshot({ path: 'mobile-android-after-tap.png', fullPage: false });

    // Check if sidebar is visible
    const sidebar = page.locator('nav').filter({ hasText: 'DlalaDZ' });
    const isSidebarVisible = await sidebar.isVisible();

    console.log(`📊 Sidebar visible: ${isSidebarVisible ? '✅ YES' : '❌ NO'}`);

    if (isSidebarVisible) {
      console.log('✅ Sidebar opened successfully');

      // Try to close it
      const closeButton = page.locator('button[aria-label*="close" i], button:has(svg.lucide-x)').first();
      await closeButton.tap();
      await page.waitForTimeout(500);

      const isClosed = await sidebar.isHidden();
      console.log(`📊 Sidebar closed: ${isClosed ? '✅ YES' : '❌ NO'}`);
      expect(isClosed).toBeTruthy();
    } else {
      console.log('❌ FAIL: Sidebar did not open on Android Chrome');

      // Debug: Check what's on the page
      const bodyHTML = await page.locator('body').innerHTML();
      console.log('📄 Body contains "DlalaDZ":', bodyHTML.includes('DlalaDZ'));

      // Check for blocking elements
      const blockingElements = await page.locator('[style*="pointer-events"]').count();
      console.log(`🔍 Elements with pointer-events: ${blockingElements}`);
    }

    expect(isSidebarVisible).toBeTruthy();

    await context.close();
  });

  test('should verify touch event handlers are present', async ({ browser }) => {
    // Firefox does not support isMobile in device emulation
    test.skip(browser.browserType().name() === 'firefox', 'isMobile not supported in Firefox');

    const iPhone = devices['iPhone 12 Pro'];
    const context = await browser.newContext({
      ...iPhone,
    });
    const page = await context.newPage();

    // Navigate to a page where GlobalMobileNav renders (not '/' or '/browse')
    await page.goto('/add-item');
    await page.waitForLoadState('domcontentloaded');

    // Check if menu button has proper touch attributes
    const menuButton = page.locator('button[data-testid="hamburger-menu"]').first();
    await expect(menuButton).toBeVisible({ timeout: 10000 });

    const styles = await menuButton.evaluate(el => {
      const computed = window.getComputedStyle(el);
      const inline = (el as HTMLElement).style;
      return {
        touchAction: computed.touchAction || inline.touchAction,
        pointerEvents: computed.pointerEvents || inline.pointerEvents,
        zIndex: computed.zIndex || inline.zIndex,
        minWidth: computed.minWidth || inline.minWidth,
        minHeight: computed.minHeight || inline.minHeight,
      };
    });

    console.log('🔍 Menu button styles:', styles);

    expect(styles.touchAction).toContain('manipulation');
    expect(styles.pointerEvents).toBe('auto');

    await context.close();
  });

  test('should check for pointer-events blocking on home page', async ({ browser }) => {
    // Firefox does not support isMobile in device emulation
    test.skip(browser.browserType().name() === 'firefox', 'isMobile not supported in Firefox');

    const iPhone = devices['iPhone 12 Pro'];
    const context = await browser.newContext({
      ...iPhone,
    });
    const page = await context.newPage();

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Check background container has pointer-events-none
    const backgroundContainer = page.locator('.absolute.inset-0.overflow-hidden').first();

    if (await backgroundContainer.count() > 0) {
      const hasPointerEventsNone = await backgroundContainer.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return computed.pointerEvents === 'none' || el.classList.contains('pointer-events-none');
      });

      console.log(`🔍 Background has pointer-events-none: ${hasPointerEventsNone ? '✅ YES' : '❌ NO'}`);
      expect(hasPointerEventsNone).toBeTruthy();
    }

    // Check bottom navigation is visible on mobile (replaces mobile header check)
    const bottomNav = page.locator('nav.fixed.bottom-0').first();

    if (await bottomNav.count() > 0) {
      const isVisible = await bottomNav.isVisible();
      console.log(`🔍 Bottom nav visible on mobile: ${isVisible ? '✅ YES' : '❌ NO'}`);
      expect(isVisible).toBeTruthy();
    }

    await context.close();
  });
});
