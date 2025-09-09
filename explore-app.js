const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  try {
    console.log('Opening MarketDZ application at http://localhost:3001...');
    
    // Navigate to the application
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle', timeout: 10000 });
    
    // Wait for the page to load completely
    await page.waitForTimeout(3000);
    
    // Take initial homepage screenshot
    await page.screenshot({ path: 'homepage-screenshot.png', fullPage: true });
    console.log('Homepage screenshot saved as homepage-screenshot.png');
    
    // Get page title and basic info
    const title = await page.title();
    console.log(`Page Title: ${title}`);
    
    // Get main content and structure
    const headingText = await page.textContent('h1').catch(() => 'No h1 found');
    console.log(`Main Heading: ${headingText}`);
    
    // Look for navigation elements
    const navElements = await page.$$eval('nav a, header a, .nav a', elements => 
      elements.map(el => ({ text: el.textContent.trim(), href: el.href }))
    ).catch(() => []);
    
    console.log('Navigation Elements Found:', navElements);
    
    // Look for key features or sections
    const sections = await page.$$eval('section, .section, [class*="section"]', elements => 
      elements.map(el => el.textContent.trim().substring(0, 100))
    ).catch(() => []);
    
    console.log('Page Sections:', sections);
    
    // Look for any product listings or cards
    const productCards = await page.$$eval('[class*="card"], [class*="product"], .item', elements => 
      elements.slice(0, 5).map(el => el.textContent.trim().substring(0, 100))
    ).catch(() => []);
    
    console.log('Product/Card Elements:', productCards);
    
    // Try to find and click on navigation links to explore
    const links = await page.$$eval('a[href^="/"]', elements => 
      elements.map(el => ({ text: el.textContent.trim(), href: el.getAttribute('href') }))
        .filter(link => link.text && link.href)
        .slice(0, 5)
    ).catch(() => []);
    
    console.log('Internal Links Found:', links);
    
    // Take screenshots of different sections if we can navigate
    if (links.length > 0) {
      for (let i = 0; i < Math.min(3, links.length); i++) {
        const link = links[i];
        try {
          console.log(`Navigating to: ${link.text} (${link.href})`);
          await page.click(`a[href="${link.href}"]`);
          await page.waitForLoadState('networkidle', { timeout: 5000 });
          await page.waitForTimeout(2000);
          
          const screenshotName = `page-${i + 1}-${link.text.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.png`;
          await page.screenshot({ path: screenshotName, fullPage: true });
          console.log(`Screenshot saved: ${screenshotName}`);
          
          // Go back to homepage for next navigation
          await page.goto('http://localhost:3001');
          await page.waitForLoadState('networkidle', { timeout: 5000 });
        } catch (error) {
          console.log(`Error navigating to ${link.text}:`, error.message);
        }
      }
    }
    
    // Look for any forms or interactive elements
    const forms = await page.$$eval('form', elements => 
      elements.map(form => {
        const inputs = form.querySelectorAll('input, textarea, select');
        return {
          action: form.action,
          method: form.method,
          inputCount: inputs.length,
          inputTypes: Array.from(inputs).map(input => input.type || input.tagName.toLowerCase())
        };
      })
    ).catch(() => []);
    
    console.log('Forms Found:', forms);
    
    // Final summary screenshot
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle', { timeout: 5000 });
    await page.screenshot({ path: 'final-homepage-screenshot.png', fullPage: true });
    
    console.log('Exploration complete! Check the generated screenshots.');
    
  } catch (error) {
    console.error('Error during exploration:', error);
    await page.screenshot({ path: 'error-screenshot.png' });
  } finally {
    await browser.close();
  }
})();