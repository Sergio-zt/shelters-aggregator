import { useI18n } from '../../i18n/I18nProvider';
import { shelterTypeLabel } from '../../i18n/shelterLabels';
import { useState } from 'react';
import {
  Check,
  ChevronRight,
  Clock,
  Copy,
  Share,
} from '../../components/UiIcons';
import { Sheet } from '../../components/ui/Sheet';
import { IconButton } from '../../components/ui/Button';
import { AccessBadge, ShelterMeta } from '../../components/ShelterCard';
import { FacilityIcon } from '../../components/FacilityIcon';
import { facilityKeys, type Shelter } from './model';
export function ShelterDetails({
  shelter,
  distance,
  onClose,
  onFeedback,
}: {
  shelter: Shelter;
  distance: boolean;
  onClose: () => void;
  onFeedback: () => void;
}) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shelter.address);
      setCopied(true);
      setCopyError(false);
    } catch {
      setCopyError(true);
    }
  };
  return (
    <Sheet title={shelter.name} onClose={onClose} className="details-sheet">
      <p className="details-subtitle Body-S-Regular">
        {shelterTypeLabel(shelter.kind, t)} · {shelter.district}
      </p>
      <div className="address-row Body-M-Regular">
        <span>{shelter.address || t('common.unspecified')}</span>
        <IconButton
          disabled={!shelter.address}
          label={copied ? t('details.copied') : t('details.copy')}
          onClick={copy}
        >
          {copied ? <Check /> : <Copy />}
        </IconButton>
        <IconButton
          disabled={!shelter.address}
          label={t('details.share')}
          onClick={async () => {
            if (navigator.share) {
              try {
                await navigator.share({
                  title: shelter.name,
                  text: shelter.address,
                });
              } catch {
                /* cancelled by the user */
              }
            } else await copy();
          }}
        >
          <Share />
        </IconButton>
      </div>
      {copied && (
        <p className="Caption-Regular" role="status">
          {t('details.copied')}{' '}
        </p>
      )}
      {copyError && (
        <p className="Caption-Regular" role="status">
          {t('details.copyError')}{' '}
        </p>
      )}
      <div className="details-access">
        <AccessBadge access={shelter.access} />
      </div>
      {shelter.access === 'limited' && (
        <p className="Caption-Regular limited-note">{t('details.limited')} </p>
      )}
      <div className="details-summary surface">
        <ShelterMeta shelter={shelter} distance={distance} />
        {shelter.hours && (
          <p className="Body-S-Regular">
            <Clock small />
            {t('details.hours')} {shelter.hours}
          </p>
        )}
      </div>
      <h3 className="Heading-H3">{t('filters.facilities')}</h3>
      <div className="facility-group surface">
        <h4 className="Heading-H4">{t('details.official')}</h4>
        <FacilityRow
          facility="ramp"
          listed={shelter.facilities.includes('ramp')}
          official
        />
        <h4 className="Heading-H4 reported-heading">
          {t('details.residents')}
        </h4>
        {facilityKeys
          .filter((key) => key !== 'ramp')
          .map((key) => (
            <FacilityRow
              key={key}
              facility={key}
              listed={shelter.facilities.includes(key)}
            />
          ))}
      </div>
      <button className="feedback-link Body-M-Medium" onClick={onFeedback}>
        <span>{t('details.correct')}</span>
        <span>
          {t('menu.feedback')} <ChevronRight />
        </span>
      </button>
    </Sheet>
  );
}
function FacilityRow({
  facility,
  listed,
  official,
}: {
  facility: (typeof facilityKeys)[number];
  listed: boolean;
  official?: boolean;
}) {
  const { t } = useI18n();
  return (
    <div className="facility-row Body-M-Regular">
      <FacilityIcon facility={facility} />
      <span>{t(`facility.${facility}`)}</span>
      {listed ? (
        <Check className="facility-yes" />
      ) : (
        <span className="facility-unknown Caption-Regular">
          {official ? t('details.notListed') : t('details.notConfirmed')}
        </span>
      )}
    </div>
  );
}
