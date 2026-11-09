import { useI18n } from '../../i18n/I18nProvider';
import { useId, type ReactNode } from 'react';
import { X } from '../UiIcons';
import { useDialog } from '../../hooks/useDialog';
import { IconButton } from './Button';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
export function Sheet({
  title,
  children,
  actions,
  onClose,
  className = '',
  inactive = false,
}: {
  title: string;
  children: ReactNode;
  actions?: ReactNode;
  onClose: () => void;
  className?: string;
  inactive?: boolean;
}) {
  const { t } = useI18n();
  const panelLayout = useResponsiveLayout();
  const ref = useDialog(onClose, !panelLayout);
  const id = useId();
  return (
    <div className="modal-layer">
      <div className="scrim" onClick={onClose} />
      <div
        ref={ref}
        className={`sheet modal-sheet ${className}`}
        role={panelLayout ? 'region' : 'dialog'}
        aria-modal={panelLayout ? undefined : true}
        aria-labelledby={id}
        tabIndex={-1}
        inert={inactive}
      >
        <button
          type="button"
          className="modal-handle-target"
          aria-label={t('common.closePanel')}
          onClick={onClose}
        >
          <span className="sheet-handle" aria-hidden="true" />
        </button>
        <header className="sheet-header">
          <h2 id={id} className="Heading-H1">
            {title}
          </h2>
          <IconButton
            label={t('common.close')}
            className="close-button"
            onClick={onClose}
          >
            <X />
          </IconButton>
        </header>
        <div className="sheet-body">{children}</div>
        {actions && <footer className="sheet-actions">{actions}</footer>}
      </div>
    </div>
  );
}
