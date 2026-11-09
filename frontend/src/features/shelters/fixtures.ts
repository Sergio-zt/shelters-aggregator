import type { Shelter } from './model';
import { demoShelterCoordinates } from './demoCoordinates';
import en from '../../i18n/en.json';
import type { TranslationKey } from '../../i18n/catalog';
// Mock-only metadata. No component reads fixtures directly.
const seeds: Pick<Shelter, 'id' | 'kind' | 'access' | 'facilities'>[] = [
  {
    id: 'metro-zhytomyrska',
    kind: 'Metro',
    access: 'alerts',
    facilities: ['pets', 'wifi', 'electricity'],
  },
  { id: 'basement-111', kind: 'Basement', access: 'always', facilities: [] },
  {
    id: 'lvivska-23',
    kind: 'Basement',
    access: 'alerts',
    facilities: ['wifi'],
  },
  {
    id: 'metro-sviatoshyn',
    kind: 'Metro',
    access: 'alerts',
    facilities: ['wifi', 'electricity'],
  },
  {
    id: 'basement-144',
    kind: 'Basement',
    access: 'always',
    facilities: ['pets'],
  },
  {
    id: 'school-51',
    kind: 'Basement',
    access: 'limited',
    facilities: ['ramp'],
  },
  {
    id: 'parking',
    kind: 'Parking',
    access: 'always',
    facilities: ['ramp', 'pets', 'electricity', 'toilet'],
  },
  {
    id: 'underpass',
    kind: 'Underpass',
    access: 'always',
    facilities: ['pets'],
  },
];
export const demoShelters: Shelter[] = seeds.map((seed) => {
  const text = (field: string) =>
    en[`demo.${seed.id}.${field}` as TranslationKey];
  return {
    ...seed,
    name: text('name'),
    address: text('address'),
    district: en['district.sviatoshyn'],
    capacity: text('capacity'),
    exampleWalk: text('walk') || undefined,
    hours: text('hours') || undefined,
    coordinates: demoShelterCoordinates[seed.id],
  };
});
export const initialShelters = [
  demoShelters[3],
  demoShelters[4],
  ...demoShelters.filter((_, i) => i !== 3 && i !== 4),
];
