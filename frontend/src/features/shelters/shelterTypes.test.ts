import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getShelterPinName } from './shelterTypes';

test('backend type names select the same pins in Ukrainian and English', () => {
  for (const name of ['Metro', ' метро ', 'СТАНЦІЯ МЕТРО', 'metro_station']) {
    assert.equal(getShelterPinName(name), 'Map pin/Metro, Default');
  }
  for (const name of ['Parking', 'Паркінг', 'Підземний паркінг', 'car park']) {
    assert.equal(getShelterPinName(name), 'Map pin/Parking, Default');
  }
});
test('other, missing and unknown backend types have the generic shelter pin', () => {
  for (const name of [
    'Basement',
    'Підвал',
    'Напівпідвал',
    'Новий тип',
    '',
    null,
    undefined,
    'constructor',
  ]) {
    assert.equal(
      getShelterPinName(name),
      'Map pin/Basement and others, Default',
    );
  }
});
test('selection keeps the type-specific original Figma variant', () => {
  assert.equal(getShelterPinName('Метро', true), 'Map pin/Metro, Selected');
  assert.equal(getShelterPinName('Паркінг', true), 'Map pin/Parking, Selected');
  assert.equal(
    getShelterPinName('Невідомий тип', true),
    'Map pin/Basement and others, Selected',
  );
});
