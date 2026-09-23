import { useCallback, useEffect, useRef, useState, type DependencyList } from 'react';

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

interface UseAsyncResult<T> extends AsyncState<T> {
  reload: () => void;
}

// Small fetch-on-mount hook shared by every admin screen. The backend is not
// guaranteed to be reachable (no local Supabase credentials in dev), so every
// page needs the same loading/error/empty handling — this is that logic in
// one place instead of copy-pasted useEffects.
export function useAsync<T>(fetcher: () => Promise<T>, deps: DependencyList = []): UseAsyncResult<T> {
  const [state, setState] = useState<AsyncState<T>>({ data: null, loading: true, error: null });
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const run = useCallback(() => {
    let active = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    fetcherRef
      .current()
      .then((data) => {
        if (active) setState({ data, loading: false, error: null });
      })
      .catch((error: unknown) => {
        if (active) setState({ data: null, loading: false, error: error instanceof Error ? error : new Error(String(error)) });
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => run(), [run]);

  return { ...state, reload: run };
}
