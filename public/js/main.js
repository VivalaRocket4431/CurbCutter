// CurbCutter app shell: routing, focus management, read-aloud, updates, and install prompts.

import { h, clear, icon } from './ui/dom.js';
import { setToastRegion, toast, button } from './ui/components.js';
import { applySettings, getSettings } from './lib/settings.js';
import { speak, stop, speechSupported, onSpeechState, readableText } from './lib/speech.js';
import { isSaving, requestPersistence } from './lib/store.js';
import { APP } from './config.js';

import { renderHome } from './screens/home.js';
import { renderCases } from './screens/cases.js';
import { renderNewCase, renderWizard } from './screens/wizard.js';
import { renderCase } from './screens/case.js';
import { renderLetter } from './screens/letter.js';
import { renderSent } from './screens/sent.js';
import { renderShow } from './screens/show.js';
import { renderRights, renderArticle } from './screens/rights.js';
import { renderHelp } from './screens/help.js';
import { renderSettings } from './screens/settings.js';
import { renderAbout } from './screens/about.js';

const ROUTES = [
  [/^\/?$/, () => renderHome],
  [/^\/cases$/, () => renderCases],
  [/^\/new$/, () => renderNewCase],
  [/^\/case\/([\w-]+)$/, () => renderCase, ['id']],
  [/^\/case\/([\w-]+)\/step\/([\w-]+)$/, () => renderWizard, ['id', 'step']],
  [/^\/case\/([\w-]+)\/letter\/([\w-]+)$/, () => renderLetter, ['id', 'kind']],
  [/^\/case\/([\w-]+)\/sent\/([\w-]+)$/, () => renderSent, ['id', 'event']],
  [/^\/case\/([\w-]+)\/show$/, () => renderShow, ['id']],
  [/^\/rights$/, () => renderRights],
  [/^\/rights\/([\w-]+)$/, () => renderArticle, ['article']],
  [/^\/help$/, () => renderHelp],
  [/^\/help\/([\w-]+)$/, () => renderHelp, ['metro']],
  [/^\/settings$/, () => renderSettings],
  [/^\/about$/, () => renderAbout],
];

// Three places only: your reports, rights and contacts, and settings.
const TABS = [
  { href: '#/', label: 'Home', icon: 'home', match: (p) => p === '/' || p === '' || p.startsWith('/cases') || p.startsWith('/case/') || p === '/new' },
  { href: '#/rights', label: 'Rights & help', icon: 'book', match: (p) => p.startsWith('/rights') || p.startsWith('/help') },
  { href: '#/settings', label: 'Settings', icon: 'settings', match: (p) => p.startsWith('/settings') || p.startsWith('/about') },
];

const state = {
  installPrompt: null,
  renderToken: 0,
  currentPath: null,
  cleanup: null,
};

let mainEl;
let navEl;
let bannerEl;
let announcer;
let readBtn;

function currentPath() {
  const raw = location.hash.replace(/^#/, '') || '/';
  return raw.split('?')[0];
}

function match(path) {
  for (const [re, get, keys = []] of ROUTES) {
    const m = re.exec(path);
    if (m) {
      const params = {};
      keys.forEach((k, i) => { params[k] = decodeURIComponent(m[i + 1]); });
      return { render: get(), params };
    }
  }
  return null;
}

export function navigate(hash, { replace = false } = {}) {
  const target = hash.startsWith('#') ? hash : `#${hash}`;
  if (location.hash === target) {
    route({ focus: true });
    return;
  }
  if (replace) {
    history.replaceState(null, '', target);
    route({ focus: true });
  } else {
    location.hash = target;
  }
}

function updateTabs(path, hidden) {
  navEl.hidden = !!hidden;
  document.body.classList.toggle('has-tabbar', !hidden);
  for (const a of navEl.querySelectorAll('a')) {
    const tab = TABS.find((t) => t.href === a.getAttribute('href'));
    if (tab && tab.match(path)) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  }
}

async function route({ focus = true, keepScroll = false } = {}) {
  stop();
  const token = ++state.renderToken;
  const path = currentPath();
  const m = match(path);
  if (state.cleanup) {
    try { state.cleanup(); } catch (e) { console.error(e); }
    state.cleanup = null;
  }
  let view;
  try {
    view = m ? await m.render(m.params, ctx) : notFound();
  } catch (err) {
    console.error(err);
    view = errorView(err);
  }
  if (token !== state.renderToken || !view) return; // a newer navigation started, or the screen redirected
  clear(mainEl).append(view.node);
  state.cleanup = view.cleanup || null;
  document.title = view.title ? `${view.title} | ${APP.name}` : APP.name;
  updateTabs(path, view.hideNav);
  const samePage = state.currentPath === path;
  state.currentPath = path;
  if (!keepScroll && !samePage) window.scrollTo(0, 0);
  if (focus && !samePage) {
    const target = mainEl.querySelector('#page-title') || mainEl;
    target.focus({ preventScroll: true });
    announce(view.title || APP.name);
  }
}

function announce(text) {
  announcer.textContent = '';
  setTimeout(() => { announcer.textContent = text; }, 60);
}

function notFound() {
  return {
    title: 'Page not found',
    node: h('section', { class: 'screen' },
      h('h1', { id: 'page-title', tabindex: '-1' }, 'We could not find that page'),
      h('p', null, 'It may have been deleted, or the link is incomplete.'),
      button({ label: 'Go to Home', href: '#/', variant: 'primary', iconName: 'home' }),
    ),
  };
}

function errorView(err) {
  return {
    title: 'Something went wrong',
    node: h('section', { class: 'screen' },
      h('h1', { id: 'page-title', tabindex: '-1' }, 'Something went wrong'),
      h('p', null, 'Your saved reports are safe. Try going back to Home. If this keeps happening, restart the app.'),
      h('p', { class: 'hint' }, String(err?.message || err)),
      button({ label: 'Go to Home', href: '#/', variant: 'primary', iconName: 'home' }),
    ),
  };
}

const ctx = {
  navigate,
  refresh: (opts = {}) => route({ focus: false, keepScroll: true, ...opts }),
  get installPrompt() { return state.installPrompt; },
  clearInstallPrompt() { state.installPrompt = null; },
  isStandalone() {
    return window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
  },
};

function brandMark() {
  // A curb ramp rising into a sign plate: the app's mark.
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 32 32');
  svg.setAttribute('width', '32');
  svg.setAttribute('height', '32');
  svg.setAttribute('aria-hidden', 'true');
  svg.classList.add('brand-mark');
  const ramp = document.createElementNS(ns, 'path');
  ramp.setAttribute('d', 'M2 25H10L17.5 16.5H30V27H2Z');
  ramp.setAttribute('class', 'brand-ramp');
  const curb = document.createElementNS(ns, 'path');
  curb.setAttribute('d', 'M17.5 16.5H30');
  curb.setAttribute('class', 'brand-curb');
  const hatch = document.createElementNS(ns, 'path');
  hatch.setAttribute('d', 'M3 13l4.5-4.5M7.5 13l4.5-4.5M12 13l4.5-4.5');
  hatch.setAttribute('class', 'brand-hatch');
  svg.append(ramp, curb, hatch);
  return svg;
}

function buildShell(root) {
  const skip = h('a', { class: 'skip', href: '#main' }, 'Skip to main content');
  skip.addEventListener('click', (e) => {
    e.preventDefault();
    mainEl.focus();
  });

  readBtn = h('button', { class: 'appbar-btn', type: 'button', 'aria-pressed': 'false' },
    icon('speaker'), h('span', { class: 'appbar-btn-label' }, 'Read aloud'));
  readBtn.addEventListener('click', () => {
    if (readBtn.getAttribute('aria-pressed') === 'true') {
      stop();
      return;
    }
    const ok = speak(readableText(mainEl), getSettings().speechRate);
    if (!ok) toast('Read aloud is not available in this browser.', { tone: 'bad' });
  });
  if (!speechSupported()) readBtn.hidden = true;
  onSpeechState((on) => {
    readBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    readBtn.querySelector('.appbar-btn-label').textContent = on ? 'Stop reading' : 'Read aloud';
    readBtn.replaceChild(icon(on ? 'stop' : 'speaker'), readBtn.querySelector('svg'));
  });

  const header = h('header', { class: 'appbar' },
    h('a', { class: 'brand', href: '#/' }, brandMark(), h('span', { class: 'brand-name' }, APP.name), h('span', { class: 'vh' }, ', Home')),
    h('div', { class: 'appbar-actions' }, readBtn),
  );

  bannerEl = h('div', { class: 'banners', id: 'banners' });
  mainEl = h('main', { id: 'main', tabindex: '-1' });
  navEl = h('nav', { class: 'tabbar', 'aria-label': 'Main' },
    h('ul', null, TABS.map((t) => h('li', null, h('a', { href: t.href }, icon(t.icon), h('span', null, t.label))))),
  );
  const toasts = h('div', { class: 'toasts', role: 'status', 'aria-live': 'polite' });
  announcer = h('div', { class: 'vh', 'aria-live': 'polite', 'aria-atomic': 'true' });
  setToastRegion(toasts);
  clear(root).append(skip, header, bannerEl, mainEl, navEl, toasts, announcer);
}

function showBanner(node) {
  bannerEl.append(node);
}

async function checkStorage() {
  const ok = await isSaving();
  if (!ok) {
    showBanner(h('div', { class: 'banner banner-warn', role: 'alert' },
      icon('alert'),
      h('p', null, 'This browser is not letting CurbCutter save. Your reports will be lost when you close this page. Try a regular (not private) window, or download a backup in Settings.'),
    ));
  }
}

// Updates are invisible. A new version downloads in the background and the app uses it the next time it
// opens. People never see an update message or have to do anything, and nothing reloads while they work.
function setupServiceWorker() {
  if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
  navigator.serviceWorker.register('sw.js').then((reg) => {
    setInterval(() => reg.update().catch(() => {}), 60 * 60 * 1000);
  }).catch(() => {
    /* offline support unavailable here; the app still works online */
  });
}

function boot() {
  applySettings(getSettings());
  const root = document.getElementById('app');
  buildShell(root);
  window.addEventListener('hashchange', () => route({ focus: true }));
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    state.installPrompt = e;
    if (currentPath() === '/' ) route({ focus: false, keepScroll: true });
  });
  window.addEventListener('appinstalled', () => {
    state.installPrompt = null;
    toast('CurbCutter is installed. Find it on your Home Screen.', { tone: 'good' });
    requestPersistence();
  });
  route({ focus: false });
  checkStorage();
  if (globalThis.__CURBCUT_PREVIEW__) {
    document.documentElement.classList.add('preview');
    showBanner(h('div', { class: 'banner banner-info' },
      icon('info'),
      h('p', null, 'Preview copy. Email links, sharing, downloads, printing, location, and offline use work in the installed app, not in this preview.'),
    ));
    return;
  }
  setupServiceWorker();
  if (ctx.isStandalone()) requestPersistence();
}

boot();
