import { useI18n } from '../i18n/I18nProvider';
import { Button } from './ui/Button';

export function LanguageToggle() {
  const { locale, setLanguage, pending, error, t } = useI18n();
  return (
    <div className="language-control">
      <div
        className="language-toggle"
        role="group"
        aria-label={t('language.switch')}
        aria-busy={pending}
      >
        {(['en', 'uk'] as const).map((value) => (
          <button
            key={value}
            type="button"
            className={value === locale ? 'active' : ''}
            aria-pressed={value === locale}
            disabled={pending}
            onClick={() => void setLanguage(value)}
          >
            {value === 'uk' ? 'UA' : 'EN'}
          </button>
        ))}
      </div>
      <span className="sr-only" role="status">
        {pending ? t('language.saving') : ''}
      </span>
      {error && (
        <span className="language-error Caption-Regular" role="alert">
          {t('language.saveError')}
        </span>
      )}
    </div>
  );
}
export function TopBar({
  onHome,
  onNavigate,
}: {
  onHome: () => void;
  onNavigate: (view: 'about' | 'feedback' | 'add') => void;
}) {
  const { t } = useI18n();
  return (
    <div className="desktop-topbar">
      <button
        className="brand"
        type="button"
        onClick={onHome}
        title={t('common.backToMap')}
      >
        <span className="brand-dot" aria-hidden="true" />
        <strong className="Body-M-Medium">SafePlace</strong>
        <span className="brand-caption Caption-Regular">
          {t('app.brandCaption')}
        </span>
      </button>
      <nav aria-label={t('app.navigation')}>
        <button
          className="topbar-link Body-S-Regular"
          onClick={() => onNavigate('about')}
        >
          {t('menu.about')}{' '}
        </button>
        <button
          className="topbar-link Body-S-Regular"
          onClick={() => onNavigate('feedback')}
        >
          {t('menu.feedback')}{' '}
        </button>
        <LanguageToggle />
        <Button className="topbar-add" onClick={() => onNavigate('add')}>
          {t('menu.add')}{' '}
        </Button>
      </nav>
    </div>
  );
}
