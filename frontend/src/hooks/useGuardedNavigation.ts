import { createContext, useCallback, useContext, useRef } from 'react';

type Guard = (proceed: () => void) => void;
export const NavigationGuardContext = createContext<
  (guard: Guard) => () => void
>(() => () => {});

export function useGuardedNavigation() {
  const guard = useRef<Guard | null>(null);
  const register = useCallback((next: Guard) => {
    guard.current = next;
    return () => {
      if (guard.current === next) guard.current = null;
    };
  }, []);
  const navigate = useCallback((proceed: () => void) => {
    if (guard.current) guard.current(proceed);
    else proceed();
  }, []);
  return { register, navigate };
}
export function useNavigationGuard() {
  return useContext(NavigationGuardContext);
}
