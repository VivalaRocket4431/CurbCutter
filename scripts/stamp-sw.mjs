// Writes the list of app files and a content hash into public/sw.js.
// Runs automatically on every Render deploy (see render.yaml), so phones always get updates.
//   node scripts/stamp-sw.mjs          update sw.js
//   node scripts/stamp-sw.mjs --check  exit 1 if sw.js is out of date

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');
const SW = path.join(ROOT, 'sw.js');
const SKIP = new Set(['sw.js', 'robots.txt']);

async function walk(dir, base = '') {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const rel = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) out.push(...(await walk(path.join(dir, entry.name), rel)));
    else if (!SKIP.has(rel)) out.push(rel);
  }
  return out;
}

const files = (await walk(ROOT)).sort();
const hash = createHash('sha256');
for (const f of files) {
  hash.update(f);
  hash.update(await readFile(path.join(ROOT, f)));
}
const version = `curbcut-${hash.digest('hex').slice(0, 12)}`;
const block = `// <stamp>\nconst VERSION = '${version}';\nconst FILES = ${JSON.stringify(['./', ...files], null, 2).replace(/"/g, "'")};\n// </stamp>`;

const sw = await readFile(SW, 'utf8');
const updated = sw.replace(/\/\/ <stamp>[\s\S]*?\/\/ <\/stamp>/, block);
if (updated === sw && !sw.includes(version)) throw new Error('Could not find the stamp markers in sw.js');

if (process.argv.includes('--check')) {
  if (updated !== sw) {
    console.error(`sw.js is out of date. Run: npm run stamp (expected ${version})`);
    process.exit(1);
  }
  console.log(`sw.js is current (${version}, ${files.length} files).`);
} else {
  await writeFile(SW, updated);
  console.log(`Stamped sw.js: ${version}, ${files.length} files.`);
}
