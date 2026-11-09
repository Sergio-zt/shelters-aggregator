import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Marker, type Map } from 'maplibre-gl';
export function MapMarker({
  map,
  longitude,
  latitude,
  children,
  elevated = false,
}: {
  map: Map;
  longitude: number;
  latitude: number;
  children: ReactNode;
  elevated?: boolean;
}) {
  const element = useMemo(() => {
    const node = document.createElement('div');
    node.className = 'map-marker-host';
    return node;
  }, []);
  const marker = useRef<Marker | null>(null);
  const coordinates = useRef<[number, number]>([longitude, latitude]);
  coordinates.current = [longitude, latitude];
  useEffect(() => {
    const instance = new Marker({
      element,
      anchor: 'bottom',
      subpixelPositioning: true,
    })
      .setLngLat(coordinates.current)
      .addTo(map);
    marker.current = instance;
    return () => {
      instance.remove();
      marker.current = null;
    };
    // Coordinates are updated separately without recreating the marker.
  }, [map, element]);
  useEffect(() => {
    marker.current?.setLngLat([longitude, latitude]);
  }, [map, longitude, latitude]);
  useEffect(() => {
    element.style.zIndex = elevated ? '5' : '1';
  }, [element, elevated]);
  return createPortal(children, element);
}
