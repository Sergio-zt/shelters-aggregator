import { useEffect, useRef, useState } from 'react';
import type { RequestOptions } from '../api/types';
export function useApiSubmit<T>(
  send: (input: T, options?: RequestOptions) => Promise<void>,
  onComplete: () => void,
  initialError = false,
) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(initialError);
  const controller = useRef<AbortController | null>(null);
  const complete = useRef(onComplete);
  complete.current = onComplete;
  useEffect(() => () => controller.current?.abort(), []);
  const cancel = () => {
    controller.current?.abort();
    controller.current = null;
    setPending(false);
  };
  const submit = async (input: T) => {
    if (controller.current) return;
    const request = new AbortController();
    controller.current = request;
    setPending(true);
    setError(false);
    try {
      await send(input, { signal: request.signal });
      if (!request.signal.aborted) complete.current();
    } catch {
      if (!request.signal.aborted) setError(true);
    } finally {
      if (controller.current === request) controller.current = null;
      if (!request.signal.aborted) setPending(false);
    }
  };
  return { pending, error, submit, cancel };
}
