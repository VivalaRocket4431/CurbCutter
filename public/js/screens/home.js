import { h, icon } from '../ui/dom.js';
import { button, statusChip } from '../ui/components.js';
import { listCases } from '../lib/store.js';
import { nextStep, statusLabel } from '../lib/ladder.js';
import { caseTitle, caseSubtitle } from '../lib/letters.js';
import { shortDate, todayISO, longDate } from '../lib/dates.js';
import { getSettings, saveSettings } from '../lib/settings.js';
import { CONTENT_CHECKED } from '../data/sources.js';
import { stepLabel } from './wizard.js';

export function caseCard(c) {
  const st = statusLabel(c);
  const next = c.status === 'draft' ? null : nextStep(c);
  const href = c.status === 'draft' ? `#/case/${c.id}/step/${c.step || 'place'}` : `#/case/${c.id}`;
  return h('li', null,
    h('a', { class: 'case-card', href },
      h('span', { class: 'case-card-top' },
        statusChip(st),
        c.nextCheck && c.status === 'open' ? h('span', { class: 'case-due' }, icon('calendar', { size: 16 }), shortDate(c.nextCheck)) : null,
      ),
      h('span', { class: 'case-card-title' }, caseTitle(c)),
      h('span', { class: 'case-card-sub' }, caseSubtitle(c)),
      h('span', { class: 'case-card-next' },
        c.status === 'draft' ? `Continue: ${stepLabel(c)}` : `Next: ${next.title}`,
        icon('right', { size: 18 }),
      ),
    ),
  );
}

function installCard(ctx) {
  const s = getSettings();
  if (ctx.isStandalone() || s.installDismissed) return null;
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const dismiss = button({ label: 'Not now', variant: 'quiet', onClick: () => { saveSettings({ installDismissed: true }); card.remove(); } });
  let body;
  if (ctx.installPrompt) {
    const install = button({ label: 'Install CurbCutter', variant: 'primary', iconName: 'download' });
    install.addEventListener('click', async () => {
      const p = ctx.installPrompt;
      ctx.clearInstallPrompt();
      p.prompt();
      try { await p.userChoice; } catch (e) { /* ignore */ }
      card.remove();
    });
    body = [h('p', null, 'Install CurbCutter so it opens like an app, works without signal, and keeps your reports safe.'), h('div', { class: 'btn-row' }, install, dismiss)];
  } else if (ios) {
    body = [
      h('p', null, 'Add CurbCutter to your Home Screen so it opens like an app and keeps your reports safe:'),
      h('ol', { class: 'steps-list' },
        h('li', null, 'Tap the Share button (a square with an arrow pointing up) in Safari.'),
        h('li', null, 'Tap "Add to Home Screen."'),
        h('li', null, 'Tap "Add."'),
      ),
      h('div', { class: 'btn-row' }, dismiss),
    ];
  } else {
    body = [
      h('p', null, 'Add CurbCutter to your Home Screen: open your browser menu and choose "Install app" or "Add to Home screen."'),
      h('div', { class: 'btn-row' }, dismiss),
    ];
  }
  const card = h('section', { class: 'panel install', 'aria-labelledby': 'install-h' },
    h('h2', { id: 'install-h', class: 'panel-title' }, icon('download'), 'Keep CurbCutter on your phone'),
    ...body,
  );
  return card;
}

export async function renderHome(params, ctx) {
  const cases = await listCases();
  const today = todayISO();
  const drafts = cases.filter((c) => c.status === 'draft');
  const due = cases.filter((c) => c.status === 'open' && c.nextCheck && c.nextCheck <= today);
  const recent = cases.filter((c) => c.status !== 'draft' && !due.includes(c)).slice(0, 3);
  const fixedCount = cases.filter((c) => c.status === 'resolved').length;

  const hero = h('section', { class: 'hero' },
    h('div', { class: 'hero-lane', 'aria-hidden': 'true' }),
    h('p', { class: 'eyebrow' }, 'Texas accessibility advocacy'),
    h('h1', { id: 'page-title', tabindex: '-1' }, 'Speak up for access.'),
    h('p', { class: 'lede' }, 'Document a barrier at a business, ask for the fix, and follow it until it\'s done. Free, private, and saved on your phone.'),
    button({ label: 'Report a barrier', href: '#/new', variant: 'primary', iconName: 'plus', block: true, attrs: { 'data-testid': 'start-report' } }),
  );

  const sections = [hero];

  if (drafts.length) {
    sections.push(h('section', { class: 'block', 'aria-labelledby': 'drafts-h' },
      h('h2', { id: 'drafts-h' }, 'Pick up where you left off'),
      h('ul', { class: 'case-list' }, drafts.map(caseCard)),
    ));
  }

  if (due.length) {
    sections.push(h('section', { class: 'block', 'aria-labelledby': 'due-h' },
      h('h2', { id: 'due-h' }, 'Follow-ups due'),
      h('ul', { class: 'case-list' }, due.map(caseCard)),
    ));
  }

  if (recent.length) {
    sections.push(h('section', { class: 'block', 'aria-labelledby': 'recent-h' },
      h('div', { class: 'block-head' },
        h('h2', { id: 'recent-h' }, 'Your cases'),
        h('a', { href: '#/cases', class: 'more' }, `See all ${cases.length - drafts.length}`),
      ),
      fixedCount ? h('p', { class: 'wins' }, icon('star', { size: 20 }), `${fixedCount} ${fixedCount === 1 ? 'barrier' : 'barriers'} fixed so far.`) : null,
      h('ul', { class: 'case-list' }, recent.map(caseCard)),
    ));
  }

  const install = installCard(ctx);
  if (install) sections.push(install);

  sections.push(h('section', { class: 'block how', 'aria-labelledby': 'how-h' },
    h('h2', { id: 'how-h' }, 'How CurbCutter works'),
    h('ol', { class: 'how-steps' },
      h('li', null, h('span', null, h('strong', null, 'Document it. '), 'Where, what\'s wrong, and photos. CurbCutter checks the parking math for you.')),
      h('li', null, h('span', null, h('strong', null, 'Ask for the fix. '), 'CurbCutter drafts a polite letter from your report. You read it, change any words you want, and send it in your own name.')),
      h('li', null, h('span', null, h('strong', null, 'Follow up. '), 'Reminders on your calendar, and a record of every date.')),
      h('li', null, h('span', null, h('strong', null, 'Escalate if needed. '), 'The property owner, state and federal complaints, your council member, and local news.')),
    ),
  ));

  sections.push(h('section', { class: 'trust' },
    icon('scale'),
    h('p', null,
      'Every rule in CurbCutter links to its official source. Checked ', h('strong', null, longDate(CONTENT_CHECKED)), '. ',
      h('a', { href: '#/about' }, 'How we keep it accurate'),
    ),
  ));

  return { title: 'Home', node: h('div', { class: 'screen home' }, ...sections) };
}
