// Letter and message templates. Pure functions: (kind, case, profile) -> { subject, body }.
// No AI and no network: the same facts always produce the same, checkable text.

import { barrier, isCityOnly } from '../data/barriers.js';
import { parkingSentence, assessParking } from './parking.js';
import { longDate, todayISO, addDays } from './dates.js';

export const LETTER_KINDS = {
  request: { title: 'Request letter', to: 'The business', purpose: 'Your first written request, drafted from your report.' },
  script: { title: 'What to say in person', to: 'Staff or a manager', purpose: 'A short, friendly script. You can also show it on your screen.' },
  followup: { title: 'Follow-up letter', to: 'The business', purpose: 'A polite reminder when the reply date passes.' },
  final: { title: 'Final request', to: 'The business', purpose: 'Your last request before filing complaints or contacting news.' },
  owner: { title: 'Letter to the owner or headquarters', to: 'Property owner, landlord, or corporate office', purpose: 'For when the store can\'t or won\'t fix it.' },
  tdlr: { title: 'TDLR complaint summary', to: 'Texas Department of Licensing and Regulation', purpose: 'Ready to paste into the state complaint form (under 1,000 characters).', limit: 1000 },
  doj: { title: 'U.S. Department of Justice complaint summary', to: 'U.S. Department of Justice', purpose: 'Ready to paste into the federal ADA complaint form.' },
  city: { title: 'City report (311 or ADA coordinator)', to: 'Your city', purpose: 'For sidewalks, curb ramps, and parking enforcement.' },
  council: { title: 'Letter to your city council member', to: 'Your council member', purpose: 'Elected officials can press a business to act.' },
  news: { title: 'News tip', to: 'Local reporters', purpose: 'A short pitch with your timeline and photos.' },
  thanks: { title: 'Thank-you note', to: 'The business', purpose: 'Say thanks when it\'s fixed, plus a short public post.' },
  summary: { title: 'Case record', to: 'Anyone helping you', purpose: 'Every fact, date, and source in one place.' },
};

// What to call each kind on screen: "Copy the letter", "Read the summary you filed".
export function letterNoun(kind) {
  if (kind === 'tdlr' || kind === 'doj') return 'summary';
  if (kind === 'script') return 'script';
  if (kind === 'summary') return 'record';
  return 'letter';
}

// The link from a timeline entry to the exact text that was sent.
export function sentLinkLabel(kind) {
  if (kind === 'script') return 'Read your script';
  if (kind === 'tdlr' || kind === 'doj') return 'Read the summary you filed';
  return `Read the ${letterNoun(kind)} you sent`;
}

const SWADA = 'the Southwest ADA Center (713-797-7171)';

function clean(s) {
  return String(s ?? '').replace(/\s+/g, ' ').trim();
}

function para(s) {
  return String(s ?? '').trim();
}

function list(items) {
  return items.filter(Boolean).map((t) => `- ${t}`).join('\n');
}

function joinWords(items) {
  const a = items.filter(Boolean);
  if (a.length <= 1) return a.join('');
  if (a.length === 2) return `${a[0]} and ${a[1]}`;
  return `${a.slice(0, -1).join(', ')}, and ${a[a.length - 1]}`;
}

function lower(s) {
  return s ? s.charAt(0).toLowerCase() + s.slice(1) : s;
}

function business(c) {
  return clean(c.place?.name) || 'this business';
}

function where(c) {
  const parts = [clean(c.place?.address), clean(c.place?.city)].filter(Boolean);
  return parts.join(', ');
}

function businessAndWhere(c) {
  const w = where(c);
  return w ? `${business(c)} at ${w}` : business(c);
}

function barrierIds(c) {
  return (c.barriers || []).filter((id) => barrier(id));
}

function barrierLines(c) {
  return barrierIds(c).map((id) => {
    const b = barrier(id);
    const note = clean(c.notes?.[id]);
    if (id === 'other') return note || 'An accessibility barrier (details below)';
    return note ? `${b.title}: ${note}` : b.title;
  });
}

function barrierPhrase(c) {
  const ids = barrierIds(c);
  if (!ids.length) return 'an accessibility problem';
  const names = ids.map((id) => (id === 'other' ? clean(c.notes?.other) || 'an accessibility barrier' : lower(barrier(id).title)));
  return joinWords(names);
}

function ruleLines(c) {
  const seen = new Set();
  const out = [];
  for (const id of barrierIds(c)) {
    const line = barrier(id).ruleShort;
    if (line && !seen.has(line)) {
      seen.add(line);
      out.push(line);
    }
  }
  return out;
}

function hasParking(c) {
  return barrierIds(c).some((id) => barrier(id).cat === 'parking');
}

function parkingLine(c) {
  return barrierIds(c).some((id) => barrier(id).usesCalc) ? parkingSentence(c.parking) : '';
}

export function requestText(c) {
  const own = para(c.request);
  if (own) return own;
  const fixes = barrierIds(c).map((id) => barrier(id).fix).filter(Boolean);
  if (!fixes.length) return 'Please fix this barrier so customers with disabilities can use your business.';
  return fixes.length === 1 ? fixes[0] : list(fixes);
}

function event(c, type) {
  return (c.events || []).filter((e) => e.type === type).sort((a, b) => (a.date < b.date ? -1 : 1));
}

function firstDate(c, type) {
  return event(c, type)[0]?.date || null;
}

function lastDate(c, type) {
  const e = event(c, type);
  return e.length ? e[e.length - 1].date : null;
}

function fixed(c) {
  return c.status === 'resolved' || event(c, 'fixed').length > 0;
}

function salutation(c, tone) {
  const who = clean(c.contact?.name);
  if (tone === 'formal') return `Dear ${who || 'Manager'},`;
  return `Hello${who ? ` ${who}` : ''},`;
}

function signoff(profile, tone = 'friendly') {
  const lines = [tone === 'formal' ? 'Sincerely,' : 'Best regards,'];
  lines.push(clean(profile?.name) || '[Your name]');
  if (clean(profile?.email)) lines.push(clean(profile.email));
  if (clean(profile?.phone)) lines.push(clean(profile.phone));
  return lines.join('\n');
}

function visitDate(c) {
  return longDate(c.date) || longDate(todayISO());
}

function opening(c, profile, tone) {
  const who = profile?.who || 'self';
  const when = visitDate(c);
  const at = businessAndWhere(c);
  const formal = tone === 'formal';
  if (who === 'self') return formal ? `I am a customer with a disability, and I visited ${at} on ${when}.` : `I'm a customer with a disability, and I visited ${at} on ${when}.`;
  if (who === 'helper') return formal ? `I am writing on behalf of a family member with a disability. We visited ${at} on ${when}.` : `I'm writing on behalf of a family member with a disability. We visited ${at} on ${when}.`;
  if (who === 'ally') return `As a member of the community who cares about accessibility, I visited ${at} on ${when}.`;
  return `I visited ${at} on ${when}.`;
}

function impactBlock(c, profile) {
  const text = para(c.impact);
  if (!text) return '';
  const label = profile?.who === 'helper' ? 'How it affected us' : 'How it affected me';
  return `${label}:\n${text}`;
}

// One short sentence near the end: help with the cost exists. Exact amounts are in the Rights article,
// and the form and code section let the business check the details for itself.
function helpLine(c) {
  if (isCityOnly(barrierIds(c))) return '';
  return `If cost is a concern, federal tax incentives may help (IRS Form 8826 and tax code Section 190), and ${SWADA} gives businesses free ADA advice.`;
}

function restripeNote(c) {
  return hasParking(c)
    ? 'The U.S. Department of Justice says restriping a parking lot is relatively inexpensive, so adding accessible spaces is "readily achievable in most cases."'
    : '';
}

function replyBy(c, days) {
  const base = lastDate(c, 'followed_up') || lastDate(c, 'asked') || todayISO();
  const from = base > todayISO() ? base : todayISO();
  return longDate(addDays(from, days ?? c.replyDays ?? 14));
}

function photoNote(c) {
  const n = (c.photos || []).length;
  if (!n) return '';
  return n === 1 ? 'I have a photo I can share.' : `I have ${n} photos I can share.`;
}

function section(title, body) {
  return body ? `${title}\n${body}` : '';
}

function compose(blocks) {
  return blocks.map((b) => (b == null ? '' : String(b).trim())).filter(Boolean).join('\n\n');
}

function timelineLines(c) {
  const labels = {
    documented: 'Documented the problem',
    asked: 'Asked the business to fix it',
    reply: 'The business replied',
    followed_up: 'Followed up with the business',
    owner_contacted: 'Contacted the property owner or headquarters',
    complaint_tdlr: 'Filed a complaint with TDLR',
    complaint_doj: 'Filed a complaint with the U.S. Department of Justice',
    complaint_city: 'Reported it to the city',
    allies_contacted: 'Asked an advocacy group for help',
    council_contacted: 'Contacted a city council member',
    media_contacted: 'Contacted local news',
    fixed: 'The problem was fixed',
    thanked: 'Thanked the business',
    note: 'Note',
  };
  return [...(c.events || [])]
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
    .map((e) => {
      const label = labels[e.type] || 'Update';
      const note = clean(e.note);
      return `${longDate(e.date)}: ${label}${note ? ` (${note})` : ''}`;
    });
}

// ---------- Letters ----------

function requestLetter(c, profile, tone) {
  if (isCityOnly(barrierIds(c))) return cityReport(c, profile);
  const formal = tone === 'formal';
  const subject = `Accessibility request for ${business(c)}${clean(c.place?.address) ? `, ${clean(c.place.address)}` : ''}`;
  const body = compose([
    salutation(c, tone),
    `${opening(c, profile, tone)} ${formal ? 'I am writing to request your help with an accessibility problem there.' : "I'm writing to ask for your help with an accessibility problem there."}`,
    section('What I found:', list(barrierLines(c))),
    parkingLine(c),
    impactBlock(c, profile),
    section('What the rules say:', list(ruleLines(c))),
    section('My request:', requestText(c)),
    restripeNote(c),
    `${formal ? 'Please let me know' : 'Could you let me know'} by ${replyBy(c)} what you plan to do? ${photoNote(c)} ${formal ? 'I would be glad to discuss it.' : "I'm glad to talk it over."}`.replace(/\s+/g, ' '),
    helpLine(c),
    `Thank you for making ${business(c)} welcoming to everyone.`,
    signoff(profile, tone),
  ]);
  return { subject, body };
}

function scriptText(c, profile) {
  const disclose = (profile?.who || 'self') === 'self' ? ', and I have a disability' : '';
  const ask = requestText(c);
  const body = compose([
    `Hi! I'm a customer here${disclose}. I noticed ${barrierPhrase(c)}.`,
    `Could you please pass this on to the manager or owner? It would help a lot to: ${lower(ask)}`,
    'Who is the best person to follow up with, and what is their email? Thank you!',
  ]);
  return { subject: 'What to say in person', body };
}

function followupLetter(c, profile) {
  const asked = firstDate(c, 'asked');
  const reply = lastDate(c, 'reply');
  const askedHow = c.contact?.method === 'in_person' ? 'spoke with your staff' : 'wrote';
  const subject = `Following up: accessibility request for ${business(c)}`;
  const body = compose([
    salutation(c, 'friendly'),
    asked
      ? `On ${longDate(asked)}, I ${askedHow} to ask ${business(c)} to fix ${barrierPhrase(c)}${where(c) ? ` at ${where(c)}` : ''}. ${reply ? `Thank you for your reply on ${longDate(reply)}.` : "I haven't heard back yet."}`
      : `I'm following up about ${barrierPhrase(c)} at ${businessAndWhere(c)}.`,
    `As of ${longDate(todayISO())}, the problem is still there.`,
    section('Here is what I am asking for:', requestText(c)),
    section('Why it matters:', list(ruleLines(c))),
    `Could you reply by ${replyBy(c, 10)}? If it isn't fixed, my next step is to contact the property owner and the Texas Department of Licensing and Regulation (TDLR).`,
    helpLine(c),
    signoff(profile, 'friendly'),
  ]);
  return { subject, body };
}

function finalLetter(c, profile) {
  const steps = [];
  const asked = firstDate(c, 'asked');
  if (asked) steps.push(`${longDate(asked)}: my first request`);
  for (const e of event(c, 'followed_up')) steps.push(`${longDate(e.date)}: my follow-up`);
  for (const e of event(c, 'owner_contacted')) steps.push(`${longDate(e.date)}: my letter to the property owner or headquarters`);
  const subject = `Final request before I file complaints: accessibility at ${business(c)}`;
  const body = compose([
    salutation(c, 'formal'),
    `I have asked ${business(c)} to fix an accessibility problem${where(c) ? ` at ${where(c)}` : ''}.`,
    steps.length ? section('My requests so far:', list(steps)) : '',
    `As of ${longDate(todayISO())}, it has not been fixed.`,
    section('The problem:', list(barrierLines(c))),
    parkingLine(c),
    section('What I am asking for:', requestText(c)),
    `If I do not hear back by ${replyBy(c, 10)}, I plan to file complaints with the Texas Department of Licensing and Regulation and the U.S. Department of Justice, and to share my experience with local reporters. I would much rather see ${business(c)} fix this, and I am glad to talk.`,
    helpLine(c),
    signoff(profile, 'formal'),
  ]);
  return { subject, body };
}

function ownerLetter(c, profile) {
  const asked = firstDate(c, 'asked');
  const subject = `Accessibility problem at your property: ${where(c) || business(c)}`;
  const body = compose([
    'Dear Property Owner or Manager,',
    `I'm contacting you as the owner or manager of the property at ${where(c) || 'this location'}, which includes ${business(c)}. ${opening(c, profile, 'friendly')}`,
    `Parking lots, entrances, and shared walkways are often the property owner's responsibility, so I'm bringing this to you directly.${asked ? ` I first asked ${business(c)} to fix it on ${longDate(asked)}.` : ''}`,
    section('What I found:', list(barrierLines(c))),
    parkingLine(c),
    impactBlock(c, profile),
    section('What the rules say:', list(ruleLines(c))),
    section('My request:', requestText(c)),
    restripeNote(c),
    `Could you let me know by ${replyBy(c)} what you plan to do? ${photoNote(c)}`.trim(),
    helpLine(c),
    signoff(profile, 'formal'),
  ]);
  return { subject, body };
}

function complaintCore(c, { compact }) {
  const date = longDate(c.date) || longDate(todayISO());
  const ids = barrierIds(c);
  const titles = ids.map((id) => (id === 'other' ? clean(c.notes?.other) || 'an accessibility barrier' : barrier(id).title));
  const parts = [];
  parts.push(`On ${date}, I found accessibility barriers at ${businessAndWhere(c)}: ${titles.join('; ')}.`);
  if (!compact) {
    const notes = ids.map((id) => (id !== 'other' ? clean(c.notes?.[id]) : '')).filter(Boolean);
    if (notes.length) parts.push(`Details: ${notes.join(' ')}`);
  }
  const p = parkingLine(c);
  if (p) {
    if (compact) {
      const a = assessParking(c.parking);
      parts.push(`The lot has ${a.totalLabel} spaces; the 2010 ADA Standards call for at least ${a.required} accessible (${a.vanRequired} van).${a.accessible != null ? ` I counted ${a.accessible}.` : ''}`);
    } else {
      parts.push(p);
    }
  }
  const asked = firstDate(c, 'asked');
  const follow = lastDate(c, 'followed_up');
  const owner = lastDate(c, 'owner_contacted');
  if (asked) {
    let s = `I asked the business to fix it on ${longDate(asked)}`;
    if (follow) s += `, followed up on ${longDate(follow)}`;
    if (owner) s += `, and contacted the property owner on ${longDate(owner)}`;
    parts.push(`${s}.`);
  }
  parts.push(fixed(c) ? 'It has since been fixed.' : `As of ${longDate(todayISO())}, it has not been fixed.`);
  if ((c.photos || []).length) parts.push('Photos attached.');
  return parts;
}

function tdlrSummary(c) {
  const ask = 'Please review this under the Texas Architectural Barriers Act and the Texas Accessibility Standards.';
  let body = [...complaintCore(c, { compact: false }), ask].join(' ');
  if (body.length > 1000) body = [...complaintCore(c, { compact: true }), ask].join(' ');
  if (body.length > 1000) {
    const core = complaintCore(c, { compact: true });
    core[0] = `On ${longDate(c.date) || longDate(todayISO())}, I found ${barrierIds(c).length} accessibility barriers at ${businessAndWhere(c)} (details and photos attached).`;
    body = [...core, ask].join(' ');
  }
  if (body.length > 1000) body = `${body.slice(0, 990).trimEnd()}...`;
  return { subject: `Architectural Barriers complaint: ${business(c)}`, body };
}

function dojSummary(c, profile) {
  const who = profile?.who === 'helper' ? 'I am filing on behalf of a family member with a disability.' : profile?.who === 'self' ? 'I am a person with a disability.' : '';
  const body = compose([
    [who, ...complaintCore(c, { compact: false })].filter(Boolean).join(' '),
    impactBlock(c, profile),
    section('What I asked the business to do:', requestText(c)),
    section('Timeline:', list(timelineLines(c))),
    'I am asking the Department of Justice to help resolve this under Title III of the Americans with Disabilities Act, including through mediation if appropriate.',
  ]);
  return { subject: `ADA Title III complaint: ${business(c)}`, body };
}

function cityReport(c, profile) {
  const ids = barrierIds(c);
  const blocks = [];
  if (ids.includes('path_city')) {
    const note = clean(c.notes?.path_city);
    blocks.push(`I'm reporting a sidewalk or curb ramp problem${where(c) ? ` at or near ${where(c)}` : ''}${note ? `: ${note}` : '.'}`.replace(/\.\.$/, '.'));
    blocks.push('It blocks people who use wheelchairs, walkers, and strollers. Please repair it, and add a curb ramp if one is missing. Under 28 CFR 35.151(i), new and altered streets and sidewalks must have curb ramps.');
  }
  if (ids.includes('parking_blocked')) {
    const note = clean(c.notes?.parking_blocked);
    blocks.push(`Vehicles without disability placards or plates often park in the accessible spaces or access aisles at ${businessAndWhere(c)}.${note ? ` ${note}` : ''} Please send parking enforcement, and let me know the best way to report it when it happens.`);
  }
  const others = ids.filter((id) => id !== 'path_city' && id !== 'parking_blocked');
  if (others.length) {
    blocks.push(`I'd also like to report an accessibility problem at ${businessAndWhere(c)}: ${joinWords(others.map((id) => (id === 'other' ? clean(c.notes?.other) || 'an accessibility barrier' : lower(barrier(id).title))))}. Can the city help, or tell me the right office to contact?`);
  }
  if (!blocks.length) blocks.push(`I'd like to report an accessibility problem at ${businessAndWhere(c)}.`);
  const body = compose([
    'Hello,',
    ...blocks,
    impactBlock(c, profile),
    photoNote(c),
    signoff(profile, 'friendly'),
  ]);
  return { subject: `Accessibility report: ${where(c) || business(c)}`, body };
}

function councilLetter(c, profile) {
  const asked = firstDate(c, 'asked');
  const follow = lastDate(c, 'followed_up');
  const city = clean(profile?.city) || clean(c.place?.city);
  const body = compose([
    'Dear Council Member,',
    `I live in ${city || 'your district'}, and I'm asking for your help. ${businessAndWhere(c)} has an accessibility problem:`,
    list(barrierLines(c)),
    parkingLine(c),
    asked ? `I asked the business to fix it on ${longDate(asked)}${follow ? ` and followed up on ${longDate(follow)}` : ''}, but it has not been fixed.` : '',
    impactBlock(c, profile),
    "Could your office contact the business and encourage a fix, or connect me with the city's ADA coordinator? Changes like this make our city easier for everyone to get around.",
    signoff(profile, 'friendly'),
  ]);
  return { subject: `Constituent request: accessibility at ${business(c)}`, body };
}

function newsTip(c, profile) {
  const city = clean(c.place?.city) || clean(profile?.city);
  const intro = profile?.who === 'self'
    ? `I'm a${city ? ` ${city}-area` : ''} resident with a disability.`
    : profile?.who === 'helper'
      ? `I'm a${city ? ` ${city}-area` : ''} resident, and my family member has a disability.`
      : `I'm a${city ? ` ${city}-area` : ''} resident.`;
  const first = barrierIds(c)[0];
  const headline = first ? (first === 'other' ? 'accessibility problem' : lower(barrier(first).title)) : 'accessibility problem';
  const subject = `Story tip: ${headline} at ${business(c)}${city ? ` in ${city}` : ''}`;
  const status = fixed(c) ? 'The business has since fixed it.' : `As of ${longDate(todayISO())}, it has not been fixed.`;
  const body = compose([
    'Hello,',
    `${intro} ${businessAndWhere(c)} has ${barrierPhrase(c)}.`,
    parkingLine(c),
    section('What I have done:', list(timelineLines(c))),
    status,
    impactBlock(c, profile),
    'The CDC reports that more than 1 in 4 U.S. adults have a disability, so problems like this affect a lot of people in our area.',
    `${photoNote(c)} I'm available to talk.`.trim(),
    signoff(profile, 'friendly'),
  ]);
  return { subject, body };
}

function thanksNote(c, profile) {
  const fixNote = clean(event(c, 'fixed').slice(-1)[0]?.note);
  const what = fixNote ? lower(fixNote) : `fixing the accessibility problem I reported`;
  const city = clean(c.place?.city) || clean(profile?.city) || 'our city';
  const body = compose([
    salutation(c, 'friendly'),
    `Thank you for ${what} at ${businessAndWhere(c)}. It makes a real difference for me and for other customers with disabilities. I'll be glad to tell others that ${business(c)} listened.`,
    signoff(profile, 'friendly'),
    '---',
    `A short public post you can share:\nThank you, ${business(c)}, for ${what}! Changes like this make ${city} more accessible for everyone.`,
  ]);
  return { subject: `Thank you from a customer: ${business(c)}`, body };
}

function caseRecord(c, profile, sources) {
  const p = parkingLine(c);
  const body = compose([
    `CurbCutter case record: ${business(c)}`,
    section('Place:', [business(c), where(c)].filter(Boolean).join('\n')),
    section('Barriers:', list(barrierLines(c))),
    p ? section('Parking count:', p) : '',
    section('What happened:', para(c.impact)),
    section('Request:', requestText(c)),
    section('Timeline:', list(timelineLines(c))),
    `Photos: ${(c.photos || []).length}`,
    sources && sources.length ? section('Sources:', list(sources.map((s) => `${s.title}: ${s.url}`))) : '',
    `Prepared ${longDate(todayISO())} with CurbCutter. General information, not legal advice.`,
  ]);
  return { subject: `Accessibility case record: ${business(c)}`, body };
}

export function makeLetter(kind, c, profile = {}, opts = {}) {
  switch (kind) {
    case 'request': return requestLetter(c, profile, opts.tone || 'friendly');
    case 'script': return scriptText(c, profile);
    case 'followup': return followupLetter(c, profile);
    case 'final': return finalLetter(c, profile);
    case 'owner': return ownerLetter(c, profile);
    case 'tdlr': return tdlrSummary(c);
    case 'doj': return dojSummary(c, profile);
    case 'city': return cityReport(c, profile);
    case 'council': return councilLetter(c, profile);
    case 'news': return newsTip(c, profile);
    case 'thanks': return thanksNote(c, profile);
    case 'summary': return caseRecord(c, profile, opts.sources);
    default: throw new Error(`Unknown letter kind: ${kind}`);
  }
}

// Fields to copy into TDLR's form, in the order the form asks for them.
export function tdlrFields(c) {
  return [
    { label: 'Program', value: 'Architectural Barriers' },
    { label: 'Date of the incident', value: longDate(c.date) || longDate(todayISO()) },
    { label: 'Company name (responsible party)', value: business(c) },
    { label: 'Street address', value: clean(c.place?.address) },
    { label: 'City', value: clean(c.place?.city) },
    { label: 'State', value: 'TX' },
  ].filter((f) => f.value);
}

// The words the case is "about", used for titles in lists.
export function caseTitle(c) {
  return business(c) === 'this business' ? 'New report' : business(c);
}

export function caseSubtitle(c) {
  const ids = barrierIds(c);
  if (!ids.length) return where(c) || 'No barrier chosen yet';
  const first = ids[0] === 'other' ? clean(c.notes?.other) || 'Something else' : barrier(ids[0]).title;
  return ids.length > 1 ? `${first} + ${ids.length - 1} more` : first;
}
