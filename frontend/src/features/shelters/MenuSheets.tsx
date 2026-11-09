import { useI18n } from '../../i18n/I18nProvider';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronRight } from '../../components/UiIcons';
import { FigmaIcon } from '../../components/FigmaIcon';
import { Sheet } from '../../components/ui/Sheet';
import { Button } from '../../components/ui/Button';
import { AccessBadge } from '../../components/ShelterCard';
import { useToggleList } from '../../hooks/useToggleList';
import { useApiSubmit } from '../../hooks/useApiSubmit';
import { api, apiMode } from '../../api';
import { shelterTypeLabel } from '../../i18n/shelterLabels';
import { useDialog } from '../../hooks/useDialog';
import { usePresence } from '../../hooks/usePresence';
import { LanguageToggle } from '../../components/TopBar';
import { useNavigationGuard } from '../../hooks/useGuardedNavigation';
import { facilityKeys, type Facility, type ShelterKind } from './model';
export type MenuView = 'menu' | 'about' | 'add' | 'feedback';
export function MenuSheet({
  onClose,
  onNavigate,
}: {
  onClose: () => void;
  onNavigate: (view: MenuView) => void;
}) {
  const { t } = useI18n();
  return (
    <Sheet title={t('menu.title')} onClose={onClose} className="menu-sheet">
      <div className="menu-row">
        <span>{t('language.label')}</span>
        <LanguageToggle />
      </div>
      <button className="menu-row" onClick={() => onNavigate('about')}>
        {t('menu.about')} <ChevronRight />
      </button>
      <button className="menu-row" onClick={() => onNavigate('feedback')}>
        {t('menu.feedback')} <ChevronRight />
      </button>
      <Button className="menu-add" onClick={() => onNavigate('add')}>
        {t('menu.add')}{' '}
      </Button>
      {apiMode === 'mock' && (
        <p className="Caption-Regular muted">{t('menu.prototype')} </p>
      )}
      <button
        className="text-link Caption-Medium"
        onClick={() => onNavigate('about')}
      >
        {t('menu.learn')}{' '}
      </button>
    </Sheet>
  );
}
export function AboutSheet({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  return (
    <Sheet title={t('menu.about')} onClose={onClose} className="about-sheet">
      <p className="Body-M-Regular">{t('about.intro')} </p>
      <h3 className="Heading-H3">{t('about.data')}</h3>
      <div className="surface info-block">
        <h4 className="Heading-H4">{t('details.official')}</h4>
        <p>{t('facility.ramp')}</p>
        <hr />
        <h4 className="Heading-H4">{t('details.residents')}</h4>
        <p>{t('about.residentFacilities')}</p>
        <small>{t('about.outdated')}</small>
      </div>
      <h3 className="Heading-H3">{t('about.labels')}</h3>
      <div className="surface info-block">
        <div className="access-explanation">
          <AccessBadge access="always" />
          <span>{t('about.allDay')}</span>
        </div>
        <div className="access-explanation">
          <AccessBadge access="alerts" />
          <span>{t('about.alert')}</span>
        </div>
        <div className="access-explanation">
          <AccessBadge access="limited" />
          <span>
            {t('about.limited')} <br />
            {t('about.example')}{' '}
          </span>
        </div>
        <small>{t('about.notLive')} </small>
      </div>
      <div className="surface info-block">
        <h4 className="Heading-H4">{t('about.wrong')}</h4>
        <p>{t('about.report')} </p>
      </div>
      {apiMode === 'mock' && (
        <p className="prototype-note Caption-Regular">
          {t('about.prototype')}{' '}
        </p>
      )}
    </Sheet>
  );
}
const shelterKinds: ShelterKind[] = [
  'Basement',
  'Metro',
  'Underpass',
  'Semi-basement',
  'Parking',
  'Other',
];
export function AddShelterSheet({
  onClose,
  onComplete,
}: {
  onClose: () => void;
  onComplete: () => void;
}) {
  const { t } = useI18n();
  const [address, setAddress] = useState('');
  const [details, setDetails] = useState('');
  const [kind, setKind] = useState<ShelterKind | null>(null);
  const [touched, setTouched] = useState(false);
  const [discard, setDiscard] = useState(false);
  const discardPresence = usePresence(discard ? 'discard' : null);
  const facilities = useToggleList<Facility>();
  const { pending, submit, cancel, error } = useApiSubmit(
    api.suggestShelter,
    onComplete,
  );
  const dirty = Boolean(address || details || kind || facilities.values.length);
  const registerGuard = useNavigationGuard();
  const pendingNavigation = useRef<(() => void) | null>(null);
  useEffect(() => {
    if (!dirty) return;
    return registerGuard((proceed) => {
      pendingNavigation.current = proceed;
      setDiscard(true);
    });
  }, [dirty, registerGuard]);
  const close = () => {
    cancel();
    if (dirty) setDiscard(true);
    else onClose();
  };
  return (
    <>
      <Sheet
        title={t('menu.add')}
        onClose={close}
        className="form-sheet"
        inactive={Boolean(discardPresence.displayed)}
        actions={
          <Button
            disabled={!address.trim()}
            loading={pending}
            onClick={() => {
              setTouched(true);
              if (address.trim())
                void submit({
                  address: address.trim(),
                  details: details.trim(),
                  type: kind,
                  facilities: facilities.values,
                });
            }}
          >
            {pending ? t('common.sending') : t('add.send')}
          </Button>
        }
      >
        <p className="Body-M-Regular form-intro">{t('add.intro')} </p>
        <label className="field-label Heading-H4" htmlFor="shelter-address">
          {t('add.address')}{' '}
        </label>
        <input
          id="shelter-address"
          className={`field ${touched && !address.trim() ? 'field--error' : ''}`}
          placeholder={t('add.addressExample')}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          onBlur={() => setTouched(true)}
          disabled={pending}
          aria-invalid={touched && !address.trim()}
          aria-describedby={
            touched && !address.trim() ? 'address-error' : undefined
          }
        />
        {touched && !address.trim() && (
          <p className="field-error Caption-Regular" id="address-error">
            {t('add.addressError')}{' '}
          </p>
        )}
        <h3 className="Heading-H3">{t('add.type')}</h3>
        <div className="chips">
          {shelterKinds.map((value) => (
            <button
              key={value}
              disabled={pending}
              className={`chip ${kind === value ? 'chip--active' : ''}`}
              aria-pressed={kind === value}
              onClick={() =>
                setKind((current) => (current === value ? null : value))
              }
            >
              {shelterTypeLabel(value, t)}
            </button>
          ))}
        </div>
        <h3 className="Heading-H3">{t('add.facilities')}</h3>
        <div className="chips">
          {facilityKeys.map((key) => (
            <button
              key={key}
              disabled={pending}
              className={`chip ${facilities.values.includes(key) ? 'chip--active' : ''}`}
              aria-pressed={facilities.values.includes(key)}
              onClick={() => facilities.toggle(key)}
            >
              {t(`facility.${key}`)}
            </button>
          ))}
        </div>
        <label
          className="field-label Heading-H4 details-label"
          htmlFor="shelter-description"
        >
          {t('add.details')}{' '}
        </label>
        <textarea
          id="shelter-description"
          className="field"
          placeholder={t('add.placeholder')}
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          disabled={pending}
        />
        {error && (
          <p className="submission-error Body-M-Regular" role="alert">
            {t('feedback.error')}
          </p>
        )}
      </Sheet>
      {discardPresence.displayed && (
        <DiscardDialog
          exiting={discardPresence.exiting}
          onExited={discardPresence.finishExit}
          onKeep={() => {
            pendingNavigation.current = null;
            setDiscard(false);
          }}
          onDiscard={() => {
            setDiscard(false);
            const proceed = pendingNavigation.current;
            pendingNavigation.current = null;
            if (proceed) proceed();
            else onClose();
          }}
        />
      )}
    </>
  );
}
function DiscardDialog({
  exiting,
  onExited,
  onKeep,
  onDiscard,
}: {
  exiting: boolean;
  onExited: () => void;
  onKeep: () => void;
  onDiscard: () => void;
}) {
  const { t } = useI18n();
  const ref = useDialog(onKeep);
  return createPortal(
    <div
      className={`confirm-layer${exiting ? ' confirm-layer--exiting' : ''}`}
      inert={exiting || undefined}
      aria-hidden={exiting || undefined}
      onTransitionEnd={(event) => {
        if (
          event.propertyName === 'opacity' &&
          event.target instanceof Element &&
          event.target.classList.contains('confirm-dialog') &&
          exiting
        )
          onExited();
      }}
    >
      <div className="scrim" onClick={onKeep} />
      <div
        className="confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="discard-title"
        ref={ref}
        tabIndex={-1}
      >
        <h3 id="discard-title" className="Heading-H3">
          {t('add.discardTitle')}{' '}
        </h3>
        <p className="Body-M-Regular">{t('add.discardHelp')}</p>
        <Button onClick={onKeep}>{t('add.keep')}</Button>
        <Button variant="danger" onClick={onDiscard}>
          {t('add.discard')}{' '}
        </Button>
      </div>
    </div>,
    document.querySelector('.app-shell')!,
  );
}
export function ConfirmationSheet({
  feedback,
  onClose,
}: {
  feedback: boolean;
  onClose: () => void;
}) {
  const { t } = useI18n();
  return (
    <Sheet
      title={feedback ? t('feedback.sent') : t('add.sent')}
      onClose={onClose}
      className="confirmation-sheet"
      actions={<Button onClick={onClose}>{t('common.backToMap')}</Button>}
    >
      <div className="confirmation-content">
        <div className="spot spot--success">
          <FigmaIcon name="Icon/Spot/Success" original />
        </div>
        <p className="Body-M-Regular">
          {feedback ? t('feedback.thanks') : t('add.thanks')}
        </p>
        {!feedback && <p className="Caption-Regular muted">{t('add.demo')} </p>}
      </div>
    </Sheet>
  );
}
