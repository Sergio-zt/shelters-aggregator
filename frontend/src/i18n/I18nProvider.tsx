import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { api } from '../api';
import {
  createTranslator,
  defaultLocale,
  normalizeLocale,
  type Locale,
  type Translator,
} from './catalog';
interface I18nValue {
  locale: Locale;
  t: Translator;
  pending: boolean;
  error: boolean;
  setLanguage: (locale: Locale) => Promise<void>;
}
const I18nContext = createContext<I18nValue | null>(null);
export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(defaultLocale);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [error, setError] = useState(false);
  const [pending, setPending] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const saving = useRef<AbortController | null>(null);
  const t = useMemo(() => createTranslator(locale), [locale]);
  useEffect(() => {
    const controller = new AbortController();
    setLoadError(false);
    api
      .getPreferences({ signal: controller.signal })
      .then((settings) => {
        if (!controller.signal.aborted) {
          setLocale(normalizeLocale(settings.language));
          setReady(true);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setLoadError(true);
      });
    return () => controller.abort();
  }, [attempt]);
  useEffect(() => () => saving.current?.abort(), []);
  const setLanguage = useCallback(
    async (next: Locale) => {
      if (saving.current || next === locale) return;
      const controller = new AbortController();
      saving.current = controller;
      setPending(true);
      setError(false);
      try {
        const settings = await api.updateLanguage(next, {
          signal: controller.signal,
        });
        if (!controller.signal.aborted)
          setLocale(normalizeLocale(settings.language));
      } catch {
        if (!controller.signal.aborted) setError(true);
      } finally {
        if (saving.current === controller) saving.current = null;
        if (!controller.signal.aborted) setPending(false);
      }
    },
    [locale],
  );
  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = t('app.pageTitle');
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute('content', t('app.description'));
  }, [locale, t]);
  const value = useMemo(
    () => ({ locale, t, pending, error, setLanguage }),
    [locale, t, pending, error, setLanguage],
  );
  if (!ready)
    return (
      <div className="app-bootstrap" role={loadError ? 'alert' : 'status'}>
        <p>{t(loadError ? 'language.loadError' : 'language.loading')}</p>
        {loadError && (
          <button
            className="button button--primary"
            onClick={() => setAttempt((x) => x + 1)}
          >
            {t('common.retry')}
          </button>
        )}
      </div>
    );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
export function useI18n() {
  const value = useContext(I18nContext);
  if (!value) throw new Error('useI18n must be used within I18nProvider');
  return value;
}
