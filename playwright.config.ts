import { defineConfig, devices } from '@playwright/test';

/**
 * @see https://playwright.dev/docs/test-configuration
 */

const ADMIN_STORAGE_STATE = '.playwright/admin-auth.json';

export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },

  /* Configure projects for major browsers */
  projects: [
    // --- Auth setup (runs once per browser before admin tests) ---
    {
      name: 'admin-setup-chromium',
      testMatch: /admin\.setup\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'admin-setup-firefox',
      testMatch: /admin\.setup\.ts/,
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'admin-setup-webkit',
      testMatch: /admin\.setup\.ts/,
      use: { ...devices['Desktop Safari'] },
    },

    // --- Admin tests: depend on setup, reuse stored auth cookies ---
    {
      name: 'chromium-admin',
      use: {
        ...devices['Desktop Chrome'],
        storageState: ADMIN_STORAGE_STATE,
      },
      testMatch: /admin-user-management\.spec\.ts|admin-debug\.spec\.ts|simple-admin-test\.spec\.ts/,
      dependencies: ['admin-setup-chromium'],
    },
    {
      name: 'firefox-admin',
      use: {
        ...devices['Desktop Firefox'],
        storageState: ADMIN_STORAGE_STATE,
      },
      testMatch: /admin-user-management\.spec\.ts|admin-debug\.spec\.ts|simple-admin-test\.spec\.ts/,
      dependencies: ['admin-setup-firefox'],
    },
    {
      name: 'webkit-admin',
      use: {
        ...devices['Desktop Safari'],
        storageState: ADMIN_STORAGE_STATE,
      },
      testMatch: /admin-user-management\.spec\.ts|admin-debug\.spec\.ts|simple-admin-test\.spec\.ts/,
      dependencies: ['admin-setup-webkit'],
    },

    // --- Regular tests (chromium / firefox / webkit) ---
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: /admin-user-management\.spec\.ts|admin-debug\.spec\.ts|simple-admin-test\.spec\.ts|admin\.setup\.ts/,
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      testIgnore: /admin-user-management\.spec\.ts|admin-debug\.spec\.ts|simple-admin-test\.spec\.ts|admin\.setup\.ts/,
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      testIgnore: /admin-user-management\.spec\.ts|admin-debug\.spec\.ts|simple-admin-test\.spec\.ts|admin\.setup\.ts/,
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
