// The app must open and work with no signal (for example, in a parking garage).
import { test, expect } from '@playwright/test';
import { seed, SAMPLE_CASE } from './helpers.mjs';

test('works offline after the first visit', async ({ page, context }) => {
  await seed(page);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller), { timeout: 15000 }).toBe(true);

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByTestId('start-report')).toBeVisible();
  await page.goto(`/#/case/${SAMPLE_CASE.id}/letter/request`);
  await expect(page.locator('.letter-text')).toContainText('Main Street Grocery');
  await page.goto('/#/rights/parking-count');
  await expect(page.getByRole('table')).toContainText('101 to 150');

  // A new report can be started and saved offline too.
  await page.goto('/#/new');
  await page.getByLabel('Business or place name').fill('Offline Cafe');
  await page.getByRole('link', { name: 'Save and finish later' }).click();
  await expect(page.getByRole('link', { name: /Offline Cafe/ })).toBeVisible();
  await context.setOffline(false);
});

test('the service worker caches every app file', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => navigator.serviceWorker.ready);
  const missing = await page.evaluate(async () => {
    const keys = await caches.keys();
    const cache = await caches.open(keys.find((k) => /^curbcut-[0-9a-f]{12}$/.test(k)));
    const wanted = ['index.html', 'js/main.js', 'js/screens/wizard.js', 'assets/app.css', 'assets/fonts/overpass-latin-800-normal.woff2', 'manifest.webmanifest'];
    const out = [];
    for (const f of wanted) if (!(await cache.match(f))) out.push(f);
    return out;
  });
  expect(missing).toEqual([]);
});

test('the privacy and support pages open from the app and work with no signal', async ({ page, context }) => {
  await page.goto('/');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller), { timeout: 15000 }).toBe(true);

  // The About screen links to the full policy, and it isn't replaced by the app.
  await page.goto('/#/about');
  await page.getByRole('link', { name: 'Read the full privacy policy' }).click();
  await expect(page.locator('h1')).toHaveText('Privacy');
  await expect(page).toHaveTitle('Privacy | CurbCutter');

  await context.setOffline(true);
  await page.goto('/support/');
  await expect(page.locator('h1')).toHaveText('Support');
  await page.getByRole('link', { name: 'Open app' }).click();
  await expect(page.getByTestId('start-report')).toBeVisible();
  await context.setOffline(false);
});
