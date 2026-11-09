import { useEffect, useState } from 'react';
import type { Map, MapLibreEvent } from 'maplibre-gl';

// Wait for the gesture and its inertia to finish before starting the idle delay.
export function useMapIdle(map: Map | null, delay = 5000) {
  const [idle, setIdle] = useState(true);
  useEffect(() => {
    if (!map) return;
    let manualMove = false;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const start = (event: MapLibreEvent) => {
      if (!event.originalEvent) return;
      manualMove = true;
      clearTimeout(timeout);
      setIdle(false);
    };
    const end = () => {
      if (!manualMove) return;
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        manualMove = false;
        setIdle(true);
      }, delay);
    };
    map.on('movestart', start);
    map.on('moveend', end);
    return () => {
      clearTimeout(timeout);
      map.off('movestart', start);
      map.off('moveend', end);
    };
  }, [map, delay]);
  return idle;
}
