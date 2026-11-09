import { useEffect, useRef, useState } from 'react';
import { Map, setWorkerUrl } from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import type { Coordinates } from '../geo';
import { mapCameraPadding } from '../features/shelters/mapModel';
import 'maplibre-gl/dist/maplibre-gl.css';

setWorkerUrl(workerUrl);
export function useMapLibre(
  center: Coordinates,
  bottomInset: number,
  onMove: () => void,
) {
  const ref = useRef<HTMLDivElement>(null);
  const initial = useRef({ center, bottomInset });
  initial.current = { center, bottomInset };
  const moveRef = useRef(onMove);
  moveRef.current = onMove;
  const [map, setMap] = useState<Map | null>(null);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(
    'loading',
  );
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const container = ref.current;
    if (!container) return;
    setReady(false);
    setStatus('loading');
    let instance: Map;
    try {
      instance = new Map({
        container,
        style: 'https://tiles.openfreemap.org/styles/positron',
        center: [
          initial.current.center.longitude,
          initial.current.center.latitude,
        ],
        zoom: 13.3,
        minZoom: 3,
        maxZoom: 19,
        renderWorldCopies: false,
        dragRotate: false,
        pitchWithRotate: false,
        touchPitch: false,
        attributionControl: false,
        canvasContextAttributes: { preserveDrawingBuffer: false },
      });
    } catch {
      container.replaceChildren();
      setMap(null);
      setStatus('error');
      return;
    }
    instance.touchZoomRotate.disableRotation();
    const reportCamera = () => {
      container.dataset.mapZoom = instance.getZoom().toFixed(3);
      const current = instance.getCenter();
      container.dataset.mapCenter = `${current.lng.toFixed(6)},${current.lat.toFixed(6)}`;
    };
    instance.on('moveend', reportCamera);
    reportCamera();
    instance.on('load', () => {
      reportCamera();
      setReady(true);
      setStatus('ready');
    });
    instance.on('error', () => setStatus('error'));
    instance.on('movestart', (event) => {
      if (event.originalEvent) moveRef.current();
    });
    let width = container.clientWidth;
    let height = container.clientHeight;
    const observer = new ResizeObserver(() => {
      if (width === container.clientWidth && height === container.clientHeight)
        return;
      width = container.clientWidth;
      height = container.clientHeight;
      instance.resize();
      instance.setPadding(
        mapCameraPadding(height, initial.current.bottomInset),
      );
    });
    observer.observe(container);
    setMap(instance);
    return () => {
      observer.disconnect();
      instance.remove();
    };
  }, [attempt]);
  useEffect(() => {
    if (!map) return;
    // Sheet/modal changes must not move the basemap under the user.
    // Explicit camera actions receive the latest inset separately.
    map.setPadding(
      mapCameraPadding(
        map.getContainer().clientHeight,
        initial.current.bottomInset,
      ),
    );
  }, [map]);
  useEffect(() => {
    if (!map) return;
    map.easeTo({
      center: [center.longitude, center.latitude],
      zoom: 13.3,
      padding: mapCameraPadding(
        map.getContainer().clientHeight,
        initial.current.bottomInset,
      ),
      duration: 0,
    });
  }, [map, center.longitude, center.latitude]);
  return {
    ref,
    map,
    ready,
    status,
    retry: () => setAttempt((current) => current + 1),
  };
}
