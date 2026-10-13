// People always get the current CurbCutter. Nobody is asked to update, nothing reloads while they work,
// and with no signal CurbCutter still opens from the copy saved on the phone.
import { test, expect } from '@playwright/test';
import { createServer } from 'node:http';
import { cp, mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PUBLIC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'public');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.txt': 'text/plain' };
const UPDATE_WORDS = /new version|update now|reload/i;

// A private copy of curbcutter.org that a test can change (a deploy) or silence (a dead connection).
async function startSite() {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'curbcut-site-'));
  await cp(PUBLIC, dir, { recursive: true });
  const site = { dir, silent: false, held: [] };
  site.server = createServer(async (req, res) => {
    if (site.silent) {
      site.held.push(res); // never answers, like a phone with signal bars but no data getting through
      return;
    }
    let file = path.join(dir, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (file.endsWith('/')) file += 'index.html';
    try {
      const body = await readFile(file);
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' }).end(body);
    } catch (e) {
      res.writeHead(404).end('Not found');
    }
  });
  await new Promise((resolve) => site.server.listen(0, '127.0.0.1', resolve));
  site.url = `http://127.0.0.1:${site.server.address().port}`;
  // Publishes a change, the way a push to GitHub does: new files, and a new VERSION written into sw.js.
  site.deploy = async (file, from, to, version) => {
    const target = path.join(dir, file);
    await writeFile(target, (await readFile(target, 'utf8')).replace(from, to));
    const sw = path.join(dir, 'sw.js');
    await writeFile(sw, (await readFile(sw, 'utf8')).replace(/const VERSION = '[^']+'/, `const VERSION = '${version}'`));
  };
  site.stop = async () => {
    site.held.forEach((res) => res.destroy());
    site.server.closeAllConnections();
    await new Promise((resolve) => site.server.close(resolve));
    await rm(dir, { recursive: true, force: true });
  };
  return site;
}

async function controlled(page) {
  await page.evaluate(() => navigator.serviceWorker.ready);
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller), { timeout: 15_000 }).toBe(true);
}

test.describe('after curbcutter.org changes', () => {
  let site;
  test.beforeEach(async () => { site = await startSite(); });
  test.afterEach(async () => { await site.stop(); });

  test('the very next time CurbCutter opens, it is the current one, with no message and no reload', async ({ page, context }) => {
    await page.goto(`${site.url}/`);
    await expect(page.locator('h1')).toHaveText('Speak up for access.');
    await controlled(page);
    const before = await page.evaluate(() => caches.keys());

    await site.deploy('js/screens/home.js', "'Speak up for access.'", "'Speak up for access, today.'", 'curbcut-00000000000a');

    let loads = 0;
    page.on('load', () => { loads += 1; });
    await page.goto(`${site.url}/`);
    await expect(page.locator('h1')).toHaveText('Speak up for access, today.');
    await expect(page.locator('body')).not.toContainText(UPDATE_WORDS);

    // The phone saves the new copy in the background, without touching the page...
    const oldCopy = before.find((k) => k !== 'curbcut-live');
    await expect.poll(() => page.evaluate(() => caches.keys()), { timeout: 15_000 }).toEqual(expect.arrayContaining(['curbcut-00000000000a', 'curbcut-live']));
    await expect.poll(() => page.evaluate(() => caches.keys()), { timeout: 15_000 }).not.toContain(oldCopy);
    await page.waitForTimeout(1000);
    expect(loads).toBe(1);

    // ...so with no signal at all, it opens the new copy too.
    await context.setOffline(true);
    await page.reload();
    await expect(page.locator('h1')).toHaveText('Speak up for access, today.');
    await context.setOffline(false);
  });

  test('a connection that never answers still opens CurbCutter within seconds', async ({ page }) => {
    await page.goto(`${site.url}/`);
    await controlled(page);
    await page.reload(); // the copy on the phone is current, so this opens from the phone
    await expect(page.getByTestId('start-report')).toBeVisible();

    await page.goto(`${site.url}/#/settings`);
    await expect(page.locator('h1')).toHaveText('Settings');

    site.silent = true;
    const started = Date.now();
    await page.reload();
    await expect(page.locator('h1')).toHaveText('Settings');
    expect(Date.now() - started).toBeLessThan(8_000);
  });

  test('an open report is never interrupted when curbcutter.org changes', async ({ page }) => {
    await page.goto(`${site.url}/#/new`);
    await controlled(page);
    let loads = 0;
    page.on('load', () => { loads += 1; });
    await page.getByLabel('Business or place name').fill('Corner Bakery');

    await site.deploy('js/screens/home.js', "'Speak up for access.'", "'Speak up for access, today.'", 'curbcut-00000000000b');
    await page.evaluate(async () => (await navigator.serviceWorker.getRegistration()).update());
    await expect.poll(() => page.evaluate(() => caches.keys()), { timeout: 15_000 }).toHaveLength(2);
    await expect.poll(() => page.evaluate(() => caches.keys()), { timeout: 15_000 }).toContain('curbcut-00000000000b');
    await page.waitForTimeout(1000);

    await expect(page.getByLabel('Business or place name')).toHaveValue('Corner Bakery');
    await expect(page.locator('body')).not.toContainText(UPDATE_WORDS);
    expect(loads).toBe(0);
  });
});

// Phones that opened CurbCutter before October 13, 2026 hold a copy from the earlier design, which could
// show "A new version of CurbCutter is ready". Those pages switch to the current CurbCutter once, by
// themselves, on the same screen.

// Opens the app on a phone whose storage already holds these caches, and counts page loads.
async function openWith(page, cacheNames) {
  await page.goto('/robots.txt'); // same site but not the app, so no service worker starts yet
  await page.evaluate(async (names) => { for (const n of names) await caches.open(n); }, cacheNames);
  let loads = 0;
  page.on('load', () => { loads += 1; });
  await page.goto('/');
  try {
    await page.evaluate(() => navigator.serviceWorker.ready);
  } catch (e) {
    /* the page may reload while waiting */
  }
  return () => loads;
}

async function cacheNames(page) {
  await page.locator('h1').first().waitFor();
  return page.evaluate(() => caches.keys());
}

test('a first visit never reloads', async ({ page }) => {
  const loads = await openWith(page, []);
  await page.waitForTimeout(1500);
  expect(loads()).toBe(1);
  expect(await cacheNames(page)).toContain('curbcut-live');
});

test('a page from the earlier design switches to the current CurbCutter by itself, once', async ({ page }) => {
  const loads = await openWith(page, ['curbcut-0123456789ab']);
  await expect.poll(loads, { timeout: 15_000 }).toBe(2);
  await expect(page.getByTestId('start-report')).toBeVisible();
  const keys = await cacheNames(page);
  expect(keys).toContain('curbcut-live');
  expect(keys).not.toContain('curbcut-0123456789ab');
  await page.waitForTimeout(1500);
  expect(loads()).toBe(2);
});

// The switch reloads the page where it was opened (usually Home), with every answer already saved.
test('that switch also happens after moving around in the app, and only once', async ({ page }) => {
  const site = await startSite();
  try {
    await page.goto(`${site.url}/`);
    await controlled(page);
    await page.evaluate(() => caches.delete('curbcut-live')); // storage as the earlier design left it
    await page.getByRole('link', { name: 'Settings' }).click();
    await expect(page.locator('h1')).toHaveText('Settings');
    let loads = 0;
    page.on('load', () => { loads += 1; });

    await site.deploy('js/screens/home.js', "'Speak up for access.'", "'Speak up for access, today.'", 'curbcut-00000000000c');
    await page.evaluate(async () => (await navigator.serviceWorker.getRegistration()).update());
    await expect.poll(() => loads, { timeout: 15_000 }).toBe(1);
    await expect(page.locator('h1')).toHaveText(/^(Settings|Speak up for access, today\.)$/);
    await expect(page.locator('body')).not.toContainText(UPDATE_WORDS);
    await page.waitForTimeout(1500);
    expect(loads).toBe(1);
  } finally {
    await site.stop();
  }
});

test('after that, pages never reload', async ({ page }) => {
  const loads = await openWith(page, ['curbcut-live', 'curbcut-0123456789ab']);
  await page.waitForTimeout(1500);
  expect(loads()).toBe(1);
  expect(await cacheNames(page)).not.toContain('curbcut-0123456789ab');
});
