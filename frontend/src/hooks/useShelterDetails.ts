import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { api } from '../api';
import { adaptShelters } from '../api/adapters';
import { useI18n } from '../i18n/I18nProvider';

export function useShelterDetails(id: string | null, enabled: boolean) {
  const { locale } = useI18n();
  const [result, setResult] = useState<{
    id: string;
    row?: unknown;
    error?: boolean;
  } | null>(null);
  const viewed = useRef(false);
  useEffect(() => {
    viewed.current = false;
  }, [id, enabled]);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!enabled || !id) return;
    const controller = new AbortController();
    setResult(null);
    api
      .getShelter(id, { signal: controller.signal })
      .then((row) => {
        if (!controller.signal.aborted) {
          setResult({ id, row });
          if (
            !viewed.current &&
            adaptShelters([row], [], 'uk').shelters.length
          ) {
            viewed.current = true;
            // Analytics is best effort: never block details or retry a potentially saved POST.
            void api.recordShelterView(id).catch(() => undefined);
          }
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setResult({ id, error: true });
      });
    return () => controller.abort();
  }, [id, enabled, attempt]);
  const shelter = useMemo(
    () =>
      result?.id === id && result.row
        ? (adaptShelters([result.row], [], locale).shelters[0] ?? null)
        : null,
    [result, id, locale],
  );
  return {
    shelter,
    loading: enabled && !!id && result?.id !== id,
    error: result?.id === id && (!!result.error || !shelter),
    retry: useCallback(() => {
      setResult(null);
      setAttempt((value) => value + 1);
    }, []),
  };
}
