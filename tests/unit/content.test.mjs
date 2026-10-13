// Guards the credibility of the content: every claim has a source, every contact is well formed.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SOURCES, CONTENT_CHECKED } from '../../public/js/data/sources.js';
import { BARRIERS, CATEGORIES, STRENGTHS } from '../../public/js/data/barriers.js';
import { ARTICLES } from '../../public/js/data/rights.js';
import { STATEWIDE, LOCAL, METROS, CHECKED, telHref } from '../../public/js/data/contacts.js';
import { isISODate } from '../../public/js/lib/dates.js';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { APP } from '../../public/js/config.js';

const PUBLIC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'public');
const PAGES = ['index.html', 'privacy/index.html', 'support/index.html'];

test('every source has an https link, a publisher, and a checked date', () => {
  assert.ok(isISODate(CONTENT_CHECKED));
  for (const [id, s] of Object.entries(SOURCES)) {
    assert.match(s.url, /^https:\/\//, id);
    assert.ok(s.title && s.publisher && s.kind, id);
    assert.ok(isISODate(s.checked), id);
  }
});

test('every barrier is complete and cites real sources', () => {
  const ids = new Set();
  for (const b of BARRIERS) {
    assert.ok(!ids.has(b.id), `duplicate ${b.id}`);
    ids.add(b.id);
    assert.ok(CATEGORIES.some((c) => c.id === b.cat), `${b.id} category`);
    assert.ok(STRENGTHS[b.strength], `${b.id} strength`);
    assert.ok(b.title && b.short && b.rule && b.ruleShort, `${b.id} text`);
    assert.ok(b.cites.length > 0, `${b.id} needs a source`);
    for (const c of b.cites) assert.ok(SOURCES[c], `${b.id} cites unknown source ${c}`);
    assert.ok(b.id === 'other' || b.fix, `${b.id} needs a suggested fix`);
  }
  for (const cat of CATEGORIES) assert.ok(BARRIERS.some((b) => b.cat === cat.id), `${cat.id} is empty`);
});

test('every rights article cites real sources', () => {
  for (const a of ARTICLES) {
    assert.ok(a.cites.length, a.id);
    for (const c of a.cites) assert.ok(SOURCES[c], `${a.id} cites unknown source ${c}`);
  }
});

function allContacts() {
  const out = [];
  for (const list of Object.values(STATEWIDE)) out.push(...list);
  for (const area of Object.values(LOCAL)) {
    for (const city of area.cities) out.push(city.report, city.ada, city.council);
    out.push(...area.cils, ...area.news);
    for (const k of area.counties) out.push({ name: k.cad, url: k.url });
    if (area.volunteer) out.push(area.volunteer);
  }
  return out;
}

test('every contact is well formed', () => {
  assert.ok(isISODate(CHECKED));
  for (const c of allContacts()) {
    if (c.url) assert.match(c.url, /^https:\/\//, `${c.name} url`);
    if (c.email) assert.match(c.email, /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i, `${c.name} email`);
    for (const n of [c.phone, ...(c.extra || []).filter((x) => x.type === 'tel').map((x) => x.value)].filter(Boolean)) {
      const digits = n.replace(/\D/g, '');
      assert.ok(digits === '311' || digits.length === 10, `${c.name} phone ${n}`);
      assert.match(telHref(n), /^tel:(\+1\d{10}|311)$/);
    }
    assert.ok(c.phone || c.email || c.url, `${c.name || c.what} needs a way to reach it`);
  }
});

test('every metro except "other" has local contacts', () => {
  for (const m of METROS) {
    const area = LOCAL[m.id];
    assert.ok(area, m.id);
    if (m.id === 'other') continue;
    assert.ok(area.cities.length && area.counties.length && area.cils.length && area.news.length, m.id);
  }
});

test('published pages have no drafting notes or placeholders', () => {
  const NOTES = /\[(?:button|check|your|insert|add|todo|tbd|placeholder)\b|\bTODO\b|\bTBD\b|lorem ipsum|paste (?:everything|this)|before (?:you )?publish/i;
  for (const page of PAGES) {
    const text = readFileSync(path.join(PUBLIC, page), 'utf8');
    assert.doesNotMatch(text, NOTES, page);
  }
  for (const s of Object.values(SOURCES)) assert.doesNotMatch(`${s.title} ${s.publisher}`, NOTES, s.title);
});

test('the privacy and support pages link only to files that exist', () => {
  for (const page of PAGES.slice(1)) {
    const html = readFileSync(path.join(PUBLIC, page), 'utf8');
    const dir = path.dirname(path.join(PUBLIC, page));
    for (const [, ref] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      if (/^(https?:|mailto:|tel:|#)/.test(ref)) continue;
      const target = path.resolve(dir, ref.split('#')[0]);
      const file = ref.endsWith('/') || ref === '' ? path.join(target, 'index.html') : target;
      assert.ok(existsSync(file), `${page} links to missing ${ref}`);
    }
    assert.match(html, /<h1>/, `${page} needs a heading`);
    assert.match(html, /mailto:hello@curbcutter\.org/, `${page} needs a way to reach us`);
  }
});

test('the feedback address matches the one on the published pages', () => {
  assert.equal(APP.feedbackEmail, 'hello@curbcutter.org');
});

test('people always get the current CurbCutter and are never asked to update', () => {
  const sw = readFileSync(path.join(PUBLIC, 'sw.js'), 'utf8');
  const main = readFileSync(path.join(PUBLIC, 'js', 'main.js'), 'utf8');
  const stamp = readFileSync(path.join(PUBLIC, '..', 'scripts', 'stamp-sw.mjs'), 'utf8');
  // Every time CurbCutter opens, the service worker asks curbcutter.org (never the browser's cache)
  // whether the copy on the phone is current, and opens curbcutter.org itself when it isn't.
  assert.match(sw, /async function currentVersion\(\) \{\s*const res = await fetch\(self\.location\.href, \{ cache: 'no-cache' \}\);/);
  assert.match(sw, /async function openPage[\s\S]*?if \(\(await within\(WAIT_MS, currentVersion\(\)\)\) !== VERSION\) \{\s*const live = await within\(WAIT_MS, fetch\(event\.request, \{ cache: 'no-cache' \}\)\);/);
  // The question is answered by the VERSION line that the deploy writes.
  assert.ok(sw.includes(`/const VERSION = '([^']+)'/.exec(`));
  assert.ok(stamp.includes("`// <stamp>\\nconst VERSION = '${version}';"));
  // A new copy takes over on its own as soon as it has downloaded...
  assert.match(sw, /cache\.addAll\([\s\S]*?\)\)\)\s*\.then\(\(\) => self\.skipWaiting\(\)\)/);
  // ...and the app never shows an update message or reloads while someone is working.
  assert.doesNotMatch(main, /version of CurbCutter is ready|Update now|location\.reload/i);
  // The service worker reloads a page only to replace one from the earlier design: once per phone,
  // or when someone taps that design's old button.
  const navigations = sw.match(/\.navigate\(/g) || [];
  assert.equal(navigations.length, 2);
  assert.match(sw, /if \(!earlierDesign\) return;[\s\S]*?\.navigate\(/);
  assert.match(sw, /if \(event\.data !== 'SKIP_WAITING'\) return;[\s\S]*?\.navigate\(/);
});
