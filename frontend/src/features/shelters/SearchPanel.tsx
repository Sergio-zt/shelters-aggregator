import { useProgressiveList } from '../../hooks/useProgressiveList';
import {
  ChevronRight,
  LocationMarker,
  AddressMarker,
  MetroMarker,
} from '../../components/UiIcons';
import { useI18n } from '../../i18n/I18nProvider';
import type { SearchPlace } from '../../api/adapters';
export function SearchPanel({
  query,
  places,
  loading,
  error,
  onRetry,
  onChoose,
  onLocate,
  exiting = false,
  onExited,
}: {
  query: string;
  places: SearchPlace[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  onChoose: (place: SearchPlace) => void;
  onLocate: () => void;
  exiting?: boolean;
  onExited?: () => void;
}) {
  const { t } = useI18n();
  const resultList = useProgressiveList(places);
  const trimmedQuery = query.trim();
  return (
    <section
      className={`search-panel${exiting ? ' search-panel--exiting' : ''}`}
      inert={exiting}
      aria-hidden={exiting || undefined}
      onTransitionEnd={(event) => {
        if (
          event.target === event.currentTarget &&
          event.propertyName === 'opacity' &&
          exiting
        )
          onExited?.();
      }}
    >
      <h2 className="Heading-H4">
        {t(
          loading
            ? 'search.loading'
            : places.length
              ? 'search.suggestions'
              : 'search.noMatches',
        )}
      </h2>
      {loading ? (
        <p role="status" className="Body-M-Regular">
          {t('search.loading')}
        </p>
      ) : error ? (
        <div role="alert">
          <p>{t('search.error')}</p>
          <button className="text-link" onClick={onRetry}>
            {t('common.retry')}
          </button>
        </div>
      ) : places.length ? (
        <>
          <button className="suggestion" onClick={onLocate}>
            <span className="suggestion-icon">
              <LocationMarker />
            </span>
            <span>
              <span className="Body-L-Regular">{t('map.locate')}</span>
              <small>{t('search.nearMe')}</small>
            </span>
            <ChevronRight />
          </button>
          {resultList.visibleItems.map((place, index) => {
            const match = place.name
              .toLocaleLowerCase()
              .indexOf(trimmedQuery.toLocaleLowerCase());
            return (
              <button
                className="suggestion"
                ref={
                  index === resultList.focusIndex
                    ? resultList.firstNewItemRef
                    : undefined
                }
                key={place.id}
                onClick={() => onChoose(place)}
              >
                <span className="suggestion-icon">
                  {place.kind === 'metro' ? <MetroMarker /> : <AddressMarker />}
                </span>
                <span>
                  <span className="Body-L-Regular">
                    {trimmedQuery && match >= 0 ? (
                      <>
                        {place.name.slice(0, match)}
                        <strong>
                          {place.name.slice(match, match + trimmedQuery.length)}
                        </strong>
                        {place.name.slice(match + trimmedQuery.length)}
                      </>
                    ) : (
                      place.name
                    )}
                  </span>
                  <small>{place.description}</small>
                </span>
                <ChevronRight />
              </button>
            );
          })}
          {resultList.hasMore && (
            <button
              type="button"
              className="text-link"
              onClick={resultList.showMore}
            >
              {t('common.showMore')}
            </button>
          )}
        </>
      ) : (
        <div className="search-no-results Body-M-Regular">
          <p>{t('search.notFound', { query })}</p>
          <p>{t('search.spelling')}</p>
        </div>
      )}
      <p className="Caption-Regular search-footnote">{t('search.footnote')}</p>
    </section>
  );
}
