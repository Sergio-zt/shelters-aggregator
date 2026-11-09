import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findLocations } from './searchModel';
test('the first result retains its actual street type after filtering', () => {
  const results = findLocations('  Mala  ');
  assert.equal(results[0].name, 'Mala Zhytomyrska St');
  assert.equal(results[0].kind, 'street');
});
test('selected places can be found again with their city suffix', () => {
  assert.equal(findLocations('Zhytomyrska, Kyiv')[0].name, 'Zhytomyrska');
  assert.deepEqual(findLocations('Zzzzz'), []);
});
