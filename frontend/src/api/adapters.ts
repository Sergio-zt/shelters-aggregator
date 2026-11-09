import { createTranslator, localizedText, type Locale } from '../i18n/catalog';
import { isValidCoordinates } from '../features/shelters/mapModel';
import {
  facilityKeys,
  type Access,
  type Shelter,
} from '../features/shelters/model';
import type { Coordinates } from '../geo';
import type { LocalizedText, PlaceDto } from './types';
const record = (value: unknown): Record<string, unknown> | null =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
const id = (value: unknown): string =>
  (typeof value === 'number' && Number.isFinite(value)) ||
  (typeof value === 'string' && value.trim())
    ? String(value)
    : '';
const numeric = (value: unknown): number =>
  typeof value === 'number'
    ? value
    : typeof value === 'string' && value.trim()
      ? Number(value)
      : NaN;
export function readCoordinates(
  value: Record<string, unknown>,
): Coordinates | null {
  const coordinates = {
    latitude: numeric(value.latitude),
    longitude: numeric(value.longitude),
  };
  return isValidCoordinates(coordinates) ? coordinates : null;
}
export function adaptShelters(
  rows: unknown[],
  districts: unknown[],
  locale: Locale,
) {
  const t = createTranslator(locale);
  const districtNames = new Map<string, string>();
  for (const row of districts) {
    const dto = record(row);
    if (dto && id(dto.id))
      districtNames.set(id(dto.id), localizedText(dto.name, locale));
  }
  const shelters: Shelter[] = [];
  const seen = new Set<string>();
  let rejected = 0;
  for (const row of rows) {
    const dto = record(row);
    const coordinates = dto && readCoordinates(dto);
    const shelterId = dto && id(dto.id);
    const name = dto && localizedText(dto.name, locale);
    if (!dto || !coordinates || !shelterId || seen.has(shelterId)) {
      rejected++;
      continue;
    }
    seen.add(shelterId);
    const embedded = record(dto.district);
    const district =
      embedded && 'name' in embedded
        ? localizedText(embedded.name, locale)
        : localizedText(dto.district, locale);
    const districtId = id(dto.district_id) || id(embedded?.id);
    const access: Access =
      dto.access === 'always' ||
      dto.access === 'alerts' ||
      dto.access === 'limited'
        ? dto.access
        : 'unknown';
    const facilities = Array.isArray(dto.facilities) ? dto.facilities : [];
    shelters.push({
      id: shelterId,
      name: name || t('shelter.defaultName', { id: shelterId }),
      coordinates,
      address: localizedText(dto.address, locale),
      district:
        district ||
        districtNames.get(districtId) ||
        t('common.unknownDistrict'),
      districtId: districtId || undefined,
      kind: typeof dto.type === 'string' ? dto.type : '',
      access,
      capacity:
        typeof dto.capacity === 'number'
          ? new Intl.NumberFormat(locale).format(dto.capacity)
          : localizedText(dto.capacity, locale) || t('common.unspecified'),
      facilities: facilityKeys.filter((key) => facilities.includes(key)),
      hours: localizedText(dto.hours, locale) || undefined,
      exampleWalk: localizedText(dto.example_walk, locale) || undefined,
    });
  }
  return { shelters, rejected };
}
export interface SearchPlace {
  id: string;
  name: string;
  description: string;
  kind: PlaceDto['kind'];
  coordinates: Coordinates;
  labels: LocalizedText;
}
export function adaptPlaces(rows: unknown[], locale: Locale): SearchPlace[] {
  return rows.flatMap((row) => {
    const dto = record(row);
    if (!dto) return [];
    const coordinates = readCoordinates(dto);
    const name = localizedText(dto.name, locale);
    const placeId = id(dto.id);
    const kind =
      dto.kind === 'metro' || dto.kind === 'street' ? dto.kind : 'address';
    return coordinates && name && placeId
      ? [
          {
            id: placeId,
            name,
            description: localizedText(dto.description, locale),
            kind,
            coordinates,
            labels: dto.name as LocalizedText,
          },
        ]
      : [];
  });
}
