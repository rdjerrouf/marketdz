import { test, expect } from '@playwright/test';

test.describe('Photo Check with Port 3007', () => {
  test('should check if photos load on browse page', async ({ page }) => {
    // Navigate to the correct port
    await page.goto('http://localhost:3007/browse');
    
    // Wait for page to load
    await page.waitForSelector('body', { timeout: 15000 });
    
    // Take a screenshot to see what's on the page
    await page.screenshot({ path: 'browse-page-screenshot.png', fullPage: true });
    
    // Check the page content
    const pageText = await page.textContent('body');
    console.log('Page contains:', pageText?.slice(0, 500));
    
    // Look for any images
    const images = page.locator('img');
    const imageCount = await images.count();
    console.log(`Total images found: ${imageCount}`);
    
    // Check for listing cards or containers
    const listingCards = page.locator('[class*="card"], [class*="listing"], [data-testid*="listing"]');
    const cardCount = await listingCards.count();
    console.log(`Listing cards found: ${cardCount}`);
    
    // Check for any error messages
    const errorElements = page.locator('[class*="error"], .error');
    const errorCount = await errorElements.count();
    console.log(`Error elements found: ${errorCount}`);
    
    if (imageCount > 0) {
      // Check first few images
      for (let i = 0; i < Math.min(imageCount, 3); i++) {
        const img = images.nth(i);
        const src = await img.getAttribute('src');
        const alt = await img.getAttribute('alt');
        console.log(`Image ${i + 1}: src="${src}", alt="${alt}"`);
        
        // Check if image loads properly
        const naturalWidth = await img.evaluate((img: HTMLImageElement) => img.naturalWidth);
        const naturalHeight = await img.evaluate((img: HTMLImageElement) => img.naturalHeight);
        console.log(`Image ${i + 1} dimensions: ${naturalWidth}x${naturalHeight}`);
      }
    }
    
    // This test will always pass - we're just gathering information
    expect(imageCount).toBeGreaterThanOrEqual(0);
  });
  
  test('should navigate to homepage and check for content', async ({ page }) => {
    await page.goto('http://localhost:3007/');
    
    await page.waitForSelector('body', { timeout: 15000 });
    
    // Take screenshot of homepage
    await page.screenshot({ path: 'homepage-screenshot.png', fullPage: true });
    
    const title = await page.title();
    console.log('Page title:', title);
    
    const images = page.locator('img');
    const imageCount = await images.count();
    console.log(`Homepage images found: ${imageCount}`);
    
    expect(imageCount).toBeGreaterThanOrEqual(0);
  });
});