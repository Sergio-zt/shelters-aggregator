import { useCallback, useEffect, useRef, useState } from 'react';
import type { UserLocation } from '../geo';
export type LocationStatus =
  'idle' | 'loading' | 'ready' | 'denied' | 'unavailable' | 'outside';
export function useGeolocation() {
  const [status, setStatus] = useState<LocationStatus>('idle');
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [attempts, setAttempts] = useState(0);
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const locate = useCallback(() => {
    setAttempts((current) => current + 1);
    if (!navigator.geolocation) {
      setStatus('unavailable');
      return;
    }
    setStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!mounted.current) return;
        const { latitude, longitude, accuracy } = position.coords;
        // Broad Kyiv bounds are enough for this presentation prototype.
        if (
          latitude < 50.2 ||
          latitude > 50.7 ||
          longitude < 30.2 ||
          longitude > 30.85
        ) {
          setStatus('outside');
          return;
        }
        setLocation({ latitude, longitude, accuracy });
        setStatus('ready');
      },
      (error) => {
        if (mounted.current)
          setStatus(error.code === 1 ? 'denied' : 'unavailable');
      },
      { timeout: 15000, maximumAge: 30000 },
    );
  }, []);
  return {
    location,
    status,
    locate,
    blockedAgain: status === 'denied' && attempts > 1,
  };
}
