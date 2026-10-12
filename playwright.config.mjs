import { defineConfig, devices } from '@playwright/test';

// End-to-end tests run the real app in a phone-sized browser.
// Locally: npm run test:e2e   (first time: npx playwright install chromium)
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 90_000,
  expect: { timeout: 10_000 },
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['github'], ['list']] : [['list']],
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'node scripts/serve.mjs',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: 'android', use: { ...devices['Pixel 7'] } },
    {
      name: 'small-iphone-size',
      use: { browserName: 'chromium', viewport: { width: 375, height: 667 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
    },
  ],
});
