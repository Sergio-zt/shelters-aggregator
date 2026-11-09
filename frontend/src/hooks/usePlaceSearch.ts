import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import { adaptPlaces } from '../api/adapters';
import type { PlaceDto } from '../api/types';
import { useI18n } from '../i18n/I18nProvider';
export function usePlaceSearch(query: string, enabled: boolean) {
  const { locale } = useI18n();
  const [response, setResponse] = useState<{ query: string; rows: PlaceDto[] }>(
    { query: '', rows: [] },
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    setLoading(true);
    setError(false);
    const timeout = setTimeout(() => {
      api
        .searchPlaces(query, { signal: controller.signal })
        .then((rows) => {
          if (!controller.signal.aborted) setResponse({ query, rows });
        })
        .catch(() => {
          if (!controller.signal.aborted) setError(true);
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 160);
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query, enabled, attempt]);
  const places = useMemo(
    () => (response.query === query ? adaptPlaces(response.rows, locale) : []),
    [response, query, locale],
  );
  return {
    places,
    loading: enabled && !error && (loading || response.query !== query),
    error,
    retry: useCallback(() => setAttempt((x) => x + 1), []),
  };
}
