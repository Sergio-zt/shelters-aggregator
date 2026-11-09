import type { Coordinates } from '../../geo';
export type Access = 'alerts' | 'always' | 'limited' | 'unknown';
export type Facility = 'ramp' | 'pets' | 'wifi' | 'electricity' | 'toilet';
export type ShelterKind =
  'Metro' | 'Basement' | 'Underpass' | 'Semi-basement' | 'Parking' | 'Other';
export interface Shelter {
  id: string;
  name: string;
  address: string;
  district: string;
  districtId?: string;
  /** Backend type name, preserved for display; pin selection handles aliases. */
  kind: string;
  access: Access;
  capacity: string;
  facilities: Facility[];
  hours?: string;
  /** Sample copy from the design, not a calculated walking route. */
  exampleWalk?: string;
  coordinates: Coordinates;
}
export interface Filters {
  everyone: boolean;
  facilities: Facility[];
  always: boolean;
}
export const emptyFilters: Filters = {
  everyone: false,
  facilities: [],
  always: false,
};
export const facilityKeys: Facility[] = [
  'ramp',
  'pets',
  'wifi',
  'electricity',
  'toilet',
];
export function matchesFilters(shelter: Shelter, filters: Filters) {
  return (
    (!filters.everyone ||
      shelter.access === 'always' ||
      shelter.access === 'alerts') &&
    (!filters.always || shelter.access === 'always') &&
    filters.facilities.every((facility) =>
      shelter.facilities.includes(facility),
    )
  );
}
export function countFilters(filters: Filters) {
  return (
    Number(filters.everyone) +
    Number(filters.always) +
    filters.facilities.length
  );
}
