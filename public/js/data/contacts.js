// Who to contact, by area. Every entry was checked on the date in CHECKED.
// Only add a phone, email, or link that you confirmed on the organization's own website.
// Run `npm run links` to find links that stopped working.

export const CHECKED = '2026-10-11';

export const METROS = [
  { id: 'dfw', name: 'Dallas–Fort Worth', short: 'DFW' },
  { id: 'houston', name: 'Houston', short: 'Houston' },
  { id: 'sanantonio', name: 'San Antonio', short: 'San Antonio' },
  { id: 'austin', name: 'Austin', short: 'Austin' },
  { id: 'other', name: 'Somewhere else in Texas', short: 'Other Texas' },
];

// Help that works anywhere in Texas.
export const STATEWIDE = {
  advice: [
    {
      id: 'swada',
      name: 'Southwest ADA Center',
      what: 'Free answers about the ADA, for you or for the business. Serves Texas.',
      phone: '713-797-7171',
      phoneLabel: 'Voice or relay',
      url: 'https://www.southwestada.org/',
      src: 'adata-region',
    },
    {
      id: 'adata',
      name: 'ADA National Network',
      what: 'Free ADA questions line that connects to regional ADA centers.',
      phone: '800-949-4232',
      url: 'https://adata.org/',
      src: 'adata-region',
    },
  ],
  legal: [
    {
      id: 'drtx',
      name: 'Disability Rights Texas',
      what: 'Free legal help for Texans facing disability discrimination. They decide which cases they can take, and a decision takes at least 10 business days.',
      phone: '800-252-9108',
      phoneLabel: 'Mon–Thu, 10 a.m.–noon and 1–3 p.m. Central',
      extra: [
        { label: 'Video phone for Deaf callers', value: '866-362-2851', type: 'tel' },
      ],
      url: 'https://intake.drtx.org/',
      urlLabel: 'Apply online (open 24/7)',
      src: 'drtx-apply',
    },
  ],
  complaints: [
    {
      id: 'tdlr',
      name: 'Texas Department of Licensing and Regulation (TDLR)',
      what: 'State agency that enforces the Texas Accessibility Standards for buildings covered by the Texas Architectural Barriers Act.',
      url: 'https://ga.tdlr.texas.gov:1443/form/Complaint',
      urlLabel: 'Open the TDLR complaint form',
      phone: '800-803-9202',
      phoneLabel: 'Customer service, Mon–Fri 8 a.m.–5 p.m.',
      notes: [
        'Choose the program "Architectural Barriers."',
        'If your description is longer than 1,000 characters, attach it as a document. CurbCutter keeps your summary under that limit.',
        'The form times out after 15 minutes, so have your summary and photos ready first.',
        'File within 2 years of the problem.',
        'It covers businesses built or remodeled since 1992 (public accommodations) or September 1993 (other commercial buildings).',
      ],
      src: 'tdlr-complaint',
    },
    {
      id: 'doj',
      name: 'U.S. Department of Justice, Civil Rights Division',
      what: 'Federal agency that enforces the ADA. It may refer your complaint to free mediation, investigate, or explain why it cannot act.',
      url: 'https://civilrights.justice.gov/report/',
      urlLabel: 'Report an ADA violation online',
      phone: '800-514-0301',
      phoneLabel: 'ADA Information Line (voice)',
      extra: [{ label: 'TTY', value: '833-610-1264', type: 'tel' }],
      notes: ['Review can take up to three months.'],
      src: 'doj-file',
    },
  ],
  directories: [
    {
      id: 'cil-dir',
      name: 'Find a Center for Independent Living',
      what: 'Disability-led local centers that help with advocacy and support. This directory lists every center in Texas.',
      url: 'https://www.ilru.org/cil-directory/tx',
      src: 'ilru-tx',
    },
    {
      id: 'cad-dir',
      name: 'Find your county appraisal district',
      what: 'Appraisal districts list who owns a property. The parking lot owner is often not the store.',
      url: 'https://comptroller.texas.gov/taxes/property-tax/county-directory/',
      src: 'comptroller-cad',
    },
  ],
  news: [
    {
      id: 'tribune',
      name: 'The Texas Tribune',
      what: 'Statewide nonprofit newsroom based in Austin. They prefer email.',
      email: 'pitches@texastribune.org',
      url: 'https://www.texastribune.org/contact/',
    },
  ],
};

export const LOCAL = {
  dfw: {
    cities: [
      {
        id: 'dallas',
        name: 'Dallas',
        report: {
          what: 'Dallas 311: report problems and ask for parking enforcement.',
          phone: '311',
          extra: [{ label: 'From outside Dallas or if 311 fails', value: '214-670-3111', type: 'tel' }],
          url: 'https://dallascrm.my.site.com/public/s/',
          urlLabel: 'Request a service online',
          app: 'Dallas 311 app',
        },
        ada: {
          name: 'City of Dallas ADA Compliance',
          what: 'For city sidewalks, curb ramps, and city facilities.',
          phone: '214-670-3247',
          url: 'https://dallascityhall.com/departments/drivers-of-opportunity/human-rights/Pages/ADA-Compliance.aspx',
        },
        council: {
          url: 'https://dallasgis.maps.arcgis.com/apps/instant/sidebar/index.html?appid=1c2709d11a3c4525b3916bccb6b860fd',
          urlLabel: 'Find my council district',
          phone: '214-670-4050',
          phoneLabel: 'Mayor and City Council office',
        },
      },
      {
        id: 'fortworth',
        name: 'Fort Worth',
        report: {
          what: 'Fort Worth 311 Contact Center: report problems and ask for parking enforcement.',
          phone: '817-392-1234',
          url: 'https://www.fortworthtexas.gov/departments/communications/customercare',
          urlLabel: 'Customer Care and online requests',
          app: 'MyFW app',
        },
        ada: {
          name: 'City of Fort Worth ADA Coordinator',
          what: 'For city sidewalks, curb ramps, and city facilities. Also staffs the Mayor\'s Committee on Persons with Disabilities.',
          phone: '817-392-7525',
          email: 'ada@fortworthtexas.gov',
          url: 'https://www.fortworthtexas.gov/departments/civil-rights-office/Mayors-Committee-on-Persons-with-Disabilities',
        },
        council: {
          url: 'https://www.fortworthtexas.gov/government/elected-officials',
          urlLabel: 'Mayor and City Council members',
        },
      },
    ],
    counties: [
      { name: 'Dallas County', cad: 'Dallas Central Appraisal District', url: 'https://www.dallascad.org/SearchAddr.aspx' },
      { name: 'Tarrant County', cad: 'Tarrant Appraisal District', url: 'https://www.tad.org/' },
      { name: 'Collin County', cad: 'Collin Central Appraisal District', url: 'https://www.collincad.org/' },
      { name: 'Denton County', cad: 'Denton Central Appraisal District', url: 'https://www.dentoncad.com/' },
      { name: 'Rockwall County', cad: 'Rockwall Central Appraisal District', url: 'https://www.rockwallcad.com/' },
      { name: 'Ellis County', cad: 'Ellis Appraisal District', url: 'https://www.elliscad.com/' },
      { name: 'Kaufman County', cad: 'Kaufman Central Appraisal District', url: 'https://www.kaufman-cad.org/' },
    ],
    cils: [
      { name: 'REACH of Dallas', phone: '214-630-4796', url: 'https://www.reachcils.org/' },
      { name: 'REACH of Fort Worth', phone: '817-870-9082', url: 'https://www.reachcils.org/' },
      { name: 'REACH of Denton', phone: '940-383-1062', url: 'https://www.reachcils.org/' },
      { name: 'REACH of Plano', phone: '972-398-1111', url: 'https://www.reachcils.org/' },
    ],
    volunteer: null,
    news: [
      {
        name: 'NBC 5 Dallas-Fort Worth',
        email: 'NewsTips@nbcdfw.com',
        extra: [
          { label: 'NBC 5 Responds (consumer problems)', value: '844-573-7763', type: 'tel' },
          { label: 'Investigations', value: 'Investigate@nbcdfw.com', type: 'email' },
        ],
        url: 'https://www.nbcdfw.com/consumer-form/',
        urlLabel: 'NBC 5 Responds complaint form',
      },
      {
        name: 'FOX 4 Dallas-Fort Worth',
        email: 'kdfw@fox.com',
        extra: [{ label: 'Consumer unit', value: '214-720-3361', type: 'tel' }],
        url: 'https://www.fox4news.com/contact-us',
      },
      {
        name: 'CBS News Texas',
        phone: '817-496-7711',
        phoneLabel: 'Tip line',
        email: 'news@ktvt.com',
        url: 'https://www.cbsnews.com/texas/',
      },
      {
        name: 'The Dallas Morning News',
        phone: '469-657-8067',
        phoneLabel: 'Call or text the investigations tip line',
        email: 'investigations@dallasnews.com',
        url: 'https://www.dallasnews.com/news-tips/',
      },
      {
        name: 'WFAA (ABC 8)',
        url: 'https://www.wfaa.com/',
        urlLabel: 'Website (find "Contact us" at the bottom)',
      },
    ],
  },

  houston: {
    cities: [
      {
        id: 'houston',
        name: 'Houston',
        report: {
          what: 'Houston 311: report problems. ParkHouston handles parking.',
          phone: '311',
          extra: [
            { label: 'From outside Houston or if 311 fails', value: '713-837-0311', type: 'tel' },
            { label: 'ParkHouston', value: '832-393-8690', type: 'tel' },
          ],
          url: 'https://houston311.powerappsportals.us/en-US/',
          urlLabel: 'Make a 311 request online',
          app: 'Houston 311 app',
        },
        ada: {
          name: "Mayor's Office for People with Disabilities",
          what: 'City office that advocates for Houstonians with disabilities.',
          phone: '832-394-0814',
          email: 'MOPDmail@houstontx.gov',
          url: 'https://houstontx.gov/disabilities/index.html',
        },
        council: {
          url: 'https://houstontx.gov/council/',
          urlLabel: 'City Council (district and at-large members)',
        },
      },
    ],
    counties: [
      { name: 'Harris County', cad: 'Harris Central Appraisal District', url: 'https://hcad.org/' },
      { name: 'Fort Bend County', cad: 'Fort Bend Central Appraisal District', url: 'https://www.fbcad.org/' },
      { name: 'Montgomery County', cad: 'Montgomery Appraisal District', url: 'https://www.mcad-tx.org/' },
    ],
    cils: [{ name: 'Coalition for Barrier Free Living (Houston Center for Independent Living)', phone: '713-974-4621', url: 'https://hcil.cc/' }],
    volunteer: {
      name: 'ParkHouston Volunteer Parking Enforcement',
      what: 'Trained volunteers issue accessible-parking citations. In 2021, volunteers issued more than 80% of these citations in Houston. Training is a four-hour virtual course.',
      url: 'https://www.houstontx.gov/parking/volunteer.html',
      email: 'parking@houstontx.gov',
      src: 'houston-parking-2022',
    },
    news: [
      {
        name: 'KHOU 11',
        phone: '713-521-4388',
        phoneLabel: 'Breaking news tips',
        extra: [{ label: 'KHOU 11 Investigates (713-521-HELP)', value: '713-521-4357', type: 'tel' }],
        url: 'https://www.khou.com/contact-us',
      },
      {
        name: 'KPRC 2',
        phone: '713-222-6397',
        phoneLabel: 'News tips (713-222-NEWS)',
        extra: [{ label: 'KPRC 2 Investigates and Consumer Expert (713-223-TIPS)', value: '713-223-8477', type: 'tel' }],
        url: 'https://www.click2houston.com/contact',
      },
      {
        name: 'ABC13 (13 Investigates)',
        phone: '713-663-8760',
        phoneLabel: 'Tip line (leave a short message about the story)',
        url: 'https://abc13.com/13-investigates-story-idea-submission/1776160/',
        urlLabel: 'Story idea form',
      },
      {
        name: 'FOX 26 Houston',
        email: 'FOX26HoustonNews@fox.com',
        phone: '713-479-2801',
        phoneLabel: 'Newsroom',
        url: 'https://www.fox26houston.com/contact-us',
      },
      {
        name: 'Houston Landing',
        url: 'https://houstonlanding.org/contact/',
        urlLabel: 'Nonprofit newsroom: contact options',
      },
    ],
  },

  sanantonio: {
    cities: [
      {
        id: 'sanantonio',
        name: 'San Antonio',
        report: {
          what: 'San Antonio 311: report problems to the city.',
          phone: '311',
          extra: [{ label: 'From outside San Antonio or if 311 fails', value: '210-207-6000', type: 'tel' }],
          url: 'https://www.sa.gov/Directory/Departments/311/Services/Request',
          urlLabel: 'Request city services online',
          app: 'SA 311 app',
          hours: 'Every day, 7 a.m.–7 p.m.',
        },
        ada: {
          name: 'City of San Antonio Disability Access Office',
          what: 'For city sidewalks, curb ramps, and city facilities.',
          phone: '210-207-7135',
          url: 'https://www.sa.gov/Directory/Departments/COA/Disability-Access/Contact',
        },
        council: {
          url: 'https://311.sanantonio.gov/kb/docs/articles/elections-and-records/find-my-council-member',
          urlLabel: 'Find my council member',
        },
      },
    ],
    counties: [{ name: 'Bexar County', cad: 'Bexar Central Appraisal District', url: 'https://bcad.org/' }],
    cils: [{ name: 'San Antonio Independent Living Services (SAILS)', phone: '210-281-1878', url: 'https://sailstx.org/' }],
    volunteer: {
      name: 'SAPD Volunteers in Policing: Public Safety Team',
      what: 'After 40 hours of training, Public Safety Team volunteers issue handicap parking citations for the San Antonio Police Department.',
      url: 'https://www.sa.gov/Directory/Departments/SAPD/Community-Programs/VIP',
      src: 'sapd-vip',
    },
    news: [
      {
        name: 'KSAT 12',
        phone: '210-351-1269',
        phoneLabel: 'News tip hotline',
        email: 'ksatinvestigates@ksat.com',
        extra: [{ label: 'KSAT Investigates', value: '210-351-1212', type: 'tel' }],
        url: 'https://www.ksat.com/contact/',
      },
      {
        name: 'KENS 5',
        phone: '210-366-2002',
        phoneLabel: 'Newsroom',
        url: 'https://www.kens5.com/contact-us',
        urlLabel: 'Story idea form',
      },
      {
        name: 'San Antonio Report',
        email: 'hello@sareport.org',
        url: 'https://sanantonioreport.org/',
      },
      {
        name: 'News 4 San Antonio',
        url: 'https://news4sanantonio.com/',
        urlLabel: 'Website',
      },
    ],
  },

  austin: {
    cities: [
      {
        id: 'austin',
        name: 'Austin',
        report: {
          what: 'Austin 3-1-1: the city asks people to report accessible parking violations here.',
          phone: '311',
          extra: [{ label: 'If 3-1-1 does not work', value: '512-974-2000', type: 'tel' }],
          url: 'https://austin-cwiprod.motorolasolutions.com/cwi/select',
          urlLabel: 'Submit a 3-1-1 request online',
          app: 'Austin 3-1-1 app',
        },
        ada: {
          name: "City of Austin ADA Office and Mayor's Committee for People with Disabilities",
          what: 'For city sidewalks, curb ramps, and city facilities.',
          phone: '512-974-3256',
        },
        council: {
          url: 'https://www.austintexas.gov/council/district-map',
          urlLabel: 'Find my council district',
        },
      },
    ],
    counties: [
      { name: 'Travis County', cad: 'Travis Central Appraisal District', url: 'https://traviscad.org/property-search/' },
      { name: 'Williamson County', cad: 'Williamson Central Appraisal District', url: 'https://www.wcad.org/' },
    ],
    cils: [{ name: 'Austin Resource Center for Independent Living (ARCIL)', phone: '512-832-6349', url: 'https://arcilinc.org/' }],
    volunteer: {
      name: 'Accessible Parking Enforcement Program',
      what: 'Volunteers trained with Austin Police issue citations and warnings at accessible spaces. Training is 4 hours.',
      url: 'https://www.austintexas.gov/transportation-public-works/accessible-parking-enforcement-program',
      email: 'AccessibleParkingVol@austintexas.gov',
      src: 'austin-apep',
    },
    news: [
      {
        name: 'KVUE',
        phone: '512-459-9442',
        phoneLabel: 'Newsroom',
        email: 'NEWS@KVUE.com',
        url: 'https://www.kvue.com/article/news/local/contact-kvue/343680366',
      },
      {
        name: 'FOX 7 Austin',
        phone: '512-472-0988',
        phoneLabel: 'News tips',
        email: 'ktbcnews@fox.com',
        url: 'https://www.fox7austin.com/contact-us',
      },
      {
        name: 'CBS Austin',
        phone: '512-490-2199',
        phoneLabel: 'News tipline',
        email: 'news@cbsaustin.com',
        url: 'https://cbsaustin.com/station/contact',
      },
      {
        name: 'KXAN',
        url: 'https://www.kxan.com/',
        urlLabel: 'Website',
      },
    ],
  },

  other: {
    cities: [],
    counties: [],
    cils: [],
    volunteer: null,
    news: [],
  },
};

export function metroName(id) {
  return METROS.find((m) => m.id === id)?.name || 'Texas';
}

// The four areas CurbCutter has local contacts for.
export function isLocalMetro(id) {
  return !!id && id !== 'other' && METROS.some((m) => m.id === id);
}

// What to call a report's area on screen: the metro area when CurbCutter has local contacts there,
// otherwise the city the person typed, or nothing. "Somewhere else in Texas" is only a choice to pick,
// never a label on someone's report.
export function placeArea(place) {
  if (isLocalMetro(place?.metro)) return metroName(place.metro);
  return String(place?.city || '').trim();
}

export function localFor(metroId) {
  return LOCAL[metroId] || LOCAL.other;
}

// Digits for a tel: link. "311" stays "311".
export function telHref(number) {
  const digits = String(number).replace(/\D/g, '');
  if (digits.length === 10) return `tel:+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `tel:+${digits}`;
  return `tel:${digits}`;
}
