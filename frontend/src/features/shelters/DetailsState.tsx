import { useI18n } from '../../i18n/I18nProvider';
import { OfflineSpot } from '../../components/UiIcons';
import { Sheet } from '../../components/ui/Sheet';
import { Button } from '../../components/ui/Button';
export function DetailsState({
  loading,
  name,
  onClose,
  onRetry,
}: {
  loading: boolean;
  name: string;
  onClose: () => void;
  onRetry: () => void;
}) {
  const { t } = useI18n();
  return (
    <Sheet
      title={name}
      className="details-sheet details-state"
      onClose={onClose}
    >
      {loading ? (
        <div role="status" aria-label={t('details.loading')}>
          <div className="skeleton skeleton-subtitle" />
          <div className="skeleton details-skeleton-badge" />
          <div className="skeleton details-skeleton-summary" />
          <div className="skeleton details-skeleton-facilities" />
          <div className="skeleton details-skeleton-footer" />
        </div>
      ) : (
        <div className="details-error">
          <div className="spot spot--error">
            <OfflineSpot />
          </div>
          <h3 className="Heading-H3">{t('details.error')}</h3>
          <p className="Body-M-Regular">{t('details.errorHelp')}</p>
          <Button onClick={onRetry}>{t('common.retry')}</Button>
        </div>
      )}
    </Sheet>
  );
}
