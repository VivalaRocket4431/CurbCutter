// A phone browser in its "desktop site" view lays pages out about 980 pixels wide and shrinks them onto the
// screen, which makes every word tiny. CurbCutter has to come out phone-sized anyway, with no browser
// setting to change. Normal phones and computers must be left exactly as they were.
import { test, expect } from '@playwright/test';
import { seed, SAMPLE_CASE, noHorizontalScroll } from './helpers.mjs';

async function fitState(page) {
  return page.evaluate(() => {
    const root = document.documentElement;
    const zoom = parseFloat(getComputedStyle(root).zoom) || 1;
    const tab = document.querySelector('.tabbar')?.getBoundingClientRect();
    return {
      fit: root.classList.contains('phone-fit'),
      zoom,
      ratio: innerWidth / screen.width,
      // Body text as it lands on the screen, after the browser shrinks the wide page to fit.
      textOnScreen: parseFloat(getComputedStyle(document.body).fontSize) * zoom * (screen.width / innerWidth),
      bodyMin: parseFloat(getComputedStyle(document.body).minHeight) * zoom,
      innerHeight,
      tab: tab ? { left: tab.left, right: tab.right, bottom: tab.bottom } : null,
      innerWidth,
    };
  });
}

test.describe('a phone showing its desktop-site view', () => {
  // screen is set through contextOptions: Playwright Test doesn't take it as a top-level option.
  test.use({ viewport: { width: 980, height: 2122 }, contextOptions: { screen: { width: 412, height: 892 } }, isMobile: false, hasTouch: true, deviceScaleFactor: 1 });

  test('still gets the phone-sized app, with readable text', async ({ page }) => {
    await seed(page, [SAMPLE_CASE]);
    for (const url of ['/', `/#/case/${SAMPLE_CASE.id}/letter/request`, '/#/settings', '/privacy/', '/support/']) {
      await page.goto(url);
      await page.locator('h1').first().waitFor();
      const s = await fitState(page);
      expect(s.fit, `${url}: zoomed back to phone size`).toBe(true);
      expect(s.zoom, `${url}: zoom matches the screen`).toBeCloseTo(s.ratio, 2);
      expect(s.textOnScreen, `${url}: body text size on the screen`).toBeGreaterThanOrEqual(17.5);
      expect(Math.abs(s.bodyMin - s.innerHeight), `${url}: no extra blank space`).toBeLessThanOrEqual(2);
      if (s.tab) {
        expect(s.tab.left).toBeLessThanOrEqual(0.5);
        expect(s.tab.right).toBeGreaterThanOrEqual(s.innerWidth - 0.5);
        expect(s.tab.bottom).toBeGreaterThanOrEqual(s.innerHeight - 0.5);
      }
      await noHorizontalScroll(page);
    }
  });
});

test.describe('a phone in its normal view', () => {
  test.use({ viewport: { width: 412, height: 892 }, contextOptions: { screen: { width: 412, height: 892 } }, isMobile: true, hasTouch: true });

  test('is left alone', async ({ page }) => {
    await seed(page, [SAMPLE_CASE]);
    const s = await fitState(page);
    expect(s.fit).toBe(false);
    expect(s.zoom).toBe(1);
  });
});

test.describe('a computer', () => {
  test.use({ viewport: { width: 1280, height: 800 }, contextOptions: { screen: { width: 1440, height: 900 } }, isMobile: false, hasTouch: false });

  test('is left alone', async ({ page }) => {
    await seed(page, [SAMPLE_CASE]);
    const s = await fitState(page);
    expect(s.fit).toBe(false);
    expect(s.zoom).toBe(1);
  });
});
