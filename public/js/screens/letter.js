// A letter, step by step: 1) read CurbCutter's draft and change any wording, 2) send it yourself.
// Nothing is ever sent automatically. The person always has the last word.

import { h, icon } from '../ui/dom.js';
import { button, field, textInput, textArea, choiceGroup, toast, copyButton, contactCard, notice, externalLink, sourceList, fold } from '../ui/components.js';
import { eventRecorder } from '../ui/recorder.js';
import { savePhotosButton, casePhotoFiles } from '../ui/photos.js';
import { getCase, putCase } from '../lib/store.js';
import { getSettings } from '../lib/settings.js';
import { LETTER_KINDS, makeLetter, tdlrFields } from '../lib/letters.js';
import { LETTER_EVENT, EVENT_TYPES } from '../lib/events.js';
import { mailtoHref, MAILTO_SAFE_LENGTH, shareContent, canShareText, downloadText, printElement, safeFilename } from '../lib/share.js';
import { speak, speechSupported } from '../lib/speech.js';
import { barrier } from '../data/barriers.js';
import { SOURCES } from '../data/sources.js';
import { STATEWIDE, localFor, metroName } from '../data/contacts.js';

const EMAILABLE = new Set(['request', 'followup', 'final', 'owner', 'council', 'news', 'thanks', 'city']);
const BUSINESS_KINDS = new Set(['request', 'followup', 'final', 'thanks']);
const FORMS = new Set(['tdlr', 'doj']);

const STEP2_TITLE = {
  tdlr: 'Step 2: File it with TDLR',
  doj: 'Step 2: File it with the U.S. Department of Justice',
  script: 'Step 2: Say it or show it',
  summary: 'Step 2: Share it',
};

const STEP2_INTRO = {
  tdlr: 'Copy the summary, open the form, and paste it in. Nothing is filed until you submit the form yourself.',
  doj: 'Copy the summary, open the form, and paste it in. Nothing is filed until you submit the form yourself.',
  script: 'Talk to a manager if you can. If talking is hard, show this on your screen instead.',
  summary: 'Share it with anyone helping you, like an ADA center, an independent living center, or a lawyer.',
};

function caseSources(c) {
  const ids = new Set();
  for (const id of c.barriers || []) for (const s of barrier(id)?.cites || []) ids.add(s);
  return [...ids].map((id) => SOURCES[id]).filter(Boolean);
}

function ownerFinder(c) {
  const local = localFor(c.place?.metro);
  return h('section', { class: 'panel', 'aria-labelledby': 'owner-h' },
    h('h3', { id: 'owner-h', class: 'panel-title' }, icon('building'), 'Find who owns the property'),
    h('p', null, 'The store often rents its space. The property owner usually controls the parking lot and the building. County appraisal districts list the owner of every property for free: search by the street address.'),
    local.counties.length ? h('ul', { class: 'link-list' }, local.counties.map((k) => h('li', null, externalLink(k.url, `${k.cad} (${k.name})`)))) : null,
    h('p', null, externalLink(STATEWIDE.directories[1].url, 'Find the appraisal district for any Texas county')),
    h('p', { class: 'hint' }, 'If the owner is a company, search its name to find a property manager. For a chain store, look for "Contact us" or "Customer service" on the company website, or use the corporate address on your receipt.'),
  );
}

function tdlrPanel(c) {
  const fields = tdlrFields(c);
  return h('section', { class: 'panel', 'aria-labelledby': 'tdlr-h' },
    h('h3', { id: 'tdlr-h', class: 'panel-title' }, icon('building'), 'Before you open the form'),
    h('ul', { class: 'check-list' },
      h('li', null, 'The form times out after 15 minutes. Get everything ready here first.'),
      h('li', null, 'Choose the program "Architectural Barriers."'),
      h('li', null, 'Attach your photos. The form takes up to 35 MB of files.'),
      h('li', null, 'File within 2 years of finding the problem.'),
      h('li', null, 'TDLR covers businesses built or remodeled since 1992 (public accommodations) or September 1993 (other commercial buildings). If you are not sure, file anyway and TDLR will decide.'),
    ),
    h('h4', { class: 'sub-title' }, 'Copy these into the form'),
    h('dl', { class: 'copy-fields' }, fields.map((f) => [
      h('dt', null, f.label),
      h('dd', null, h('span', { class: 'copy-value' }, f.value), copyButton(f.value, { label: 'Copy', variant: 'quiet' })),
    ])),
    sourceList(['tdlr-complaint', 'tx-469-003']),
  );
}

function dojPanel() {
  const doj = STATEWIDE.complaints[1];
  return h('section', { class: 'panel', 'aria-labelledby': 'doj-h' },
    h('h3', { id: 'doj-h', class: 'panel-title' }, icon('scale'), 'How the federal complaint works'),
    h('ul', { class: 'check-list' },
      h('li', null, 'Paste the summary into the "What happened" part of the online form.'),
      h('li', null, 'Review can take up to three months. The Department may offer free, voluntary mediation.'),
      h('li', null, 'Your name and details are not shared unless needed for enforcement or required by law.'),
    ),
    contactCard({ name: 'Questions? ADA Information Line', phone: doj.phone, phoneLabel: doj.phoneLabel, extra: doj.extra }, { headingLevel: 4 }),
    sourceList(['doj-file', 'doj-report']),
  );
}

function cityPanel(c) {
  const local = localFor(c.place?.metro);
  if (!local.cities.length) {
    return notice({ tone: 'info', title: 'Find your city\'s 311', body: 'Search your city\'s name and "311" or "ADA coordinator." CurbCutter has local contacts for Dallas, Fort Worth, Houston, San Antonio, and Austin.' });
  }
  return h('section', { class: 'panel', 'aria-labelledby': 'city-h' },
    h('h3', { id: 'city-h', class: 'panel-title' }, icon('building'), `Where to send it in the ${metroName(c.place?.metro)} area`),
    ...local.cities.flatMap((city) => [
      contactCard({ name: `${city.name} 311`, ...city.report }, { headingLevel: 4 }),
      contactCard(city.ada, { headingLevel: 4 }),
    ]),
    local.volunteer ? contactCard(local.volunteer, { headingLevel: 4 }) : null,
  );
}

function councilPanel(c) {
  const local = localFor(c.place?.metro);
  if (!local.cities.length) return notice({ tone: 'info', title: 'Find your council member', body: 'Search your city\'s name and "find my council member."' });
  return h('section', { class: 'panel', 'aria-labelledby': 'council-h' },
    h('h3', { id: 'council-h', class: 'panel-title' }, icon('building'), 'Find your council member'),
    ...local.cities.map((city) => contactCard({ name: city.name, ...city.council }, { headingLevel: 4 })),
  );
}

function newsPanel(c) {
  const local = localFor(c.place?.metro);
  const outlets = [...local.news, ...STATEWIDE.news];
  return h('section', { class: 'panel', 'aria-labelledby': 'news-h' },
    h('h3', { id: 'news-h', class: 'panel-title' }, icon('megaphone'), 'Newsrooms that take tips'),
    h('p', null, 'Send to one or two at a time. Consumer and investigations teams are a good fit. ', h('a', { href: '#/rights/media' }, 'Tips for working with reporters')),
    ...outlets.map((o) => contactCard(o, { headingLevel: 4 })),
  );
}

function scriptPanel(c) {
  return h('div', { class: 'btn-col' },
    button({ label: 'Show this to staff', href: `#/case/${c.id}/show`, variant: 'primary', iconName: 'eye' }),
  );
}

export async function renderLetter(params, ctx) {
  const c = await getCase(params.id);
  const meta = LETTER_KINDS[params.kind];
  if (!c || !meta) {
    return { title: 'Not found', node: h('section', { class: 'screen' }, h('h1', { id: 'page-title', tabindex: '-1' }, 'We could not find that letter'), button({ label: 'Go to Home', href: '#/', variant: 'primary' })) };
  }
  const kind = params.kind;
  const isForm = FORMS.has(kind);
  const noun = isForm ? 'summary' : kind === 'script' ? 'script' : kind === 'summary' ? 'record' : 'letter';
  const profile = getSettings().profile;
  const sources = caseSources(c);
  let tone = c.letterTone || 'friendly';
  let editing = false;

  const generate = () => makeLetter(kind, c, profile, { tone, sources });
  let letter = c.letters?.[kind]?.edited ? c.letters[kind] : generate();

  const recipientKey = BUSINESS_KINDS.has(kind) ? 'business' : kind;
  const recipient = (c.recipients || {})[recipientKey] ?? (recipientKey === 'business' ? c.contact?.email || '' : '');
  let toInput = null;

  const saveLetter = async () => {
    c.letters = { ...(c.letters || {}), [kind]: { ...letter } };
    await putCase(c);
  };

  // ---------- Step 1: read it and change anything ----------
  const subjectHost = h('div', { class: 'subject' });
  const bodyHost = h('div', { class: 'letter-body' });
  const countHost = h('p', { class: 'count', 'aria-live': 'polite' });
  const card = h('article', { class: 'letter', 'aria-label': `Your ${noun}` }, subjectHost, bodyHost, countHost);
  const reviewHost = h('div', { class: 'review-tools btn-pair' });
  const editedHost = h('div', { 'aria-live': 'polite' });

  function paintCount() {
    if (meta.limit) {
      const n = letter.body.length;
      countHost.className = `count${n > meta.limit ? ' over' : ''}`;
      countHost.textContent = `${n.toLocaleString('en-US')} of ${meta.limit.toLocaleString('en-US')} characters${n > meta.limit ? '. Shorten it, or attach it as a document.' : '.'}`;
    } else {
      countHost.textContent = '';
    }
  }

  function paintEdited() {
    if (!letter.edited) {
      editedHost.replaceChildren();
      return;
    }
    editedHost.replaceChildren(h('div', { class: 'edited-note' },
      h('p', null, icon('check', { size: 18 }), `You changed this ${noun}. Your version is saved.`),
      button({
        label: 'Go back to CurbCutter\'s draft',
        iconName: 'left',
        variant: 'quiet',
        onClick: async () => {
          letter = generate();
          const rest = { ...(c.letters || {}) };
          delete rest[kind];
          c.letters = rest;
          await putCase(c);
          editing = false;
          paint();
          toast('Back to CurbCutter\'s draft.');
        },
      }),
    ));
  }

  function paintReviewTools() {
    const tools = [];
    if (speechSupported()) {
      tools.push(button({ label: 'Read it to me', iconName: 'speaker', variant: 'secondary', onClick: () => speak(`${letter.subject}. ${letter.body}`, getSettings().speechRate) }));
    }
    tools.push(button({
      label: editing ? 'Done changing' : 'Change the wording',
      iconName: editing ? 'check' : 'edit',
      variant: editing ? 'primary' : 'secondary',
      attrs: { 'data-testid': 'edit-toggle' },
      onClick: () => {
        editing = !editing;
        paint();
        if (editing) document.getElementById('edit-body')?.focus();
        else reviewHost.querySelector('[data-testid="edit-toggle"]')?.focus();
      },
    }));
    reviewHost.replaceChildren(...tools);
  }

  function paintLetter() {
    if (editing) {
      const subj = textInput({ id: 'edit-subject', value: letter.subject, onInput: (v) => { letter = { ...letter, subject: v, edited: true }; saveLetter(); paintEdited(); paintActions(); } });
      const body = textArea({ id: 'edit-body', rows: 18, value: letter.body, onInput: (v) => { letter = { ...letter, body: v, edited: true }; paintCount(); saveLetter(); paintEdited(); paintActions(); } });
      subjectHost.replaceChildren(field({ id: 'edit-subject', label: 'Subject', input: subj }));
      bodyHost.replaceChildren(field({ id: 'edit-body', label: `Your ${noun}`, hint: 'Change, add, or remove anything. Your changes save as you type.', input: body }));
    } else {
      subjectHost.replaceChildren(h('p', { class: 'subject-label' }, 'Subject'), h('p', { class: 'subject-text' }, letter.subject));
      bodyHost.replaceChildren(h('div', { class: 'letter-text' }, letter.body));
    }
    paintCount();
  }

  // ---------- Step 2: send it yourself ----------
  const sendHost = h('div', { class: 'quick-send' });
  const moreHost = h('div', { class: 'btn-col' });

  async function shareLetter() {
    const files = await casePhotoFiles(c);
    const result = await shareContent({ title: letter.subject, text: `${letter.subject}\n\n${letter.body}`, files });
    if (result === 'unsupported') toast('Sharing is not available here. Use Copy instead.', { tone: 'bad' });
  }

  function paintActions() {
    const btns = [];
    const more = [];
    const copyLabel = `Copy the ${noun}`;
    const copy = (variant) => copyButton(() => (isForm ? letter.body : `${letter.subject}\n\n${letter.body}`), { label: copyLabel, variant });
    if (EMAILABLE.has(kind)) {
      const href = mailtoHref({ to: toInput?.value || recipient, subject: letter.subject, body: letter.body });
      btns.push(button({ label: 'Email it', href, variant: 'primary', iconName: 'mail' }));
      if (canShareText()) btns.push(button({ label: (c.photos || []).length ? 'Share with photos' : 'Share', iconName: 'share', variant: 'secondary', onClick: shareLetter }));
      if (href.length > MAILTO_SAFE_LENGTH) {
        btns.push(copy('secondary'));
        btns.push(h('p', { class: 'hint quick-hint' }, 'If your email app cuts the letter short, use Copy and paste it into the email.'));
      } else {
        more.push(copy('secondary'));
      }
    } else if (isForm) {
      btns.push(copy('primary'));
      const form = kind === 'tdlr' ? STATEWIDE.complaints[0] : STATEWIDE.complaints[1];
      btns.push(button({ label: kind === 'tdlr' ? 'Open the TDLR complaint form' : 'Open the federal complaint form', href: form.url, variant: 'secondary', iconName: 'external', external: true }));
    } else {
      if (canShareText()) btns.push(button({ label: 'Share', iconName: 'share', variant: 'primary', onClick: shareLetter }));
      btns.push(copy(canShareText() ? 'secondary' : 'primary'));
    }
    sendHost.replaceChildren(...btns);

    more.push(
      savePhotosButton(c),
      button({ label: 'Print or save as PDF', iconName: 'printer', variant: 'secondary', onClick: () => printElement(card), attrs: { 'data-needs-app': '' } }),
      button({ label: 'Download as a text file', iconName: 'download', variant: 'secondary', onClick: () => downloadText(`${letter.subject}\n\n${letter.body}\n`, `${safeFilename(c.place?.name)}-${kind}.txt`), attrs: { 'data-needs-app': '' } }),
    );
    moreHost.replaceChildren(...more.filter(Boolean));
  }

  function paint() {
    paintLetter();
    paintReviewTools();
    paintEdited();
    paintActions();
  }

  // Recipient address, remembered per kind of letter.
  let recipientField = null;
  if (EMAILABLE.has(kind)) {
    toInput = textInput({
      id: 'to', type: 'email', value: recipient, autocomplete: 'off',
      onInput: async (v) => {
        c.recipients = { ...(c.recipients || {}), [recipientKey]: v.trim() };
        if (recipientKey === 'business') c.contact = { ...(c.contact || {}), email: v.trim() };
        await putCase(c);
        paintActions();
      },
    });
    const hint = kind === 'news' ? 'One newsroom email at a time works best.' : kind === 'council' ? 'Use the links above to find your council member\'s email.' : kind === 'city' ? 'Or call 311 and read the report aloud.' : 'No email address? Print it and mail or hand-deliver it.';
    recipientField = field({ id: 'to', label: 'Send to (email address)', optional: true, hint, input: toInput });
  }

  // Tone only applies to the first request.
  const toneGroup = kind === 'request' ? choiceGroup({
    name: 'tone', legend: 'Tone', variant: 'segmented', legendClass: 'legend legend-small',
    options: [{ value: 'friendly', label: 'Friendly' }, { value: 'formal', label: 'Formal' }],
    value: tone,
    onChange: async (v) => {
      tone = v;
      c.letterTone = v;
      await putCase(c);
      if (!letter.edited) {
        letter = generate();
        paint();
      } else {
        toast('You changed this letter, so CurbCutter kept your version. Use "Go back to CurbCutter\'s draft" to start over in the new tone.');
      }
    },
  }) : null;

  // Photos can't ride along in an email link, so say which ways work, in one line.
  const photoCount = (c.photos || []).length;
  const photoHelp = photoCount && (EMAILABLE.has(kind) || isForm) ? h('p', { class: 'note-line photo-help' }, icon('camera', { size: 18 }),
    (() => {
      const them = photoCount === 1 ? 'it' : 'them';
      const yours = photoCount === 1 ? 'your photo' : `your ${photoCount} photos`;
      if (isForm) return `To attach ${yours} to the form, save ${them} to your phone first (under "More ways").`;
      return canShareText()
        ? `Email links can't carry photos. To include ${yours}, use "Share with photos."`
        : `Email links can't carry photos. Save ${yours} to your phone (under "More ways") and attach ${them} to your email.`;
    })()) : null;

  const where = {
    owner: ownerFinder(c),
    tdlr: tdlrPanel(c),
    doj: dojPanel(),
    city: cityPanel(c),
    council: councilPanel(c),
    news: newsPanel(c),
    script: scriptPanel(c),
  }[kind] || null;

  // ---------- Did you send it? ----------
  const sentHost = h('div', { class: 'recorder-host' });
  const eventType = LETTER_EVENT[kind];
  const sent = eventType ? h('section', { class: 'block sent', 'aria-labelledby': 'sent-h' },
    h('h2', { id: 'sent-h' }, kind === 'script' ? 'Did you talk to them?' : kind === 'thanks' ? 'Did you send your thanks?' : isForm ? 'Did you file it?' : 'Did you send it?'),
    button({
      label: `Yes: ${EVENT_TYPES[eventType].label}`,
      variant: 'secondary', iconName: 'check',
      onClick: () => {
        sentHost.replaceChildren(eventRecorder(c, eventType, {
          onSaved: () => ctx.navigate(`#/case/${c.id}`),
          onCancel: () => sentHost.replaceChildren(),
        }));
        sentHost.querySelector('input')?.focus();
      },
    }),
    sentHost,
  ) : null;

  paint();

  const step1 = h('section', { class: 'step', 'aria-labelledby': 'step1-h' },
    h('h2', { id: 'step1-h', class: 'step-title' }, isForm ? 'Step 1: Read your summary' : 'Step 1: Read it over'),
    h('p', { class: 'hint' }, 'CurbCutter wrote this from your report. Change any words you want.'),
    toneGroup,
    reviewHost,
    card,
    editedHost,
  );

  const step2 = h('section', { class: 'step', 'aria-labelledby': 'step2-h' },
    h('h2', { id: 'step2-h', class: 'step-title' }, STEP2_TITLE[kind] || 'Step 2: Send it'),
    h('p', { class: 'hint' }, STEP2_INTRO[kind] || 'It goes out under your name. Nothing is sent until you tap a button below.'),
    kind === 'script' ? null : where,
    recipientField,
    kind === 'script' ? where : null,
    sendHost,
    photoHelp,
    fold({ title: 'More ways', sub: 'Copy, print, download, or save photos.', className: 'more-ways' }, moreHost),
  );

  const node = h('div', { class: 'screen letter-screen' },
    h('p', { class: 'back' }, h('a', { href: `#/case/${c.id}` }, icon('left', { size: 18 }), `Back to ${c.place?.name || 'the case'}`)),
    h('header', { class: 'page-head' },
      h('p', { class: 'eyebrow' }, `To: ${meta.to}`),
      h('h1', { id: 'page-title', tabindex: '-1' }, meta.title),
      h('p', { class: 'lede' }, meta.purpose),
    ),
    step1,
    step2,
    kind === 'summary' ? sourceList((c.barriers || []).flatMap((id) => barrier(id)?.cites || []), { title: 'Sources in this record' }) : null,
    sent,
    h('p', { class: 'fine' }, 'CurbCutter shares general information, not legal advice.'),
  );

  return { title: `${meta.title}: ${c.place?.name || 'case'}`, node };
}
