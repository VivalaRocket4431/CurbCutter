// Recording what happened on a case, and when to check back next.

import { addDays, todayISO } from './dates.js';
import { newId } from './store.js';

export const EVENT_TYPES = {
  documented: { label: 'Documented the problem', past: 'Documented' },
  asked: { label: 'I asked the business', past: 'Asked the business', noteLabel: 'Who did you ask, and how?', noteHint: 'For example: Emailed the store manager, Ana.' },
  reply: { label: 'They replied', past: 'The business replied', noteLabel: 'What did they say?' },
  followed_up: { label: 'I followed up', past: 'Followed up', noteLabel: 'How did you follow up?' },
  owner_contacted: { label: 'I contacted the owner or headquarters', past: 'Contacted the owner or headquarters', noteLabel: 'Who did you contact?' },
  complaint_tdlr: { label: 'I filed with TDLR', past: 'Filed a complaint with TDLR', refLabel: 'TDLR complaint number', noteLabel: 'Anything to remember?' },
  complaint_doj: { label: 'I filed with the U.S. Department of Justice', past: 'Filed a complaint with the U.S. Department of Justice', refLabel: 'Report number', noteLabel: 'Anything to remember?' },
  complaint_city: { label: 'I reported it to the city', past: 'Reported it to the city', refLabel: '311 request number', noteLabel: 'Anything to remember?' },
  allies_contacted: { label: 'I asked an advocacy group for help', past: 'Asked an advocacy group for help', noteLabel: 'Who did you contact?' },
  council_contacted: { label: 'I contacted my council member', past: 'Contacted a council member', noteLabel: 'Who did you contact?' },
  media_contacted: { label: 'I contacted local news', past: 'Contacted local news', noteLabel: 'Which newsroom?' },
  fixed: { label: 'It\'s fixed', past: 'Fixed', noteLabel: 'What did they fix?', noteHint: 'For example: added a van-accessible space with a new sign.' },
  thanked: { label: 'I thanked them', past: 'Thanked the business' },
  note: { label: 'Add a note', past: 'Update', noteLabel: 'What happened?' },
};

// Which event a letter creates when the user says "I sent it".
export const LETTER_EVENT = {
  request: 'asked',
  script: 'asked',
  followup: 'followed_up',
  final: 'followed_up',
  owner: 'owner_contacted',
  tdlr: 'complaint_tdlr',
  doj: 'complaint_doj',
  city: 'complaint_city',
  council: 'council_contacted',
  news: 'media_contacted',
  thanks: 'thanked',
};

// Days until the next check-in after each kind of event. null = no reminder.
export function nextCheckAfter(type, date, c, outcome) {
  switch (type) {
    case 'asked': return addDays(date, Number(c.replyDays) || 14);
    case 'reply':
      if (outcome === 'yes') return addDays(date, 30);
      if (outcome === 'no') return date;
      return addDays(date, 14);
    case 'followed_up': return addDays(date, 10);
    case 'owner_contacted': return addDays(date, 14);
    case 'complaint_tdlr':
    case 'complaint_doj':
    case 'complaint_city': return addDays(date, 30);
    case 'allies_contacted':
    case 'council_contacted':
    case 'media_contacted': return addDays(date, 14);
    case 'fixed':
    case 'thanked': return null;
    default: return undefined; // keep the current date
  }
}

// Returns a new case object with the event added.
export function withEvent(c, { type, date = todayISO(), note = '', ref = '', outcome = '' }) {
  const ev = { id: newId('ev'), type, date, note: note.trim() };
  if (ref) ev.ref = ref.trim();
  if (outcome) ev.outcome = outcome;
  const next = { ...c, events: [...(c.events || []), ev] };
  const check = nextCheckAfter(type, date, c, outcome);
  if (check !== undefined) next.nextCheck = check;
  if (type === 'fixed') next.status = 'resolved';
  return next;
}

export function withoutEvent(c, eventId) {
  const events = (c.events || []).filter((e) => e.id !== eventId);
  const next = { ...c, events };
  if (c.status === 'resolved' && !events.some((e) => e.type === 'fixed')) next.status = 'open';
  return next;
}
