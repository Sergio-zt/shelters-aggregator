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
}: {
  shelter?: Shelter | null;
  onClose: () => void;
  onComplete: () => void;
  initialError?: boolean;
  initialComment?: string;
}) {
  const { t } = useI18n();
  const [comment, setComment] = useState(initialComment);
  const { pending, submit, error, cancel } = useApiSubmit(
    api.submitFeedback,
    onComplete,
    initialError,
  );
  const canSubmit = Boolean(comment.trim()) && !pending;
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
          onClick={() =>
            void submit({
              comment: comment.trim(),
              shelterId: shelter?.id,
              shelterName: shelter?.name,
            })
          }
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
      <label className="field-label Heading-H4" htmlFor="feedback-comment">
        {t('feedback.comment')}{' '}
      </label>
      <textarea
        id="feedback-comment"
        className="field feedback-comment"
        rows={2}
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
