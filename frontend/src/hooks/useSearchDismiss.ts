import { useEffect, useRef } from 'react';
export function useSearchDismiss(active: boolean, onDismiss: () => void) {
  const dismiss = useRef(onDismiss);
  dismiss.current = onDismiss;
  useEffect(() => {
    if (!active) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === 'Escape' &&
        !event.isComposing &&
        !event.defaultPrevented
      ) {
        event.preventDefault();
        dismiss.current();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [active]);
}
