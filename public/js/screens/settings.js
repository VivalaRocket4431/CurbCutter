import { h, icon, uid } from '../ui/dom.js';
import { pageHead, choiceGroup, button, confirmButton, toast, notice } from '../ui/components.js';
import { getSettings, saveSettings, resetSettings } from '../lib/settings.js';
import { exportAll, importAll, clearAll, isSaving, requestPersistence } from '../lib/store.js';
import { downloadText } from '../lib/share.js';
import { speak, speechSupported } from '../lib/speech.js';
import { todayISO } from '../lib/dates.js';
import { profileFields } from './wizard.js';

function checkbox({ id, label, hint, checked, onChange }) {
  const input = h('input', { id, type: 'checkbox', class: 'check-input', checked });
  input.addEventListener('change', () => onChange(input.checked));
  return h('div', { class: 'check' }, input, h('label', { for: id }, label, hint ? h('span', { class: 'check-hint' }, hint) : null));
}

export async function renderSettings(params, ctx) {
  const s = getSettings();
  const saving = await isSaving();
  let persisted = false;
  try { persisted = !!(await navigator.storage?.persisted?.()); } catch (e) { persisted = false; }

  const display = h('section', { class: 'block', 'aria-labelledby': 'disp-h' },
    h('h2', { id: 'disp-h' }, 'Display and reading'),
    choiceGroup({
      name: 'text-size', legend: 'Text size', columns: 3,
      options: [{ value: 'm', label: 'Standard' }, { value: 'l', label: 'Large' }, { value: 'xl', label: 'Extra large' }],
      value: s.textSize, onChange: (v) => saveSettings({ textSize: v }),
    }),
    choiceGroup({
      name: 'theme', legend: 'Colors', columns: 3,
      options: [{ value: 'system', label: 'Match my phone' }, { value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }],
      value: s.theme, onChange: (v) => saveSettings({ theme: v }),
    }),
    checkbox({ id: 'set-contrast', label: 'High contrast', hint: 'Black and white, with thicker outlines.', checked: s.contrast === 'high', onChange: (on) => saveSettings({ contrast: on ? 'high' : 'normal' }) }),
    checkbox({ id: 'set-motion', label: 'Reduce motion', hint: 'Turns off animations.', checked: s.motion === 'reduce', onChange: (on) => saveSettings({ motion: on ? 'reduce' : 'system' }) }),
    speechSupported() ? choiceGroup({
      name: 'speech-rate', legend: 'Read-aloud speed', columns: 3,
      options: [{ value: 0.8, label: 'Slower' }, { value: 1, label: 'Normal' }, { value: 1.2, label: 'Faster' }],
      value: s.speechRate,
      onChange: (v) => { saveSettings({ speechRate: Number(v) }); speak('This is how fast I will read.', Number(v)); },
    }) : null,
  );

  const profile = h('section', { class: 'block', 'aria-labelledby': 'prof-h' },
    h('h2', { id: 'prof-h' }, 'Your info for letters'),
    h('p', { class: 'hint' }, 'Saved only on this phone. It appears at the end of your letters.'),
    ...profileFields(),
  );

  // ----- Data -----
  const fileId = uid('restore');
  const restoreInput = h('input', { id: fileId, type: 'file', accept: 'application/json,.json', class: 'file-input' });
  restoreInput.addEventListener('change', async () => {
    const f = restoreInput.files?.[0];
    restoreInput.value = '';
    if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      const { added, updated } = await importAll(data);
      toast(`Backup restored: ${added} added, ${updated} updated.`, { tone: 'good' });
      ctx.refresh();
    } catch (e) {
      toast(e.message && e.message.includes('CurbCutter') ? e.message : 'That file could not be read as a CurbCutter backup.', { tone: 'bad' });
    }
  });

  const data = h('section', { class: 'block', 'aria-labelledby': 'data-h' },
    h('h2', { id: 'data-h' }, 'Your data'),
    saving
      ? notice({ tone: 'good', title: 'Saved on this device', body: persisted ? 'Your browser has agreed to keep CurbCutter\'s data even when space is low.' : 'Tip: installing CurbCutter to your Home Screen helps keep your reports safe. A backup is the safest.' })
      : notice({ tone: 'bad', title: 'This browser is not saving', body: 'Your reports will be lost when you close this page. Download a backup now.' }),
    h('p', null, 'CurbCutter has no accounts and no servers. Your reports never leave this phone unless you send, share, or back them up.'),
    h('div', { class: 'btn-col' },
      button({
        label: 'Download a backup', iconName: 'download', variant: 'primary', attrs: { 'data-needs-app': '' },
        onClick: async () => {
          const backup = await exportAll();
          downloadText(JSON.stringify(backup), `curbcutter-backup-${todayISO()}.json`, 'application/json');
          toast(`Backup downloaded with ${backup.cases.length} ${backup.cases.length === 1 ? 'case' : 'cases'}. Keep it somewhere safe.`, { tone: 'good' });
        },
      }),
      h('div', { class: 'file-btn' }, restoreInput, h('label', { for: fileId, class: 'btn btn-secondary' }, icon('upload'), h('span', { class: 'btn-label' }, 'Restore from a backup'))),
      !persisted ? button({ label: 'Ask the browser to keep my data', iconName: 'check', variant: 'quiet', onClick: async () => { const ok = await requestPersistence(); toast(ok ? 'Done. Your data is protected from automatic cleanup.' : 'The browser said no. Installing CurbCutter usually helps.', { tone: ok ? 'good' : 'info' }); } }) : null,
    ),
    h('h3', null, 'Start over'),
    confirmButton({
      label: 'Delete all my cases and photos',
      confirmText: 'Delete every case and photo on this device? Download a backup first if you might want them.',
      confirmLabel: 'Delete everything',
      onConfirm: async () => { await clearAll(); toast('Everything was deleted.'); ctx.navigate('#/'); },
    }),
    button({ label: 'Reset display settings', iconName: 'left', variant: 'quiet', onClick: () => { resetSettings(); toast('Display settings reset.'); ctx.refresh(); } }),
  );

  const about = h('section', { class: 'block' },
    h('a', { href: '#/about', class: 'article-card' },
      h('span', { class: 'article-title' }, 'About CurbCutter, privacy, and sources'),
      h('span', { class: 'article-sum' }, 'How the information is checked, and what stays on your phone.'),
      icon('right', { size: 18 }),
    ),
  );

  return { title: 'Settings', node: h('div', { class: 'screen settings' }, pageHead({ title: 'Settings' }), display, profile, data, about) };
}
