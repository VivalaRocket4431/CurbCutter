// "Show this to staff": large text for people who find talking hard (including after a brain injury).

import { h } from '../ui/dom.js';
import { button } from '../ui/components.js';
import { getCase } from '../lib/store.js';
import { getSettings } from '../lib/settings.js';
import { makeLetter } from '../lib/letters.js';

export async function renderShow(params, ctx) {
  const c = await getCase(params.id);
  if (!c) return { title: 'Not found', node: h('section', { class: 'screen' }, h('h1', { id: 'page-title', tabindex: '-1' }, 'We could not find that case')) };
  const profile = getSettings().profile;
  const script = makeLetter('script', c, profile).body;
  let extraTime = true;

  const extra = h('p', { class: 'show-extra' }, 'I may need extra time to talk or answer. Thank you for your patience.');
  const toggle = h('input', { id: 'show-extra', type: 'checkbox', class: 'check-input', checked: true });
  toggle.addEventListener('change', () => {
    extraTime = toggle.checked;
    extra.hidden = !extraTime;
  });

  const node = h('div', { class: 'screen show-screen' },
    h('h1', { id: 'page-title', tabindex: '-1', class: 'vh' }, 'Show this to staff'),
    h('div', { class: 'show-card' },
      ...script.split(/\n\n+/).map((p) => h('p', null, p)),
      extra,
    ),
    h('div', { class: 'show-controls' },
      h('div', { class: 'check' }, toggle, h('label', { for: 'show-extra' }, 'Include "I may need extra time"')),
      button({ label: 'Done', iconName: 'left', variant: 'primary', onClick: () => ctx.navigate(`#/case/${c.id}/letter/script`) }),
    ),
  );
  return { title: 'Show this to staff', node, hideNav: true };
}
