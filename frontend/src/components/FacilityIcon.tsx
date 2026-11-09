import type { Facility } from '../features/shelters/model';
import { FigmaIcon } from './FigmaIcon';
import type { FigmaIconName } from '../figmaIcons';
const body: Record<Facility, FigmaIconName> = {
  ramp: 'Facility/Ramp',
  pets: 'Facility/Pets',
  wifi: 'Facility/Wi-Fi',
  electricity: 'Facility/Power',
  toilet: 'Facility/WC',
};
const badges: Record<Facility, FigmaIconName> = {
  ramp: 'Icon/Amenity/Ramp',
  pets: 'Icon/Amenity/Pets',
  wifi: 'Icon/Amenity/Wi-Fi',
  electricity: 'Icon/Amenity/Power',
  toilet: 'Icon/Amenity/WC',
};
export function FacilityIcon({
  facility,
  variant = 'body',
}: {
  facility: Facility;
  variant?: 'body' | 'badge';
}) {
  return (
    <FigmaIcon
      name={variant === 'badge' ? badges[facility] : body[facility]}
      className="facility-icon"
    />
  );
}
