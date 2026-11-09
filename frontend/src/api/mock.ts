import {
  dictionaries,
  type TranslationKey,
  type Locale,
} from '../i18n/catalog';
import { initialShelters } from '../features/shelters/fixtures';
import { searchLocations } from '../features/shelters/searchModel';
import { demoSearchCoordinates } from '../features/shelters/demoCoordinates';
import type { AppApi, RequestOptions, ShelterDto, PlaceDto } from './types';
export const preferenceStorageKey = 'safeplace.mock.preferences.v1';
interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}
const pair = (key: string) => ({
  en: dictionaries.en[key as TranslationKey],
  uk: dictionaries.uk[key as TranslationKey],
});
const places: PlaceDto[] = searchLocations.map((place) => {
  const placeId = place.id;
  const coordinates = demoSearchCoordinates[placeId];
  return {
    id: placeId,
    name: pair(`place.${placeId}.name`),
    description: pair(`place.${placeId}.description`),
    kind: place.kind,
    ...coordinates,
  };
});
function browserStorage(): StorageLike | undefined {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}
export function createMockApi({
  storage = browserStorage(),
  delayMs = 180,
}: { storage?: StorageLike; delayMs?: number } = {}): AppApi {
  let preferences: { language: Locale } = { language: 'uk' };
  const request = <T>(action: () => T, options?: RequestOptions) =>
    new Promise<T>((resolve, reject) => {
      const abort = () => {
        clearTimeout(timer);
        reject(new DOMException('Aborted', 'AbortError'));
      };
      const timer = setTimeout(() => {
        options?.signal?.removeEventListener('abort', abort);
        if (options?.signal?.aborted) return abort();
        try {
          resolve(action());
        } catch (error) {
          reject(error);
        }
      }, delayMs);
      if (options?.signal?.aborted) abort();
      else options?.signal?.addEventListener('abort', abort, { once: true });
    });
  return {
    getPreferences: (options) =>
      request(() => {
        try {
          const saved = JSON.parse(
            storage?.getItem(preferenceStorageKey) ?? 'null',
          );
          if (saved?.language === 'uk' || saved?.language === 'en')
            preferences = { language: saved.language };
        } catch {
          /* Missing/corrupt/private-mode storage uses the mock server default. */
        }
        return { ...preferences };
      }, options),
    updateLanguage: (language, options) =>
      request(() => {
        preferences = { language };
        try {
          storage?.setItem(preferenceStorageKey, JSON.stringify(preferences));
        } catch {
          /* In-memory mock preference still works for this session. */
        }
        return { ...preferences };
      }, options),
    getDistricts: (options) =>
      request(
        () => [{ id: 'sviatoshyn', name: pair('district.sviatoshyn') }],
        options,
      ),
    getShelters: (options) =>
      request(
        () =>
          initialShelters.map(
            (s) =>
              ({
                id: s.id,
                name: pair(`demo.${s.id}.name`),
                address: pair(`demo.${s.id}.address`),
                district_id: 'sviatoshyn',
                type: s.kind,
                access: s.access,
                capacity: pair(`demo.${s.id}.capacity`),
                facilities: [...s.facilities],
                hours: pair(`demo.${s.id}.hours`),
                example_walk: pair(`demo.${s.id}.walk`),
                ...s.coordinates,
              }) satisfies ShelterDto,
          ),
        options,
      ),
    searchPlaces: (query, options) =>
      request(() => {
        const normalized = query
          .trim()
          .toLocaleLowerCase()
          .replace(/,\s*(kyiv|київ)$/u, '');
        return structuredClone(
          places.filter((p) =>
            Object.values(p.name).some((name) =>
              name.toLocaleLowerCase().includes(normalized),
            ),
          ),
        );
      }, options),
    submitFeedback: (input, options) =>
      request(() => {
        if (!input.comment.trim()) throw new Error('Comment is required');
      }, options),
    suggestShelter: (input, options) =>
      request(() => {
        if (!input.address.trim()) throw new Error('Address is required');
      }, options),
  };
}
