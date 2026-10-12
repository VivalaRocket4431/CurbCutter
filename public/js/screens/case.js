import { h, icon } from '../ui/dom.js';
import { button, statusChip, strengthBadge, sourceList, confirmButton, toast, notice, fold } from '../ui/components.js';
import { eventRecorder, calendarButton } from '../ui/recorder.js';
import { savePhotosButton } from '../ui/photos.js';
import { getCase, putCase, deleteCase, listPhotos } from '../lib/store.js';
import { nextStep, statusLabel, RUNGS, rungDone, has } from '../lib/ladder.js';
import { EVENT_TYPES, withoutEvent } from '../lib/events.js';
import { LETTER_KINDS, requestText } from '../lib/letters.js';
import { barrier } from '../data/barriers.js';
import { metroName } from '../data/contacts.js';
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

function photoViewer() {
  const img = h('img', { alt: '' });
  const close = button({ label: 'Close', iconName: 'close', variant: 'secondary' });
  const dlg = h('dialog', { class: 'viewer', 'aria-label': 'Photo' }, img, close);
  close.addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  return {
    node: dlg,
    open(src, alt) {
      img.src = src;
      img.alt = alt;
      if (typeof dlg.showModal === 'function') dlg.showModal();
      else dlg.setAttribute('open', '');
    },
  };
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

  const urls = [];
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

  // ----- The problem -----
  const a = assessParking(c.parking);
  const photos = (await listPhotos(c.id)).filter((p) => (c.photos || []).includes(p.id));
  const thumbs = photos.map((p, i) => {
    const url = URL.createObjectURL(p.blob);
    urls.push(url);
    const alt = `Photo ${i + 1} of ${c.place?.name || 'the barrier'}`;
    return h('li', null, h('button', { type: 'button', class: 'thumb', onclick: () => viewer.open(url, alt) }, h('img', { src: url, alt })));
  });

  const nProblems = (c.barriers || []).length;
  const problem = fold({
    title: 'Your report',
    sub: [`${nProblems} ${nProblems === 1 ? 'problem' : 'problems'}`, thumbs.length ? `${thumbs.length} ${thumbs.length === 1 ? 'photo' : 'photos'}` : 'no photos yet'].join(', '),
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
    thumbs.length ? h('ul', { class: 'photo-grid small' }, thumbs) : h('p', { class: 'hint' }, 'No photos yet. ', h('a', { href: `#/case/${c.id}/step/photos` }, 'Add photos')),
    thumbs.length ? h('div', { class: 'btn-row' }, savePhotosButton(c), h('a', { href: `#/case/${c.id}/step/photos`, class: 'more' }, icon('plus', { size: 18 }), 'Add or remove photos')) : null,
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
      h('p', { class: 'eyebrow' }, statusChip(st), h('span', { class: 'eyebrow-meta' }, metroName(c.place?.metro))),
      h('h1', { id: 'page-title', tabindex: '-1' }, c.place?.name || 'Your case'),
      h('p', { class: 'lede' }, [c.place?.address, c.place?.city].filter(Boolean).join(', ') || 'No address yet'),
    ),
    c.status === 'resolved' ? notice({ tone: 'good', title: 'Fixed!', body: 'This barrier was fixed. Thank you for speaking up.', iconName: 'star' }) : null,
    next,
    recorderHost,
    timeline,
    h('div', { class: 'folds' }, quick, ladder, problem, manage),
    viewer.node,
  );

  return {
    title: c.place?.name || 'Case',
    node,
    cleanup: () => urls.forEach((u) => URL.revokeObjectURL(u)),
  };
}
