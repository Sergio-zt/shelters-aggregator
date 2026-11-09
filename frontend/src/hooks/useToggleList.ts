import { useState } from 'react';
export function useToggleList<T>(initial: T[] = []) {
  const [values, setValues] = useState<T[]>(initial);
  const toggle = (value: T) =>
    setValues((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  return { values, toggle, clear: () => setValues([]) };
}
