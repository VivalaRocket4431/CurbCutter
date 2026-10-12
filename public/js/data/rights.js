// "Know your rights" library. Short, plain articles. Each block is a paragraph (string)
// or a list ({ list: [...] }) or a table ({ table: { head, rows } }) or a callout ({ note }).

export const ARTICLES = [
  {
    id: 'basics',
    title: 'Your rights at businesses, in plain words',
    summary: 'What the ADA asks of stores, restaurants, and other places open to the public.',
    blocks: [
      'The Americans with Disabilities Act (ADA) is a federal law. Its Title III covers businesses open to the public, such as stores, restaurants, banks, doctors\' offices, gyms, and hotels.',
      { list: [
        'Older buildings must remove barriers when it is "readily achievable." That means easy to do without much difficulty or expense. Larger businesses are expected to do more.',
        'New and remodeled buildings must follow the 2010 ADA Standards for Accessible Design. Texas has matching state rules, the Texas Accessibility Standards.',
        'Businesses must keep accessible features working, like keeping access aisles and ramps clear.',
      ] },
      'The U.S. Department of Justice lists examples of barrier removal, including installing ramps, making curb cuts, widening doors, installing grab bars, and creating accessible parking spaces.',
      { note: 'CurbCutter shares general information, not legal advice. Whether a rule applies can depend on when a building was built or changed. For legal advice, contact Disability Rights Texas or a lawyer.' },
    ],
    cites: ['cfr-36-304', 'cfr-36-211', 'ada-2010', 'gcpd-building'],
  },
  {
    id: 'parking-count',
    title: 'How many accessible spaces a lot needs',
    summary: 'The minimum depends on the total number of spaces in each lot.',
    blocks: [
      'The 2010 ADA Standards set a minimum for each parking lot or garage. Count each lot separately when they are divided by a street or are separate garages.',
      { table: {
        caption: 'Minimum accessible spaces (2010 ADA Standards, Table 208.2)',
        head: ['Total spaces in the lot', 'Accessible spaces required'],
        rows: [
          ['1 to 25', '1'],
          ['26 to 50', '2'],
          ['51 to 75', '3'],
          ['76 to 100', '4'],
          ['101 to 150', '5'],
          ['151 to 200', '6'],
          ['201 to 300', '7'],
          ['301 to 400', '8'],
          ['401 to 500', '9'],
          ['501 to 1,000', '2% of the total'],
          ['More than 1,000', '20, plus 1 for each 100 over 1,000'],
        ],
      } },
      { list: [
        'At least 1 of every 6 accessible spaces, and never fewer than 1, must be van-accessible.',
        'Hospital outpatient areas need at least 10% of patient and visitor spaces to be accessible.',
        'Outpatient physical therapy and rehabilitation places for mobility conditions need at least 20%.',
      ] },
      'CurbCutter does this math for you when you report a parking problem.',
    ],
    cites: ['ab-parking', 'doj-restriping'],
  },
  {
    id: 'parking-design',
    title: 'What a good accessible space looks like',
    summary: 'Widths, aisles, signs, and the extra markings Texas requires on newer lots.',
    blocks: [
      { list: [
        'Car space: at least 8 feet wide, with an access aisle at least 5 feet wide beside it.',
        'Van space: 11 feet wide with a 5-foot aisle, or 8 feet wide with an 8-foot aisle. Garages need 98 inches of clearance overhead for vans.',
        'The aisle is marked so people won\'t park in it. Two spaces can share one aisle.',
        'An upright sign with the International Symbol of Accessibility, with its bottom edge at least 60 inches above the ground. Van spaces say "Van Accessible."',
        'The space and aisle are nearly level, and the spaces are on the shortest accessible route to an accessible entrance.',
      ] },
      'Texas adds more for parking lots built or remodeled under a state rule adopted in 2020:',
      { list: [
        'The International Symbol of Accessibility painted on the space.',
        '"NO PARKING" painted in the access aisle, in letters at least 12 inches tall.',
        'A sign that says at least "Violators Subject to Fine and Towing," mounted with its bottom edge 48 to 80 inches above the ground.',
      ] },
    ],
    cites: ['ab-parking', 'tac-68-104', 'doj-restriping'],
  },
  {
    id: 'texas-enforcement',
    title: 'How accessible parking is enforced in Texas',
    summary: 'Fines, blocked aisles, missing signs, and volunteer enforcers.',
    blocks: [
      { list: [
        'Parking in an accessible space without a disability placard or plates is a misdemeanor. A first offense carries a fine of $500 to $750, and fines go up for repeat offenses.',
        'Blocking an access aisle or curb ramp with a vehicle is also an offense.',
        'If a space has no sign, a police officer can give only a warning, not a ticket. That is why a missing sign matters so much.',
        'Cities can appoint trained volunteers to file charges against people who park illegally in accessible spaces.',
      ] },
      'Houston, Austin, and San Antonio run volunteer programs. In Houston, volunteers issued more than 80% of accessible-parking citations in 2021. To report a car parked illegally right now, call your city\'s 311 or police non-emergency line.',
    ],
    cites: ['tx-681-011', 'tx-681-0101', 'houston-parking-2022', 'austin-apep', 'sapd-vip'],
  },
  {
    id: 'who-enforces',
    title: 'Who can make a business fix it',
    summary: 'The business, the state, the federal government, your city, and the courts each play a part.',
    blocks: [
      { list: [
        'The business or property owner can fix it fastest. Most fixes start with a clear, polite request.',
        'TDLR, the Texas Department of Licensing and Regulation, enforces the Texas Accessibility Standards. It covers businesses built or remodeled since 1992, plus other commercial buildings since September 1993. File within 2 years.',
        'The U.S. Department of Justice enforces the ADA. It may send your complaint to free, voluntary mediation, investigate it, or tell you it cannot act. Review can take up to three months.',
        'Your city handles public sidewalks, curb ramps, and parking enforcement. Your city council member can also press a business to act.',
        'Courts: you can talk to Disability Rights Texas or a lawyer about legal options. CurbCutter does not file lawsuits, and it never asks a business for money.',
      ] },
    ],
    cites: ['tx-469-003', 'tdlr-complaint', 'doj-file', 'drtx-apply'],
  },
  {
    id: 'business-help',
    title: 'Tax incentives and free advice for businesses',
    summary: 'Federal tax incentives and free expert advice make it easier for a business to say yes.',
    blocks: [
      { list: [
        'Free advice: the Southwest ADA Center answers questions from businesses as well as customers.',
        'Disabled Access Credit (IRS Form 8826): small businesses with 30 or fewer employees, or $1 million or less in revenue, can get a credit for half of eligible costs between $250 and $10,250. That is up to $5,000 a year.',
        'Barrier Removal Tax Deduction (IRS Section 190): any business can deduct up to $15,000 a year for removing barriers.',
        'A business can use both when the costs qualify.',
      ] },
      'CurbCutter\'s letter drafts mention these. Before you send, you decide whether to keep that part.',
    ],
    cites: ['doj-tax', 'adata-region'],
  },
  {
    id: 'advocate-well',
    title: 'Advocating safely and credibly',
    summary: 'What makes businesses, agencies, and reporters take a report seriously.',
    blocks: [
      { list: [
        'Be specific: what, where, and when. Counts and photos beat adjectives.',
        'Be polite and give a reasonable deadline. Most fixes happen after a clear first request.',
        'Keep records. CurbCutter saves dates, letters, and replies so your timeline is ready if you need to escalate.',
        'Ask only for the access fix. Never ask for money, gifts, or favors.',
        'Photograph places, not people. Avoid faces and license plates.',
        'Stay safe. You never have to argue with staff or another driver. Leave and write instead.',
        'Get support when you need it. A Center for Independent Living can help you advocate.',
      ] },
    ],
    cites: ['drtx-apply', 'ilru-tx'],
  },
  {
    id: 'media',
    title: 'Working with local news',
    summary: 'When to contact reporters and what they need from you.',
    blocks: [
      'Local news can move a business that won\'t answer. It works best after you have given the business a fair chance.',
      { list: [
        'Reporters need a clear timeline: when you found the problem, when you asked, and what happened.',
        'Share your photos and any numbers, like how many accessible spaces the rules call for compared with what is there.',
        'Explain why it matters to people in your city. The CDC reports that more than 1 in 4 U.S. adults have a disability.',
        'Be accurate and calm. Reporters will contact the business for its side.',
        'Decide ahead of time what you are comfortable sharing about your own disability.',
      ] },
      'CurbCutter writes the news tip for you, using your case timeline.',
    ],
    cites: ['cdc-1in4'],
  },
];

export function article(id) {
  return ARTICLES.find((a) => a.id === id);
}
