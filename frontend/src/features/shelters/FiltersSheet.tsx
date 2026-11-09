import { useI18n } from '../../i18n/I18nProvider';
import { useState } from 'react';
import { Clock } from '../../components/UiIcons';
import { Sheet } from '../../components/ui/Sheet';
import { Button } from '../../components/ui/Button';
import { FacilityIcon } from '../../components/FacilityIcon';
import {
  emptyFilters,
  facilityKeys,
  matchesFilters,
  type Filters,
  type Shelter,
} from './model';
export function FiltersSheet({
  filters,
  shelters,
  onApply,
  onClose,
}: {
  filters: Filters;
  shelters: Shelter[];
  onApply: (filters: Filters) => void;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const [draft, setDraft] = useState<Filters>({
    ...filters,
    facilities: [...filters.facilities],
  });
  const count = shelters.filter((shelter) =>
    matchesFilters(shelter, draft),
  ).length;
  const toggleFacility = (key: (typeof facilityKeys)[number]) =>
    setDraft((current) => ({
      ...current,
      facilities: current.facilities.includes(key)
        ? current.facilities.filter((value) => value !== key)
        : [...current.facilities, key],
    }));
  return (
    <Sheet
      title={t('filters.title')}
      onClose={onClose}
      className="filters-sheet"
      actions={
        <>
          <Button variant="secondary" onClick={() => setDraft(emptyFilters)}>
            {t('filters.reset')}{' '}
          </Button>
          <Button disabled={!count} onClick={() => onApply(draft)}>
            {count ? t('filters.show', { count }) : t('filters.noMatch')}
          </Button>
        </>
      }
    >
      <h3 className="Heading-H3">{t('filters.access')}</h3>
      <div className="segmented">
        <button
          aria-pressed={!draft.everyone}
          className={!draft.everyone ? 'active' : ''}
          onClick={() =>
            setDraft((current) => ({ ...current, everyone: false }))
          }
        >
          {t('filters.any')}{' '}
        </button>
        <button
          aria-pressed={draft.everyone}
          className={draft.everyone ? 'active' : ''}
          onClick={() =>
            setDraft((current) => ({ ...current, everyone: true }))
          }
        >
          {t('filters.everyone')} ·{' '}
          {
            shelters.filter(
              (s) => s.access === 'always' || s.access === 'alerts',
            ).length
          }
        </button>
      </div>
      <h3 className="Heading-H3 facilities-heading">
        {t('filters.facilities')}
      </h3>
      <label className="filter-option">
        <FacilityIcon facility="ramp" />
        <span>
          {t('facility.ramp')} ·{' '}
          {shelters.filter((s) => s.facilities.includes('ramp')).length}
        </span>
        <input
          type="checkbox"
          checked={draft.facilities.includes('ramp')}
          onChange={() => toggleFacility('ramp')}
        />
      </label>
      <label className="filter-option">
        <Clock />
        <span>
          {t('access.always')} ·{' '}
          {shelters.filter((s) => s.access === 'always').length}
        </span>
        <input
          type="checkbox"
          checked={draft.always}
          onChange={() =>
            setDraft((current) => ({ ...current, always: !current.always }))
          }
        />
      </label>
      {facilityKeys
        .filter((key) => key !== 'ramp')
        .map((key) => (
          <label className="filter-option" key={key}>
            <FacilityIcon facility={key} />
            <span>
              {t(`facility.${key}`)}
              {key !== 'toilet' &&
                ` · ${shelters.filter((s) => s.facilities.includes(key)).length}`}
            </span>
            <input
              type="checkbox"
              checked={draft.facilities.includes(key)}
              onChange={() => toggleFacility(key)}
            />
          </label>
        ))}
    </Sheet>
  );
}
