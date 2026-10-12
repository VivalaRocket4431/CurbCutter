import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nextStep, statusLabel } from '../../public/js/lib/ladder.js';
import { withEvent, withoutEvent, nextCheckAfter } from '../../public/js/lib/events.js';

const TODAY = '2026-10-11';
const base = () => ({
  id: 'c', status: 'open', place: { name: 'Shop', address: '1 Main', metro: 'dfw' },
  barriers: ['parking_sign'], notes: {}, parking: {}, events: [{ id: 'd', type: 'documented', date: '2026-10-01' }], replyDays: 14, nextCheck: null,
});

test('walks the whole ladder in order', () => {
  let c = base();
  assert.equal(nextStep(c, TODAY).rung, 'ask');
  c = withEvent(c, { type: 'asked', date: '2026-10-02' });
  assert.equal(c.nextCheck, '2026-10-16');
  assert.equal(nextStep(c, TODAY).title, 'Wait for a reply');
  assert.equal(nextStep(c, '2026-10-16').rung, 'followup');
  c = withEvent(c, { type: 'followed_up', date: '2026-10-16' });
  assert.equal(nextStep(c, '2026-10-27').rung, 'owner');
  c = withEvent(c, { type: 'owner_contacted', date: '2026-10-27' });
  assert.equal(nextStep(c, '2026-11-11').rung, 'official');
  c = withEvent(c, { type: 'complaint_tdlr', date: '2026-11-11', ref: 'AB 123' });
  assert.equal(c.events.at(-1).ref, 'AB 123');
  assert.equal(nextStep(c, '2026-12-11').rung, 'allies');
  c = withEvent(c, { type: 'council_contacted', date: '2026-12-11' });
  assert.equal(nextStep(c, '2026-12-25').rung, 'media');
  c = withEvent(c, { type: 'fixed', date: '2027-01-05' });
  assert.equal(c.status, 'resolved');
  assert.equal(c.nextCheck, null);
  assert.equal(nextStep(c, '2027-01-05').title, 'Say thank you');
  c = withEvent(c, { type: 'thanked', date: '2027-01-06' });
  assert.equal(nextStep(c, '2027-01-06').title, 'You did it');
});

test('a "no" reply makes the follow-up due right away', () => {
  let c = withEvent(base(), { type: 'asked', date: '2026-10-02' });
  c = withEvent(c, { type: 'reply', date: '2026-10-05', outcome: 'no' });
  assert.equal(c.nextCheck, '2026-10-05');
  assert.equal(statusLabel(c, TODAY).label, 'Follow-up due');
});

test('a "yes" reply gives the business 30 days to finish', () => {
  assert.equal(nextCheckAfter('reply', '2026-10-05', base(), 'yes'), '2026-11-04');
});

test('city-only problems go to the city, not the business', () => {
  const c = { ...base(), barriers: ['path_city'] };
  const s = nextStep(c, TODAY);
  assert.equal(s.rung, 'official');
  assert.equal(s.actions[0].letter, 'city');
});

test('removing the "fixed" event reopens the case', () => {
  let c = withEvent(base(), { type: 'fixed', date: '2026-10-10' });
  const fixedId = c.events.at(-1).id;
  c = withoutEvent(c, fixedId);
  assert.equal(c.status, 'open');
});

test('drafts ask to finish the report', () => {
  const c = { ...base(), status: 'open', barriers: [] };
  assert.equal(nextStep(c, TODAY).rung, 'document');
});

test('a letter marked as sent keeps its exact text, even if the case changes later', () => {
  const letter = { kind: 'request', subject: 'Accessibility request for Shop', body: 'Hello,\n\nPlease add a sign.\n\nBest regards,\nAlex' };
  let c = withEvent(base(), { type: 'asked', date: '2026-10-02', letter });
  const ev = c.events.at(-1);
  assert.deepEqual(ev.letter, letter);
  letter.body = 'changed afterward';
  assert.equal(ev.letter.body, 'Hello,\n\nPlease add a sign.\n\nBest regards,\nAlex');
  c = withEvent(c, { type: 'note', date: '2026-10-03', note: 'Called the store', letter: { kind: 'request', subject: 'x', body: '' } });
  assert.equal(c.events.at(-1).letter, undefined, 'an empty letter is not saved');
});
