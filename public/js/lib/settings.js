// Display preferences and the user's letter signature. Stored in this browser only.

const KEY = 'curbcut.settings.v1';

export const DEFAULTS = {
  textSize: 'm', // m | l | xl
  theme: 'system', // system | light | dark
  contrast: 'normal', // normal | high
  motion: 'system', // system | reduce
  speechRate: 1,
  metro: '',
  replyDays: 14,
  profile: {
    name: '',
    email: '',
    phone: '',
    city: '',
    who: 'self', // self | helper | ally | none
  },
  installDismissed: false,
  introSeen: false,
};

let cache = null;

export function getSettings() {
  if (cache) return cache;
  let saved = {};
  try {
    saved = JSON.parse(localStorage.getItem(KEY) || '{}') || {};
  } catch (e) {
    saved = {};
  }
  cache = { ...DEFAULTS, ...saved, profile: { ...DEFAULTS.profile, ...(saved.profile || {}) } };
  return cache;
}

export function saveSettings(patch) {
  const current = getSettings();
  cache = {
    ...current,
    ...patch,
    profile: { ...current.profile, ...(patch.profile || {}) },
  };
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch (e) {
    /* storage blocked: settings last for this visit only */
  }
  applySettings(cache);
  return cache;
}

export function applySettings(s = getSettings()) {
  const root = document.documentElement;
  root.dataset.textSize = s.textSize;
  // Only remove a theme this app set itself, so a host page's own theme choice is respected.
  if (s.theme === 'light' || s.theme === 'dark') {
    root.dataset.theme = s.theme;
    root.dataset.themeSrc = 'app';
  } else if (root.dataset.themeSrc === 'app') {
    delete root.dataset.theme;
    delete root.dataset.themeSrc;
  }
  if (s.contrast === 'high') root.dataset.contrast = 'high';
  else delete root.dataset.contrast;
  if (s.motion === 'reduce') root.dataset.motion = 'reduce';
  else delete root.dataset.motion;
}

export function resetSettings() {
  cache = null;
  try {
    localStorage.removeItem(KEY);
  } catch (e) {
    /* ignore */
  }
  applySettings(getSettings());
}
