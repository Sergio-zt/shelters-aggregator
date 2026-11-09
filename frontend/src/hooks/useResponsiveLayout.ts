import { useSyncExternalStore } from 'react';

const panelQuery = '(min-width: 768px)';
const subscribe = (onChange: () => void) => {
  const media = window.matchMedia(panelQuery);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
};
const getSnapshot = () => window.matchMedia(panelQuery).matches;

// Figma: Handoff · Responsive layout. CSS owns sizing; JS switches behaviour.
export function useResponsiveLayout() {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
