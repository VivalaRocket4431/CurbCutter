// Date helpers that work with plain calendar dates ("2026-10-11") and avoid time zone drift.

const pad = (n) => String(n).padStart(2, '0');

export function todayISO(now = new Date()) {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function isISODate(s) {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d));
  return utc.getUTCFullYear() === y && utc.getUTCMonth() === m - 1 && utc.getUTCDate() === d;
}

function toUTC(iso) {
  if (!isISODate(iso)) return new Date(NaN);
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function addDays(iso, days) {
  if (!isISODate(iso)) return '';
  const d = toUTC(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

export function daysBetween(fromISO, toISO) {
  if (!isISODate(fromISO) || !isISODate(toISO)) return NaN;
  return Math.round((toUTC(toISO) - toUTC(fromISO)) / 86400000);
}

const LONG = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
const SHORT = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
const WEEKDAY = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' });

export function longDate(iso) {
  return isISODate(iso) ? LONG.format(toUTC(iso)) : '';
}

export function shortDate(iso) {
  return isISODate(iso) ? SHORT.format(toUTC(iso)) : '';
}

export function weekdayDate(iso) {
  return isISODate(iso) ? WEEKDAY.format(toUTC(iso)) : '';
}

// "in 3 days", "today", "2 days ago"
export function relativeDays(iso, today = todayISO()) {
  if (!isISODate(iso)) return '';
  const n = daysBetween(today, iso);
  if (n === 0) return 'today';
  if (n === 1) return 'tomorrow';
  if (n === -1) return 'yesterday';
  return n > 0 ? `in ${n} days` : `${-n} days ago`;
}
