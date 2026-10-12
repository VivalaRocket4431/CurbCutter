import { h, icon } from '../ui/dom.js';
import { button, pageHead } from '../ui/components.js';
import { listCases } from '../lib/store.js';
import { has } from '../lib/ladder.js';
import { todayISO } from '../lib/dates.js';
import { caseCard } from './home.js';

function impactTiles(cases) {
  const open = cases.filter((c) => c.status !== 'draft');
  const count = (fn) => open.filter(fn).length;
  const tiles = [
    { n: open.length, label: open.length === 1 ? 'place documented' : 'places documented' },
    { n: count((c) => has(c, 'asked')), label: 'requests sent' },
    { n: count((c) => has(c, 'complaint_tdlr') || has(c, 'complaint_doj') || has(c, 'complaint_city')), label: 'official complaints' },
    { n: count((c) => c.status === 'resolved'), label: 'barriers fixed', win: true },
  ];
  return h('section', { class: 'impact', 'aria-labelledby': 'impact-h' },
    h('h2', { id: 'impact-h', class: 'vh' }, 'Your impact'),
    h('ul', { class: 'impact-tiles' }, tiles.map((t) => h('li', { class: t.win ? 'win' : null },
      h('span', { class: 'impact-n' }, String(t.n)),
      h('span', { class: 'impact-label' }, t.label),
    ))),
  );
}

export async function renderCases() {
  const cases = await listCases();
  const today = todayISO();
  const groups = [
    { id: 'attention', title: 'Needs you', items: cases.filter((c) => c.status === 'draft' || (c.status === 'open' && c.nextCheck && c.nextCheck <= today) || (c.status === 'open' && !has(c, 'asked'))) },
    { id: 'waiting', title: 'In progress', items: cases.filter((c) => c.status === 'open' && has(c, 'asked') && !(c.nextCheck && c.nextCheck <= today)) },
    { id: 'fixed', title: 'Fixed', items: cases.filter((c) => c.status === 'resolved') },
    { id: 'closed', title: 'Closed', items: cases.filter((c) => c.status === 'closed') },
  ];

  const node = h('div', { class: 'screen' },
    pageHead({ title: 'My cases', lede: 'Every report you\'ve started, with its next step.' }),
    button({ label: 'Report a barrier', href: '#/new', variant: 'primary', iconName: 'plus', block: true }),
  );

  if (!cases.length) {
    node.append(h('div', { class: 'empty' },
      icon('cases', { size: 40 }),
      h('p', { class: 'empty-title' }, 'No reports yet'),
      h('p', null, 'When you report a barrier, it shows up here with the next step and any follow-up dates.'),
    ));
    return { title: 'My cases', node };
  }

  node.append(impactTiles(cases));
  for (const g of groups) {
    if (!g.items.length) continue;
    node.append(h('section', { class: 'block', 'aria-labelledby': `g-${g.id}` },
      h('h2', { id: `g-${g.id}` }, `${g.title} (${g.items.length})`),
      h('ul', { class: 'case-list' }, g.items.map(caseCard)),
    ));
  }
  node.append(h('p', { class: 'fine' }, 'Your cases are saved only on this device. To keep a copy, download a backup in Settings.'));
  return { title: 'My cases', node };
}
