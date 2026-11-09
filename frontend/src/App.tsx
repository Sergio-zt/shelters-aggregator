import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Menu,
  Search,
  X,
  Clock,
  NoResultsSpot,
  OfflineSpot,
  Spinner,
} from './components/UiIcons';
import { FilterIcon } from './components/FilterIcon';
import { api } from './api';
import { adaptPlaces, type SearchPlace } from './api/adapters';
import { useShelterCatalog } from './hooks/useShelterCatalog';
import { usePlaceSearch } from './hooks/usePlaceSearch';
import { useI18n } from './i18n/I18nProvider';
import { localizedText } from './i18n/catalog';
import {
  demoMapCenter,
  demoSearchRadiusMeters,
  demoUserCoordinates,
} from './features/shelters/demoCoordinates';
import { haversine } from './geo';
import { withinMapBounds, type MapBounds } from './features/shelters/mapModel';
import { useElementSize } from './hooks/useElementSize';
import { IconButton, Button } from './components/ui/Button';
import { ShelterCard } from './components/ShelterCard';
import { useSheet } from './hooks/useSheet';
import { useGeolocation } from './hooks/useGeolocation';
import { useOverlay } from './hooks/useOverlay';
import { usePresence } from './hooks/usePresence';
import { useSearchDismiss } from './hooks/useSearchDismiss';
import { useResponsiveLayout } from './hooks/useResponsiveLayout';
import { usePanelTabOrder } from './hooks/usePanelTabOrder';
import { useIdleMount } from './hooks/useIdleMount';
import { TopBar } from './components/TopBar';
import {
  NavigationGuardContext,
  useGuardedNavigation,
} from './hooks/useGuardedNavigation';
import { DetailsState } from './features/shelters/DetailsState';
import {
  countFilters,
  emptyFilters,
  matchesFilters,
  type Filters,
  type Shelter,
} from './features/shelters/model';
import { SearchPanel } from './features/shelters/SearchPanel';
import { FiltersSheet } from './features/shelters/FiltersSheet';
import { ShelterDetails } from './features/shelters/ShelterDetails';
import { FeedbackSheet } from './features/shelters/FeedbackSheet';
import { LocationSheet } from './features/shelters/LocationSheet';
import {
  MenuSheet,
  AboutSheet,
  AddShelterSheet,
  ConfirmationSheet,
  type MenuView,
} from './features/shelters/MenuSheets';
const DesignMap = lazy(() =>
  import('./components/DesignMap').then((module) => ({
    default: module.DesignMap,
  })),
);
type Overlay =
  | 'menu'
  | 'about'
  | 'add'
  | 'filters'
  | 'details'
  | 'feedback'
  | 'location'
  | 'sent'
  | 'feedback-sent'
  | null;
// Explicit visual preview scenarios for checking the Figma states without browser permissions.
const preview = new URLSearchParams(window.location.search).get('preview');
const previewOverlays: Record<string, Overlay> = {
  menu: 'menu',
  about: 'about',
  add: 'add',
  filters: 'filters',
  details: 'details',
  feedback: 'feedback',
  location: 'location',
  sent: 'sent',
  'feedback-menu': 'feedback',
  'feedback-ready': 'feedback',
  'feedback-menu-error': 'feedback',
  'feedback-sent': 'feedback-sent',
  'details-loading': 'details',
  'details-error': 'details',
  denied: 'location',
  outside: 'location',
  'location-unavailable': 'location',
  'location-steps': 'location',
  'location-blocked': 'location',
  'feedback-error': 'feedback',
};
export default function App() {
  const panelLayout = useResponsiveLayout();
  const mapEnabled = useIdleMount();
  usePanelTabOrder(panelLayout);
  const { locale, t } = useI18n();
  const catalog = useShelterCatalog();
  const { register, navigate } = useGuardedNavigation();
  const [overlay, setOverlay, restoreOverlayFocus] = useOverlay<
    Exclude<Overlay, null>
  >(previewOverlays[preview ?? ''] ?? null);
  const {
    displayed: displayedOverlay,
    exiting,
    finishExit,
  } = usePresence(overlay);
  const [query, setQuery] = useState(
    preview === 'search'
      ? t('search.exampleQuery')
      : preview === 'search-empty'
        ? 'Zzzzz'
        : preview === 'results'
          ? `${t('place.zhytomyrska.name')}, ${t('common.city')}`
          : '',
  );
  const [searching, setSearching] = useState(
    preview === 'search' || preview === 'search-empty',
  );
  const [chosenPlace, setChosenPlace] = useState<SearchPlace | null>(null);
  const placeName = chosenPlace
    ? localizedText(chosenPlace.labels, locale) || chosenPlace.name
    : '';
  const placeSearch = usePlaceSearch(query, searching);
  const searchSnapshot = useMemo(
    () =>
      searching
        ? {
            query,
            places: placeSearch.places,
            loading: placeSearch.loading,
            error: placeSearch.error,
          }
        : null,
    [
      searching,
      query,
      placeSearch.places,
      placeSearch.loading,
      placeSearch.error,
    ],
  );
  const searchPresence = usePresence(searchSnapshot);
  useEffect(() => {
    if (preview !== 'results' || chosenPlace) return;
    const controller = new AbortController();
    api
      .searchPlaces(t('place.zhytomyrska.name'), { signal: controller.signal })
      .then((rows) => {
        if (!controller.signal.aborted)
          setChosenPlace(adaptPlaces(rows, locale)[0] ?? null);
      })
      .catch(() => {});
    return () => controller.abort();
  }, [chosenPlace, locale, t]);
  useEffect(() => {
    if (!searching && chosenPlace)
      setQuery(`${placeName}, ${t('common.city')}`);
  }, [placeName, chosenPlace, searching, t]);
  const [selectedId, setSelectedId] = useState<string | null>(
    [
      'details',
      'feedback',
      'feedback-error',
      'feedback-ready',
      'picked',
      'details-loading',
      'details-error',
    ].includes(preview ?? '')
      ? 'metro-zhytomyrska'
      : null,
  );
  const [feedbackShelterId, setFeedbackShelterId] = useState<string | null>(
    ['feedback', 'feedback-error', 'feedback-ready'].includes(preview ?? '')
      ? 'metro-zhytomyrska'
      : null,
  );
  const selected = catalog.shelters.find((s) => s.id === selectedId) ?? null;
  const feedbackShelter =
    catalog.shelters.find((s) => s.id === feedbackShelterId) ?? null;
  const setSelected = useCallback(
    (s: Shelter | null) => setSelectedId(s?.id ?? null),
    [],
  );
  const setFeedbackShelter = (s: Shelter | null) =>
    setFeedbackShelterId(s?.id ?? null);
  const previousPanel = useRef(displayedOverlay);
  useEffect(() => {
    if (displayedOverlay === null) {
      restoreOverlayFocus();
      if (panelLayout && previousPanel.current !== null) setSelected(null);
    }
    previousPanel.current = displayedOverlay;
  }, [displayedOverlay, panelLayout, restoreOverlayFocus, setSelected]);
  const [filters, setFilters] = useState<Filters>(
    preview === 'empty'
      ? { everyone: false, facilities: ['wifi'], always: true }
      : emptyFilters,
  );
  const [steps, setSteps] = useState(preview === 'location-steps');
  const [detailsMode, setDetailsMode] = useState(
    preview === 'details-loading'
      ? 'loading'
      : preview === 'details-error'
        ? 'error'
        : 'ready',
  );
  const [moved, setMoved] = useState(false);
  const [searchBounds, setSearchBounds] = useState<MapBounds | null>(null);
  const { ref: listRef, size: listSize } = useElementSize<HTMLElement>();
  const [mapError, setMapError] = useState(preview === 'map-error');
  const inputRef = useRef<HTMLInputElement>(null);
  const geo = useGeolocation();
  const nearby =
    geo.status === 'ready' ||
    [
      'nearby',
      'picked',
      'details',
      'feedback',
      'map-error',
      'loading',
      'error',
    ].includes(preview ?? '');
  const candidates = useMemo(() => {
    const place = chosenPlace?.coordinates;
    const origin =
      place || geo.location || (nearby ? demoUserCoordinates : null);
    const rows = catalog.shelters.filter((s) =>
      searchBounds
        ? withinMapBounds(s.coordinates, searchBounds)
        : !place || haversine(s.coordinates, place) <= demoSearchRadiusMeters,
    );
    return origin
      ? [...rows].sort(
          (a, b) =>
            haversine(a.coordinates, origin) - haversine(b.coordinates, origin),
        )
      : rows;
  }, [catalog.shelters, nearby, chosenPlace, geo.location, searchBounds]);
  const records = useMemo(
    () => candidates.filter((shelter) => matchesFilters(shelter, filters)),
    [candidates, filters],
  );
  const mapCenter = chosenPlace?.coordinates || geo.location || demoMapCenter;
  const filterCount = countFilters(filters);
  const isLoading = catalog.loading || preview === 'loading';
  const hasError = catalog.error || preview === 'error';
  const isStateSheet = records.length === 0 || isLoading || hasError;
  const stateTitle = isLoading
    ? t('list.loading')
    : hasError
      ? t('list.error')
      : t('list.empty');
  const {
    size: sheetSize,
    setSize: setSheetSize,
    handleProps,
    sheetProps,
    dragHeight,
  } = useSheet(() => setSelected(null), isStateSheet ? 'state' : 'list');
  const stateCollapsed =
    !panelLayout && isStateSheet && sheetSize === 'collapsed';
  const mapInset = panelLayout
    ? 0
    : isStateSheet
      ? (dragHeight ?? (stateCollapsed ? 48 : listSize.height))
      : listSize.height;
  const cancelSearch = useCallback(() => {
    setSearching(false);
    setQuery(chosenPlace ? `${placeName}, ${t('common.city')}` : '');
    inputRef.current?.blur();
  }, [chosenPlace, placeName, t]);
  useSearchDismiss(searching && displayedOverlay === null, cancelSearch);
  useEffect(() => {
    if (searching && displayedOverlay === null)
      inputRef.current?.focus({ preventScroll: true });
  }, [searching, displayedOverlay]);
  useEffect(() => {
    if (geo.status === 'ready') {
      setSearchBounds(null);
      setOverlay(null);
      setSheetSize('half');
    } else if (['denied', 'unavailable', 'outside'].includes(geo.status)) {
      setOverlay('location');
      setSteps(false);
    }
  }, [geo.status, setOverlay, setSheetSize]);
  const close = () => {
    setOverlay(null);
  };
  const search = () => {
    setOverlay(null);
    setSearching(true);
  };
  const select = (shelter: Shelter) =>
    navigate(() => {
      setSelected(shelter);
      setSearching(false);
      if (panelLayout) setOverlay('details');
    });
  const choosePlace = (place: SearchPlace) => {
    setOverlay(null);
    setSearchBounds(null);
    setMoved(false);
    setChosenPlace(place);
    setQuery(
      `${localizedText(place.labels, locale) || place.name}, ${t('common.city')}`,
    );
    setSearching(false);
    setSelected(null);
    setSheetSize('half');
    inputRef.current?.blur();
  };
  const clearSearch = () =>
    navigate(() => {
      setQuery('');
      setSearching(true);
      if (panelLayout) setOverlay(null);
      if (displayedOverlay === null)
        inputRef.current?.focus({ preventScroll: true });
    });
  const openLocation = () =>
    navigate(() => {
      setSteps(false);
      if (geo.status === 'ready') return;
      setOverlay('location');
    });
  const openFeedback = (shelter: Shelter | null = null) => {
    setFeedbackShelter(shelter);
    setOverlay('feedback');
  };
  const navigateMenu = (view: MenuView) => {
    if (view === 'feedback') openFeedback();
    else setOverlay(view);
  };
  const closeFeedback = () => {
    if (feedbackShelter) setOverlay('details');
    else close();
  };
  const feedbackBackToMap = () => {
    setSelected(null);
    setFeedbackShelter(null);
    close();
  };
  return (
    <NavigationGuardContext.Provider value={register}>
      <div
        className="workspace"
        onClickCapture={(event) => {
          if (
            searching &&
            displayedOverlay === null &&
            event.target instanceof Element &&
            !event.target.closest(
              'button, input, textarea, select, a, label, [role="button"]',
            )
          )
            cancelSearch();
        }}
      >
        <div
          className="app-shell"
          data-panel-open={Boolean(displayedOverlay) || undefined}
        >
          <div
            className="app-base"
            inert={!panelLayout && displayedOverlay !== null}
            data-overlay-open={overlay !== null || undefined}
          >
            <header className="app-header">
              <TopBar
                onHome={() =>
                  navigate(() => {
                    cancelSearch();
                    close();
                  })
                }
                onNavigate={(view) =>
                  navigate(() => {
                    cancelSearch();
                    navigateMenu(view);
                  })
                }
              />
              <div className="header-top">
                <h1 className="Heading-H1">
                  <button
                    type="button"
                    className="home-title"
                    title={t('common.backToMap')}
                    onClick={cancelSearch}
                  >
                    {t('app.titleFirst')} <br />
                    {t('app.titleSecond')}{' '}
                  </button>
                </h1>
                <IconButton
                  label={t('menu.open')}
                  className="menu-button"
                  onClick={() => {
                    cancelSearch();
                    setOverlay('menu');
                  }}
                >
                  <Menu />
                </IconButton>
              </div>
              <div className="search-row">
                <div
                  className={`search-field ${searching ? 'search-field--active' : ''}`}
                >
                  <Search />
                  <input
                    ref={inputRef}
                    value={query}
                    aria-label={t('search.label')}
                    placeholder={t('search.placeholder')}
                    onFocus={() => {
                      if (panelLayout && overlay !== null) {
                        inputRef.current?.blur();
                        navigate(() => {
                          setOverlay(null);
                          setSearching(true);
                        });
                      } else setSearching(true);
                    }}
                    onChange={(event) => setQuery(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && query.trim()) {
                        const first = placeSearch.places[0];
                        if (first && !placeSearch.loading && !placeSearch.error)
                          choosePlace(first);
                      }
                    }}
                  />
                  {query && (
                    <IconButton
                      label={t('search.clear')}
                      className="clear-search"
                      onClick={clearSearch}
                    >
                      <X />
                    </IconButton>
                  )}
                </div>
                {searching ? (
                  <button
                    type="button"
                    className="search-cancel Body-M-Medium"
                    onClick={cancelSearch}
                  >
                    {t('common.cancel')}{' '}
                  </button>
                ) : (
                  <IconButton
                    label={
                      filterCount
                        ? t('filters.active', { count: filterCount })
                        : t('filters.title')
                    }
                    className="filter-button"
                    onClick={() => navigate(() => setOverlay('filters'))}
                  >
                    <FilterIcon />
                    {filterCount > 0 && (
                      <span className="filter-count Caption-Regular">
                        {filterCount}
                      </span>
                    )}
                  </IconButton>
                )}
              </div>
            </header>
            <div
              className="map-content"
              inert={!panelLayout && searching}
              aria-hidden={(!panelLayout && searching) || undefined}
            >
              {mapError ? (
                <div className="map-failure">
                  <strong className="Heading-H3">{t('map.loadFailed')}</strong>
                  <p>{t('map.listWorks')}</p>
                  <button
                    className="text-link"
                    onClick={() => setMapError(false)}
                  >
                    {t('common.retry')}{' '}
                  </button>
                </div>
              ) : !mapEnabled ? (
                <div className="map-loading-fallback" role="status">
                  {t('map.loading')}{' '}
                </div>
              ) : (
                <Suspense
                  fallback={
                    <div className="map-loading-fallback" role="status">
                      {t('map.loading')}{' '}
                    </div>
                  }
                >
                  <DesignMap
                    shelters={records}
                    selected={selected?.id}
                    center={mapCenter}
                    userLocation={
                      geo.location ?? (nearby ? demoUserCoordinates : null)
                    }
                    demoLocation={!geo.location}
                    fitInitialView={!chosenPlace && !geo.location}
                    bottomInset={mapInset}
                    onSelect={select}
                    onLocate={openLocation}
                    onMove={() => setMoved(true)}
                    moved={moved}
                    onSearchArea={(bounds) => {
                      setSearchBounds(bounds);
                      setMoved(false);
                      setSelected(null);
                      setSheetSize('half');
                    }}
                  />
                </Suspense>
              )}
              <section
                className={`sheet list-sheet list-sheet--${sheetSize} ${selected ? 'list-sheet--picked' : ''} ${isStateSheet ? 'list-sheet--state' : ''}`}
                aria-label={t('list.label')}
                inert={panelLayout && (searching || Boolean(displayedOverlay))}
                aria-hidden={
                  (panelLayout && (searching || Boolean(displayedOverlay))) ||
                  undefined
                }
                ref={listRef}
                {...sheetProps}
              >
                <button
                  className="sheet-drag-target"
                  aria-label={
                    isStateSheet
                      ? stateCollapsed
                        ? t('list.show')
                        : t('list.hide')
                      : t('list.resize', { size: t(`list.size.${sheetSize}`) })
                  }
                  aria-expanded={sheetSize !== 'collapsed'}
                  aria-controls="shelter-panel-content"
                  {...handleProps}
                >
                  <span className="sheet-handle" />
                  {stateCollapsed && (
                    <span className="list-state-caption" aria-hidden="true">
                      {stateTitle}
                    </span>
                  )}
                </button>
                <div
                  id="shelter-panel-content"
                  className="list-content"
                  inert={stateCollapsed}
                  aria-hidden={stateCollapsed || undefined}
                >
                  {isLoading ? (
                    <div className="list-scroll">
                      <div className="skeleton skeleton-heading" />
                      <div className="skeleton skeleton-subtitle" />
                      {[0, 1].map((value) => (
                        <div className="skeleton-card surface" key={value}>
                          <div className="skeleton" />
                          <div className="skeleton" />
                          <div className="skeleton" />
                        </div>
                      ))}
                    </div>
                  ) : hasError ? (
                    <div className="state-content">
                      <div className="spot spot--error">
                        <OfflineSpot />
                      </div>
                      <h3 className="Heading-H3">{t('list.error')}</h3>
                      <p>{t('list.errorHelp')} </p>
                      <Button
                        onClick={() =>
                          preview === 'error'
                            ? window.location.assign(window.location.pathname)
                            : catalog.retry()
                        }
                      >
                        {t('common.retry')}{' '}
                      </Button>
                      <Button variant="outline" onClick={search}>
                        {t('search.address')}{' '}
                      </Button>
                    </div>
                  ) : records.length === 0 ? (
                    <div className="state-content">
                      <div className="spot">
                        <NoResultsSpot />
                      </div>
                      <h3 className="Heading-H3">{t('list.empty')}</h3>
                      <p>{t('list.emptyHelp')}</p>
                      <Button onClick={() => setFilters(emptyFilters)}>
                        {t('list.clearFilters')}{' '}
                      </Button>
                      <Button variant="outline" onClick={search}>
                        {t('search.wider')}{' '}
                      </Button>
                    </div>
                  ) : selected && !panelLayout ? (
                    <div className="picked-content">
                      <ShelterCard
                        shelter={selected}
                        onSelect={() => setOverlay('details')}
                        distance={nearby || Boolean(chosenPlace)}
                      />
                      {selected.hours && (
                        <p className="picked-hours Caption-Regular">
                          <Clock small />
                          {t('details.hours')} {selected.hours}
                        </p>
                      )}
                      <Button onClick={() => setOverlay('details')}>
                        {t('details.view')}{' '}
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="list-heading">
                        {catalog.rejected > 0 && (
                          <p
                            className="Caption-Regular data-warning"
                            role="status"
                          >
                            {t('list.invalidPoints', {
                              count: catalog.rejected,
                            })}
                          </p>
                        )}
                        <h2 className="Heading-H2">
                          {!panelLayout && sheetSize === 'collapsed'
                            ? t('list.count', { count: records.length })
                            : nearby
                              ? t('list.nearby')
                              : t('list.area')}
                        </h2>
                        <p className="Caption-Regular">
                          {!panelLayout && sheetSize === 'collapsed'
                            ? t('list.nearest', {
                                name: records[0]?.name ?? '',
                              })
                            : nearby
                              ? t('list.fromLocation')
                              : chosenPlace
                                ? t('list.nearPlace', { place: placeName })
                                : t('list.visibleArea')}
                        </p>
                      </div>
                      <div className="list-scroll">
                        {records.map((shelter) => (
                          <ShelterCard
                            shelter={shelter}
                            key={shelter.id}
                            onSelect={() => {
                              select(shelter);
                              setOverlay('details');
                            }}
                            distance={nearby || Boolean(chosenPlace)}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </section>
              {isLoading && (
                <div className="loading-chip">
                  <Spinner className="spinner" />
                  {t('list.loading')}{' '}
                </div>
              )}
            </div>
            {searchPresence.displayed !== null && (
              <SearchPanel
                query={searchPresence.displayed.query}
                places={searchPresence.displayed.places}
                loading={searchPresence.displayed.loading}
                error={searchPresence.displayed.error}
                onRetry={placeSearch.retry}
                exiting={searchPresence.exiting}
                onExited={searchPresence.finishExit}
                onChoose={choosePlace}
                onLocate={() => {
                  cancelSearch();
                  openLocation();
                }}
              />
            )}
          </div>
          {displayedOverlay && (
            <div
              className={`overlay-stage ${exiting ? 'overlay-stage--exiting' : ''}`}
              inert={exiting}
              aria-hidden={exiting || undefined}
              onTransitionEnd={(event) => {
                if (
                  event.propertyName === 'transform' &&
                  event.target instanceof HTMLElement &&
                  event.target.classList.contains('overlay-motion')
                )
                  finishExit();
              }}
            >
              <div className="overlay-motion">
                {displayedOverlay === 'menu' && (
                  <MenuSheet onClose={close} onNavigate={navigateMenu} />
                )}
                {displayedOverlay === 'about' && <AboutSheet onClose={close} />}
                {displayedOverlay === 'add' && (
                  <AddShelterSheet
                    onClose={close}
                    onComplete={() => {
                      if (overlay === 'add') setOverlay('sent');
                    }}
                  />
                )}
                {displayedOverlay === 'filters' && (
                  <FiltersSheet
                    filters={filters}
                    shelters={candidates}
                    onClose={close}
                    onApply={(value) => {
                      setFilters(value);
                      setSelected(null);
                      close();
                    }}
                  />
                )}
                {displayedOverlay === 'details' &&
                  selected &&
                  (detailsMode !== 'ready' ? (
                    <DetailsState
                      name={selected.name}
                      loading={detailsMode === 'loading'}
                      onClose={close}
                      onRetry={() => setDetailsMode('ready')}
                    />
                  ) : (
                    <ShelterDetails
                      shelter={selected}
                      distance={nearby || Boolean(chosenPlace)}
                      onClose={close}
                      onFeedback={() => openFeedback(selected)}
                    />
                  ))}
                {displayedOverlay === 'feedback' && (
                  <FeedbackSheet
                    key={feedbackShelter?.id ?? 'site'}
                    initialError={[
                      'feedback-error',
                      'feedback-menu-error',
                    ].includes(preview ?? '')}
                    initialComment={
                      [
                        'feedback-error',
                        'feedback-menu-error',
                        'feedback-ready',
                      ].includes(preview ?? '')
                        ? t('feedback.example')
                        : ''
                    }
                    shelter={feedbackShelter}
                    onClose={closeFeedback}
                    onComplete={() => {
                      if (overlay === 'feedback') setOverlay('feedback-sent');
                    }}
                  />
                )}
                {displayedOverlay === 'location' && (
                  <LocationSheet
                    blockedAgain={
                      geo.blockedAgain || preview === 'location-blocked'
                    }
                    status={
                      preview === 'denied' || preview === 'location-blocked'
                        ? 'denied'
                        : preview === 'outside'
                          ? 'outside'
                          : preview === 'location-unavailable'
                            ? 'unavailable'
                            : geo.status
                    }
                    steps={steps}
                    onClose={close}
                    onSearch={search}
                    onLocate={geo.locate}
                    onSteps={() => setSteps(true)}
                  />
                )}
                {(displayedOverlay === 'sent' ||
                  displayedOverlay === 'feedback-sent') && (
                  <ConfirmationSheet
                    feedback={displayedOverlay === 'feedback-sent'}
                    onClose={
                      displayedOverlay === 'feedback-sent'
                        ? feedbackBackToMap
                        : close
                    }
                  />
                )}
              </div>
            </div>
          )}
          <p className="desktop-prototype Caption-Regular">
            {t('app.prototype')}
            {preview ? ` · ${t('app.preview', { name: preview })}` : ''}
          </p>
        </div>
      </div>
    </NavigationGuardContext.Provider>
  );
}
