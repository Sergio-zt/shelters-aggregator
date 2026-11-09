import { useEffect } from 'react';

function tabbable(root: Element | null) {
  if (!root) return [];
  return Array.from(
    root.querySelectorAll<HTMLElement>(
      'button, input, textarea, select, a[href], [tabindex]',
    ),
  ).filter(
    (element) =>
      !element.matches(':disabled, [tabindex="-1"]') &&
      !element.closest('[inert]') &&
      element.getClientRects().length > 0 &&
      getComputedStyle(element).visibility !== 'hidden',
  );
}

// Desktop side panels are nonmodal: continue to the map rather than trapping Tab.
export function usePanelTabOrder(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.key !== 'Tab' ||
        event.defaultPrevented ||
        document.querySelector('.confirm-layer')
      )
        return;
      const panel =
        document.querySelector('.modal-sheet') ??
        document.querySelector('.search-panel') ??
        document.querySelector('.list-sheet');
      const panelItems = tabbable(panel);
      const mapItems = tabbable(document.querySelector('.design-map'));
      const lastPanel = panelItems.at(-1);
      const firstMap = mapItems[0];
      if (!lastPanel || !firstMap) return;
      if (!event.shiftKey && document.activeElement === lastPanel) {
        event.preventDefault();
        firstMap.focus({ preventScroll: true });
      } else if (event.shiftKey && document.activeElement === firstMap) {
        event.preventDefault();
        lastPanel.focus({ preventScroll: true });
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [enabled]);
}
