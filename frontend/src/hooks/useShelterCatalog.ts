import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import { adaptShelters } from '../api/adapters';
import { useI18n } from '../i18n/I18nProvider';
export function useShelterCatalog() {
  const { locale } = useI18n();
  const [data, setData] = useState<{ rows: unknown[]; districts: unknown[] }>({
    rows: [],
    districts: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(false);
    Promise.all([
      api.getShelters({ signal: controller.signal }),
      api.getDistricts({ signal: controller.signal }),
    ])
      .then(([rows, districts]) => {
        if (!controller.signal.aborted) setData({ rows, districts });
      })
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [attempt]);
  const normalized = useMemo(
    () => adaptShelters(data.rows, data.districts, locale),
    [data, locale],
  );
  return {
    ...normalized,
    loading,
    error:
      error ||
      (!loading && data.rows.length > 0 && normalized.shelters.length === 0),
    retry: useCallback(() => setAttempt((x) => x + 1), []),
  };
}
