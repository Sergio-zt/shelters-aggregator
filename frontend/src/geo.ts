import { createTranslator, type Locale } from './i18n/catalog';
export interface Coordinates {
  latitude: number;
  longitude: number;
}
export interface UserLocation extends Coordinates {
  accuracy: number;
}
export function haversine(
  a: Pick<UserLocation, 'latitude' | 'longitude'>,
  b: Pick<UserLocation, 'latitude' | 'longitude'>,
): number {
  const rad = (n: number) => (n * Math.PI) / 180;
  const dlat = rad(b.latitude - a.latitude),
    dlon = rad(b.longitude - a.longitude);
  const h =
    Math.sin(dlat / 2) ** 2 +
    Math.cos(rad(a.latitude)) *
      Math.cos(rad(b.latitude)) *
      Math.sin(dlon / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(Math.max(0, 1 - h)));
}
export function formatDistance(m: number, locale: Locale = 'uk') {
  const t = createTranslator(locale);
  return m < 1000
    ? t('distance.meters', { value: Math.round(m / 10) * 10 })
    : t('distance.kilometers', {
        value: new Intl.NumberFormat(locale, {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        }).format(m / 1000),
      });
}
export function accuracyPolygon(p: UserLocation): Feature<Polygon> {
  const points = Array.from({ length: 65 }, (_, i) => {
    const angle = (i / 64) * 2 * Math.PI;
    return [
      p.longitude +
        (Math.cos(angle) * p.accuracy) /
          (111320 * Math.cos((p.latitude * Math.PI) / 180)),
      p.latitude + (Math.sin(angle) * p.accuracy) / 111320,
    ];
  });
  return {
    type: 'Feature',
    properties: {},
    geometry: { type: 'Polygon', coordinates: [points] },
  };
}
import type { Feature, Polygon } from 'geojson';
