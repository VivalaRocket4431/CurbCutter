// Minimum accessible parking under the 2010 ADA Standards, Table 208.2 and 208.2.1-208.2.4.
// Pure functions: no DOM, so they run in tests and in the app.

export const FACILITY_TYPES = {
  standard: 'Most businesses',
  hospital_outpatient: 'Hospital outpatient clinic (10% rule)',
  rehab: 'Outpatient physical therapy or rehab for mobility (20% rule)',
};

// Rows of Table 208.2 that have a fixed answer. Used for the "I'm not sure of the exact count" picker.
export const TABLE_ROWS = [
  { min: 1, max: 25, required: 1 },
  { min: 26, max: 50, required: 2 },
  { min: 51, max: 75, required: 3 },
  { min: 76, max: 100, required: 4 },
  { min: 101, max: 150, required: 5 },
  { min: 151, max: 200, required: 6 },
  { min: 201, max: 300, required: 7 },
  { min: 301, max: 400, required: 8 },
  { min: 401, max: 500, required: 9 },
];

export function requiredAccessible(total, facility = 'standard') {
  const n = Math.floor(Number(total));
  if (!Number.isFinite(n) || n <= 0) return 0;
  if (facility === 'hospital_outpatient') return Math.ceil(n * 0.1);
  if (facility === 'rehab') return Math.ceil(n * 0.2);
  for (const row of TABLE_ROWS) if (n <= row.max) return row.required;
  if (n <= 1000) return Math.ceil(n * 0.02);
  return 20 + Math.ceil((n - 1000) / 100);
}

// 208.2.4: at least 1 of every 6 (or fraction of 6) accessible spaces must be van-accessible.
export function requiredVan(accessibleRequired) {
  const n = Math.floor(Number(accessibleRequired));
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.ceil(n / 6);
}

function toCount(v) {
  if (v === '' || v == null) return null;
  const n = Math.floor(Number(v));
  return Number.isFinite(n) && n >= 0 ? n : null;
}

// Turn what the user counted into a plain-language result.
// parking = { total, totalRange, accessible, van, facility }
// totalRange is an index into TABLE_ROWS when the user picked a range instead of a number.
export function assessParking(parking = {}) {
  const facility = FACILITY_TYPES[parking.facility] ? parking.facility : 'standard';
  let total = toCount(parking.total);
  let totalLabel = total != null ? `about ${total.toLocaleString('en-US')}` : null;
  let required = null;

  if (total == null && parking.totalRange != null && TABLE_ROWS[parking.totalRange] && facility === 'standard') {
    const row = TABLE_ROWS[parking.totalRange];
    required = row.required;
    totalLabel = `${row.min} to ${row.max}`;
  } else if (total != null && total > 0) {
    required = requiredAccessible(total, facility);
  }

  if (required == null) {
    return { known: false, facility };
  }

  const vanRequired = requiredVan(required);
  const accessible = toCount(parking.accessible);
  const van = toCount(parking.van);
  const shortBy = accessible == null ? null : Math.max(0, required - accessible);
  const vanShortBy = van == null ? null : Math.max(0, vanRequired - van);
  const meets = shortBy === 0 && (vanShortBy === 0 || vanShortBy == null);

  return {
    known: true,
    facility,
    totalLabel,
    required,
    vanRequired,
    accessible,
    van,
    shortBy,
    vanShortBy,
    meets,
  };
}

function plural(n, one, many) {
  return `${n} ${n === 1 ? one : many}`;
}

// One sentence for letters and complaints. Returns '' when there is not enough information.
export function parkingSentence(parking) {
  const a = assessParking(parking);
  if (!a.known) return '';
  const rule = a.facility === 'hospital_outpatient'
    ? 'the 2010 ADA Standards (208.2.1) call for at least 10% of patient and visitor spaces'
    : a.facility === 'rehab'
      ? 'the 2010 ADA Standards (208.2.2) call for at least 20% of patient and visitor spaces'
      : 'the 2010 ADA Standards (Table 208.2) call for';
  const need = `${plural(a.required, 'accessible space', 'accessible spaces')}, including ${plural(a.vanRequired, 'van-accessible space', 'van-accessible spaces')}`;
  let found = '';
  if (a.accessible != null) {
    found = ` I counted ${plural(a.accessible, 'accessible space', 'accessible spaces')}`;
    if (a.van != null) found += ` (${a.van} van-accessible)`;
    found += '.';
  }
  if (a.facility === 'standard') {
    return `This lot has ${a.totalLabel} parking spaces. For a lot this size, ${rule} at least ${need}.${found}`;
  }
  return `This lot has ${a.totalLabel} patient and visitor spaces, so ${rule}: at least ${need}.${found}`;
}
