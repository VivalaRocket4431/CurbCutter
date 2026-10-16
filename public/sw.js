// CurbCutter service worker. It keeps a complete copy of CurbCutter on the phone so it works with no
// signal, and it makes sure that copy never keeps anyone from the current CurbCutter.
//
// Each time CurbCutter opens, the worker asks curbcutter.org one tiny question: is the copy on this phone
// still the current one?
//   - Yes (nearly always): CurbCutter opens from the phone, at once.
//   - No, curbcutter.org has changed: CurbCutter opens straight from curbcutter.org, and the phone saves
//     the new copy in the background for next time.
//   - No connection, or no answer within 3 seconds: CurbCutter opens from the copy on the phone.
// Nobody is ever asked to update, and each page takes its files from the same place the page came from.
//
// The block between the stamp markers is written by scripts/stamp-sw.mjs on every deploy. Never edit it
// by hand. VERSION is a fingerprint of every file in FILES, so the same VERSION means identical files.

// <stamp>
const VERSION = 'curbcut-978bceb1cdf7';
const FILES = [
  './',
  'assets/app.css',
  'assets/fonts/OFL-AtkinsonHyperlegibleNext.txt',
  'assets/fonts/OFL-Overpass.txt',
  'assets/fonts/atkinson-hyperlegible-next-latin-400-italic.woff2',
  'assets/fonts/atkinson-hyperlegible-next-latin-400-normal.woff2',
  'assets/fonts/atkinson-hyperlegible-next-latin-700-normal.woff2',
  'assets/fonts/atkinson-hyperlegible-next-latin-800-normal.woff2',
  'assets/fonts/overpass-latin-800-normal.woff2',
  'assets/icons/apple-touch-icon.png',
  'assets/icons/favicon-32.png',
  'assets/icons/favicon.svg',
  'assets/icons/icon-192.png',
  'assets/icons/icon-512.png',
  'assets/icons/icon-maskable-512.png',
  'index.html',
  'js/config.js',
  'js/data/barriers.js',
  'js/data/contacts.js',
  'js/data/rights.js',
  'js/data/sources.js',
  'js/fit.js',
  'js/lib/dates.js',
  'js/lib/events.js',
  'js/lib/geo.js',
  'js/lib/ics.js',
  'js/lib/ladder.js',
  'js/lib/letters.js',
  'js/lib/parking.js',
  'js/lib/photos.js',
  'js/lib/settings.js',
  'js/lib/share.js',
  'js/lib/speech.js',
  'js/lib/store.js',
  'js/main.js',
  'js/screens/about.js',
  'js/screens/case.js',
  'js/screens/cases.js',
  'js/screens/help.js',
  'js/screens/home.js',
  'js/screens/letter.js',
  'js/screens/rights.js',
  'js/screens/sent.js',
  'js/screens/settings.js',
  'js/screens/show.js',
  'js/screens/wizard.js',
  'js/ui/components.js',
  'js/ui/dom.js',
  'js/ui/photos.js',
  'js/ui/recorder.js',
  'manifest.webmanifest',
  'privacy/index.html',
  'support/index.html'
];
// </stamp>

// Where CurbCutter lives ("/" on curbcutter.org).
const APP_ROOT = new URL('./', self.location).pathname;

// How long to wait for curbcutter.org before opening the copy on the phone instead.
const WAIT_MS = 3000;

// An empty cache that marks a phone as already using this service worker's design (see activate).
const LIVE_MARK = 'curbcut-live';

// Saves a complete copy of CurbCutter, then takes over at once. addAll saves every file or none,
// so a copy is never partial.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSION)
      .then((cache) => cache.addAll(FILES.map((f) => new Request(f, { cache: 'reload' }))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  const ready = (async () => {
    const keys = await caches.keys();
    const old = keys.filter((k) => k.startsWith('curbcut-') && k !== VERSION && k !== LIVE_MARK);
    // Before October 13, 2026, CurbCutter always opened from the copy on the phone, even when a newer
    // one existed, and some of those copies showed "A new version of CurbCutter is ready." The page
    // open right now may have come from one of them.
    const earlierDesign = old.length > 0 && !keys.includes(LIVE_MARK);
    await Promise.all(old.map((k) => caches.delete(k)));
    await caches.open(LIVE_MARK);
    await self.clients.claim();
    return earlierDesign;
  })();
  event.waitUntil(ready);
  // If so, open the current CurbCutter in those pages straight away. This happens once per phone, and
  // only after activation has finished, because the page load goes through this worker. Reports and
  // letters save as people type, so nothing is lost.
  ready.then(async (earlierDesign) => {
    if (!earlierDesign) return;
    const pages = await self.clients.matchAll({ type: 'window' });
    pages.forEach((page) => page.navigate(page.url).catch(() => {}));
  });
});

// Only pages from those earlier copies send this, from their "Update now" button.
self.addEventListener('message', (event) => {
  if (event.data !== 'SKIP_WAITING') return;
  self.skipWaiting();
  const page = event.source;
  if (page && typeof page.navigate === 'function') event.waitUntil(page.navigate(page.url).catch(() => {}));
});

// Where the most recently opened page came from: 'saved' (the copy on the phone) or 'live'
// (curbcutter.org). Its scripts, styles, fonts, and icons come from the same place.
let source = 'saved';

function savedCopy(request) {
  return caches.open(VERSION).then((cache) => cache.match(request, { ignoreSearch: true }));
}

// Settles like the promise, or fails if it takes longer than ms.
function within(ms, promise) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('no answer in time')), ms);
    promise.then(
      (value) => { clearTimeout(timer); resolve(value); },
      (err) => { clearTimeout(timer); reject(err); },
    );
  });
}

// The VERSION of the CurbCutter on curbcutter.org right now, read from its copy of this file.
async function currentVersion() {
  const res = await fetch(self.location.href, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`sw.js answered ${res.status}`);
  const found = /const VERSION = '([^']+)'/.exec(await res.text());
  if (!found) throw new Error('sw.js has no VERSION');
  return found[1];
}

async function openPage(event, url) {
  const isApp = url.pathname === APP_ROOT || url.pathname === `${APP_ROOT}index.html`;
  const path = isApp ? 'index.html' : url.pathname.slice(APP_ROOT.length) + (url.pathname.endsWith('/') ? 'index.html' : '');
  const saved = await savedCopy(path);
  if (!saved) return fetch(event.request); // not a page CurbCutter keeps on the phone
  try {
    if ((await within(WAIT_MS, currentVersion())) !== VERSION) {
      const live = await within(WAIT_MS, fetch(event.request, { cache: 'no-cache' }));
      if (live.ok) {
        source = 'live';
        return live;
      }
    }
  } catch (e) {
    // No connection, or curbcutter.org didn't answer in time.
  }
  source = 'saved';
  return saved;
}

async function openFile(event) {
  const req = event.request;
  if (source === 'live') {
    try {
      const live = await fetch(req, { cache: 'no-cache' });
      if (live.ok) return live;
      return (await savedCopy(req)) || live;
    } catch (e) {
      return (await savedCopy(req)) || Response.error();
    }
  }
  return (await savedCopy(req)) || fetch(req);
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // other websites: straight to the network
  event.respondWith(req.mode === 'navigate' ? openPage(event, url) : openFile(event));
});
