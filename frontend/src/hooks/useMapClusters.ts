import { useEffect, useMemo, useRef, useState } from 'react';
import type { FeatureCollection, Point } from 'geojson';
import type { Map, GeoJSONSource } from 'maplibre-gl';
import type { Shelter } from '../features/shelters/model';
import { shelterPoints } from '../features/shelters/mapModel';
export type MapItem = {
  key: string;
  longitude: number;
  latitude: number;
} & (
  | { cluster: true; clusterId: number; count: number }
  | { cluster: false; shelterId: string }
);
export const shelterSourceId = 'safeplace-shelters';
export function useMapClusters(
  map: Map | null,
  ready: boolean,
  shelters: Shelter[],
  selected?: string,
) {
  const serialized = JSON.stringify(shelterPoints(shelters, selected));
  const data = useMemo<FeatureCollection<Point, { shelterId: string }>>(
    () => JSON.parse(serialized),
    [serialized],
  );
  const [items, setItems] = useState<MapItem[]>([]);
  const signature = useRef('');
  useEffect(() => {
    if (!map || !ready) return;
    signature.current = '';
    setItems([]);
    const update = () => {
      if (!map.isSourceLoaded(shelterSourceId)) return;
      const unique = new globalThis.Map<string, MapItem>();
      for (const feature of map.querySourceFeatures(shelterSourceId)) {
        if (feature.geometry.type !== 'Point') continue;
        const [longitude, latitude] = feature.geometry.coordinates;
        const props = feature.properties;
        const item: MapItem = props.cluster
          ? {
              key: `cluster-${props.cluster_id}`,
              cluster: true,
              clusterId: Number(props.cluster_id),
              count: Number(props.point_count),
              longitude,
              latitude,
            }
          : {
              key: `shelter-${props.shelterId}`,
              cluster: false,
              shelterId: String(props.shelterId),
              longitude,
              latitude,
            };
        unique.set(item.key, item);
      }
      const next = [...unique.values()].sort((a, b) =>
        a.key.localeCompare(b.key),
      );
      const key = JSON.stringify(next);
      if (key !== signature.current) {
        signature.current = key;
        setItems(next);
      }
    };
    const source = map.getSource<GeoJSONSource>(shelterSourceId);
    if (source) source.setData(data);
    else {
      map.addSource(shelterSourceId, {
        type: 'geojson',
        data,
        cluster: true,
        clusterRadius: 42,
        clusterMaxZoom: 15,
      });
      // Keep the source loaded while React renders its custom HTML markers.
      map.addLayer({
        id: `${shelterSourceId}-index`,
        type: 'circle',
        source: shelterSourceId,
        paint: { 'circle-radius': 1, 'circle-opacity': 0 },
      });
    }
    map.on('sourcedata', update);
    map.on('moveend', update);
    update();
    return () => {
      map.off('sourcedata', update);
      map.off('moveend', update);
    };
  }, [map, ready, data]);
  return items;
}
