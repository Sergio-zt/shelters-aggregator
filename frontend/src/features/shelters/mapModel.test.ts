import { test } from 'node:test';
import assert from 'node:assert/strict';
import { demoShelters } from './fixtures';
import {
  demoShelterCoordinates,
  demoSearchCoordinates,
} from './demoCoordinates';
import { isValidCoordinates, shelterPoints, withinMapBounds } from './mapModel';
test('demo coordinates are separate, valid and cover every fixture', () => {
  assert.deepEqual(
    new Set(Object.keys(demoShelterCoordinates)),
    new Set(demoShelters.map((s) => s.id)),
  );
  for (const shelter of demoShelters) {
    assert.equal(shelter.coordinates, demoShelterCoordinates[shelter.id]);
    assert.ok(isValidCoordinates(shelter.coordinates));
    assert.ok(
      shelter.coordinates.latitude > 50 && shelter.coordinates.latitude < 51,
    );
    assert.ok(
      shelter.coordinates.longitude > 30 && shelter.coordinates.longitude < 31,
    );
  }
  for (const point of Object.values(demoSearchCoordinates))
    assert.ok(isValidCoordinates(point));
});
test('GeoJSON uses longitude then latitude, and keeps IDs for marker selection', () => {
  const result = shelterPoints(demoShelters);
  assert.equal(result.features.length, demoShelters.length);
  for (const [i, feature] of result.features.entries()) {
    assert.equal(feature.properties.shelterId, demoShelters[i].id);
    assert.deepEqual(feature.geometry.coordinates, [
      demoShelters[i].coordinates.longitude,
      demoShelters[i].coordinates.latitude,
    ]);
  }
});
test('the selected point is excluded from clustering and empty/invalid sets are safe', () => {
  const result = shelterPoints(demoShelters, demoShelters[0].id);
  assert.equal(result.features.length, demoShelters.length - 1);
  assert.ok(
    result.features.every((f) => f.properties.shelterId !== demoShelters[0].id),
  );
  assert.equal(shelterPoints([]).features.length, 0);
  assert.equal(shelterPoints([demoShelters[0]]).features.length, 1);
  assert.equal(
    shelterPoints([
      { ...demoShelters[0], coordinates: { latitude: NaN, longitude: 30 } },
    ]).features.length,
    0,
  );
  assert.equal(isValidCoordinates({ latitude: 91, longitude: 30 }), false);
});
test('searching a visible area includes its edges and excludes distant demo points', () => {
  const bounds = { west: 30.36, east: 30.38, south: 50.45, north: 50.46 };
  assert.ok(withinMapBounds(demoShelters[0].coordinates, bounds));
  assert.equal(withinMapBounds(demoShelters[3].coordinates, bounds), false);
  assert.ok(
    withinMapBounds({ latitude: bounds.north, longitude: bounds.west }, bounds),
  );
  assert.equal(
    withinMapBounds({ latitude: NaN, longitude: 30.37 }, bounds),
    false,
  );
});
test('bounds crossing the antimeridian do not incorrectly include the opposite side', () => {
  const bounds = { west: 170, east: -170, south: -10, north: 10 };
  assert.ok(withinMapBounds({ latitude: 0, longitude: 179 }, bounds));
  assert.ok(withinMapBounds({ latitude: 0, longitude: -179 }, bounds));
  assert.equal(withinMapBounds({ latitude: 0, longitude: 0 }, bounds), false);
});
