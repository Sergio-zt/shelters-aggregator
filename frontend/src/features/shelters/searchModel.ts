import en from '../../i18n/en.json';
import type { TranslationKey } from '../../i18n/catalog';
export interface SearchLocation {
  id: string;
  name: string;
  description: string;
  kind: 'metro' | 'street' | 'address';
}
const seeds = [
  ['zhytomyrska', 'metro'],
  ['velyka-zhytomyrska', 'street'],
  ['mala-zhytomyrska', 'street'],
  ['velyka-8', 'address'],
  ['velyka-20', 'address'],
] as const;
export const searchLocations: SearchLocation[] = seeds.map(([id, kind]) => ({
  id,
  kind,
  name: en[`place.${id}.name` as TranslationKey],
  description: en[`place.${id}.description` as TranslationKey],
}));
// Pure lookup retained for fixture regression tests; runtime search goes through AppApi.
export function findLocations(query: string) {
  const normalized = query
    .trim()
    .toLowerCase()
    .replace(/,\s*kyiv$/, '');
  return searchLocations.filter((location) =>
    location.name.toLowerCase().includes(normalized),
  );
}
