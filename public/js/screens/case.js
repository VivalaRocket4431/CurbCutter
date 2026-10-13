import { h, icon } from '../ui/dom.js';
import { button, statusChip, strengthBadge, sourceList, confirmButton, toast, notice, fold } from '../ui/components.js';
import { eventRecorder, calendarButton } from '../ui/recorder.js';
import { savePhotosButton, photoViewer, photoThumbs } from '../ui/photos.js';
import { getCase, putCase, deleteCase } from '../lib/store.js';
import { nextStep, statusLabel, RUNGS, rungDone, has } from '../lib/ladder.js';
import { EVENT_TYPES, withoutEvent } from '../lib/events.js';
import { LETTER_KINDS, requestText, sentLinkLabel } from '../lib/letters.js';
import { barrier } from '../data/barriers.js';
import { placeArea } from '../data/contacts.js';
import { assessParking } from '../lib/parking.js';
import { longDate, shortDate, relativeDays } from '../lib/dates.js';

function actionButton(c, a, openRecorder, primary) {
  const variant = primary ? 'primary' : 'secondary';
  if (a.kind === 'letter') return button({ label: a.label, href: `#/case/${c.id}/letter/${a.letter}`, variant, iconName: 'mail' });
  if (a.kind === 'wizard') return button({ label: a.label, href: `#/case/${c.id}/step/${c.step || 'place'}`, variant, iconName: 'edit' });
  if (a.kind === 'owner') return button({ label: a.label, href: `#/case/${c.id}/letter/owner`, variant, iconName: 'building' });
  if (a.kind === 'help') return button({ label: a.label, href: `#/help/${c.place?.metro || 'other'}`, variant, iconName: 'people' });
  if (a.kind === 'event') return button({ label: a.label, variant, iconName: a.type === 'fixed' ? 'star' : 'check', onClick: () => openRecorder(a.type) });
  return null;
}

export async function renderCase(params, ctx) {
  const c = await getCase(params.id);
  if (!c) {
    return {
      title: 'Case not found',
      node: h('section', { class: 'screen' }, h('h1', { id: 'page-title', tabindex: '-1' }, 'We could not find that case'), button({ label: 'Go to Home', href: '#/', variant: 'primary' })),
    };
  }
  if (c.status === 'draft') {
    ctx.navigate(`#/case/${c.id}/step/${c.step || 'place'}`, { replace: true });
    return null;
  }

  const viewer = photoViewer();
  const st = statusLabel(c);
  const step = nextStep(c);
  const recorderHost = h('div', { class: 'recorder-host' });

  function openRecorder(type, intro) {
    recorderHost.replaceChildren(eventRecorder(c, type, {
      intro,
      onSaved: () => ctx.refresh(),
      onCancel: () => recorderHost.replaceChildren(),
    }));
    recorderHost.querySelector('input')?.focus();
    recorderHost.scrollIntoView({ block: 'nearest' });
  }

  // ----- Next step -----
  const next = h('section', { class: 'next', 'aria-labelledby': 'next-h' },
    h('p', { class: 'next-eyebrow', id: 'next-h' }, 'Your next step'),
    h('h2', { class: 'next-title' }, step.title),
    h('p', null, step.detail),
    step.due ? h('p', { class: 'due' }, icon('calendar', { size: 18 }), `${longDate(step.due)} (${relativeDays(step.due)})`) : null,
    step.actions.length ? h('div', { class: 'btn-col' }, step.actions.map((a, i) => actionButton(c, a, openRecorder, i === 0))) : null,
    step.due && c.nextCheck ? calendarButton(c, { variant: 'secondary', label: 'Add a reminder to my calendar' }) : null,
  );

  // ----- Quick record -----
  const shown = new Set(step.actions.filter((a) => a.kind === 'event').map((a) => a.type));
  const quickTypes = (c.status === 'resolved' ? ['thanked', 'note'] : [has(c, 'asked') ? null : 'asked', 'reply', 'fixed', 'note'])
    .filter((t) => t && !shown.has(t));
  const quick = fold({ title: 'Add an update', sub: 'A reply, a fix, or a note to yourself.' },
    h('div', { class: 'btn-wrap' }, quickTypes.map((t) => button({ label: EVENT_TYPES[t].label, variant: 'secondary', iconName: t === 'fixed' ? 'star' : 'plus', onClick: () => openRecorder(t) }))),
  );

  // ----- Ladder -----
  const ladder = fold({ title: 'All steps and letters', sub: 'Most fixes happen in the first two steps.' },
    h('ol', { class: 'ladder' }, RUNGS.map((r) => {
      const done = rungDone(c, r);
      const current = !done && step.rung === r.id;
      const dates = (r.events || []).flatMap((t) => (c.events || []).filter((e) => e.type === t)).map((e) => shortDate(e.date));
      return h('li', { class: `rung${done ? ' done' : ''}${current ? ' current' : ''}` },
        h('span', { class: 'rung-mark', 'aria-hidden': 'true' }, done ? icon('check', { size: 18 }) : null),
        h('div', { class: 'rung-body' },
          h('p', { class: 'rung-title' }, r.title,
            h('span', { class: 'vh' }, done ? ' (done)' : current ? ' (current step)' : ''),
            dates.length ? h('span', { class: 'rung-date' }, ` ${dates.join(', ')}`) : null),
          h('p', { class: 'rung-what' }, r.what),
          r.letters && !(c.status === 'resolved' && r.id !== 'fixed') ? h('p', { class: 'rung-links' }, r.letters.map((k) => h('a', { href: `#/case/${c.id}/letter/${k}` }, LETTER_KINDS[k].title))) : null,
        ),
      );
    })),
  );

  // ----- Photos: in plain view, because people come back to check them -----
  const thumbs = await photoThumbs(c, viewer);
  const photoSection = thumbs ? h('section', { class: 'block', 'aria-labelledby': 'photos-h' },
    h('h2', { id: 'photos-h' }, thumbs.count === 1 ? 'Your photo' : `Your ${thumbs.count} photos`),
    h('p', { class: 'hint' }, 'Tap a photo to see it full size.'),
    thumbs.node,
    h('div', { class: 'btn-row' }, savePhotosButton(c), h('a', { href: `#/case/${c.id}/step/photos`, class: 'more' }, icon('plus', { size: 18 }), 'Add or remove photos')),
  ) : null;

  // ----- The problem -----
  const a = assessParking(c.parking);
  const nProblems = (c.barriers || []).length;
  const problem = fold({
    title: 'Your report',
    sub: [`${nProblems} ${nProblems === 1 ? 'problem' : 'problems'}`, thumbs ? `${thumbs.count} ${thumbs.count === 1 ? 'photo' : 'photos'}` : 'no photos yet'].join(', '),
  },
    h('p', null, h('a', { href: `#/case/${c.id}/step/review`, class: 'more' }, icon('edit', { size: 18 }), 'Change the report')),
    h('ul', { class: 'barrier-cards' }, (c.barriers || []).map((id) => {
      const b = barrier(id);
      return h('li', { class: 'barrier-card' },
        h('h3', null, id === 'other' ? (c.notes?.other || b.title) : b.title),
        strengthBadge(b.strength),
        c.notes?.[id] && id !== 'other' ? h('p', null, c.notes[id]) : null,
        h('details', { class: 'explain' }, h('summary', null, 'What the rule says'), h('p', null, b.rule), sourceList(b.cites)),
      );
    })),
    a.known && (c.barriers || []).some((id) => barrier(id).usesCalc) ? h('div', { class: 'calc-result compact' },
      h('p', { class: 'calc-title' }, `Parking: lot with ${a.totalLabel} spaces`),
      h('div', { class: 'calc-row' }, h('span', null, 'Required'), h('strong', null, `${a.required} accessible`), h('span', { class: 'calc-sub' }, `${a.vanRequired} van`)),
      a.accessible != null ? h('div', { class: 'calc-row' }, h('span', null, 'Counted'), h('strong', null, `${a.accessible} accessible`), a.van != null ? h('span', { class: 'calc-sub' }, `${a.van} van`) : null) : null,
    ) : null,
    c.impact ? h('div', { class: 'quote' }, h('p', { class: 'quote-label' }, 'How it affected you'), h('p', null, c.impact)) : null,
    h('div', { class: 'quote' }, h('p', { class: 'quote-label' }, 'Your request'), h('p', { class: 'pre' }, requestText(c))),
    thumbs ? null : h('p', { class: 'hint' }, 'No photos yet. ', h('a', { href: `#/case/${c.id}/step/photos` }, 'Add photos')),
  );

  // ----- Timeline -----
  const events = [...(c.events || [])].sort((x, y) => (x.date < y.date ? 1 : x.date > y.date ? -1 : 0));
  const timeline = h('section', { class: 'block', 'aria-labelledby': 'tl-h' },
    h('h2', { id: 'tl-h' }, 'What\'s happened'),
    h('ol', { class: 'timeline' }, events.map((e) => h('li', null,
      h('p', { class: 'tl-date' }, longDate(e.date)),
      h('p', { class: 'tl-what' }, EVENT_TYPES[e.type]?.past || 'Update',
        e.outcome === 'yes' ? ': they agreed to fix it' : e.outcome === 'no' ? ': they said no' : '',
        e.ref ? ` (#${e.ref})` : ''),
      e.note ? h('p', { class: 'tl-note' }, e.note) : null,
      e.letter ? h('p', { class: 'tl-link' }, h('a', { href: `#/case/${c.id}/sent/${e.id}`, class: 'more' }, icon('mail', { size: 18 }), sentLinkLabel(e.letter.kind))) : null,
      e.type !== 'documented' ? confirmButton({
        label: 'Remove', iconName: 'trash', variant: 'quiet',
        confirmText: 'Remove this from the timeline?', confirmLabel: 'Remove it',
        onConfirm: async () => { await putCase(withoutEvent(c, e.id)); toast('Removed.'); ctx.refresh(); },
      }) : null,
    ))),
  );

  // ----- Manage -----
  const manage = fold({ title: 'Close or delete this report', className: 'manage' },
    c.status === 'closed'
      ? button({ label: 'Reopen this case', iconName: 'left', onClick: async () => { await putCase({ ...c, status: has(c, 'fixed') ? 'resolved' : 'open' }); toast('Case reopened.'); ctx.refresh(); } })
      : c.status !== 'resolved'
        ? button({ label: 'Close this case without a fix', iconName: 'close', variant: 'quiet', onClick: async () => { await putCase({ ...c, status: 'closed', nextCheck: null }); toast('Case closed. You can reopen it any time.'); ctx.refresh(); } })
        : null,
    confirmButton({
      label: 'Delete this case', confirmText: 'Delete this case and its photos? This cannot be undone.', confirmLabel: 'Delete for good',
      onConfirm: async () => { await deleteCase(c.id); toast('Case deleted.'); ctx.navigate('#/'); },
    }),
  );


  const node = h('div', { class: 'screen case' },
    h('header', { class: 'page-head' },
      h('p', { class: 'eyebrow' }, statusChip(st), placeArea(c.place) ? h('span', { class: 'eyebrow-meta' }, placeArea(c.place)) : null),
      h('h1', { id: 'page-title', tabindex: '-1' }, c.place?.name || 'Your case'),
      h('p', { class: 'lede' }, [c.place?.address, c.place?.city].filter(Boolean).join(', ') || 'No address yet'),
    ),
    c.status === 'resolved' ? notice({ tone: 'good', title: 'Fixed!', body: 'This barrier was fixed. Thank you for speaking up.', iconName: 'star' }) : null,
    next,
    recorderHost,
    photoSection,
    timeline,
    h('div', { class: 'folds' }, quick, ladder, problem, manage),
    viewer.node,
  );

  return {
    title: c.place?.name || 'Case',
    node,
    cleanup: () => thumbs?.cleanup(),
  };
}
