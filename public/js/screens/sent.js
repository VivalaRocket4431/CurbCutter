// The exact text of a letter the person marked as sent, saved with that day's timeline entry.
// It never changes, so it's a reliable record even after the report or CurbCutter's drafts change.

import { h, icon } from '../ui/dom.js';
import { button, copyButton, toast } from '../ui/components.js';
import { casePhotoFiles } from '../ui/photos.js';
import { getCase } from '../lib/store.js';
import { LETTER_KINDS, letterNoun } from '../lib/letters.js';
import { EVENT_TYPES } from '../lib/events.js';
import { longDate } from '../lib/dates.js';
import { shareContent, canShareText } from '../lib/share.js';

export async function renderSent(params) {
  const c = await getCase(params.id);
  const ev = (c?.events || []).find((e) => e.id === params.event && e.letter?.body);
  if (!c || !ev) {
    return {
      title: 'Not found',
      node: h('section', { class: 'screen' },
        h('h1', { id: 'page-title', tabindex: '-1' }, 'We could not find that letter'),
        button({ label: 'Go to Home', href: '#/', variant: 'primary' })),
    };
  }

  const { kind, subject, body } = ev.letter;
  const meta = LETTER_KINDS[kind] || { title: 'Letter', to: '' };
  const noun = letterNoun(kind);
  const isForm = kind === 'tdlr' || kind === 'doj';
  const text = isForm || !subject ? body : `${subject}\n\n${body}`;

  const card = h('article', { class: 'letter', 'aria-label': `The ${noun} you saved` },
    subject ? h('div', { class: 'subject' }, h('p', { class: 'subject-label' }, 'Subject'), h('p', { class: 'subject-text' }, subject)) : null,
    h('div', { class: 'letter-body' }, h('div', { class: 'letter-text' }, body)),
  );

  const actions = [copyButton(text, { label: `Copy the ${noun}`, variant: 'primary' })];
  if (canShareText()) {
    actions.push(button({
      label: (c.photos || []).length ? 'Share with photos' : 'Share',
      iconName: 'share',
      variant: 'secondary',
      onClick: async () => {
        const files = await casePhotoFiles(c);
        const result = await shareContent({ title: subject, text, files });
        if (result === 'unsupported') toast('Sharing is not available here. Use Copy instead.', { tone: 'bad' });
      },
    }));
  }

  const node = h('div', { class: 'screen letter-screen sent-screen' },
    h('p', { class: 'back' }, h('a', { href: `#/case/${c.id}` }, icon('left', { size: 18 }), `Back to ${c.place?.name || 'the case'}`)),
    h('header', { class: 'page-head' },
      meta.to ? h('p', { class: 'eyebrow' }, `To: ${meta.to}`) : null,
      h('h1', { id: 'page-title', tabindex: '-1' }, meta.title),
      h('p', { class: 'lede' }, `${EVENT_TYPES[ev.type]?.past || 'Saved'} on ${longDate(ev.date)}. This is the text CurbCutter saved at that time.`),
    ),
    card,
    h('div', { class: 'quick-send' }, ...actions),
    h('p', { class: 'fine' }, 'CurbCutter shares general information, not legal advice.'),
  );
  return { title: `${meta.title}: ${c.place?.name || 'case'}`, node };
}
