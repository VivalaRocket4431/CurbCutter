import { test } from 'node:test';
import assert from 'node:assert/strict';
import { reminderICS, googleCalendarURL } from '../../public/js/lib/ics.js';
import { addDays, daysBetween, longDate, relativeDays, isISODate } from '../../public/js/lib/dates.js';
import { mailtoHref } from '../../public/js/lib/share.js';
import { metroFor } from '../../public/js/lib/geo.js';
import { chunks } from '../../public/js/lib/speech.js';

test('calendar file follows RFC 5545', () => {
  const ics = reminderICS({ uid: 'abc', dateISO: '2026-10-25', title: 'CurbCutter: check on Joe\'s Diner, Dallas; follow up', description: 'Line one\nLine two', now: new Date('2026-10-11T12:00:00Z') });
  assert.ok(ics.endsWith('\r\n'));
  assert.match(ics, /DTSTART:20261025T100000\r\n/);
  assert.match(ics, /SUMMARY:CurbCutter: check on Joe's Diner\\, Dallas\\; follow up/);
  assert.match(ics, /DESCRIPTION:Line one\\nLine two/);
  for (const line of ics.split('\r\n')) assert.ok(new TextEncoder().encode(line).length <= 75, `line too long: ${line}`);
  const long = reminderICS({ uid: 'x', dateISO: '2026-10-25', title: 'é'.repeat(80), description: 'd' });
  for (const line of long.split('\r\n')) assert.ok(new TextEncoder().encode(line).length <= 75);
});

test('Google Calendar link keeps personal details out', () => {
  const url = googleCalendarURL({ dateISO: '2026-10-25', title: 'CurbCutter: check on Shop' });
  assert.match(url, /^https:\/\/calendar\.google\.com\/calendar\/render\?/);
  assert.match(url, /dates=20261025T100000%2F20261025T101500/);
});

test('date math crosses months, years, and daylight saving time', () => {
  assert.equal(addDays('2026-10-25', 14), '2026-11-08');
  assert.equal(addDays('2026-12-25', 14), '2027-01-08');
  assert.equal(addDays('2026-03-01', 7), '2026-03-08');
  assert.equal(daysBetween('2026-11-01', '2026-11-02'), 1);
  assert.equal(longDate('2026-10-04'), 'October 4, 2026');
  assert.equal(relativeDays('2026-10-12', '2026-10-11'), 'tomorrow');
  assert.equal(relativeDays('2026-10-01', '2026-10-11'), '10 days ago');
  assert.equal(isISODate('2026-13-40'), false);
  assert.equal(isISODate('2024-02-30'), false);
  assert.equal(addDays('2024-02-30', 1), '');
  assert.ok(Number.isNaN(daysBetween('2024-02-29', '2024-02-30')));
});

test('email links are encoded safely', () => {
  const href = mailtoHref({ to: 'manager@shop.com', subject: 'A & B', body: 'Line 1\nLine 2 #3' });
  assert.equal(href, 'mailto:manager@shop.com?subject=A%20%26%20B&body=Line%201%0D%0ALine%202%20%233');
});

test('metro detection works offline', () => {
  assert.equal(metroFor({ lat: 32.9126, lng: -96.6389 }), 'dfw'); // Garland
  assert.equal(metroFor({ lat: 29.6197, lng: -95.6349 }), 'houston'); // Sugar Land
  assert.equal(metroFor({ lat: 29.7030, lng: -98.1245 }), 'sanantonio'); // New Braunfels
  assert.equal(metroFor({ lat: 30.5083, lng: -97.6789 }), 'austin'); // Round Rock
  assert.equal(metroFor({ lat: 31.7619, lng: -106.485 }), 'other'); // El Paso
  assert.equal(metroFor({ lat: 45.5152, lng: -122.6784 }), 'outside'); // Portland, OR
});

test('read-aloud splits long text into short pieces', () => {
  const parts = chunks('One. Two two two. ' + 'Three is a much longer sentence that keeps going. '.repeat(10));
  assert.ok(parts.length > 1);
  for (const p of parts) assert.ok(p.length <= 220);
});
