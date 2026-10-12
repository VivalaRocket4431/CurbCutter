import { test } from 'node:test';
import assert from 'node:assert/strict';
import { requiredAccessible, requiredVan, assessParking, parkingSentence, TABLE_ROWS } from '../../public/js/lib/parking.js';

// Every row of Table 208.2 as printed in the U.S. Access Board guide (total spaces -> accessible, van).
const ACCESS_BOARD_TABLE = [
  [25, 1, 1], [50, 2, 1], [75, 3, 1], [100, 4, 1], [150, 5, 1], [200, 6, 1], [300, 7, 2], [400, 8, 2],
  [500, 9, 2], [550, 11, 2], [600, 12, 2], [650, 13, 3], [700, 14, 3], [750, 15, 3], [800, 16, 3],
  [850, 17, 3], [900, 18, 3], [950, 19, 4], [1000, 20, 4], [1100, 21, 4], [1200, 22, 4], [1300, 23, 4],
  [1400, 24, 4], [1500, 25, 5], [1600, 26, 5], [1700, 27, 5], [1800, 28, 5], [1900, 29, 5], [2000, 30, 5],
];

test('matches every row of the Access Board table (upper edge of each row)', () => {
  for (const [total, acc, van] of ACCESS_BOARD_TABLE) {
    assert.equal(requiredAccessible(total), acc, `accessible for ${total}`);
    assert.equal(requiredVan(requiredAccessible(total)), van, `van for ${total}`);
  }
});

test('lower edges of rows', () => {
  assert.equal(requiredAccessible(1), 1);
  assert.equal(requiredAccessible(26), 2);
  assert.equal(requiredAccessible(101), 5);
  assert.equal(requiredAccessible(501), 11); // 2% of 501 = 10.02, rounded up
  assert.equal(requiredAccessible(1001), 21); // 20 + 1 for the fraction of 100 over 1000
});

test('medical facility rules', () => {
  assert.equal(requiredAccessible(80, 'hospital_outpatient'), 8);
  assert.equal(requiredAccessible(81, 'hospital_outpatient'), 9);
  assert.equal(requiredAccessible(40, 'rehab'), 8);
  assert.equal(requiredAccessible(41, 'rehab'), 9);
});

test('nonsense input never throws', () => {
  for (const v of [undefined, null, '', 'abc', -5, 0, NaN]) assert.equal(requiredAccessible(v), 0);
  assert.equal(requiredVan(0), 0);
  assert.deepEqual(assessParking({}), { known: false, facility: 'standard' });
});

test('ranges give the same answer as exact counts', () => {
  TABLE_ROWS.forEach((row, i) => {
    const a = assessParking({ totalRange: i });
    assert.equal(a.required, requiredAccessible(row.max));
    assert.equal(a.required, requiredAccessible(row.min));
  });
});

test('shortfall math', () => {
  const a = assessParking({ total: '120', accessible: '2', van: '0' });
  assert.equal(a.required, 5);
  assert.equal(a.vanRequired, 1);
  assert.equal(a.shortBy, 3);
  assert.equal(a.vanShortBy, 1);
  assert.equal(a.meets, false);
  const ok = assessParking({ total: 40, accessible: 2, van: 1 });
  assert.equal(ok.meets, true);
});

test('sentence reads naturally', () => {
  const s = parkingSentence({ total: 120, accessible: 2, van: 0 });
  assert.match(s, /about 120 parking spaces/);
  assert.match(s, /at least 5 accessible spaces, including 1 van-accessible space\./);
  assert.match(s, /I counted 2 accessible spaces \(0 van-accessible\)\./);
  assert.equal(parkingSentence({}), '');
  assert.match(parkingSentence({ total: 30, accessible: 1 }), /at least 2 accessible spaces, including 1 van-accessible space\. I counted 1 accessible space\./);
});
