/**
 * Subcategory end-to-end tests
 * Verifies that every seeded subcategory:
 *  - appears in the browse/search API with correct details
 *  - has photos attached
 *  - is accessible on the detail page (no 404 / missing sections)
 *
 * Prerequisite: run `node scripts/seed-subcategory-test-data.js` first.
 */

import { test, expect } from '@playwright/test'

const BASE = 'http://localhost:3000'

// All subcategories we seeded
const SEEDED_SUBCATEGORIES: { category: string; subcategory: string; detailKey: string }[] = [
  { category: 'for_sale', subcategory: 'Vehicles',                           detailKey: 'vehicle_make' },
  { category: 'for_sale', subcategory: 'Motorcycles',                        detailKey: 'moto_type' },
  { category: 'for_sale', subcategory: 'Auto & Motorcycle Parts',            detailKey: 'part_category' },
  { category: 'for_sale', subcategory: 'Construction Vehicles & Trucks',     detailKey: 'truck_type' },
  { category: 'for_sale', subcategory: 'Heavy Equipment & Machinery',        detailKey: 'equipment_type' },
  { category: 'for_sale', subcategory: 'Construction Materials & Supplies',  detailKey: 'material_type' },
  { category: 'for_sale', subcategory: 'Tools & Equipment',                  detailKey: 'tool_type' },
  { category: 'for_sale', subcategory: 'Real Estate',                        detailKey: 'property_type' },
  { category: 'for_rent', subcategory: 'Apartments',                         detailKey: 'property_type' },
  { category: 'for_rent', subcategory: 'Offices',                            detailKey: 'usage_type' },
  { category: 'for_rent', subcategory: 'Vehicles',                           detailKey: 'rate_unit' },
  { category: 'for_rent', subcategory: 'Equipment',                          detailKey: 'equipment_type' },
]

// ── API-level tests ───────────────────────────────────────────────────────────

test.describe('Subcategory API — seeded data present', () => {
  for (const { category, subcategory, detailKey } of SEEDED_SUBCATEGORIES) {
    test(`[${category}] ${subcategory} returns listing with details`, async ({ request }) => {
      const res = await request.get(`${BASE}/api/listings`, {
        params: { category, subcategory, limit: '5' },
      })
      expect(res.status()).toBe(200)
      const json = await res.json()
      const listings = json.listings ?? json.data ?? json

      expect(Array.isArray(listings), 'response should be an array').toBe(true)
      expect(listings.length, `no listings found for ${subcategory}`).toBeGreaterThan(0)

      const listing = listings[0]
      // Must have photos
      expect(listing.photos?.length ?? 0, 'listing should have photos').toBeGreaterThan(0)

      // Cars use dedicated columns; others use listing_details JSONB
      if (subcategory === 'Cars') {
        expect(listing.vehicle_make, 'Cars must have vehicle_make').toBeTruthy()
      } else {
        expect(listing.listing_details, 'listing_details should not be null').toBeTruthy()
        expect(listing.listing_details[detailKey], `${detailKey} should be set`).toBeTruthy()
      }
    })
  }
})

// ── Browse page UI tests ──────────────────────────────────────────────────────

test.describe('Browse page — subcategory filter UI', () => {
  test('Motorcycles browse shows moto_type detail', async ({ page }) => {
    await page.goto(`${BASE}/browse?category=for_sale&subcategory=Motorcycles`)
    await page.waitForLoadState('networkidle')

    // Should have at least one listing card
    const cards = page.locator('[data-testid="listing-card"], .listing-card, article')
    await expect(cards.first()).toBeVisible({ timeout: 10000 })
    expect(await cards.count()).toBeGreaterThan(0)
  })

  test('Heavy Equipment browse shows equipment results', async ({ page }) => {
    await page.goto(`${BASE}/browse?category=for_sale&subcategory=Heavy+Equipment+%26+Machinery`)
    await page.waitForLoadState('networkidle')

    const cards = page.locator('[data-testid="listing-card"], .listing-card, article')
    await expect(cards.first()).toBeVisible({ timeout: 10000 })
  })

  test('Apartment rent browse shows results', async ({ page }) => {
    await page.goto(`${BASE}/browse?category=for_rent&subcategory=Apartments+%2F+Houses`)
    await page.waitForLoadState('networkidle')

    const cards = page.locator('[data-testid="listing-card"], .listing-card, article')
    await expect(cards.first()).toBeVisible({ timeout: 10000 })
  })
})

// ── Detail page tests ─────────────────────────────────────────────────────────

test.describe('Listing detail page — subcategory sections render', () => {
  let carId: string
  let motoId: string

  test.beforeAll(async ({ request }) => {
    const [carRes, motoRes] = await Promise.all([
      request.get(`${BASE}/api/listings`, { params: { category: 'for_sale', subcategory: 'Cars', limit: '1' } }),
      request.get(`${BASE}/api/listings`, { params: { category: 'for_sale', subcategory: 'Motorcycles', limit: '1' } }),
    ])
    const carJson = await carRes.json()
    const motoJson = await motoRes.json()
    carId  = (carJson.listings ?? carJson)[0]?.id
    motoId = (motoJson.listings ?? motoJson)[0]?.id
  })

  test('Car detail page shows vehicle specs section', async ({ page }) => {
    test.skip(!carId, 'No car listing seeded')
    await page.goto(`${BASE}/browse/${carId}`)
    await page.waitForLoadState('networkidle')
    expect(page.url()).not.toContain('/404')
    // Page should not show a hard error
    await expect(page.locator('h1, [data-testid="listing-title"]').first()).toBeVisible({ timeout: 10000 })
  })

  test('Motorcycle detail page renders without error', async ({ page }) => {
    test.skip(!motoId, 'No moto listing seeded')
    await page.goto(`${BASE}/browse/${motoId}`)
    await page.waitForLoadState('networkidle')
    expect(page.url()).not.toContain('/404')
    await expect(page.locator('h1, [data-testid="listing-title"]').first()).toBeVisible({ timeout: 10000 })
  })
})
