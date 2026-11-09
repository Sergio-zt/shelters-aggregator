import { useEffect, useState } from 'react';

// Let the interface paint before importing/initializing the WebGL engine.
export function useIdleMount() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let frame = 0;
    let idle: number | undefined;
    let timeout: number | undefined;
    frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => {
        if (typeof window.requestIdleCallback === 'function') {
          idle = window.requestIdleCallback(() => setReady(true), {
            timeout: 1000,
          });
        } else timeout = window.setTimeout(() => setReady(true), 0);
      });
    });
    return () => {
      cancelAnimationFrame(frame);
      if (idle !== undefined) window.cancelIdleCallback(idle);
      if (timeout !== undefined) window.clearTimeout(timeout);
    };
  }, []);
  return ready;
}
