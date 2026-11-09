import { FigmaIcon } from './FigmaIcon';
import type { FigmaIconName } from '../figmaIcons';
interface IconProps {
  className?: string;
}
function icon(name: FigmaIconName, original = false) {
  return function Icon(props: IconProps) {
    return (
      <FigmaIcon name={name} original={original} className={props.className} />
    );
  };
}
export const ChevronRight = icon('Icon/Chevron right');
export const Walk = icon('Sheet/Shelter details/Walk icon', true);
export const Capacity = icon('Sheet/Shelter details/Capacity icon', true);
export const Copy = icon('Sheet/Shelter details/Copy icon', true);
export const Share = icon('Sheet/Shelter details/Share icon', true);
export const Menu = icon('Button/Menu', true);
export const Search = icon('Utility/Search', true);
export const X = icon('Sheet/Shelter details/Close', true);
export const Check = icon('Utility/Check', true);
export const Spinner = icon('Utility/Spinner');
export const LocationMarker = icon('Search suggestion/Location', true);
export const AddressMarker = icon('Search suggestion/Address', true);
export const MetroMarker = icon('Search suggestion/Metro', true);
export const NoResultsSpot = icon('Icon/Spot/No results', true);
export const OfflineSpot = icon('Icon/Spot/Offline', true);
export function Clock(props: IconProps & { small?: boolean }) {
  return (
    <FigmaIcon
      name={props.small ? 'Utility/Clock small' : 'Utility/Clock'}
      original
      className={props.className}
    />
  );
}
