import type { FeatureCollection, Point } from 'geojson';
import type { Coordinates } from '../../geo';
import type { Shelter } from './model';
export interface MapBounds {
  west: number;
  south: number;
  east: number;
  north: number;
}
export function isValidCoordinates(point: Coordinates) {
  return (
    Number.isFinite(point.latitude) &&
    Number.isFinite(point.longitude) &&
    Math.abs(point.latitude) <= 90 &&
    Math.abs(point.longitude) <= 180
  );
}
export function withinMapBounds(point: Coordinates, bounds: MapBounds) {
  return (
    isValidCoordinates(point) &&
    point.latitude >= bounds.south &&
    point.latitude <= bounds.north &&
    (bounds.west <= bounds.east
      ? point.longitude >= bounds.west && point.longitude <= bounds.east
      : point.longitude >= bounds.west || point.longitude <= bounds.east)
  );
}
export function shelterPoints(
  shelters: Shelter[],
  selected?: string,
): FeatureCollection<Point, { shelterId: string }> {
  return {
    type: 'FeatureCollection',
    features: shelters
      .filter((s) => s.id !== selected && isValidCoordinates(s.coordinates))
      .map((s) => ({
        type: 'Feature',
        id: s.id,
        geometry: {
          type: 'Point',
          coordinates: [s.coordinates.longitude, s.coordinates.latitude],
        },
        properties: { shelterId: s.id },
      })),
  };
}

export function mapCameraPadding(height: number, bottomInset: number) {
  return {
    top: 36,
    bottom: Math.min(bottomInset, Math.max(0, height - 150)) + 16,
    left: 24,
    right: 24,
  };
}
