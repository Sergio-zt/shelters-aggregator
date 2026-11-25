import { test } from 'node:test';
import assert from 'node:assert/strict';
import { adaptShelters, adaptPlaces } from './adapters';
import { shelterPoints } from '../features/shelters/mapModel';
import { matchesFilters, emptyFilters } from '../features/shelters/model';
const row = {
  id: 99,
  name: { uk: 'Укриття 99', en: 'Shelter 99' },
  address: 'API address',
  type: 'Новий тип',
  district_id: 3,
  latitude: '50.55',
  longitude: '30.65',
  facilities: ['wifi', 'electricity', 'unknown-facility'],
};
test('API coordinates and district IDs drive normalized records and GeoJSON', () => {
  const result = adaptShelters(
    [row],
    [{ id: '3', name: { uk: 'Район 3', en: 'District 3' } }],
    'uk',
  );
  assert.equal(result.rejected, 0);
  assert.equal(result.shelters[0].id, '99');
  assert.equal(result.shelters[0].district, 'Район 3');
  assert.deepEqual(result.shelters[0].coordinates, {
    latitude: 50.55,
    longitude: 30.65,
  });
  assert.deepEqual(result.shelters[0].facilities, ['wifi', 'electricity']);
  assert.deepEqual(
    shelterPoints(result.shelters).features[0].geometry.coordinates,
    [30.65, 50.55],
  );
  assert.equal(result.shelters[0].kind, 'Новий тип');
});
test('invalid coordinates, empty IDs and duplicates cannot produce pins', () => {
  const rows = [
    row,
    { ...row, id: 'bad', latitude: 91 },
    { ...row, id: 'empty', longitude: '' },
    { ...row, id: null },
    row,
    null,
  ];
  const result = adaptShelters(rows, [], 'en');
  assert.equal(result.shelters.length, 1);
  assert.equal(result.rejected, 5);
  assert.equal(result.shelters[0].district, 'District not specified');
});
test('embedded district names and unknown access are handled without assuming public access', () => {
  const { shelters } = adaptShelters(
    [
      {
        ...row,
        district: {
          id: 3,
          name: { uk: 'Вбудований район', en: 'Embedded district' },
        },
      },
    ],
    [],
    'en',
  );
  assert.equal(shelters[0].district, 'Embedded district');
  assert.equal(shelters[0].access, 'unknown');
  assert.equal(
    matchesFilters(shelters[0], { ...emptyFilters, everyone: true }),
    false,
  );
  assert.equal(shelters[0].capacity, 'Not specified');
});
test('place IDs/coordinates stay stable while labels change', () => {
  const place = {
    id: 'api-place',
    name: { uk: 'Місце', en: 'Place' },
    description: { uk: 'Адреса', en: 'Address' },
    kind: 'address' as const,
    latitude: 50.4,
    longitude: 30.4,
  };
  const uk = adaptPlaces([place], 'uk')[0],
    en = adaptPlaces([place], 'en')[0];
  assert.equal(uk.id, en.id);
  assert.equal(uk.name, 'Місце');
  assert.equal(en.name, 'Place');
  assert.deepEqual(uk.coordinates, en.coordinates);
});
test('minimal backend points need only ID and valid coordinates, never fixture joins', () => {
  const { shelters, rejected } = adaptShelters(
    [{ id: 'new-point', latitude: 50.62, longitude: 30.78 }],
    [],
    'uk',
  );
  assert.equal(rejected, 0);
  assert.equal(shelters[0].name, 'Укриття new-point');
  assert.deepEqual(
    shelterPoints(shelters).features[0].geometry.coordinates,
    [30.78, 50.62],
  );
});
test('malformed search records cannot crash the suggestions view', () => {
  assert.deepEqual(
    adaptPlaces(
      [null, { id: 'x', latitude: 95, longitude: 30, name: 'Bad' }],
      'uk',
    ),
    [],
  );
});

test('backend multilingual catalog and facility objects adapt', () => {
  const dto = {
    ...row,
    type: { uk: 'Метро', en: 'Metro' },
    capacity_tier: { uk: 'До 100', en: 'Up to 100' },
    operating_hours: { uk: 'цілодобово', en: '24/7' },
    facilities: [
      { id: 4, name: { uk: 'Електрика', en: 'Electricity' } },
      { id: 5, name: { uk: 'Wi-Fi', en: 'Wi-Fi' } },
    ],
  };
  const result = adaptShelters([dto], [], 'en').shelters[0];
  assert.equal(result.kind, 'Metro');
  assert.equal(result.capacity, 'Up to 100');
  assert.equal(result.hours, '24/7');
  assert.deepEqual(result.facilities, ['wifi', 'electricity']);
  assert.equal(result.access, 'unknown');
  assert.equal(
    adaptPlaces([{ ...dto, name: null }], 'uk')[0].name,
    'API address',
  );
});

test('search distinguishes repeated building names with localized addresses', () => {
  const places = adaptPlaces(
    [
      {
        ...row,
        id: 1,
        name: 'Житловий будинок',
        address: { uk: 'Вулиця 1', en: 'Street 1' },
      },
      {
        ...row,
        id: 2,
        name: 'Житловий будинок',
        address: { uk: 'Вулиця 2', en: 'Street 2' },
      },
    ],
    'en',
  );
  assert.equal(places[0].description, 'Street 1 · Новий тип');
  assert.equal(places[1].description, 'Street 2 · Новий тип');
  assert.deepEqual(
    places.map((place) => place.id),
    ['1', '2'],
  );
});

test('address-only search results do not repeat their heading in the subtitle', () => {
  const place = adaptPlaces(
    [{ ...row, name: null, description: 'API address' }],
    'en',
  )[0];
  assert.equal(place.name, 'API address');
  assert.equal(place.description, '');
});
