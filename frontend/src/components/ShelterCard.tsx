import { useI18n } from '../i18n/I18nProvider';
import { shelterTypeLabel } from '../i18n/shelterLabels';
import { ChevronRight, Walk, Capacity } from './UiIcons';
import { type Access, type Shelter } from '../features/shelters/model';
import { FacilityIcon } from './FacilityIcon';
export function AccessBadge({ access }: { access: Access }) {
  const { t } = useI18n();
  return (
    <span className={`badge access-badge access-badge--${access}`}>
      <i />
      {t(`access.${access}`)}
    </span>
  );
}
export function ShelterMeta({
  shelter,
  distance,
}: {
  shelter: Shelter;
  distance?: boolean;
}) {
  const { t } = useI18n();
  return (
    <div className="shelter-meta Body-S-Regular">
      {distance && shelter.exampleWalk && (
        <span>
          <Walk />
          {shelter.exampleWalk}
        </span>
      )}
      <span>
        <Capacity />
        {t('shelter.capacityLabel')} {shelter.capacity}
      </span>
    </div>
  );
}
export function ShelterCard({
  shelter,
  onSelect,
  distance,
}: {
  shelter: Shelter;
  onSelect: () => void;
  distance?: boolean;
}) {
  const { t } = useI18n();
  return (
    <button type="button" className="shelter-card" onClick={onSelect}>
      <span className="card-heading">
        <strong className="Heading-H3">{shelter.name}</strong>
        <ChevronRight />
      </span>
      <span className="card-subtitle Body-S-Regular">
        {shelterTypeLabel(shelter.kind, t)} · {shelter.district}
      </span>
      <span className="badges">
        <AccessBadge access={shelter.access} />
        {(['wifi', 'electricity'] as const)
          .filter((facility) => shelter.facilities.includes(facility))
          .map((facility) => (
            <span className="badge" key={facility}>
              <FacilityIcon facility={facility} variant="badge" />
              {t(`facility.${facility}`)}
            </span>
          ))}
      </span>
      <ShelterMeta shelter={shelter} distance={distance} />
    </button>
  );
}
