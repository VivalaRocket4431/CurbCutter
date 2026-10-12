import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeLetter, LETTER_KINDS, requestText, tdlrFields, caseTitle } from '../../public/js/lib/letters.js';
import { BARRIERS } from '../../public/js/data/barriers.js';

const profile = { name: 'Alex Rivera', email: 'alex@example.com', phone: '214-555-0100', who: 'self', city: 'Dallas' };

function baseCase(over = {}) {
  return {
    id: 'case_test',
    status: 'open',
    place: { name: 'Main Street Grocery', address: '1200 Elm St', city: 'Dallas', metro: 'dfw' },
    barriers: ['parking_too_few', 'parking_no_van', 'parking_sign'],
    notes: { parking_sign: 'The only accessible space has no sign.' },
    parking: { total: '120', accessible: '2', van: '0', facility: 'standard' },
    date: '2026-10-04',
    impact: 'I could not get out of my van safely, so I left.',
    request: '',
    replyDays: 14,
    photos: ['p1', 'p2'],
    events: [
      { id: 'e1', type: 'documented', date: '2026-10-04' },
      { id: 'e2', type: 'asked', date: '2026-10-05' },
    ],
    ...over,
  };
}

const BAD = /\bundefined\b|\bnull\b|NaN|\[object Object\]/;

test('every letter kind renders cleanly for a full case', () => {
  for (const kind of Object.keys(LETTER_KINDS)) {
    const l = makeLetter(kind, baseCase(), profile, { sources: [{ title: 'Source', url: 'https://example.gov' }] });
    assert.ok(l.subject.length > 5, `${kind} subject`);
    assert.ok(l.body.length > 40, `${kind} body`);
    assert.doesNotMatch(l.subject + l.body, BAD, kind);
  }
});

test('every letter kind renders for a nearly empty case and every profile type', () => {
  const sparse = { id: 'c', status: 'open', place: {}, barriers: ['other'], notes: {}, parking: {}, events: [], photos: [] };
  for (const who of ['self', 'helper', 'ally', 'none', undefined]) {
    for (const kind of Object.keys(LETTER_KINDS)) {
      const l = makeLetter(kind, sparse, { who });
      assert.doesNotMatch(l.subject + l.body, BAD, `${kind}/${who}`);
    }
  }
});

test('every barrier renders in a request letter without errors', () => {
  for (const b of BARRIERS) {
    const c = baseCase({ barriers: [b.id], notes: { [b.id]: 'Detail here.' } });
    const l = makeLetter('request', c, profile);
    assert.doesNotMatch(l.body, BAD, b.id);
  }
});

test('request letter cites the rule, the parking math, and help for the business', () => {
  const { subject, body } = makeLetter('request', baseCase(), profile);
  assert.match(subject, /Main Street Grocery/);
  assert.match(body, /Table 208\.2/);
  assert.match(body, /at least 5 accessible spaces/);
  assert.match(body, /681\.011\(f-2\)/);
  assert.match(body, /Southwest ADA Center \(713-797-7171\)/);
  assert.match(body, /federal tax incentives may help \(IRS Form 8826 and tax code Section 190\)/);
  assert.match(body, /readily achievable in most cases/);
  assert.match(body, /Alex Rivera/);
  assert.match(body, /I have 2 photos I can share\./);
  // Never asks for money.
  assert.doesNotMatch(body, /\bpay me\b|compensation|settlement|damages/i);
});

test('help with the cost is one short line near the end, with no dollar amounts', () => {
  for (const kind of ['request', 'followup', 'final', 'owner']) {
    const { body } = makeLetter(kind, baseCase(), profile);
    const help = body.indexOf('federal tax incentives may help');
    assert.ok(help > 0, `${kind}: help line missing`);
    assert.equal(body.match(/federal tax incentives/g).length, 1, `${kind}: help line repeated`);
    assert.ok(help > body.indexOf('by ') && help < body.lastIndexOf('Alex Rivera'), `${kind}: help line should come after the reply date and before the signature`);
    assert.doesNotMatch(body, /Help for your business|\$5,000|\$15,000/, `${kind}: old help block or dollar amounts`);
  }
});

test('the DOJ restriping quote appears once, not twice', () => {
  const { body } = makeLetter('request', baseCase(), profile);
  assert.equal(body.match(/readily achievable in most cases/g).length, 1);
});

test('formal tone changes the greeting and sign-off', () => {
  const f = makeLetter('request', baseCase({ contact: { name: 'Ms. Lee' } }), profile, { tone: 'formal' }).body;
  assert.match(f, /^Dear Ms\. Lee,/);
  assert.match(f, /Sincerely,/);
  const friendly = makeLetter('request', baseCase(), profile).body;
  assert.match(friendly, /^Hello,/);
  assert.match(friendly, /Best regards,/);
});

test('TDLR summary always fits the 1,000-character form limit', () => {
  const long = 'x'.repeat(900);
  const c = baseCase({
    barriers: BARRIERS.filter((b) => b.cat !== 'path').map((b) => b.id),
    notes: Object.fromEntries(BARRIERS.map((b) => [b.id, long])),
    place: { name: 'A very long business name '.repeat(5), address: '123 Long Street Name '.repeat(5), city: 'Dallas' },
  });
  const { body } = makeLetter('tdlr', c, profile);
  assert.ok(body.length <= 1000, `length was ${body.length}`);
  assert.match(body, /Texas Architectural Barriers Act/);
});

test('TDLR form fields are ready to copy', () => {
  const f = tdlrFields(baseCase());
  assert.deepEqual(f.map((x) => x.label), ['Program', 'Date of the incident', 'Company name (responsible party)', 'Street address', 'City', 'State']);
  assert.equal(f[0].value, 'Architectural Barriers');
  assert.equal(f[1].value, 'October 4, 2026');
});

test('a city-only problem turns the request into a city report', () => {
  const c = baseCase({ barriers: ['path_city'], notes: { path_city: 'NE corner of Main St and 5th St has no curb ramp' }, place: { name: '', address: 'Main St and 5th St', city: 'Dallas' } });
  const { subject, body } = makeLetter('request', c, profile);
  assert.match(subject, /Accessibility report/);
  assert.match(body, /35\.151\(i\)/);
  assert.doesNotMatch(body, /IRS Form 8826/);
  assert.doesNotMatch(body, /\.\./);
});

test('timeline-based letters use the recorded dates', () => {
  const c = baseCase({ events: [...baseCase().events, { id: 'e3', type: 'followed_up', date: '2026-10-20' }] });
  const fin = makeLetter('final', c, profile).body;
  assert.match(fin, /October 5, 2026: my first request/);
  assert.match(fin, /October 20, 2026: my follow-up/);
  const news = makeLetter('news', c, profile).body;
  assert.match(news, /October 5, 2026: Asked the business to fix it/);
  assert.match(news, /more than 1 in 4 U\.S\. adults have a disability/);
});

test('thank-you note includes a public post', () => {
  const c = baseCase({ status: 'resolved', events: [...baseCase().events, { id: 'f', type: 'fixed', date: '2026-11-01', note: 'Added a van-accessible space with a new sign' }] });
  const { body } = makeLetter('thanks', c, profile);
  assert.match(body, /added a van-accessible space with a new sign/);
  assert.match(body, /A short public post you can share/);
});

test('requestText uses the person\'s own words when they edited it', () => {
  assert.equal(requestText(baseCase({ request: 'Please add one van space.' })), 'Please add one van space.');
  assert.match(requestText(baseCase()), /^- Add accessible parking spaces/);
  assert.equal(caseTitle({ place: {} }), 'New report');
});
