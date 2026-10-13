import { test, expect } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { h1, next, seed, SAMPLE_CASE } from './helpers.mjs';

const PHOTO = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'fixtures', 'lot.jpg');

test('report a parking barrier, send the request, and record it', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/');
  await page.getByTestId('start-report').click();
  await expect(h1(page)).toHaveText('Where is it?');

  // Clear, specific validation.
  await next(page);
  await expect(page.locator('.error-summary')).toContainText('Enter the business name or the address.');
  await expect(page.locator('.error-summary')).toBeFocused();

  await page.getByLabel('Business or place name').fill('Main Street Grocery');
  await page.getByLabel(/Street address/).fill('1200 Elm St');
  await page.getByLabel(/^City/).fill('Dallas');
  await page.getByText('Dallas–Fort Worth', { exact: true }).click();
  await next(page);

  await expect(h1(page)).toHaveText('What\'s the problem?');
  await next(page);
  await expect(page.locator('.error-summary')).toContainText('Pick at least one problem.');
  await page.getByText('Not enough accessible parking spaces').click();
  await page.getByText('No van-accessible space').click();
  await page.getByText('Missing, faded, or too-low signs').click();
  await next(page);

  await expect(h1(page)).toHaveText('Count the parking');
  await page.locator('#park-total').fill('120');
  await page.locator('#park-accessible').fill('2');
  await page.locator('#park-van').fill('0');
  const calc = page.locator('.calc-result');
  await expect(calc).toContainText('5 accessible');
  await expect(calc).toContainText('Missing 3 accessible spaces and 1 van-accessible space.');
  await next(page);

  await expect(h1(page)).toHaveText('Add details');
  await page.locator('#note-parking_sign').fill('The only accessible space has no sign.');
  await next(page);

  await expect(h1(page)).toHaveText('Add photos');
  await page.locator('input[type=file][multiple]').setInputFiles(PHOTO);
  await expect(page.locator('.photo-grid img')).toHaveCount(1);
  await next(page);

  await expect(h1(page)).toHaveText('How did it affect you?');
  await page.getByRole('button', { name: /could not get out of my vehicle safely/ }).click();
  await expect(page.locator('#impact')).toHaveValue(/could not get out of my vehicle safely/);
  await next(page);

  await expect(h1(page)).toHaveText('What are you asking for?');
  await expect(page.locator('#request')).toHaveValue(/Add accessible parking spaces/);
  await next(page);

  await expect(h1(page)).toHaveText('How to sign your letters');
  await page.getByLabel('Your name').fill('Alex Rivera');
  await page.getByLabel(/Your email/).fill('alex@example.com');
  await next(page);

  await expect(h1(page)).toHaveText('Review your report');
  await expect(page.locator('.review-sec').first()).toContainText('Main Street Grocery');
  await page.getByTestId('wizard-next').click();

  // Case page: one clear next step.
  await expect(h1(page)).toHaveText('Main Street Grocery');
  await expect(page.locator('.next-title')).toHaveText('Ask the business');
  await page.getByRole('link', { name: 'Read your letter' }).click();
  await expect(page.getByRole('heading', { name: 'Step 1: Read it over' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Step 2: Send it' })).toBeVisible();

  const letter = page.locator('.letter-text');
  await expect(letter).toContainText('Table 208.2');
  await expect(letter).toContainText('at least 5 accessible spaces, including 1 van-accessible space');
  await expect(letter).toContainText('681.011(f-2)');
  await expect(letter).toContainText('federal tax incentives may help (IRS Form 8826');
  await expect(letter).toContainText('Alex Rivera');
  await expect(page.getByRole('link', { name: 'Email it' })).toHaveAttribute('href', /^mailto:\?subject=Accessibility%20request/);
  // Copy sits with the main buttons, not tucked under "More ways".
  await expect(page.getByRole('button', { name: 'Copy the letter' })).toBeVisible();

  // Formal tone rewrites the letter.
  await page.getByText('Formal', { exact: true }).click();
  await expect(letter).toContainText('Sincerely,');

  // Record that it was sent; the case moves to "wait for a reply" with a reminder.
  await page.getByRole('button', { name: 'Yes: I asked the business' }).click();
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.locator('.recorder-done')).toContainText('Asked the business');
  await expect(page.locator('.reminder-title')).toContainText('Check back');
  await page.getByRole('button', { name: 'Done' }).click();
  await expect(page.locator('.next-title')).toHaveText('Wait for a reply');

  // Everything survives a reload.
  await page.reload();
  await expect(page.locator('.next-title')).toHaveText('Wait for a reply');
  await expect(page.locator('.timeline')).toContainText('Asked the business');

  // The letter that was sent can be reread exactly, and copied again.
  await page.getByRole('link', { name: 'Read the letter you sent' }).click();
  await expect(h1(page)).toHaveText('Request letter');
  await expect(page.locator('.lede')).toContainText('Asked the business on');
  await expect(page.locator('.letter-text')).toContainText('Sincerely,');
  await expect(page.locator('.letter-text')).toContainText('Table 208.2');
  await expect(page.getByRole('button', { name: 'Copy the letter' })).toBeVisible();
  await page.getByRole('link', { name: /^Back to/ }).click();
  await page.getByText('All steps and letters', { exact: true }).click();
  await page.getByRole('link', { name: 'Request letter' }).click();
  await expect(page.locator('.sent-note')).toContainText('Asked the business on');
  expect(errors).toEqual([]);
});

test('drafts can be finished later', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('start-report').click();
  await page.getByLabel('Business or place name').fill('Corner Pharmacy');
  await page.getByRole('link', { name: 'Save and finish later' }).click();
  await expect(page.getByRole('heading', { name: 'Pick up where you left off' })).toBeVisible();
  await page.getByRole('link', { name: /Corner Pharmacy/ }).click();
  await expect(page.getByLabel('Business or place name')).toHaveValue('Corner Pharmacy');
});

test('TDLR summary fits the state form and shows the fields to copy', async ({ page }) => {
  await seed(page, [{ ...SAMPLE_CASE, events: [...SAMPLE_CASE.events, { id: 'ev_2', type: 'asked', date: '2026-10-05' }] }]);
  await page.goto(`/#/case/${SAMPLE_CASE.id}/letter/tdlr`);
  await expect(h1(page)).toHaveText('TDLR complaint summary');
  await expect(page.locator('.count')).toContainText('of 1,000 characters.');
  await expect(page.locator('.count')).not.toHaveClass(/over/);
  await expect(page.locator('.copy-fields')).toContainText('Architectural Barriers');
  await expect(page.getByRole('link', { name: /Open the TDLR complaint form/ })).toHaveAttribute('href', 'https://ga.tdlr.texas.gov:1443/form/Complaint');
});

test('owner letter shows where to look up the property owner', async ({ page }) => {
  await seed(page);
  await page.goto(`/#/case/${SAMPLE_CASE.id}/letter/owner`);
  await expect(page.getByRole('heading', { name: 'Find who owns the property' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Dallas Central Appraisal District/ })).toBeVisible();
});

test('marking it fixed celebrates and suggests a thank-you', async ({ page }) => {
  await seed(page);
  await page.goto(`/#/case/${SAMPLE_CASE.id}`);
  await page.getByText('Add an update', { exact: true }).click();
  await page.getByRole('button', { name: 'It\'s fixed' }).click();
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.locator('.next-title')).toHaveText('Say thank you');
  await expect(page.locator('.chip').first()).toHaveText('Fixed');
});

test('settings change text size and colors', async ({ page }) => {
  await page.goto('/#/settings');
  await page.getByText('Extra large', { exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-text-size', 'xl');
  await page.getByText('Dark', { exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByLabel(/High contrast/).check();
  await expect(page.locator('html')).toHaveAttribute('data-contrast', 'high');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-text-size', 'xl');
});

test('backup downloads and restores every case', async ({ page }) => {
  await seed(page);
  await page.goto('/#/settings');
  await page.getByText('Backup or start over').click();
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Download a backup' }).click(),
  ]);
  const file = await download.path();
  await page.getByRole('button', { name: 'Delete all my cases and photos' }).click();
  await page.getByRole('button', { name: 'Delete everything' }).click();
  await expect(page.locator('.toast', { hasText: 'Everything was deleted.' })).toBeVisible();
  await page.goto('/#/cases');
  await expect(page.getByText('No reports yet')).toBeVisible();
  await page.goto('/#/settings');
  await page.getByText('Backup or start over').click();
  await page.locator('input[type=file][accept*="json"]').setInputFiles(file);
  await expect(page.locator('.toast', { hasText: 'Backup restored: 1 added' })).toBeVisible();
  await page.goto('/#/cases');
  await expect(page.getByRole('link', { name: /Main Street Grocery/ })).toBeVisible();
});

test('the person has the last word: edits go into the email and can be undone', async ({ page }) => {
  await seed(page);
  await page.goto(`/#/case/${SAMPLE_CASE.id}/letter/request`);

  // Reading comes first; sending comes after the letter.
  const step1 = page.getByRole('heading', { name: 'Step 1: Read it over' });
  const email = page.getByRole('link', { name: 'Email it' });
  const step1Box = await step1.boundingBox();
  const emailBox = await email.boundingBox();
  expect(emailBox.y).toBeGreaterThan(step1Box.y);

  await page.getByTestId('edit-toggle').click();
  const body = page.locator('#edit-body');
  await expect(body).toBeFocused();
  await body.fill('Howdy. Please add a van-accessible space by the front door. Thank you kindly, Alex');
  await expect(page.locator('.edited-note')).toContainText('You changed this letter. Your version is saved.');
  await expect(email).toHaveAttribute('href', /Howdy\.%20Please%20add%20a%20van-accessible%20space/);
  await page.getByTestId('edit-toggle').click();
  await expect(page.locator('.letter-text')).toHaveText(/^Howdy\./);

  // The edit survives a reload, and the tone switch doesn't overwrite it.
  await page.reload();
  await expect(page.locator('.letter-text')).toHaveText(/^Howdy\./);
  await page.getByText('Formal', { exact: true }).click();
  await expect(page.locator('.letter-text')).toHaveText(/^Howdy\./);

  // Going back to the draft restores CurbCutter's wording in the chosen tone.
  await page.getByRole('button', { name: 'Go back to CurbCutter\'s draft' }).click();
  await expect(page.locator('.letter-text')).toContainText('Sincerely,');
  await expect(page.locator('.edited-note')).toHaveCount(0);
});

test('photos can be saved to the phone from the case and the letter', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('start-report').click();
  await page.getByLabel('Business or place name').fill('Photo Test Market');
  await next(page);
  await page.getByText('Spaces or aisles are often blocked').click();
  await next(page); // details
  await next(page); // photos
  await expect(page.locator('.photo-note')).toContainText('don\'t go into your phone\'s photo library');
  await page.locator('input[type=file][multiple]').setInputFiles(PHOTO);
  await expect(page.locator('.photo-grid img')).toHaveCount(1);
  for (let i = 0; i < 4; i += 1) await next(page);
  await page.getByTestId('wizard-next').click(); // save on review

  // The report page shows the photo without opening anything, and it opens full size.
  await expect(page.getByRole('heading', { name: 'Your photo' })).toBeVisible();
  await expect(page.locator('.photo-grid img')).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Save the photo to my phone' })).toBeVisible();
  await page.locator('.photo-grid .thumb').first().click();
  await expect(page.locator('dialog.viewer')).toBeVisible();
  await page.locator('dialog.viewer').getByRole('button', { name: 'Close' }).click();

  // The letter screen shows the same photo next to the send buttons.
  await page.getByRole('link', { name: 'Read your letter' }).click();
  await expect(page.locator('.letter-photos img')).toHaveCount(1);
  await expect(page.locator('.photo-help')).toContainText('Email links can\'t carry photos');
  await page.getByText('More ways', { exact: true }).click();
  await expect(page.getByRole('button', { name: 'Save the photo to my phone' })).toBeVisible();
});

test('a photo that can\'t be added says why and what to do, and stays on screen', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('start-report').click();
  await page.getByLabel('Business or place name').fill('Photo Problem Cafe');
  await next(page);
  await page.getByText('Spaces or aisles are often blocked').click();
  await next(page); // details
  await next(page); // photos
  const chooser = page.locator('input[type=file][multiple]');

  // A HEIC photo from an Android camera: Chrome can't open it.
  await chooser.setInputFiles({ name: 'selfie.heic', mimeType: 'image/heic', buffer: Buffer.from('not a real photo') });
  await expect(page.locator('.photo-problem')).toContainText('This photo couldn\'t be added');
  await expect(page.locator('.photo-problem')).toContainText('HEIC');
  await expect(page.locator('.photo-problem')).toContainText('Take a photo');

  // A photo still in the cloud arrives empty.
  await chooser.setInputFiles({ name: 'IMG_2041.jpg', mimeType: 'image/jpeg', buffer: Buffer.alloc(0) });
  await expect(page.locator('.photo-problem')).toContainText('hasn\'t finished downloading');

  // Two bad files at once get one message, then a good photo clears it.
  await chooser.setInputFiles([
    { name: 'a.heic', mimeType: 'image/heic', buffer: Buffer.from('x') },
    { name: 'b.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('not a jpeg') },
  ]);
  await expect(page.locator('.photo-problem')).toContainText('2 photos couldn\'t be added');
  await chooser.setInputFiles(PHOTO);
  await expect(page.locator('.photo-grid img')).toHaveCount(1);
  await expect(page.locator('.photo-problem')).toBeEmpty();
});

test('picking a problem clears the error at once, and Next works on the first tap', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('start-report').tap();
  await page.getByLabel('Business or place name').fill('Tap Test Diner');
  await page.getByTestId('wizard-next').tap();
  await expect(h1(page)).toHaveText('What\'s the problem?');

  // Nothing on this screen looks picked until the person picks a problem.
  await expect(page.locator('.choice-input:checked')).toHaveCount(0);
  await page.getByTestId('wizard-next').tap();
  await expect(page.locator('.error-summary')).toContainText('Pick at least one problem.');

  await page.getByText('Door is too heavy to open').tap();
  await expect(page.locator('.error-summary')).toHaveCount(0);
  await expect(page.locator('.error-text')).toHaveCount(0);
  await page.getByText('Counter is too high').tap();
  await page.getByTestId('wizard-next').tap();
  await expect(h1(page)).toHaveText('Add details');
  await expect(page.locator('.detail-block h2')).toHaveText(['Door is too heavy to open', 'Counter is too high']);
});

test('a report shows its progress as 4 numbered boxes, not a long row of steps', async ({ page }) => {
  await seed(page); // the sample report has 8 screens, so each screen fills half a box
  const fills = () => page.locator('.progress-fill').evaluateAll((els) => els.map((e) => Math.round((e.getBoundingClientRect().width / e.parentElement.clientWidth) * 100) / 100));

  await page.goto(`/#/case/${SAMPLE_CASE.id}/step/place`);
  await expect(page.locator('.progress-box')).toHaveCount(4);
  await expect(page.locator('.progress-num')).toHaveText(['1', '2', '3', '4']);
  await expect(page.locator('.progress')).toHaveAttribute('aria-valuetext', 'Part 1 of 4');
  await expect(page.locator('.wizard-head')).not.toContainText(/step|of \d/i);
  expect(await fills()).toEqual([0.5, 0, 0, 0]);

  await page.goto(`/#/case/${SAMPLE_CASE.id}/step/details`);
  await expect(page.locator('.progress')).toHaveAttribute('aria-valuetext', 'Part 2 of 4');
  expect(await fills()).toEqual([1, 1, 0, 0]);

  await page.goto(`/#/case/${SAMPLE_CASE.id}/step/review`);
  await expect(page.locator('.progress')).toHaveAttribute('aria-valuetext', 'Part 4 of 4');
  expect(await fills()).toEqual([1, 1, 1, 1]);
});
