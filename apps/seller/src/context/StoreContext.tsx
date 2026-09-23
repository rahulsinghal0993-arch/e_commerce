import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';
import type { Store } from '@arghya/api-client';
import { api } from '../lib/api.js';

interface StoreContextValue {
  store: Store | null;
  loading: boolean;
  error: unknown;
  refresh: () => Promise<void>;
  setStore: Dispatch<SetStateAction<Store | null>>;
}

// The seller's own store row. Shared across the console shell (which shows
// "Selling as ...") and the profile page (which edits it), so it's fetched
// once here instead of per-page.
const StoreContext = createContext<StoreContextValue | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getSellerStore();
      setStore(data);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <StoreContext.Provider value={{ store, loading, error, refresh, setStore }}>{children}</StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within a StoreProvider');
  return ctx;
}
