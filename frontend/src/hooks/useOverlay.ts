import { useCallback, useRef, useState } from 'react';
export function useOverlay<T extends string>(initial: T | null = null) {
  const [overlay, setValue] = useState<T | null>(initial);
  const trigger = useRef<HTMLElement | null>(null);
  const current = useRef(initial);
  const setOverlay = useCallback((next: T | null) => {
    if (next && !current.current)
      trigger.current = document.activeElement as HTMLElement;
    current.current = next;
    setValue(next);
  }, []);
  const restoreFocus = useCallback(() => {
    if (current.current || !trigger.current) return;
    const previous = trigger.current;
    const target =
      previous?.isConnected && previous.getClientRects().length > 0
        ? previous
        : (document.querySelector<HTMLElement>('.list-sheet .shelter-card') ??
          document.querySelector<HTMLElement>('.filter-button'));
    if (target && !target.closest('[inert]'))
      target.focus({ preventScroll: true });
  }, []);
  return [overlay, setOverlay, restoreFocus] as const;
}
