import { readFacilityFlags } from './facilities';
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
    const legacyAccess: Access =
      dto.access === 'always' ||
      dto.access === 'alerts' ||
      dto.access === 'limited'
        ? dto.access
        : 'unknown';
    const flags = readFacilityFlags(dto.facilities);
    const availability =
      typeof dto.availability === 'boolean'
        ? dto.availability
        : flags.get('availability');
    const open24_7 =
      typeof dto.open_24_7 === 'boolean'
        ? dto.open_24_7
        : flags.get('open_24_7');
    const availableToEveryone =
      availability ??
      (legacyAccess === 'always' || legacyAccess === 'alerts'
        ? true
        : legacyAccess === 'limited'
          ? false
          : undefined);
    const open24DuringAlerts =
      open24_7 ?? (legacyAccess === 'always' ? true : undefined);
    const access: Access =
      availability === false
        ? 'limited'
        : open24_7 === true
          ? 'alerts'
          : availability === true
            ? 'public'
            : legacyAccess;
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
      kind: localizedText(dto.type, locale),
      access,
      availableToEveryone,
      open24DuringAlerts,
      capacity:
        typeof dto.capacity === 'number'
          ? new Intl.NumberFormat(locale).format(dto.capacity)
          : localizedText(dto.capacity_tier ?? dto.capacity, locale) ||
            t('common.unspecified'),
      facilities: facilityKeys.filter((key) => flags.get(key) === true),
      hours:
        localizedText(dto.operating_hours ?? dto.hours, locale) || undefined,
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
    const name =
      localizedText(dto.name, locale) || localizedText(dto.address, locale);
    const placeId = id(dto.id);
    const kind =
      dto.kind === 'metro' || dto.kind === 'street' ? dto.kind : 'address';
    return coordinates && name && placeId
      ? [
          {
            id: placeId,
            name,
            description: [
              localizedText(dto.address, locale),
              localizedText(dto.description ?? dto.type, locale),
            ]
              .filter(
                (text, index, parts) =>
                  text && text !== name && parts.indexOf(text) === index,
              )
              .join(' · '),
            kind,
            coordinates,
            labels: (dto.name || dto.address) as LocalizedText,
          },
        ]
      : [];
  });
}
