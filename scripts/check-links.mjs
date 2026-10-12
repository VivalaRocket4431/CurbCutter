// Checks every outside link in CurbCutter's content files. Run monthly (GitHub Actions does this for you).
//   node scripts/check-links.mjs
// Broken links (404, 410, DNS errors) fail the check. Sites that block automated checks (401, 403, 429)
// are listed as "check by hand" so a person can confirm them in a browser.

import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DATA = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'js', 'data');
const files = (await readdir(DATA)).filter((f) => f.endsWith('.js'));
const urls = new Set();
for (const f of files) {
  const text = await readFile(path.join(DATA, f), 'utf8');
  for (const m of text.matchAll(/https:\/\/[^\s'"`)]+/g)) urls.add(m[0]);
}

const UA = 'Mozilla/5.0 (compatible; CurbCutter link checker; +https://curbcutter.org)';
async function check(url) {
  for (const method of ['HEAD', 'GET']) {
    try {
      const res = await fetch(url, { method, redirect: 'follow', headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(20000) });
      if (res.ok) return { url, status: res.status, ok: true };
      if (method === 'HEAD' && [403, 405, 400, 501].includes(res.status)) continue;
      return { url, status: res.status, ok: false };
    } catch (e) {
      if (method === 'GET') return { url, status: e.name === 'TimeoutError' ? 'timeout' : e.cause?.code || e.message, ok: false };
    }
  }
  return { url, status: 'unknown', ok: false };
}

const results = [];
const list = [...urls].sort();
for (let i = 0; i < list.length; i += 6) {
  results.push(...(await Promise.all(list.slice(i, i + 6).map(check))));
}

const blocked = results.filter((r) => !r.ok && [401, 403, 429, 'timeout'].includes(r.status));
const broken = results.filter((r) => !r.ok && !blocked.includes(r));
console.log(`Checked ${results.length} links: ${results.filter((r) => r.ok).length} OK, ${blocked.length} to check by hand, ${broken.length} broken.`);
for (const r of blocked) console.log(`  CHECK BY HAND (${r.status}): ${r.url}`);
for (const r of broken) console.log(`  BROKEN (${r.status}): ${r.url}`);
if (broken.length) process.exit(1);
