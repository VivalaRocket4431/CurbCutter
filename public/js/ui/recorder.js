// Inline form for recording what happened ("I sent it", "They replied", "It's fixed").
// After saving, offers a calendar reminder for the next check-in.

import { h, icon, uid } from './dom.js';
import { button, field, textInput, textArea, choiceGroup, toast } from './components.js';
import { EVENT_TYPES, withEvent } from '../lib/events.js';
import { putCase } from '../lib/store.js';
import { todayISO, longDate, relativeDays } from '../lib/dates.js';
import { reminderICS, googleCalendarURL } from '../lib/ics.js';
import { downloadText } from '../lib/share.js';
import { externalLink } from './components.js';

function reminderTitle(c) {
  return `CurbCutter: check on ${c.place?.name || 'your accessibility request'}`;
}

export function calendarButton(c, { variant = 'secondary', label = 'Add to my calendar' } = {}) {
  const ics = button({ label, iconName: 'calendar', variant, attrs: { 'data-needs-app': '' } });
  ics.addEventListener('click', () => {
    downloadText(reminderICS({ uid: `${c.id}-${c.nextCheck}`, dateISO: c.nextCheck, title: reminderTitle(c), description: 'Open CurbCutter to see the next step for this case.' }), 'curbcutter-reminder.ics', 'text/calendar');
    toast('Calendar file downloaded. Open it to add the reminder.', { tone: 'good' });
  });
  return ics;
}

export function reminderPanel(c, { headingLevel = 3 } = {}) {
  if (!c.nextCheck) return null;
  const H = `h${headingLevel}`;
  const title = reminderTitle(c);
  const ics = calendarButton(c);
  return h('div', { class: 'reminder' },
    h(H, { class: 'reminder-title' }, icon('calendar'), `Check back ${longDate(c.nextCheck)}`),
    h('p', { class: 'hint' }, `That's ${relativeDays(c.nextCheck)}. A reminder helps you keep the momentum.`),
    h('div', { class: 'btn-row' },
      ics,
      externalLink(googleCalendarURL({ dateISO: c.nextCheck, title }), 'Use Google Calendar instead', { class: 'ext btn btn-quiet' }),
    ),
  );
}

// type: an EVENT_TYPES key. onSaved(newCase) is called after saving.
// letter: a function returning { kind, subject, body }, read at the moment of saving.
export function eventRecorder(c, type, { onSaved, onCancel, intro, letter } = {}) {
  const meta = EVENT_TYPES[type];
  const id = uid('rec');
  let outcome = '';
  const date = h('input', { id: `${id}-date`, type: 'date', class: 'input input-date', value: todayISO(), max: todayISO() });
  const note = textArea({ id: `${id}-note`, rows: 3 });
  const ref = meta.refLabel ? textInput({ id: `${id}-ref` }) : null;

  const panel = h('div', { class: 'recorder', role: 'group', 'aria-labelledby': `${id}-h` });
  const save = button({ label: 'Save', variant: 'primary', iconName: 'check' });
  const cancel = button({ label: 'Cancel', variant: 'quiet' });
  cancel.addEventListener('click', () => onCancel?.());

  save.addEventListener('click', async () => {
    const next = withEvent(c, { type, date: date.value || todayISO(), note: note.value, ref: ref?.value || '', outcome, letter: typeof letter === 'function' ? letter() : letter });
    const saved = await putCase(next);
    toast(type === 'fixed' ? 'Wonderful. Marked as fixed!' : 'Saved to your timeline.', { tone: 'good' });
    const reminder = reminderPanel(saved);
    panel.replaceChildren(...[
      h('p', { class: 'recorder-done', tabindex: '-1' }, icon('check'), `${meta.past} on ${longDate(date.value || todayISO())}.`),
      reminder,
      button({ label: 'Done', variant: 'secondary', onClick: () => onSaved?.(saved) }),
    ].filter(Boolean));
    panel.querySelector('.recorder-done').focus();
    if (!reminder) onSaved?.(saved);
  });

  panel.append(
    h('h3', { id: `${id}-h`, class: 'recorder-title' }, meta.label),
    intro ? h('p', { class: 'hint' }, intro) : null,
    field({ id: `${id}-date`, label: 'Date', input: date }),
    type === 'reply' ? choiceGroup({
      name: `${id}-outcome`, legend: 'What did they say?',
      options: [
        { value: 'yes', label: 'They agreed to fix it' },
        { value: 'no', label: 'They said no, or not now' },
        { value: 'other', label: 'Something else' },
      ],
      onChange: (v) => { outcome = v; },
    }) : null,
    ref ? field({ id: `${id}-ref`, label: meta.refLabel, optional: true, input: ref }) : null,
    meta.noteLabel ? field({ id: `${id}-note`, label: meta.noteLabel, hint: meta.noteHint, optional: true, input: note }) : null,
    h('div', { class: 'btn-row' }, save, cancel),
  );
  return panel;
}
