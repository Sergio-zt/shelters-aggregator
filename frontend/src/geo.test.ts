import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { accuracyPolygon, formatDistance, haversine } from './geo.ts';
test('Haversine returns zero for identical positions and a plausible Kyiv distance', () => {
  const origin = { latitude: 50.4501, longitude: 30.5234 };
  assert.equal(haversine(origin, origin), 0);
  const other = { latitude: 50.4453, longitude: 30.5181 };
  const distance = haversine(origin, other);
  assert.ok(distance > 640 && distance < 660);
  assert.equal(haversine(origin, other), haversine(other, origin));
  assert.ok(
    Math.abs(
      haversine({ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 1 }) -
        111195,
    ) < 1,
  );
});
test('accuracy polygon closes and has the requested north/south radius', () => {
  const p = { latitude: 50.45, longitude: 30.52, accuracy: 100 };
  const ring = accuracyPolygon(p).geometry.coordinates[0];
  assert.equal(ring.length, 65);
  assert.ok(Math.abs(ring[0][0] - ring[64][0]) < 1e-10);
  assert.ok(Math.abs(ring[0][1] - ring[64][1]) < 1e-10);
  const distance = haversine(p, {
    longitude: ring[16][0],
    latitude: ring[16][1],
  });
  assert.ok(distance > 99 && distance < 101);
});
test('distance formatting uses meters then kilometers', () => {
  assert.equal(formatDistance(650), '650 м');
  assert.equal(formatDistance(1500), '1,5 км');
  assert.equal(formatDistance(1500, 'en'), '1.5 km');
  assert.equal(formatDistance(650, 'en'), '650 m');
});
