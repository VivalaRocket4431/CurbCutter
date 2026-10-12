import { h, icon } from '../ui/dom.js';
import { button, statusChip, fold } from '../ui/components.js';
import { listCases } from '../lib/store.js';
import { nextStep, statusLabel, has } from '../lib/ladder.js';
import { caseTitle, caseSubtitle } from '../lib/letters.js';
import { shortDate, todayISO } from '../lib/dates.js';
import { getSettings, saveSettings } from '../lib/settings.js';
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

function installFold(ctx) {
  const s = getSettings();
  if (ctx.isStandalone() || s.installDismissed) return null;
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  let node = null;
  const dismiss = button({ label: 'Not now', variant: 'quiet', onClick: () => { saveSettings({ installDismissed: true }); node?.remove(); } });
  let body;
  if (ctx.installPrompt) {
    const install = button({ label: 'Install CurbCutter', variant: 'primary', iconName: 'download' });
    install.addEventListener('click', async () => {
      const p = ctx.installPrompt;
      ctx.clearInstallPrompt();
      p.prompt();
      try { await p.userChoice; } catch (e) { /* ignore */ }
      node?.remove();
    });
    body = [h('div', { class: 'btn-row' }, install, dismiss)];
  } else if (ios) {
    body = [
      h('ol', { class: 'steps-list' },
        h('li', null, 'In Safari, tap the Share button (a square with an arrow pointing up).'),
        h('li', null, 'Tap "Add to Home Screen," then "Add."'),
      ),
      dismiss,
    ];
  } else {
    body = [h('p', null, 'Open your browser menu and choose "Install app" or "Add to Home screen."'), dismiss];
  }
  node = fold({ title: 'Put CurbCutter on your Home Screen', sub: 'It opens like an app and works with no signal.', className: 'install-fold' }, ...body);
  return node;
}

// Reports that need the person come first: unsent requests and follow-ups that are due.
function sortOpen(cases, today) {
  const needsYou = (c) => !has(c, 'asked') || (c.nextCheck && c.nextCheck <= today);
  return [...cases].sort((a, b) => {
    const na = needsYou(a) ? 0 : 1;
    const nb = needsYou(b) ? 0 : 1;
    if (na !== nb) return na - nb;
    return (a.nextCheck || '9999') < (b.nextCheck || '9999') ? -1 : 1;
  });
}

export async function renderHome(params, ctx) {
  const cases = await listCases();
  const today = todayISO();
  const drafts = cases.filter((c) => c.status === 'draft');
  const open = sortOpen(cases.filter((c) => c.status === 'open'), today);
  const finished = cases.filter((c) => c.status === 'resolved' || c.status === 'closed');
  const fixedCount = cases.filter((c) => c.status === 'resolved').length;

  const sections = [
    h('section', { class: 'hero' },
      h('div', { class: 'hero-lane', 'aria-hidden': 'true' }),
      h('h1', { id: 'page-title', tabindex: '-1' }, 'Speak up for access.'),
      h('p', { class: 'lede' }, 'Report a barrier at a Texas business and ask for the fix. Free, and private to your phone.'),
      button({ label: 'Report a barrier', href: '#/new', variant: 'primary', iconName: 'plus', block: true, attrs: { 'data-testid': 'start-report' } }),
    ),
  ];

  if (drafts.length) {
    sections.push(h('section', { class: 'block', 'aria-labelledby': 'drafts-h' },
      h('h2', { id: 'drafts-h' }, 'Pick up where you left off'),
      h('ul', { class: 'case-list' }, drafts.map(caseCard)),
    ));
  }

  if (open.length) {
    sections.push(h('section', { class: 'block', 'aria-labelledby': 'open-h' },
      h('h2', { id: 'open-h' }, 'Your reports'),
      fixedCount ? h('p', { class: 'wins' }, icon('star', { size: 20 }), `${fixedCount} ${fixedCount === 1 ? 'barrier' : 'barriers'} fixed so far.`) : null,
      h('ul', { class: 'case-list' }, open.map(caseCard)),
    ));
  }

  if (finished.length) {
    sections.push(fold({ title: `Fixed or closed (${finished.length})`, sub: open.length ? null : `${fixedCount} ${fixedCount === 1 ? 'barrier' : 'barriers'} fixed so far.` },
      h('ul', { class: 'case-list' }, finished.map(caseCard))));
  }

  if (!cases.length) {
    sections.push(h('section', { class: 'block', 'aria-labelledby': 'how-h' },
      h('p', { class: 'empty-title' }, 'No reports yet'),
      h('h2', { id: 'how-h', class: 'vh' }, 'How CurbCutter works'),
      h('ol', { class: 'how-steps' },
        h('li', null, h('span', null, h('strong', null, 'Document it. '), 'Where it is, what\'s wrong, and a photo.')),
        h('li', null, h('span', null, h('strong', null, 'Ask for the fix. '), 'CurbCutter drafts a polite letter. You read it, change any words, and send it.')),
        h('li', null, h('span', null, h('strong', null, 'Follow up. '), 'Reminders and a dated record of every step.')),
        h('li', null, h('span', null, h('strong', null, 'Escalate if needed. '), 'The owner, the state, the city, or local news.')),
      ),
    ));
  }

  const install = installFold(ctx);
  if (install) sections.push(install);

  return { title: 'Home', node: h('div', { class: 'screen home' }, ...sections) };
}
