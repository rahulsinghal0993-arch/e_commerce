import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User, UserRole } from '@arghya/api-client';
import { api } from '../lib/api.js';

interface AuthContextValue {
  user: User | null;
  userRole: UserRole;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  applyUserPatch: (patch: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // The authenticated user object from the API, or null when signed out.
  const [user, setUser] = useState<User | null>(null);
  // True while we check for an existing session on first load.
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function restore() {
      try {
        const me = await api.me();
        if (active) setUser(me);
      } catch {
        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    }
    restore();
    return () => {
      active = false;
    };
  }, []);

  const login = async (email: string, password: string) => {
    const u = await api.login(email, password);
    setUser(u);
    return u;
  };

  const logout = async () => {
    setUser(null);
    await api.logout();
  };

  const applyUserPatch = (patch: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : (patch as User)));
  };

  const userRole: UserRole = user?.role ?? 'guest';

  return (
    <AuthContext.Provider value={{ user, userRole, loading, login, logout, applyUserPatch }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
