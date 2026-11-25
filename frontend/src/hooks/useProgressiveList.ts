import { useLayoutEffect, useRef, useState } from 'react';

/** Keep initial rendering small without dropping results or fixing row heights. */
export function useProgressiveList<T>(items: readonly T[], batchSize = 40) {
  const [page, setPage] = useState({ items, count: batchSize, focusIndex: -1 });
  const firstNewItemRef = useRef<HTMLButtonElement>(null);
  useLayoutEffect(() => {
    if (page.items === items && page.focusIndex >= 0)
      firstNewItemRef.current?.focus();
  }, [page, items]);
  const count = page.items === items ? page.count : batchSize;
  return {
    visibleItems: items.slice(0, count),
    hasMore: count < items.length,
    firstNewItemRef,
    focusIndex: page.items === items ? page.focusIndex : -1,
    showMore: () =>
      setPage((previous) => ({
        items,
        focusIndex: previous.items === items ? previous.count : batchSize,
        count: Math.min(
          items.length,
          (previous.items === items ? previous.count : batchSize) + batchSize,
        ),
      })),
  };
}
