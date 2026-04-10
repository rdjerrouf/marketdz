/**
 * Search Tests — API + Browse UI
 *
 * API tests: hit /api/search directly via page.request (fast, no UI)
 * UI tests:  navigate /en/browse and exercise filter controls
 *
 * Seed data: 4000 active listings, all in Béjaïa, mixed Arabic/French titles
 */
import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const BASE = 'http://localhost:3000';

async function searchApi(request: any, params: Record<string, string>) {
  const qs = new URLSearchParams(params).toString();
  return request.get(`${BASE}/api/search?${qs}`);
}

// Navigate to a browse URL and wait for the first /api/search response.
// Registers the listener BEFORE goto so it never misses the request.
// After the response, waits for the search button to go from "Searching..." back to "Search Listings",
// which is the reliable DOM signal that React has committed the new state.
async function gotoAndWait(page: any, url: string) {
  const done = page.waitForResponse(
    (resp: any) => resp.url().includes('/api/search') && resp.status() === 200,
    { timeout: 30000 }
  );
  await page.goto(url);
  await done;
  // Wait for the submit button to re-enable (loading=false)
  await page.waitForSelector('button:not([disabled]):has-text("Search")', { timeout: 10000 });
  await page.waitForTimeout(200);
}

// Desktop listing cards (visible at Playwright's default 1280px viewport)
function listingCards(page: any) {
  return page.locator('[class*="rounded-3xl"][class*="cursor-pointer"]');
}

// ─────────────────────────────────────────────
// API Tests
// ─────────────────────────────────────────────

test.describe('Search API', () => {
  test('no filters — returns up to 20 active listings', async ({ request }) => {
    const res = await searchApi(request, { limit: '20' });
    expect(res.ok()).toBeTruthy();

    const body = await res.json();
    expect(body.listings).toBeDefined();
    expect(body.listings.length).toBeGreaterThan(0);
    expect(body.listings.length).toBeLessThanOrEqual(20);

    // Every result must be active (security invariant)
    for (const listing of body.listings) {
      expect(listing.status).toBe('active');
    }
  });

  test('category filter — returns only matching category', async ({ request }) => {
    const res = await searchApi(request, { category: 'for_sale', limit: '20' });
    expect(res.ok()).toBeTruthy();

    const body = await res.json();
    expect(body.listings.length).toBeGreaterThan(0);

    for (const listing of body.listings) {
      expect(listing.category).toBe('for_sale');
      expect(listing.status).toBe('active');
    }
  });

  test('subcategory filter — narrows results within category', async ({ request }) => {
    const res = await searchApi(request, {
      category: 'for_sale',
      subcategory: 'Computers & Tablets',
      limit: '20'
    });
    expect(res.ok()).toBeTruthy();

    const body = await res.json();
    expect(body.listings.length).toBeGreaterThan(0);
    for (const listing of body.listings) {
      expect(listing.subcategory).toBe('Computers & Tablets');
    }
  });

  test('French full-text search — returns relevant results', async ({ request }) => {
    const res = await searchApi(request, { q: 'voiture', limit: '20' });
    expect(res.ok()).toBeTruthy();

    const body = await res.json();
    expect(body.listings.length).toBeGreaterThan(0);
    // All results must still be active
    for (const listing of body.listings) {
      expect(listing.status).toBe('active');
    }
  });

  test('Arabic full-text search — returns relevant results', async ({ request }) => {
    // سيارة = car in Arabic
    const res = await searchApi(request, { q: 'سيارة', limit: '20' });
    expect(res.ok()).toBeTruthy();

    const body = await res.json();
    expect(body.listings.length).toBeGreaterThan(0);
    for (const listing of body.listings) {
      expect(listing.status).toBe('active');
    }
  });

  test('price range filter — results within bounds', async ({ request }) => {
    const res = await searchApi(request, {
      category: 'for_sale',
      minPrice: '10000',
      maxPrice: '50000',
      limit: '20'
    });
    expect(res.ok()).toBeTruthy();

    const body = await res.json();
    expect(body.listings.length).toBeGreaterThan(0);
    for (const listing of body.listings) {
      expect(listing.price).toBeGreaterThanOrEqual(10000);
      expect(listing.price).toBeLessThanOrEqual(50000);
    }
  });

  test('wilaya filter — results from that wilaya', async ({ request }) => {
    const res = await searchApi(request, {
      wilaya: 'Béjaïa',
      limit: '20'
    });
    expect(res.ok()).toBeTruthy();

    const body = await res.json();
    expect(body.listings.length).toBeGreaterThan(0);
    for (const listing of body.listings) {
      expect(listing.location_wilaya).toBe('Béjaïa');
    }
  });

  test('sort by price_low — ascending price order', async ({ request }) => {
    const res = await searchApi(request, {
      category: 'for_sale',
      sortBy: 'price_low',
      limit: '20'
    });
    expect(res.ok()).toBeTruthy();

    const body = await res.json();
    const prices = body.listings.map((l: any) => l.price ?? 0);
    for (let i = 1; i < prices.length; i++) {
      expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1]);
    }
  });

  test('sort by price_high — descending price order', async ({ request }) => {
    const res = await searchApi(request, {
      category: 'for_sale',
      sortBy: 'price_high',
      limit: '20'
    });
    expect(res.ok()).toBeTruthy();

    const body = await res.json();
    const prices = body.listings.map((l: any) => l.price ?? Infinity);
    for (let i = 1; i < prices.length; i++) {
      expect(prices[i]).toBeLessThanOrEqual(prices[i - 1]);
    }
  });

  test('pagination — page 2 returns different results than page 1', async ({ request }) => {
    const [res1, res2] = await Promise.all([
      searchApi(request, { category: 'for_sale', page: '1', limit: '20' }),
      searchApi(request, { category: 'for_sale', page: '2', limit: '20' }),
    ]);

    expect(res1.ok()).toBeTruthy();
    expect(res2.ok()).toBeTruthy();

    const [b1, b2] = await Promise.all([res1.json(), res2.json()]);
    const ids1 = new Set(b1.listings.map((l: any) => l.id));
    const ids2 = new Set(b2.listings.map((l: any) => l.id));

    // No overlap between pages
    for (const id of ids2) {
      expect(ids1.has(id)).toBe(false);
    }
    expect(b2.pagination.hasPreviousPage).toBe(true);
  });

  test('no results — empty array for nonsense query', async ({ request }) => {
    const res = await searchApi(request, { q: 'xyzxyzxyz999nomatch' });
    expect(res.ok()).toBeTruthy();

    const body = await res.json();
    expect(body.listings).toHaveLength(0);
    expect(body.pagination.hasNextPage).toBe(false);
  });

  test('invalid category — returns 400', async ({ request }) => {
    const res = await searchApi(request, { category: 'invalid_cat' });
    expect(res.status()).toBe(400);
  });

  test('profiles are included in response', async ({ request }) => {
    const res = await searchApi(request, { category: 'for_sale', limit: '5' });
    expect(res.ok()).toBeTruthy();

    const body = await res.json();
    // At least some listings should have profile data attached
    const withProfiles = body.listings.filter((l: any) => l.profiles !== null);
    expect(withProfiles.length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────
// Browse Page UI Tests
// ─────────────────────────────────────────────

test.describe('Browse Page', () => {
  // Serial: each test navigates and waits on the same dev server.
  // Parallel execution causes response-listener races under load.
  test.describe.configure({ mode: 'serial' });

  test('loads with default listing cards', async ({ page }) => {
    await gotoAndWait(page, '/browse');

    const cards = listingCards(page);
    await expect(cards.first()).toBeVisible({ timeout: 10000 });
    expect(await cards.count()).toBeGreaterThan(0);
  });

  test('URL param ?search= pre-fills query and shows results', async ({ page }) => {
    await gotoAndWait(page, '/browse?search=voiture');

    await expect(page.locator('#search-query')).toHaveValue('voiture');
    expect(await listingCards(page).count()).toBeGreaterThan(0);
  });

  test('URL param ?category= pre-selects category', async ({ page }) => {
    await gotoAndWait(page, '/browse?category=for_sale');

    await expect(page.locator('#category-select')).toHaveValue('for_sale');
    expect(await listingCards(page).count()).toBeGreaterThan(0);
  });

  test('subcategory dropdown disabled until category selected', async ({ page }) => {
    await gotoAndWait(page, '/browse');

    const subcatSelect = page.locator('#subcategory-select');
    await expect(subcatSelect).toBeDisabled();

    // Select a category — wait for the triggered search then check subcategory is enabled
    const searchDone = page.waitForResponse(
      (resp: any) => resp.url().includes('/api/search') && resp.status() === 200,
      { timeout: 15000 }
    );
    await page.locator('#category-select').selectOption('for_sale');
    await searchDone;

    await expect(subcatSelect).toBeEnabled();
    expect(await subcatSelect.locator('option').count()).toBeGreaterThan(1);
  });

  test('category filter change triggers new search', async ({ page }) => {
    await gotoAndWait(page, '/browse');

    const searchDone = page.waitForResponse(
      (resp: any) => resp.url().includes('/api/search') && resp.url().includes('category=for_sale') && resp.status() === 200,
      { timeout: 15000 }
    );
    await page.locator('#category-select').selectOption('for_sale');
    await searchDone;
    await page.waitForTimeout(300);

    expect(await listingCards(page).count()).toBeGreaterThan(0);
    expect(page.url()).toContain('category=for_sale');
  });

  test('wilaya filter change updates results', async ({ page }) => {
    await gotoAndWait(page, '/browse');

    const searchDone = page.waitForResponse(
      (resp: any) => resp.url().includes('/api/search') && resp.url().includes('wilaya=') && resp.status() === 200,
      { timeout: 15000 }
    );
    await page.locator('#wilaya-select').selectOption('Béjaïa');
    await searchDone;
    await page.waitForTimeout(300);

    expect(await listingCards(page).count()).toBeGreaterThan(0);
    expect(page.url()).toContain('wilaya=');
  });

  test('empty state shown for no-match search', async ({ page }) => {
    await gotoAndWait(page, '/browse?search=xyzxyzxyz999nomatch');

    expect(await listingCards(page).count()).toBe(0);
    await expect(page.locator('div.text-center.py-12')).toBeVisible({ timeout: 5000 });
  });

  test('listing card click navigates to detail page', async ({ page }) => {
    await gotoAndWait(page, '/browse');

    await listingCards(page).first().click();
    await page.waitForURL(/\/browse\/[a-f0-9-]+/, { timeout: 10000 });
    expect(page.url()).toMatch(/\/browse\/[a-f0-9-]+/);
  });

  test('load more — appends additional results', async ({ page }) => {
    await gotoAndWait(page, '/browse');

    const initialCount = await listingCards(page).count();
    expect(initialCount).toBeGreaterThan(0);

    const loadMoreBtn = page.locator('button').filter({ hasText: /load more|voir plus|المزيد/i }).last();

    if (await loadMoreBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      const page2Done = page.waitForResponse(
        (resp: any) => resp.url().includes('/api/search') && resp.url().includes('page=2') && resp.status() === 200,
        { timeout: 15000 }
      );
      await loadMoreBtn.click();
      await page2Done;
      await page.waitForTimeout(300);

      expect(await listingCards(page).count()).toBeGreaterThan(initialCount);
    } else {
      test.skip(true, 'hasNextPage is false, load more button not shown');
    }
  });
});
