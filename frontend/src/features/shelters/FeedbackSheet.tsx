import { useI18n } from '../../i18n/I18nProvider';
import { useState } from 'react';
import { Sheet } from '../../components/ui/Sheet';
import { Button } from '../../components/ui/Button';
import { useApiSubmit } from '../../hooks/useApiSubmit';
import { api } from '../../api';
import type { Shelter } from './model';

export function FeedbackSheet({
  shelter,
  onClose,
  onComplete,
  initialError = false,
  initialComment = '',
  initialName = '',
  previewSending = false,
}: {
  shelter?: Shelter | null;
  onClose: () => void;
  onComplete: () => void;
  initialError?: boolean;
  initialComment?: string;
  initialName?: string;
  previewSending?: boolean;
}) {
  const { t } = useI18n();
  const [name, setName] = useState(initialName);
  const [comment, setComment] = useState(initialComment);
  const {
    pending: submitting,
    submit,
    error,
    cancel,
  } = useApiSubmit(api.submitFeedback, onComplete, initialError);
  const pending = submitting || previewSending;
  const canSubmit = Boolean(name.trim() && comment.trim()) && !pending;
  return (
    <Sheet
      title={t('menu.feedback')}
      onClose={() => {
        cancel();
        onClose();
      }}
      className="form-sheet feedback-form"
      actions={
        <Button
          disabled={!canSubmit}
          loading={pending}
          onClick={() => {
            if (!canSubmit) return;
            void submit({
              name: name.trim(),
              comment: comment.trim(),
              shelterId: shelter?.id,
              shelterName: shelter?.name,
            });
          }}
        >
          {pending
            ? t('common.sending')
            : error
              ? t('common.retry')
              : t('feedback.send')}
        </Button>
      }
    >
      <p className="Body-M-Regular feedback-intro">{t('feedback.intro')} </p>
      {shelter && (
        <p className="Body-M-Regular feedback-context">
          {shelter.name}
          {shelter.address && (
            <> · {shelter.address.replace(/, (Kyiv|Київ)$/u, '')}</>
          )}
        </p>
      )}
      <div className="feedback-name-field">
        <label className="field-label Heading-H4" htmlFor="feedback-name">
          {t('feedback.name')}
        </label>
        <input
          id="feedback-name"
          className="field feedback-name"
          type="text"
          autoComplete="name"
          required
          placeholder={t('feedback.namePlaceholder')}
          value={name}
          onChange={(event) => setName(event.target.value)}
          disabled={pending}
          aria-describedby={error ? 'feedback-error' : undefined}
        />
      </div>
      <label className="field-label Heading-H4" htmlFor="feedback-comment">
        {t('feedback.comment')}{' '}
      </label>
      <textarea
        id="feedback-comment"
        className="field feedback-comment"
        rows={2}
        required
        placeholder={t('feedback.placeholder')}
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        disabled={pending}
        aria-describedby={error ? 'feedback-error' : 'feedback-help'}
      />
      {error ? (
        <p
          id="feedback-error"
          className="submission-error Body-M-Regular"
          role="alert"
        >
          {t('feedback.error')}{' '}
        </p>
      ) : (
        <p id="feedback-help" className="Caption-Regular muted feedback-help">
          {t('feedback.help')}{' '}
        </p>
      )}
    </Sheet>
  );
}
