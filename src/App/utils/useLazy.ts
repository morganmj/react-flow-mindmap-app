import {useRef} from 'react';

export function useLazy<T>(initialize: () => T): T {
  const constantRef = useRef<{value: T} | undefined>(undefined);

  if (!constantRef.current) {
    constantRef.current = {value: initialize()};
  }

  return constantRef.current.value;
}
