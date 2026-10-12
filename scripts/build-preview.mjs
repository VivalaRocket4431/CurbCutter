// Builds a single-file preview of CurbCutter (everything inlined) for sharing as a claude.ai Artifact.
// The real app is the public/ folder; this preview is for looking around, not for daily use.
//   node scripts/build-preview.mjs  ->  preview/curbcut-preview.html

import { build } from 'esbuild';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUB = path.join(ROOT, 'public');

const result = await build({
  entryPoints: [path.join(PUB, 'js', 'main.js')],
  bundle: true,
  format: 'iife',
  target: ['es2020', 'safari15'],
  minify: true,
  write: false,
  legalComments: 'none',
});
const js = result.outputFiles[0].text;

let css = await readFile(path.join(PUB, 'assets', 'app.css'), 'utf8');
css = await replaceAsync(css, /url\("fonts\/([^"]+)"\)/g, async (_, file) => {
  const data = await readFile(path.join(PUB, 'assets', 'fonts', file));
  return `url("data:font/woff2;base64,${data.toString('base64')}")`;
});

const html = `<title>CurbCutter</title>
<style>${css}</style>
<div id="app"><main><p>Loading CurbCutter...</p></main></div>
<script>window.__CURBCUT_PREVIEW__ = true;</script>
<script>${js.replace(/<\/script/gi, '<\\/script')}</script>
`;
await mkdir(path.join(ROOT, 'preview'), { recursive: true });
await writeFile(path.join(ROOT, 'preview', 'curbcut-preview.html'), html);
console.log(`Preview written: preview/curbcut-preview.html (${Math.round(html.length / 1024)} KB)`);

async function replaceAsync(str, re, fn) {
  const parts = [];
  let last = 0;
  for (const m of str.matchAll(re)) {
    parts.push(str.slice(last, m.index), await fn(...m));
    last = m.index + m[0].length;
  }
  parts.push(str.slice(last));
  return parts.join('');
}
