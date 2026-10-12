// Automated accessibility checks (WCAG 2.2 A and AA rules in axe-core) on every screen,
// in light, dark, and high-contrast modes, plus a check that nothing scrolls sideways at XL text.
import { test, expect } from '@playwright/test';
import { createRequire } from 'node:module';
import { seed, SAMPLE_CASE, noHorizontalScroll } from './helpers.mjs';

const require = createRequire(import.meta.url);
const AXE = require.resolve('axe-core/axe.min.js');

test.use({ bypassCSP: true }); // lets the test inject axe-core; the app itself keeps its strict policy

const SCREENS = [
  '/',
  '/#/cases',
  `/#/case/${SAMPLE_CASE.id}`,
  `/#/case/${SAMPLE_CASE.id}/step/place`,
  `/#/case/${SAMPLE_CASE.id}/step/barriers`,
  `/#/case/${SAMPLE_CASE.id}/step/parking`,
  `/#/case/${SAMPLE_CASE.id}/step/details`,
  `/#/case/${SAMPLE_CASE.id}/step/photos`,
  `/#/case/${SAMPLE_CASE.id}/step/story`,
  `/#/case/${SAMPLE_CASE.id}/step/request`,
  `/#/case/${SAMPLE_CASE.id}/step/review`,
  `/#/case/${SAMPLE_CASE.id}/letter/request`,
  `/#/case/${SAMPLE_CASE.id}/letter/tdlr`,
  `/#/case/${SAMPLE_CASE.id}/letter/news`,
  `/#/case/${SAMPLE_CASE.id}/letter/owner`,
  `/#/case/${SAMPLE_CASE.id}/letter/city`,
  `/#/case/${SAMPLE_CASE.id}/show`,
  '/#/rights',
  '/#/rights/parking-count',
  '/#/rights/who-enforces',
  '/#/help/dfw',
  '/#/help/houston',
  '/#/help/sanantonio',
  '/#/help/austin',
  '/#/help/other',
  '/#/settings',
  '/#/about',
  '/privacy/',
  '/support/',
];

async function axe(page) {
  await page.addScriptTag({ path: AXE });
  return page.evaluate(async () => {
    const r = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] } });
    return r.violations.map((v) => `${v.id} (${v.impact}): ${v.help} -> ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`);
  });
}

for (const mode of ['light', 'dark', 'high-contrast']) {
  test(`every screen passes axe in ${mode} mode`, async ({ page }) => {
    test.setTimeout(240_000);
    if (mode === 'dark') await page.emulateMedia({ colorScheme: 'dark' });
    await seed(page, [SAMPLE_CASE], {
      profile: { name: 'Alex Rivera', who: 'self' },
      installDismissed: true,
      contrast: mode === 'high-contrast' ? 'high' : 'normal',
    });
    const problems = [];
    for (const url of SCREENS) {
      await page.goto(url);
      await page.locator('h1').first().waitFor();
      await page.waitForTimeout(150);
      for (const v of await axe(page)) problems.push(`${url}: ${v}`);
      const stray = await page.evaluate(() => document.body.innerText.match(/\b(null|undefined|NaN)\b|\[object Object\]/)?.[0]);
      if (stray) problems.push(`${url}: shows the word "${stray}"`);
    }
    expect(problems, problems.join('\n')).toEqual([]);
  });
}

test('nothing scrolls sideways at extra-large text', async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 360, height: 740 });
  await seed(page, [SAMPLE_CASE], { profile: { name: 'Alex Rivera', who: 'self' }, installDismissed: true, textSize: 'xl' });
  for (const url of SCREENS) {
    await page.goto(url);
    await page.locator('h1').first().waitFor();
    await noHorizontalScroll(page);
  }
});

test('the app bar fits on small phones at every text size', async ({ page }) => {
  for (const width of [320, 360, 375]) {
    await page.setViewportSize({ width, height: 640 });
    for (const textSize of ['m', 'l', 'xl']) {
      await seed(page, [], { installDismissed: true, textSize });
      await page.locator('h1').first().waitFor();
      const r = await page.evaluate(() => {
        const name = document.querySelector('.brand-name');
        const btn = document.querySelector('.appbar-btn').getBoundingClientRect();
        const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
        return {
          gap: btn.left - name.getBoundingClientRect().right,
          oneLine: btn.height <= 2.75 * rem + 2,
          nameCut: name.scrollWidth > name.clientWidth,
        };
      });
      const where = `${width}px wide, text size ${textSize}`;
      expect(r.gap, `${where}: the name runs into the Read aloud button`).toBeGreaterThanOrEqual(6);
      expect(r.oneLine, `${where}: the Read aloud label wraps`).toBe(true);
      expect(r.nameCut, `${where}: the app name is cut off`).toBe(false);
      await noHorizontalScroll(page);
    }
  }
});

test('route changes move focus to the new heading', async ({ page }) => {
  await seed(page);
  await page.goto('/');
  await page.getByRole('link', { name: 'Rights & help', exact: true }).click();
  await expect(page.locator('h1')).toBeFocused();
  await expect(page).toHaveTitle('Rights & help | CurbCutter');
});
