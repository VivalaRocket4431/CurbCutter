import { h, icon, uid } from '../ui/dom.js';
import { pageHead, contactCard, fold } from '../ui/components.js';
import { METROS, STATEWIDE, CHECKED, localFor, metroName } from '../data/contacts.js';
import { getSettings, saveSettings } from '../lib/settings.js';
import { longDate } from '../lib/dates.js';
import { APP } from '../config.js';

// One closed section per need. People open only the one they came for.
function need(title, sub, cards) {
  const items = cards.flat().filter(Boolean);
  if (!items.length) return null;
  return fold({ title, sub }, h('div', { class: 'contact-list' }, items));
}

export async function renderHelp(params, ctx) {
  const metro = params.metro && METROS.some((m) => m.id === params.metro) ? params.metro : getSettings().metro || 'dfw';
  const local = localFor(metro);
  const card = (c) => contactCard(c, { headingLevel: 3 });

  const selectId = uid('area');
  const select = h('select', { id: selectId, class: 'select' },
    METROS.map((m) => h('option', { value: m.id, selected: m.id === metro ? true : null }, m.name)));
  select.addEventListener('change', () => {
    saveSettings({ metro: select.value });
    ctx.navigate(`#/help/${select.value}`, { replace: true });
  });

  const cityCards = (key, nameFn) => local.cities.map((city) => card({ name: nameFn(city), ...city[key] }));
  const here = local.cities.length ? metroName(metro) : 'Texas';

  const node = h('div', { class: 'screen help' },
    h('p', { class: 'back' }, h('a', { href: '#/rights' }, icon('left', { size: 18 }), 'Rights & help')),
    pageHead({ title: 'Who can help', lede: 'Open what you need. Tap a phone number to call.' }),
    h('div', { class: 'area-pick' },
      h('label', { for: selectId, class: 'label' }, 'Your area'),
      select,
    ),
    h('div', { class: 'folds' },
      need('Report illegal parking or a broken sidewalk', `311 and parking enforcement in ${here}.`, [
        cityCards('report', (c) => `${c.name} 311`),
        local.volunteer ? card(local.volunteer) : null,
      ]),
      need('Free ADA advice', 'For you, or to share with the business.', STATEWIDE.advice.map(card)),
      need('Find who owns a property', 'The parking lot owner is often not the store.', [
        local.counties.map((k) => card({ name: k.cad, what: k.name, url: k.url, urlLabel: 'Property search' })),
        card(STATEWIDE.directories[1]),
      ]),
      need('File an official complaint', 'State and federal agencies that can require a fix.', STATEWIDE.complaints.map(card)),
      need('City disability office', 'For city sidewalks, curb ramps, and city buildings.', local.cities.map((city) => card(city.ada))),
      need('Your city council member', 'Council offices can press businesses and city departments.', cityCards('council', (c) => c.name)),
      need('Independent living centers', 'Disability-led centers that help people advocate.', [
        local.cils.map((c) => card({ ...c, what: 'Center for Independent Living' })),
        card(STATEWIDE.directories[0]),
      ]),
      need('Free legal help', 'If asking and complaints haven\'t worked.', STATEWIDE.legal.map(card)),
      need('Local news', 'After the business has had a fair chance.', [local.news.map(card), STATEWIDE.news.map(card)]),
    ),
    h('p', { class: 'fine' },
      icon('check', { size: 16 }), ` Checked by hand on ${longDate(CHECKED)}. `,
      APP.feedbackEmail ? h('a', { href: `mailto:${APP.feedbackEmail}?subject=${encodeURIComponent('CurbCutter: a contact needs updating')}` }, 'Report a wrong number or link') : 'Numbers change. If one is wrong, search the organization\'s name.',
    ),
  );
  return { title: 'Who can help', node };
}
