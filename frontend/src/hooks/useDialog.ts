import { useEffect, useRef } from 'react';
export function useDialog(onClose: () => void, modal = true) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const root = ref.current;
    const background =
      modal && root?.closest('.confirm-layer')
        ? document.querySelector<HTMLElement>('.app-base')
        : null;
    const wasInert = background?.inert;
    if (background) background.inert = true;
    root?.focus({ preventScroll: true });
    const onKeyDown = (event: KeyboardEvent) => {
      if (!root?.isConnected || root.closest('[inert]')) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        closeRef.current();
      }
      if (!modal || event.key !== 'Tab' || !root) return;
      const items = Array.from(
        root.querySelectorAll<HTMLElement>(
          'button, input, textarea, select, a[href], [tabindex]',
        ),
      ).filter(
        (item) =>
          !item.matches(':disabled, [tabindex="-1"]') &&
          !item.closest('[inert]') &&
          item.getClientRects().length > 0 &&
          getComputedStyle(item).visibility !== 'hidden',
      );
      const first = items[0],
        last = items[items.length - 1];
      if (!first) {
        event.preventDefault();
        return;
      }
      if (
        event.shiftKey &&
        (document.activeElement === first ||
          !items.includes(document.activeElement as HTMLElement))
      ) {
        event.preventDefault();
        last.focus({ preventScroll: true });
      } else if (
        !event.shiftKey &&
        (document.activeElement === last ||
          !items.includes(document.activeElement as HTMLElement))
      ) {
        event.preventDefault();
        first.focus({ preventScroll: true });
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      if (background) background.inert = Boolean(wasInert);
      if (previous?.isConnected && !previous.closest('[inert]'))
        previous.focus({ preventScroll: true });
    };
  }, [modal]);
  return ref;
}
