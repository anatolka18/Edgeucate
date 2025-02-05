import { useState, useCallback, useRef, useEffect } from 'react';

type UpdateState<T> = (newState: T | ((prevState: T) => T), cb?: (state: T) => void) => void;

const useStateWithCallback = <T>(initialState: T): [T, UpdateState<T>] => {
  const [state, setState] = useState<T>(initialState);
  const cbRef = useRef<((state: T) => void) | null>(null);

  const updateState: UpdateState<T> = useCallback((newState, cb) => {
    cbRef.current = cb ?? null;
    setState(prev => (typeof newState === 'function' ? (newState as (prevState: T) => T)(prev) : newState));
  }, []);

  useEffect(() => {
    if (cbRef.current) {
      cbRef.current(state);
      cbRef.current = null;
    }
  }, [state]);

  return [state, updateState];
};

export default useStateWithCallback;