import { useI18n } from '../../i18n/I18nProvider';
import { FigmaIcon } from '../../components/FigmaIcon';
import { Sheet } from '../../components/ui/Sheet';
import { Button } from '../../components/ui/Button';
import type { LocationStatus } from '../../hooks/useGeolocation';
export function LocationSheet({
  status,
  steps,
  onClose,
  onSearch,
  onLocate,
  onSteps,
  blockedAgain = false,
}: {
  status: LocationStatus;
  steps: boolean;
  onClose: () => void;
  onSearch: () => void;
  onLocate: () => void;
  onSteps: () => void;
  blockedAgain?: boolean;
}) {
  const { t } = useI18n();
  if (steps)
    return (
      <Sheet
        title={t('location.enable')}
        onClose={onClose}
        className="location-steps"
        actions={
          <>
            <Button onClick={onLocate}>{t('location.allowed')}</Button>
            <Button variant="outline" onClick={onSearch}>
              {t('search.address')}{' '}
            </Button>
          </>
        }
      >
        <p className="Body-M-Regular">{t('location.blockedHelp')} </p>
        <div className="surface info-block">
          <h3 className="Heading-H3">{t('location.iphone')}</h3>
          <ol>
            <li>{t('location.iosStep1')}</li>
            <li>{t('location.iosStep2')}</li>
            <li>{t('location.iosStep3')}</li>
          </ol>
        </div>
        <div className="surface info-block">
          <h3 className="Heading-H3">{t('location.android')}</h3>
          <ol>
            <li>{t('location.androidStep1')}</li>
            <li>{t('location.androidStep2')}</li>
            <li>{t('location.androidStep3')}</li>
          </ol>
        </div>
      </Sheet>
    );
  const denied = status === 'denied',
    outside = status === 'outside',
    unavailable = status === 'unavailable';
  const title = blockedAgain
    ? t('location.stillBlocked')
    : denied
      ? t('location.off')
      : outside
        ? t('location.outside')
        : unavailable
          ? t('location.unavailable')
          : t('location.nearby');
  const description = blockedAgain
    ? t('location.stillBlockedHelp')
    : denied
      ? t('location.offHelp')
      : outside
        ? t('location.outsideHelp')
        : unavailable
          ? t('location.unavailableHelp')
          : t('location.allowHelp');
  const spot = denied
    ? 'Icon/Spot/Location off'
    : unavailable
      ? 'Icon/Spot/Location unknown'
      : outside
        ? 'Icon/Spot/Outside area'
        : 'Icon/Spot/Location';
  return (
    <Sheet
      title={title}
      onClose={onClose}
      className="state-sheet location-prompt"
    >
      <div className="state-content">
        <div className="spot">
          <FigmaIcon name={spot} original />
        </div>
        <h3 className="Heading-H3">{title}</h3>
        <p className="Body-M-Regular">{description}</p>
        <Button
          loading={status === 'loading'}
          onClick={
            blockedAgain ? onSteps : denied || outside ? onSearch : onLocate
          }
        >
          {blockedAgain
            ? t('location.stepsAgain')
            : denied || outside
              ? t('search.address')
              : status === 'loading'
                ? t('location.finding')
                : unavailable
                  ? t('common.retry')
                  : t('map.locate')}
        </Button>
        {!outside && (
          <Button
            variant="outline"
            onClick={denied && !blockedAgain ? onSteps : onSearch}
          >
            {denied && !blockedAgain ? t('location.how') : t('search.address')}
          </Button>
        )}
      </div>
    </Sheet>
  );
}
