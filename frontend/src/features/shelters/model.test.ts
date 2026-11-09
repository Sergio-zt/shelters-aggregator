import { test } from 'node:test';
import assert from 'node:assert/strict';
import { demoShelters } from './fixtures';
import { emptyFilters, matchesFilters, type Filters } from './model';
test('combining access, 24/7 and ramp keeps only the accessible public parking', () => {
  const filters: Filters = {
    everyone: true,
    always: true,
    facilities: ['ramp'],
  };
  assert.deepEqual(
    demoShelters.filter((s) => matchesFilters(s, filters)).map((s) => s.id),
    ['parking'],
  );
});
test('facility filters require every selected facility and can produce an empty result', () => {
  assert.deepEqual(
    demoShelters.filter((s) =>
      matchesFilters(s, {
        everyone: false,
        always: true,
        facilities: ['wifi'],
      }),
    ),
    [],
  );
});
test('reset includes limited-access records again', () => {
  const publicRecords = demoShelters.filter((s) =>
    matchesFilters(s, { ...emptyFilters, everyone: true }),
  );
  assert.ok(!publicRecords.some((s) => s.id === 'school-51'));
  assert.equal(
    demoShelters.filter((s) => matchesFilters(s, emptyFilters)).length,
    demoShelters.length,
  );
});
