import { useCallback, useEffect, useRef, useState } from 'react';

// Exit completion owns removal; the timer is only a missing-event fallback.
export function usePresence<T>(value: T | null, fallbackMs = 600) {
  const [retained, setRetained] = useState(value);
  const current = useRef(value);
  current.current = value;
  const finishExit = useCallback(() => {
    if (current.current === null) setRetained(null);
  }, []);
  useEffect(() => {
    if (value !== null) {
      setRetained(value);
      return;
    }
    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    const timeout = window.setTimeout(finishExit, reduced ? 0 : fallbackMs);
    return () => window.clearTimeout(timeout);
  }, [value, fallbackMs, finishExit]);
  return {
    displayed: value ?? retained,
    exiting: value === null && retained !== null,
    finishExit,
  };
}
