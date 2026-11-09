import { createPortal } from 'react-dom';
import { useI18n } from '../i18n/I18nProvider';
import { useEffect, useRef, type CSSProperties } from 'react';
import type { GeoJSONSource } from 'maplibre-gl';
import { FigmaIcon } from './FigmaIcon';
import type { Shelter } from '../features/shelters/model';
import { getShelterPinName } from '../features/shelters/shelterTypes';
import type { Coordinates } from '../geo';
import {
  mapCameraPadding,
  type MapBounds,
} from '../features/shelters/mapModel';
import { IconButton } from './ui/Button';
import { Spinner } from './UiIcons';
import { MapMarker } from './MapMarker';
import { useMapLibre } from '../hooks/useMapLibre';
import { useMapIdle } from '../hooks/useMapIdle';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { useMapClusters, shelterSourceId } from '../hooks/useMapClusters';
export function DesignMap({
  shelters,
  selected,
  center,
  userLocation,
  demoLocation,
  fitInitialView,
  bottomInset,
  onSelect,
  onLocate,
  onMove,
  moved,
  onSearchArea,
}: {
  shelters: Shelter[];
  selected?: string;
  center: Coordinates;
  userLocation?: Coordinates | null;
  demoLocation: boolean;
  fitInitialView: boolean;
  bottomInset: number;
  onSelect: (shelter: Shelter) => void;
  onLocate: () => void;
  onMove: () => void;
  moved: boolean;
  onSearchArea: (bounds: MapBounds) => void;
}) {
  const { t } = useI18n();
  const { ref, map, ready, status, retry } = useMapLibre(
    center,
    bottomInset,
    onMove,
  );
  const items = useMapClusters(map, ready, shelters, selected);
  const mapIdle = useMapIdle(map);
  const panelLayout = useResponsiveLayout();
  const showSearchArea = moved && mapIdle;
  const picked = shelters.find((shelter) => shelter.id === selected);
  const fitted = useRef<typeof map>(null);
  useEffect(() => {
    if (
      !map ||
      !ready ||
      picked ||
      !fitInitialView ||
      fitted.current === map ||
      !shelters.length
    )
      return;
    fitted.current = map;
    const longitudes = shelters.map((s) => s.coordinates.longitude);
    const latitudes = shelters.map((s) => s.coordinates.latitude);
    map.fitBounds(
      [
        [Math.min(...longitudes), Math.min(...latitudes)],
        [Math.max(...longitudes), Math.max(...latitudes)],
      ],
      {
        padding: {
          top: 80,
          bottom:
            Math.min(
              bottomInset,
              Math.max(0, map.getContainer().clientHeight - 150),
            ) + 52,
          left: 44,
          right: 72,
        },
        maxZoom: 14,
        absolutePadding: true,
        duration: 0,
      },
    );
  }, [map, ready, picked, fitInitialView, shelters, bottomInset]);
  const pickedLongitude = picked?.coordinates.longitude;
  const pickedLatitude = picked?.coordinates.latitude;
  useEffect(() => {
    if (!map || pickedLongitude === undefined || pickedLatitude === undefined)
      return;
    map.easeTo({
      center: [pickedLongitude, pickedLatitude],
      zoom: Math.max(map.getZoom(), 15),
      padding: mapCameraPadding(map.getContainer().clientHeight, bottomInset),
      duration: 450,
    });
  }, [map, pickedLongitude, pickedLatitude, bottomInset]);
  useEffect(() => {
    if (map) map.getCanvas().setAttribute('aria-label', t('map.map'));
  }, [map, t]);
  const zoomContainer = map
    ?.getContainer()
    .querySelector('.maplibregl-ctrl-top-right');
  const renderShelter = (shelter: Shelter) => (
    <MapMarker
      key={`selected-${shelter.id}`}
      map={map!}
      longitude={shelter.coordinates.longitude}
      latitude={shelter.coordinates.latitude}
      elevated={shelter.id === selected}
    >
      <button
        type="button"
        className={`map-pin ${shelter.id === selected ? 'map-pin--selected' : ''}`}
        aria-label={t('map.select', { name: shelter.name })}
        aria-pressed={shelter.id === selected}
        onClick={() => onSelect(shelter)}
      >
        <FigmaIcon
          name={getShelterPinName(shelter.kind, shelter.id === selected)}
          size={panelLayout ? 32 : undefined}
          original
        />
      </button>
    </MapMarker>
  );
  return (
    <div
      className="design-map"
      role="region"
      aria-label={t('map.label')}
      style={{ '--map-bottom-inset': `${bottomInset}px` } as CSSProperties}
    >
      <div className="live-map" ref={ref} />
      {map &&
        zoomContainer &&
        createPortal(
          <div className="maplibregl-ctrl maplibregl-ctrl-group">
            <button
              type="button"
              className="maplibregl-ctrl-zoom-in"
              title={t('map.zoomIn')}
              aria-label={t('map.zoomIn')}
              onClick={(event) =>
                map.zoomIn({}, { originalEvent: event.nativeEvent })
              }
            >
              <span className="maplibregl-ctrl-icon" aria-hidden="true" />
            </button>
            <button
              type="button"
              className="maplibregl-ctrl-zoom-out"
              title={t('map.zoomOut')}
              aria-label={t('map.zoomOut')}
              onClick={(event) =>
                map.zoomOut({}, { originalEvent: event.nativeEvent })
              }
            >
              <span className="maplibregl-ctrl-icon" aria-hidden="true" />
            </button>
          </div>,
          zoomContainer,
        )}
      {status === 'loading' && (
        <div className="map-status Caption-Regular" role="status">
          <Spinner className="spinner" /> {t('map.loading')}{' '}
        </div>
      )}
      {status === 'error' && (
        <div
          className="map-status map-status--error Body-S-Regular"
          role="alert"
        >
          {t('map.error')}{' '}
          <button className="text-link" onClick={retry}>
            {t('map.retry')}{' '}
          </button>
        </div>
      )}
      {map &&
        items.map((item) => {
          if (!item.cluster) {
            if (item.shelterId === selected) return null;
            const shelter = shelters.find((s) => s.id === item.shelterId);
            return shelter ? renderShelter(shelter) : null;
          }
          return (
            <MapMarker
              key={item.key}
              map={map}
              longitude={item.longitude}
              latitude={item.latitude}
            >
              <button
                type="button"
                className="map-cluster"
                aria-label={t('map.cluster', { count: item.count })}
                onClick={async () => {
                  const source = map.getSource<GeoJSONSource>(shelterSourceId);
                  if (!source) return;
                  try {
                    const zoom = await source.getClusterExpansionZoom(
                      item.clusterId,
                    );
                    map.easeTo({
                      center: [item.longitude, item.latitude],
                      zoom: Math.min(zoom + 0.1, 19),
                      padding: mapCameraPadding(
                        map.getContainer().clientHeight,
                        bottomInset,
                      ),
                      duration: 400,
                    });
                  } catch {
                    /* The source may have changed after applying a filter. */
                  }
                }}
              >
                {item.count}
              </button>
            </MapMarker>
          );
        })}
      {map && picked && renderShelter(picked)}
      {map && userLocation && (
        <MapMarker
          map={map}
          longitude={userLocation.longitude}
          latitude={userLocation.latitude}
        >
          <div
            className="user-location"
            role="img"
            aria-label={
              demoLocation ? t('map.location') : t('map.yourLocation')
            }
          >
            <span className="user-location-dot" />
            {!demoLocation && (
              <span className="user-location-label Caption-Medium">
                {t('map.yourLocation')}{' '}
              </span>
            )}
          </div>
        </MapMarker>
      )}
      {map && (
        <button
          className="search-area Caption-Medium"
          data-visible={showSearchArea}
          disabled={!showSearchArea}
          aria-hidden={!showSearchArea}
          onClick={() => {
            map.stop();
            const container = map.getContainer();
            const corner = map.unproject([0, 0]);
            const opposite = map.unproject([
              container.clientWidth,
              Math.max(1, container.clientHeight - bottomInset),
            ]);
            onSearchArea({
              west: corner.lng,
              north: corner.lat,
              east: opposite.lng,
              south: opposite.lat,
            });
          }}
        >
          {t('map.searchArea')}{' '}
        </button>
      )}
      <IconButton
        label={userLocation ? t('map.recenter') : t('map.locate')}
        className="map-locate"
        onClick={() => {
          if (map && userLocation)
            map.easeTo({
              center: [userLocation.longitude, userLocation.latitude],
              zoom: 15,
              padding: mapCameraPadding(
                map.getContainer().clientHeight,
                bottomInset,
              ),
              duration: 450,
            });
          else onLocate();
        }}
      >
        <FigmaIcon name="Utility/Recenter" original />
      </IconButton>
    </div>
  );
}
