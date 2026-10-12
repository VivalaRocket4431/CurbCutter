import { h, icon } from '../ui/dom.js';
import { pageHead, contactCard, choiceGroup } from '../ui/components.js';
import { METROS, STATEWIDE, CHECKED, localFor, metroName } from '../data/contacts.js';
import { getSettings, saveSettings } from '../lib/settings.js';
import { longDate } from '../lib/dates.js';
import { APP } from '../config.js';

function section(id, title, intro, ...cards) {
  const items = cards.flat().filter(Boolean);
  if (!items.length) return null;
  return h('section', { class: 'block', 'aria-labelledby': `h-${id}` },
    h('h2', { id: `h-${id}` }, title),
    intro ? h('p', { class: 'hint' }, intro) : null,
    h('div', { class: 'contact-list' }, items),
  );
}

export async function renderHelp(params, ctx) {
  const metro = params.metro && METROS.some((m) => m.id === params.metro) ? params.metro : getSettings().metro || 'dfw';
  const local = localFor(metro);

  const picker = choiceGroup({
    name: 'help-metro', legend: 'Show contacts for', columns: 2,
    options: METROS.map((m) => ({ value: m.id, label: m.name })),
    value: metro,
    onChange: (v) => { saveSettings({ metro: v }); ctx.navigate(`#/help/${v}`, { replace: true }); },
  });

  const cityCards = (key, nameFn) => local.cities.map((city) => contactCard({ name: nameFn(city), ...city[key] }));

  const node = h('div', { class: 'screen help' },
    pageHead({ title: 'Get help', lede: 'People and agencies that can help, checked by hand. Tap a phone number to call.' }),
    picker,
    section('advice', 'Free ADA advice', 'For you, or to share with the business.', STATEWIDE.advice.map((c) => contactCard(c))),
    section('report', `Report illegal parking or a city problem${local.cities.length ? ` (${metroName(metro)})` : ''}`, 'For a car parked illegally right now, or a broken public sidewalk or curb ramp.',
      cityCards('report', (c) => `${c.name} 311`),
      local.volunteer ? contactCard(local.volunteer) : null),
    section('city-ada', 'City disability offices', 'For city sidewalks, curb ramps, and city buildings.', local.cities.map((city) => contactCard(city.ada))),
    section('council', 'Your city council member', 'Council offices can press businesses and city departments to act.', cityCards('council', (c) => c.name)),
    section('owner', 'Find who owns a property', 'The parking lot owner is often not the store. Search by street address.',
      local.counties.map((k) => contactCard({ name: k.cad, what: k.name, url: k.url, urlLabel: 'Property search' })),
      contactCard(STATEWIDE.directories[1])),
    section('complaints', 'Official complaints', 'Agencies that can require a fix. CurbCutter prepares the text for both forms from your case.', STATEWIDE.complaints.map((c) => contactCard(c))),
    section('legal', 'Legal help', null, STATEWIDE.legal.map((c) => contactCard(c))),
    section('cils', 'Independent living centers', 'Disability-led centers that help people advocate.', local.cils.map((c) => contactCard({ ...c, what: 'Center for Independent Living' })), contactCard(STATEWIDE.directories[0])),
    section('news', 'Local news', 'After you have given the business a fair chance.', local.news.map((c) => contactCard(c)), STATEWIDE.news.map((c) => contactCard(c))),
    h('p', { class: 'fine' },
      icon('check', { size: 16 }), ` Checked by hand on ${longDate(CHECKED)}. `,
      APP.feedbackEmail ? h('a', { href: `mailto:${APP.feedbackEmail}?subject=${encodeURIComponent('CurbCutter: a contact needs updating')}` }, 'Report a wrong number or link') : 'Numbers change. If one is wrong, search the organization\'s name.',
    ),
  );
  return { title: 'Get help', node };
}
