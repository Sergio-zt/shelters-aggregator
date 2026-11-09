import type { Translator, TranslationKey } from './catalog';
const labels: Record<string, TranslationKey> = {
  metro: 'type.Metro',
  'metro station': 'type.Metro',
  метро: 'type.Metro',
  'станція метро': 'type.Metro',
  basement: 'type.Basement',
  підвал: 'type.Basement',
  underpass: 'type.Underpass',
  'підземний перехід': 'type.Underpass',
  'semi basement': 'type.Semi-basement',
  напівпідвал: 'type.Semi-basement',
  parking: 'type.Parking',
  'car park': 'type.Parking',
  паркінг: 'type.Parking',
  парковка: 'type.Parking',
  'підземний паркінг': 'type.Parking',
  other: 'type.Other',
  інше: 'type.Other',
};
export function shelterTypeLabel(name: string, t: Translator) {
  const key = name
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, ' ');
  return Object.hasOwn(labels, key)
    ? t(labels[key])
    : name || t('common.unspecified');
}
