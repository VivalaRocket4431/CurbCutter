// Every rule, number, and phone shown in CurbCutter traces back to one of these sources.
// "checked" is the date a person last confirmed the link and the facts we quote from it.
// When you re-check a source, update its date. The app shows these dates to users.

export const CONTENT_CHECKED = '2026-10-11';

export const SOURCES = {
  'cfr-36-304': {
    title: '28 CFR § 36.304: Removal of barriers',
    publisher: 'Electronic Code of Federal Regulations',
    kind: 'Federal regulation',
    url: 'https://www.ecfr.gov/current/title-28/chapter-I/part-36/subpart-C/section-36.304',
    checked: '2026-10-11',
  },
  'cfr-36-211': {
    title: '28 CFR § 36.211: Maintenance of accessible features',
    publisher: 'Electronic Code of Federal Regulations',
    kind: 'Federal regulation',
    url: 'https://www.ecfr.gov/current/title-28/chapter-I/part-36/subpart-C/section-36.211',
    checked: '2026-10-11',
  },
  'cfr-35-151': {
    title: '28 CFR § 35.151: New construction and alterations (curb ramps)',
    publisher: 'Electronic Code of Federal Regulations',
    kind: 'Federal regulation',
    url: 'https://www.ecfr.gov/current/title-28/chapter-I/part-35/subpart-D/section-35.151',
    checked: '2026-10-11',
  },
  'ada-2010': {
    title: '2010 ADA Standards for Accessible Design',
    publisher: 'U.S. Department of Justice',
    kind: 'Federal standard',
    url: 'https://www.ada.gov/law-and-regs/design-standards/2010-stds/',
    checked: '2026-10-11',
  },
  'ab-parking': {
    title: 'Guide to the ADA Standards, Chapter 5: Parking',
    publisher: 'U.S. Access Board',
    kind: 'Federal guidance',
    url: 'https://www.access-board.gov/ada/guides/chapter-5-parking/',
    checked: '2026-10-11',
  },
  'ab-doors': {
    title: 'Guide to the ADA Standards, Chapter 4: Entrances, Doors, and Gates',
    publisher: 'U.S. Access Board',
    kind: 'Federal guidance',
    url: 'https://www.access-board.gov/ada/guides/chapter-4-entrances-doors-and-gates/',
    checked: '2026-10-11',
  },
  'ab-routes': {
    title: 'Guide to the ADA Standards, Chapter 4: Accessible Routes',
    publisher: 'U.S. Access Board',
    kind: 'Federal guidance',
    url: 'https://www.access-board.gov/ada/guides/chapter-4-accessible-routes/',
    checked: '2026-10-11',
  },
  'doj-restriping': {
    title: 'ADA Guide for Small Businesses: Restriping Parking Spaces',
    publisher: 'U.S. Department of Justice',
    kind: 'Federal guidance',
    url: 'https://www.ada.gov/resources/restriping-parking-spaces/',
    checked: '2026-10-11',
  },
  'doj-tax': {
    title: 'Tax Incentives for Businesses',
    publisher: 'U.S. Department of Justice',
    kind: 'Federal guidance',
    url: 'https://www.ada.gov/resources/tax-incentives-businesses/',
    checked: '2026-10-11',
  },
  'doj-file': {
    title: 'File a Complaint (ADA)',
    publisher: 'U.S. Department of Justice',
    kind: 'Federal agency',
    url: 'https://www.ada.gov/file-a-complaint/',
    checked: '2026-10-11',
  },
  'doj-report': {
    title: 'Civil Rights Division: Report a Violation',
    publisher: 'U.S. Department of Justice',
    kind: 'Federal agency',
    url: 'https://civilrights.justice.gov/report/',
    checked: '2026-10-11',
  },
  'tx-681-011': {
    title: 'Texas Transportation Code § 681.011: Offenses',
    publisher: 'Justia (text of the 2025 Texas Statutes)',
    kind: 'Texas law',
    url: 'https://law.justia.com/codes/texas/transportation-code/title-7/subtitle-h/chapter-681/section-681-011/',
    checked: '2026-10-11',
  },
  'tx-681-009': {
    title: 'Texas Transportation Code § 681.009: Designating parking spaces',
    publisher: 'Texas Public Law (text of the Texas Statutes)',
    kind: 'Texas law',
    url: 'https://texas.public.law/statutes/tex._transp._code_section_681.009',
    checked: '2026-10-11',
  },
  'tx-681-0101': {
    title: 'Texas Transportation Code § 681.0101: Volunteer enforcement',
    publisher: 'Texas Public Law (text of the Texas Statutes)',
    kind: 'Texas law',
    url: 'https://texas.public.law/statutes/tex._transp._code_section_681.0101',
    checked: '2026-10-11',
  },
  'tx-469-003': {
    title: "Texas Government Code § 469.003: Which buildings the Texas Architectural Barriers Act covers",
    publisher: 'Texas Public Law (text of the Texas Statutes)',
    kind: 'Texas law',
    url: "https://texas.public.law/statutes/tex._gov't_code_section_469.003",
    checked: '2026-10-11',
  },
  'tac-68-104': {
    title: '16 Tex. Admin. Code § 68.104: Accessible parking spaces',
    publisher: 'Cornell Legal Information Institute (text of the Texas Administrative Code)',
    kind: 'Texas rule',
    url: 'https://www.law.cornell.edu/regulations/texas/16-Tex-Admin-Code-SS-68-104',
    checked: '2026-10-11',
  },
  'tdlr-complaint': {
    title: 'TDLR online complaint form',
    publisher: 'Texas Department of Licensing and Regulation',
    kind: 'Texas agency',
    url: 'https://ga.tdlr.texas.gov:1443/form/Complaint',
    checked: '2026-10-11',
  },
  'tdlr-ab': {
    title: 'TDLR Architectural Barriers program',
    publisher: 'Texas Department of Licensing and Regulation',
    kind: 'Texas agency',
    url: 'https://www.tdlr.texas.gov/ab/ab.htm',
    checked: '2026-10-11',
  },
  'gcpd-building': {
    title: 'Building and Physical Accessibility',
    publisher: "Texas Governor's Committee on People with Disabilities",
    kind: 'Texas agency',
    url: 'https://gov.texas.gov/organization/disabilities/building_accessibility',
    checked: '2026-10-11',
  },
  'cdc-1in4': {
    title: 'Disability Impacts All of Us',
    publisher: 'U.S. Centers for Disease Control and Prevention',
    kind: 'Federal data',
    url: 'https://www.cdc.gov/disability-and-health/articles-documents/disability-impacts-all-of-us-infographic.html',
    checked: '2026-10-11',
  },
  'houston-parking-2022': {
    title: 'ParkHouston: Volunteer Parking Enforcement training goes virtual (May 16, 2022)',
    publisher: 'City of Houston',
    kind: 'City',
    url: 'https://www.houstontx.gov/parking/20220516.html',
    checked: '2026-10-11',
  },
  'austin-apep': {
    title: 'Accessible Parking Enforcement Program',
    publisher: 'City of Austin',
    kind: 'City',
    url: 'https://www.austintexas.gov/transportation-public-works/accessible-parking-enforcement-program',
    checked: '2026-10-11',
  },
  'sapd-vip': {
    title: 'SAPD Volunteers in Policing (Public Safety Team)',
    publisher: 'City of San Antonio',
    kind: 'City',
    url: 'https://www.sa.gov/Directory/Departments/SAPD/Community-Programs/VIP',
    checked: '2026-10-11',
  },
  'drtx-apply': {
    title: 'How to apply for services',
    publisher: 'Disability Rights Texas',
    kind: 'Nonprofit legal help',
    url: 'https://disabilityrightstx.org/en/getting-help/how-to-apply-for-services/',
    checked: '2026-10-11',
  },
  'adata-region': {
    title: 'ADA National Network: Contact your region',
    publisher: 'ADA National Network',
    kind: 'Federally funded help center',
    url: 'https://adata.org/find-your-region',
    checked: '2026-10-11',
  },
  'ilru-tx': {
    title: 'Texas Center for Independent Living directory',
    publisher: 'ILRU (Independent Living Research Utilization)',
    kind: 'Directory',
    url: 'https://www.ilru.org/cil-directory/tx',
    checked: '2026-10-11',
  },
  'comptroller-cad': {
    title: 'County directory of appraisal districts',
    publisher: 'Texas Comptroller of Public Accounts',
    kind: 'Texas agency',
    url: 'https://comptroller.texas.gov/taxes/property-tax/county-directory/',
    checked: '2026-10-11',
  },
};

export function source(id) {
  const s = SOURCES[id];
  if (!s) throw new Error(`Unknown source: ${id}`);
  return s;
}
