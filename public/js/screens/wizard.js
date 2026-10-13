// The report wizard: one question per screen, saved as you go.

import { h, icon, debounce, uid } from '../ui/dom.js';
import { button, field, textInput, textArea, choiceGroup, toast, notice, externalLink, fold } from '../ui/components.js';
import { getCase, putCase, newId, putPhoto, listPhotos, deletePhoto } from '../lib/store.js';
import { getSettings, saveSettings } from '../lib/settings.js';
import { CATEGORIES, barrier, barriersIn, needsCalc, isCityOnly } from '../data/barriers.js';
import { METROS, metroName } from '../data/contacts.js';
import { TABLE_ROWS, FACILITY_TYPES, assessParking } from '../lib/parking.js';
import { compressPhoto, photoProblemText } from '../lib/photos.js';
import { currentPosition, metroFor, mapsLink } from '../lib/geo.js';
import { requestText } from '../lib/letters.js';
import { todayISO, longDate } from '../lib/dates.js';

const STEPS = [
  { id: 'place', title: 'Where is it?', stage: 'Document' },
  { id: 'barriers', title: 'What\'s the problem?', stage: 'Document' },
  { id: 'parking', title: 'Count the parking', stage: 'Document', when: (c) => needsCalc(c.barriers || []) },
  { id: 'details', title: 'Add details', stage: 'Document' },
  { id: 'photos', title: 'Add photos', stage: 'Document' },
  { id: 'story', title: 'How did it affect you?', stage: 'Document' },
  { id: 'request', title: 'What are you asking for?', stage: 'Ask' },
  { id: 'you', title: 'How to sign your letters', stage: 'Ask', when: (c) => !!c.askProfile },
  { id: 'review', title: 'Review your report', stage: 'Ask' },
];

export function activeSteps(c) {
  return STEPS.filter((s) => !s.when || s.when(c));
}

// The screen a draft stopped on, for "Continue: ..." on Home. No step counts: progress shows as 4 boxes.
export function stepLabel(c) {
  const steps = activeSteps(c);
  const i = Math.max(0, steps.findIndex((s) => s.id === c.step));
  return steps[i].title;
}

// Progress is always 4 numbered boxes, however many screens a report has. Each screen fills its share,
// so with 8 screens every screen fills half a box. It shows progress only; it isn't a menu.
const BOXES = 4;

function progressBoxes(idx, total) {
  const reached = (idx + 1) / total;
  const filled = Math.round(reached * BOXES * 1000) / 1000;
  const part = Math.min(BOXES, Math.max(1, Math.ceil(filled)));
  return h('div', {
    class: 'progress', role: 'progressbar', 'aria-label': 'Your progress',
    'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(Math.round(reached * 100)),
    'aria-valuetext': `Part ${part} of ${BOXES}`,
  }, Array.from({ length: BOXES }, (_, i) => {
    const share = Math.max(0, Math.min(1, filled - i));
    const fill = h('span', { class: 'progress-fill' });
    fill.style.width = `${share * 100}%`; // set through the style object, which the security policy allows
    return h('span', { class: `progress-box${i + 1 === part ? ' current' : ''}` },
      h('span', { class: 'progress-track' }, fill),
      h('span', { class: 'progress-num', 'aria-hidden': 'true' }, String(i + 1)),
    );
  }));
}

export async function renderNewCase(params, ctx) {
  const s = getSettings();
  const c = {
    id: newId('case'),
    createdAt: new Date().toISOString(),
    status: 'draft',
    step: 'place',
    place: { name: '', address: '', city: '', metro: s.metro || '' },
    barriers: [],
    notes: {},
    parking: { facility: 'standard' },
    date: todayISO(),
    impact: '',
    request: '',
    requestEdited: false,
    replyDays: s.replyDays || 14,
    contact: {},
    photos: [],
    events: [],
    letters: {},
    nextCheck: null,
    askProfile: !s.profile.name,
  };
  await putCase(c);
  ctx.navigate(`#/case/${c.id}/step/place`, { replace: true });
  return null;
}

function errorSummary(errors) {
  return h('div', { class: 'error-summary', role: 'alert', tabindex: '-1' },
    h('h2', null, icon('alert'), errors.length === 1 ? 'One thing to fix' : `${errors.length} things to fix`),
    h('ul', null, errors.map((e) => h('li', null,
      h('a', {
        href: `#${e.id}`,
        onclick: (ev) => {
          ev.preventDefault();
          const el = document.getElementById(e.id);
          el?.focus();
          el?.scrollIntoView({ block: 'center' });
        },
      }, e.message),
    ))),
  );
}

function numberStepper({ id, value, onChange, min = 0, max = 99999 }) {
  const input = h('input', {
    id, type: 'text', inputmode: 'numeric', pattern: '[0-9]*', class: 'input input-number',
    value: value ?? '', autocomplete: 'off',
  });
  const set = (n) => {
    const v = n === '' ? '' : String(Math.min(max, Math.max(min, n)));
    input.value = v;
    onChange(v);
  };
  input.addEventListener('input', () => {
    const digits = input.value.replace(/\D/g, '').slice(0, 5);
    if (digits !== input.value) input.value = digits;
    onChange(digits);
  });
  const minus = h('button', { type: 'button', class: 'stepper-btn', 'aria-label': 'Decrease', onclick: () => set(Math.max(min, (parseInt(input.value, 10) || 0) - 1)) }, '−');
  const plus = h('button', { type: 'button', class: 'stepper-btn', 'aria-label': 'Increase', onclick: () => set((parseInt(input.value, 10) || 0) + 1) }, '+');
  return { node: h('div', { class: 'stepper' }, minus, input, plus), input };
}

// ---------- Steps ----------

function stepPlace(c, api) {
  const nameErr = api.errorFor('place-name');
  const datalist = h('datalist', { id: 'city-options' },
    ['Dallas', 'Fort Worth', 'Arlington', 'Plano', 'Irving', 'Garland', 'Frisco', 'McKinney', 'Denton', 'Rockwall', 'Houston', 'Pasadena', 'Sugar Land', 'Pearland', 'Katy', 'The Woodlands', 'Conroe', 'San Antonio', 'New Braunfels', 'Austin', 'Round Rock', 'Georgetown', 'Pflugerville', 'Cedar Park', 'San Marcos']
      .map((x) => h('option', { value: x })));

  const locStatus = h('div', { class: 'loc-status', role: 'status', 'aria-live': 'polite' });
  const showLoc = () => {
    if (c.place.lat != null) {
      locStatus.replaceChildren(
        h('p', null, icon('check', { size: 18 }), `Location saved${c.place.accuracy ? ` (within about ${Math.round(c.place.accuracy)} meters)` : ''}. `),
        externalLink(mapsLink({ lat: c.place.lat, lng: c.place.lng }), 'Check it on a map'),
      );
    }
  };
  showLoc();
  const locBtn = button({ label: 'Use my location', iconName: 'locate', variant: 'secondary' });
  locBtn.addEventListener('click', async () => {
    locStatus.replaceChildren(h('p', null, 'Finding your location...'));
    try {
      const pos = await currentPosition();
      const metro = metroFor(pos);
      api.update((x) => {
        x.place.lat = pos.lat;
        x.place.lng = pos.lng;
        x.place.accuracy = pos.accuracy;
        if (metro && metro !== 'outside') x.place.metro = metro;
      });
      if (metro && metro !== 'outside') saveSettings({ metro });
      api.rerender('place-name');
      if (metro === 'outside') toast('That location looks outside Texas. CurbCutter\'s rules and contacts are for Texas.', { tone: 'bad' });
    } catch (err) {
      locStatus.replaceChildren(h('p', { class: 'error-text' }, icon('alert', { size: 18 }), err.message));
    }
  });

  const node = h('div', { class: 'stack' },
    field({
      id: 'place-name', label: 'Business or place name', hint: 'For example: Main Street Grocery', error: nameErr,
      input: textInput({ id: 'place-name', value: c.place.name, onInput: (v) => api.update((x) => { x.place.name = v; }) }),
    }),
    field({
      id: 'place-address', label: 'Street address or nearest corner', optional: true, hint: 'For example: 1200 Elm St, or Main St and 5th St',
      input: textInput({ id: 'place-address', value: c.place.address, onInput: (v) => api.update((x) => { x.place.address = v; }) }),
    }),
    field({
      id: 'place-city', label: 'City', optional: true,
      input: textInput({ id: 'place-city', value: c.place.city, attrs: { list: 'city-options', autocapitalize: 'words' }, onInput: (v) => api.update((x) => { x.place.city = v; }) }),
    }),
    datalist,
    h('div', { class: 'loc' }, locBtn, locStatus),
    choiceGroup({
      name: 'metro', legend: 'Which area is it in?',
      options: METROS.map((m) => ({ value: m.id, label: m.name })),
      value: c.place.metro || null,
      columns: 2, variant: 'compact',
      onChange: (v) => { api.update((x) => { x.place.metro = v; }); saveSettings({ metro: v }); },
    }),
  );
  return {
    node,
    validate: () => (!c.place.name.trim() && !c.place.address.trim()
      ? [{ id: 'place-name', message: 'Enter the business name or the address.' }]
      : []),
  };
}

function stepBarriers(c, api) {
  const err = api.errorFor('barrier-first');
  const groups = CATEGORIES.map((cat) => choiceGroup({
    name: `barrier-${cat.id}`,
    legend: cat.id === 'other' ? 'Not on the list?' : cat.title,
    multiple: true,
    variant: 'compact',
    options: barriersIn(cat.id).map((b) => ({ value: b.id, label: b.title })),
    value: c.barriers.filter((id) => barrier(id).cat === cat.id),
    onChange: (vals) => api.update((x) => {
      x.barriers = [...x.barriers.filter((id) => barrier(id).cat !== cat.id), ...vals];
    }),
  }));
  const node = h('div', { class: 'stack' },
    h('p', { class: 'intro' }, 'Check everything you noticed. You can pick more than one.'),
    err ? h('p', { class: 'error-text', id: 'barrier-first', tabindex: '-1' }, icon('alert', { size: 18 }), err) : h('span', { id: 'barrier-first', tabindex: '-1' }),
    h('div', { class: 'check-groups' }, groups),
  );
  return {
    node,
    validate: () => (c.barriers.length ? [] : [{ id: 'barrier-first', message: 'Pick at least one problem.' }]),
  };
}

function stepParking(c, api) {
  const p = c.parking || (c.parking = { facility: 'standard' });
  const result = h('div', { class: 'calc-result', role: 'status', 'aria-live': 'polite' });

  const renderResult = () => {
    const a = assessParking(p);
    if (!a.known) {
      result.replaceChildren(h('p', { class: 'calc-empty' }, icon('info', { size: 20 }), 'Enter the total number of spaces (or pick a range) to see what the rules require.'));
      return;
    }
    const rows = [
      h('div', { class: 'calc-row' }, h('span', null, 'Required'), h('strong', null, `${a.required} accessible`), h('span', { class: 'calc-sub' }, `including ${a.vanRequired} van-accessible`)),
    ];
    if (a.accessible != null) {
      rows.push(h('div', { class: 'calc-row' }, h('span', null, 'You counted'), h('strong', null, `${a.accessible} accessible`), a.van != null ? h('span', { class: 'calc-sub' }, `${a.van} van-accessible`) : null));
    }
    let verdict = null;
    if (a.shortBy != null) {
      verdict = a.meets
        ? h('p', { class: 'calc-verdict ok' }, icon('check', { size: 20 }), 'That meets the minimum count. Other problems, like signs or stripes, can still apply.')
        : h('p', { class: 'calc-verdict short' }, icon('alert', { size: 20 }),
          [a.shortBy > 0 ? `Missing ${a.shortBy} accessible ${a.shortBy === 1 ? 'space' : 'spaces'}` : null,
            a.vanShortBy > 0 ? `${a.vanShortBy} van-accessible ${a.vanShortBy === 1 ? 'space' : 'spaces'}` : null].filter(Boolean).join(' and ') + '.');
    }
    result.replaceChildren(...[
      h('p', { class: 'calc-title' }, `For a lot with ${a.totalLabel} spaces`),
      ...rows,
      verdict,
      h('p', { class: 'calc-how' }, h('a', { href: '#/rights/parking-count' }, 'How this is calculated')),
    ].filter(Boolean));
  };

  const total = numberStepper({
    id: 'park-total', value: p.total ?? '',
    onChange: (v) => {
      api.update((x) => { x.parking.total = v; if (v !== '') x.parking.totalRange = null; });
      rangeHost.querySelectorAll('input').forEach((i) => { if (v !== '') i.checked = false; });
      renderResult();
    },
  });

  const rangeHost = choiceGroup({
    name: 'park-range', legend: 'Not sure of the exact count? Pick a range',
    legendClass: 'legend legend-small',
    options: TABLE_ROWS.map((r, i) => ({ value: i, label: `${r.min} to ${r.max} spaces` })),
    value: p.totalRange ?? null,
    columns: 2, variant: 'compact',
    onChange: (i) => {
      api.update((x) => { x.parking.totalRange = i; x.parking.total = ''; });
      total.input.value = '';
      renderResult();
    },
  });

  const acc = numberStepper({ id: 'park-accessible', value: p.accessible ?? '', onChange: (v) => { api.update((x) => { x.parking.accessible = v; }); renderResult(); } });
  const van = numberStepper({ id: 'park-van', value: p.van ?? '', onChange: (v) => { api.update((x) => { x.parking.van = v; }); renderResult(); } });

  renderResult();
  const node = h('div', { class: 'stack' },
    h('p', { class: 'intro' }, 'Count only this lot. A close estimate is fine.'),
    field({ id: 'park-total', label: 'About how many parking spaces are in this lot?', hint: 'Include the accessible spaces.', input: total.node }),
    h('details', { class: 'explain', open: p.totalRange != null ? true : null }, h('summary', null, 'Not sure? Pick a range'), rangeHost),
    field({ id: 'park-accessible', label: 'How many accessible spaces did you see?', hint: 'Spaces with the wheelchair symbol, signed or painted.', input: acc.node }),
    field({ id: 'park-van', label: 'How many are marked "Van Accessible"?', input: van.node }),
    choiceGroup({
      name: 'facility', legend: 'What kind of place is this?', variant: 'compact',
      options: Object.entries(FACILITY_TYPES).map(([value, label]) => ({ value, label })),
      value: p.facility || 'standard',
      onChange: (v) => { api.update((x) => { x.parking.facility = v; }); renderResult(); },
    }),
    result,
  );
  return { node };
}

function stepDetails(c, api) {
  const cards = c.barriers.map((id) => {
    const b = barrier(id);
    const fid = `note-${id}`;
    const required = id === 'other' || id === 'path_city';
    const label = id === 'other' ? 'Describe the problem' : id === 'path_city' ? 'Where exactly is it, and what is wrong?' : 'Add a detail';
    const hint = id === 'other'
      ? 'For example: The ramp is blocked by a planter.'
      : id === 'path_city'
        ? 'For example: Northeast corner of Main St and 5th St has no curb ramp.'
        : 'For example: which space, how often, or a measurement.';
    return h('section', { class: 'detail-block' },
      h('h2', null, b.title),
      field({
        id: fid, label, hint, optional: !required, error: api.errorFor(fid),
        input: textArea({ id: fid, rows: 3, value: c.notes?.[id] || '', onInput: (v) => api.update((x) => { x.notes = { ...(x.notes || {}), [id]: v }; }) }),
      }),
    );
  });
  return {
    node: h('div', { class: 'stack' }, h('p', { class: 'intro' }, 'A detail or two makes your request specific. Skip anything you aren\'t sure about.'), ...cards),
    validate: () => {
      const errs = [];
      if (c.barriers.includes('other') && !(c.notes?.other || '').trim()) errs.push({ id: 'note-other', message: 'Describe the problem in a few words.' });
      if (c.barriers.includes('path_city') && !(c.notes?.path_city || '').trim()) errs.push({ id: 'note-path_city', message: 'Say where the sidewalk or corner is.' });
      return errs;
    },
  };
}

function stepPhotos(c, api) {
  const urls = [];
  api.onCleanup(() => urls.forEach((u) => URL.revokeObjectURL(u)));
  const grid = h('ul', { class: 'photo-grid' });
  const status = h('p', { class: 'photo-status', role: 'status', 'aria-live': 'polite' });
  // Problems stay on screen until the next try, so nobody has to catch a message that disappears.
  const problemHost = h('div', { class: 'photo-problem' });

  const renderGrid = async () => {
    const photos = (await listPhotos(c.id)).filter((p) => c.photos.includes(p.id));
    photos.sort((a, b) => c.photos.indexOf(a.id) - c.photos.indexOf(b.id));
    grid.replaceChildren(...photos.map((p, i) => {
      const url = URL.createObjectURL(p.blob);
      urls.push(url);
      const remove = h('button', { type: 'button', class: 'photo-remove' }, icon('trash', { size: 18 }), h('span', null, 'Remove'), h('span', { class: 'vh' }, ` photo ${i + 1}`));
      remove.addEventListener('click', async () => {
        await deletePhoto(p.id);
        api.update((x) => { x.photos = x.photos.filter((pid) => pid !== p.id); });
        api.flush();
        toast('Photo removed.');
        renderGrid();
      });
      return h('li', null, h('img', { src: url, alt: `Photo ${i + 1} of ${c.place.name || 'the barrier'}` }), remove);
    }));
    status.textContent = photos.length ? `${photos.length} ${photos.length === 1 ? 'photo' : 'photos'} saved.` : 'No photos yet.';
  };

  const addFiles = async (files) => {
    const list = [...files].slice(0, 12);
    if (!list.length) return;
    problemHost.replaceChildren();
    status.textContent = `Adding ${list.length === 1 ? 'photo' : `${list.length} photos`}...`;
    let added = 0;
    const problems = [];
    for (const f of list) {
      try {
        const { blob, width, height } = await compressPhoto(f);
        const id = newId('ph');
        await putPhoto({ id, caseId: c.id, blob, width, height, createdAt: new Date().toISOString() });
        api.update((x) => { x.photos = [...(x.photos || []), id]; });
        added += 1;
      } catch (e) {
        problems.push(photoProblemText(e));
      }
    }
    api.flush();
    if (added) toast(`${added === 1 ? 'Photo' : `${added} photos`} added.`, { tone: 'good' });
    if (problems.length) {
      problemHost.replaceChildren(notice({
        tone: 'bad',
        title: problems.length === 1 ? 'This photo couldn\'t be added' : `${problems.length} photos couldn't be added`,
        body: [...new Set(problems)],
      }));
    }
    renderGrid();
  };

  const fileButton = (label, iconName, attrs) => {
    const id = uid('file');
    const input = h('input', { id, type: 'file', accept: 'image/*', class: 'file-input', ...attrs });
    input.addEventListener('change', () => { addFiles(input.files); input.value = ''; });
    return h('div', { class: 'file-btn' }, input, h('label', { for: id, class: 'btn btn-secondary' }, icon(iconName), h('span', { class: 'btn-label' }, label)));
  };

  const tips = [...new Set(c.barriers.flatMap((id) => barrier(id).photoTips || []))].slice(0, 5);
  renderGrid();
  return {
    node: h('div', { class: 'stack' },
      h('p', { class: 'intro' }, 'Photos make a report convincing. They\'re optional, and you can add more later.'),
      h('div', { class: 'btn-pair' },
        fileButton('Take a photo', 'camera', { capture: 'environment' }),
        fileButton('Choose photos', 'image', { multiple: true }),
      ),
      problemHost,
      status,
      grid,
      tips.length ? fold({ title: 'What to photograph' }, h('ul', { class: 'prose-list' }, tips.map((t) => h('li', null, t)))) : null,
      h('p', { class: 'note-line photo-note' }, icon('info', { size: 18 }), 'Photos stay inside CurbCutter on this phone, with their location data removed. They don\'t go into your phone\'s photo library, and you can save them there later.'),
    ),
  };
}

const IMPACT_CHIPS = [
  'I could not get out of my vehicle safely.',
  'I had to park far away and travel a long distance.',
  'I could not get through the door.',
  'I left without shopping.',
  'I had to ask a stranger for help.',
  'I was at risk of falling.',
];

function stepStory(c, api) {
  const ta = textArea({ id: 'impact', rows: 5, value: c.impact, onInput: (v) => api.update((x) => { x.impact = v; }) });
  const chips = h('div', { class: 'chips', role: 'group', 'aria-label': 'Add a common sentence' },
    IMPACT_CHIPS.map((t) => h('button', {
      type: 'button', class: 'chip-btn',
      onclick: () => {
        const cur = ta.value.trim();
        if (cur.includes(t)) return;
        ta.value = cur ? `${cur} ${t}` : t;
        api.update((x) => { x.impact = ta.value; });
        toast('Added.');
      },
    }, icon('plus', { size: 16 }), t)));
  const date = h('input', { id: 'visit-date', type: 'date', class: 'input input-date', value: c.date || todayISO(), max: todayISO() });
  date.addEventListener('change', () => api.update((x) => { x.date = date.value || todayISO(); }));
  return {
    node: h('div', { class: 'stack' },
      field({ id: 'visit-date', label: 'When did you find this?', input: date }),
      field({
        id: 'impact', label: 'How did it affect you?', optional: true,
        hint: 'Your own words make a request more convincing. Share only what you are comfortable sharing.',
        input: ta,
      }),
      h('p', { class: 'chips-label' }, 'Tap to add a sentence:'),
      chips,
    ),
  };
}

function stepRequest(c, api) {
  const suggested = () => requestText({ ...c, request: '' });
  const ta = textArea({ id: 'request', rows: 6, value: c.requestEdited ? c.request : suggested(), onInput: (v) => api.update((x) => { x.request = v; x.requestEdited = true; }) });
  const reset = button({ label: 'Use the suggested wording', iconName: 'left', variant: 'quiet' });
  reset.addEventListener('click', () => {
    ta.value = suggested();
    api.update((x) => { x.request = ''; x.requestEdited = false; });
    toast('Suggested wording restored.');
  });
  const cityOnly = isCityOnly(c.barriers);
  return {
    node: h('div', { class: 'stack' },
      h('p', { class: 'intro' }, 'CurbCutter wrote this from what you picked. Change anything you like.'),
      field({ id: 'request', label: cityOnly ? 'What should the city fix?' : 'What should the business change?', input: ta }),
      reset,
      choiceGroup({
        name: 'reply-days', legend: 'How long should they have to reply?', variant: 'compact',
        hint: 'A reply or a plan by this date, not a finished fix.',
        options: [{ value: 7, label: '1 week' }, { value: 14, label: '2 weeks (most common)' }, { value: 30, label: '30 days' }],
        value: c.replyDays || 14,
        onChange: (v) => { api.update((x) => { x.replyDays = Number(v); }); saveSettings({ replyDays: Number(v) }); },
      }),
    ),
  };
}

function profileFields(onChange) {
  const p = getSettings().profile;
  const upd = (key) => (v) => { saveSettings({ profile: { [key]: v } }); onChange?.(); };
  return [
    field({ id: 'me-name', label: 'Your name', hint: 'Shown at the end of your letters. A first name is fine.', input: textInput({ id: 'me-name', value: p.name, autocomplete: 'name', onInput: upd('name') }) }),
    field({ id: 'me-email', label: 'Your email', optional: true, hint: 'So the business can reply to you.', input: textInput({ id: 'me-email', type: 'email', value: p.email, autocomplete: 'email', onInput: upd('email') }) }),
    field({ id: 'me-phone', label: 'Your phone', optional: true, input: textInput({ id: 'me-phone', type: 'tel', value: p.phone, autocomplete: 'tel', onInput: upd('phone') }) }),
    field({ id: 'me-city', label: 'The city you live in', optional: true, hint: 'Used in letters to your council member and to reporters.', input: textInput({ id: 'me-city', value: p.city, autocomplete: 'address-level2', onInput: upd('city') }) }),
    choiceGroup({
      name: 'me-who', legend: 'Which describes you?', variant: 'compact',
      hint: 'This changes the first sentence of your letters.',
      options: [
        { value: 'self', label: 'I have a disability' },
        { value: 'helper', label: 'I\'m helping a family member with a disability' },
        { value: 'ally', label: 'I\'m an ally or advocate' },
        { value: 'none', label: 'I\'d rather not say' },
      ],
      value: p.who || 'self',
      onChange: (v) => { saveSettings({ profile: { who: v } }); onChange?.(); },
    }),
  ];
}

export { profileFields };

function stepYou() {
  return {
    node: h('div', { class: 'stack' },
      h('p', { class: 'intro' }, 'CurbCutter saves this on your phone and uses it in every letter. You can change it any time in Settings.'),
      ...profileFields(),
    ),
  };
}

function reviewSection(title, stepId, c, ...content) {
  return h('section', { class: 'review-sec' },
    h('div', { class: 'review-head' },
      h('h2', null, title),
      h('a', { href: `#/case/${c.id}/step/${stepId}`, class: 'review-edit' }, icon('edit', { size: 18 }), 'Change', h('span', { class: 'vh' }, ` ${title.toLowerCase()}`)),
    ),
    ...content,
  );
}

function stepReview(c) {
  const a = assessParking(c.parking);
  const p = getSettings().profile;
  const steps = activeSteps(c).map((s) => s.id);
  return {
    node: h('div', { class: 'stack' },
      h('p', { class: 'intro' }, 'Check that it looks right. Next, CurbCutter drafts your letter, and you can change any of it before you send it.'),
      reviewSection('Place', 'place', c,
        h('p', null, h('strong', null, c.place.name || 'No name'), c.place.address ? h('br') : null, c.place.address || null, c.place.city ? `, ${c.place.city}` : null),
        h('p', { class: 'hint' }, metroName(c.place.metro)),
      ),
      reviewSection('Problems', 'barriers', c,
        h('ul', { class: 'review-list' }, c.barriers.map((id) => h('li', null, barrier(id).title, c.notes?.[id] ? h('p', { class: 'hint' }, c.notes[id]) : null))),
      ),
      steps.includes('parking') && a.known ? reviewSection('Parking count', 'parking', c,
        h('p', null, `Required: at least ${a.required} accessible (${a.vanRequired} van-accessible). ${a.accessible != null ? `You counted ${a.accessible}${a.van != null ? ` (${a.van} van)` : ''}.` : ''}`),
      ) : null,
      reviewSection('Photos', 'photos', c, h('p', null, c.photos.length ? `${c.photos.length} ${c.photos.length === 1 ? 'photo' : 'photos'}` : 'No photos yet. You can add them later.')),
      reviewSection('What happened', 'story', c,
        h('p', null, `Found on ${longDate(c.date)}.`),
        c.impact ? h('p', null, c.impact) : null,
      ),
      reviewSection('Your request', 'request', c, h('p', { class: 'pre' }, c.requestEdited ? c.request : requestText({ ...c, request: '' }))),
      !p.name ? notice({ tone: 'warn', title: 'Your letters are not signed yet', body: h('p', null, h('a', { href: '#/settings' }, 'Add your name in Settings'), ' so businesses know who is asking.') }) : null,
    ),
  };
}

const RENDERERS = {
  place: stepPlace,
  barriers: stepBarriers,
  parking: stepParking,
  details: stepDetails,
  photos: stepPhotos,
  story: stepStory,
  request: stepRequest,
  you: stepYou,
  review: stepReview,
};

export async function renderWizard(params, ctx) {
  const c = await getCase(params.id);
  if (!c) {
    return {
      title: 'Report not found',
      node: h('section', { class: 'screen' }, h('h1', { id: 'page-title', tabindex: '-1' }, 'We could not find that report'), button({ label: 'Go to Home', href: '#/', variant: 'primary' })),
    };
  }
  let steps = activeSteps(c);
  let idx = steps.findIndex((s) => s.id === params.step);
  if (idx < 0) {
    ctx.navigate(`#/case/${c.id}/step/${steps[0].id}`, { replace: true });
    return null;
  }
  const step = steps[idx];
  const editing = c.status !== 'draft';
  if (!editing && c.step !== step.id) {
    c.step = step.id;
    await putCase(c);
  }

  const save = debounce(() => putCase(c), 350);
  const cleanups = [];
  let errors = [];
  const wizardState = {};

  const api = {
    state: wizardState,
    update(fn) {
      fn(c);
      save();
      // An error stays on screen only while it's still true.
      if (errors.length && current?.validate && !current.validate().length) clearErrors();
    },
    flush() { save.flush(); },
    errorFor(id) { return errors.find((e) => e.id === id)?.message || null; },
    onCleanup(fn) { cleanups.push(fn); },
    rerender(focusId) { renderStep(focusId); },
  };

  const host = h('div', { class: 'step-host' });
  const summaryHost = h('div');
  let current = null;

  function clearErrors() {
    errors = [];
    summaryHost.replaceChildren();
    host.querySelectorAll('.error-text').forEach((el) => el.remove());
    host.querySelectorAll('[aria-invalid]').forEach((el) => el.removeAttribute('aria-invalid'));
    host.querySelectorAll('.field-error').forEach((el) => el.classList.remove('field-error'));
  }

  function renderStep(focusId) {
    current = RENDERERS[step.id](c, api);
    host.replaceChildren(current.node);
    if (focusId) document.getElementById(focusId)?.focus();
  }
  renderStep();

  steps = activeSteps(c);
  idx = steps.findIndex((s) => s.id === step.id);
  const total = steps.length;

  const progress = progressBoxes(idx, total);

  const goNext = async () => {
    errors = current.validate ? current.validate() : [];
    if (errors.length) {
      renderStep();
      summaryHost.replaceChildren(errorSummary(errors));
      summaryHost.querySelector('.error-summary').focus();
      return;
    }
    save.flush();
    const fresh = activeSteps(c);
    const at = fresh.findIndex((s) => s.id === step.id);
    if (step.id === 'review') {
      if (!editing) {
        c.status = 'open';
        c.step = null;
        c.events = [...(c.events || []), { id: newId('ev'), type: 'documented', date: c.date || todayISO() }];
        if (!c.requestEdited) c.request = '';
        await putCase(c);
        toast('Report saved. Next: ask for the fix.', { tone: 'good' });
      } else {
        await putCase(c);
        toast('Changes saved.', { tone: 'good' });
      }
      ctx.navigate(`#/case/${c.id}`);
      return;
    }
    const next = fresh[at + 1] || fresh[fresh.length - 1];
    ctx.navigate(`#/case/${c.id}/step/${next.id}`);
  };

  const goBack = () => {
    save.flush();
    if (idx === 0) ctx.navigate(editing ? `#/case/${c.id}` : '#/');
    else ctx.navigate(`#/case/${c.id}/step/${steps[idx - 1].id}`);
  };

  const isLast = step.id === 'review';
  const nextBtn = button({ label: isLast ? (editing ? 'Save changes' : 'Save report') : 'Next', iconName: isLast ? 'check' : 'right', iconAfter: !isLast, variant: 'primary', attrs: { 'data-testid': 'wizard-next' } });
  nextBtn.addEventListener('click', goNext);
  const backBtn = button({ label: idx === 0 ? 'Cancel' : 'Back', iconName: 'left', variant: 'secondary', attrs: { 'data-testid': 'wizard-back' } });
  backBtn.addEventListener('click', goBack);

  const later = h('a', {
    href: editing ? `#/case/${c.id}` : '#/',
    class: 'later',
    onclick: () => { save.flush(); if (!editing) toast('Saved. You can finish it later from Home.', { tone: 'good' }); },
  }, editing ? 'Back to the case' : 'Save and finish later');

  const node = h('div', { class: 'screen wizard' },
    h('div', { class: 'wizard-head' },
      progress,
      h('p', { class: 'wizard-meta' }, later),
    ),
    h('h1', { id: 'page-title', tabindex: '-1' }, step.title),
    idx === 0 && !editing ? h('p', { class: 'autosave' }, icon('check', { size: 16 }), 'Your answers save as you go.') : null,
    summaryHost,
    host,
    h('div', { class: 'wizard-actions' }, backBtn, nextBtn),
  );

  return {
    title: step.title,
    node,
    hideNav: true,
    cleanup: () => { save.flush(); cleanups.forEach((fn) => fn()); },
  };
}
