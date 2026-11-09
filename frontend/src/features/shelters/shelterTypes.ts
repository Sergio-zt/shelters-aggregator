import type { FigmaIconName } from '../../figmaIcons';

type PinGroup = 'Metro' | 'Parking' | 'Basement and others';
const pinGroups: Record<string, PinGroup> = {
  metro: 'Metro',
  'metro station': 'Metro',
  метро: 'Metro',
  'станція метро': 'Metro',
  parking: 'Parking',
  'car park': 'Parking',
  паркінг: 'Parking',
  парковка: 'Parking',
  'підземний паркінг': 'Parking',
};

// Type names come from the backend; only the icon lookup is normalized.
// Preserve the original name for cards, details and API requests.
export function getShelterPinName(
  typeName: string | null | undefined,
  selected = false,
): FigmaIconName {
  const normalized = (typeName ?? '')
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, ' ');
  const group = Object.hasOwn(pinGroups, normalized)
    ? pinGroups[normalized]
    : 'Basement and others';
  return `Map pin/${group}, ${selected ? 'Selected' : 'Default'}`;
}
