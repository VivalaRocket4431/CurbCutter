import { expect } from '@playwright/test';

export const h1 = (page) => page.locator('h1');

export async function next(page) {
  await page.getByTestId('wizard-next').click();
}

// A complete, realistic case written straight into the app's local database.
export const SAMPLE_CASE = {
  id: 'case_sample0001',
  createdAt: '2026-10-04T15:00:00.000Z',
  status: 'open',
  step: null,
  place: { name: 'Main Street Grocery', address: '1200 Elm St', city: 'Dallas', metro: 'dfw' },
  barriers: ['parking_too_few', 'parking_no_van', 'parking_sign'],
  notes: { parking_sign: 'The only accessible space has no sign.' },
  parking: { total: '120', accessible: '2', van: '0', facility: 'standard' },
  date: '2026-10-04',
  impact: 'I could not get out of my vehicle safely.',
  request: '',
  requestEdited: false,
  replyDays: 14,
  contact: {},
  photos: [],
  events: [{ id: 'ev_1', type: 'documented', date: '2026-10-04' }],
  letters: {},
  nextCheck: null,
  askProfile: false,
};

export async function seed(page, cases = [SAMPLE_CASE], settings = { profile: { name: 'Alex Rivera', who: 'self' }, installDismissed: true }) {
  await page.goto('/');
  await page.evaluate(async ({ cases, settings }) => {
    localStorage.setItem('curbcut.settings.v1', JSON.stringify(settings));
    const store = await import('/js/lib/store.js');
    for (const c of cases) await store.putCase(c);
  }, { cases, settings });
  await page.reload(); // the app reads settings at startup
}

export async function noHorizontalScroll(page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow, 'page should not scroll sideways').toBeLessThanOrEqual(0);
}
