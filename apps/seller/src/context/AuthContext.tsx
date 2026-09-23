import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { AuthResponse, User, UserRole } from '@arghya/api-client';
import { api } from '../lib/api.js';

interface RegisterInput {
  email: string;
  password: string;
  fullName: string;
}

interface AuthContextValue {
  user: User | null;
  userRole: UserRole;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (input: RegisterInput) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  // Every current caller passes a full User (a sign-in/sign-up/profile
  // response), so this takes User rather than a Partial<User>.
  applyUserPatch: (patch: User) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // The authenticated user object from the API, or null when signed out.
  const [user, setUser] = useState<User | null>(null);
  // True while we check for an existing session on first load, so the app
  // doesn't flash the sign-in screen for an already-signed-in seller.
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

  const register = async ({ email, password, fullName }: RegisterInput) => {
    const data = await api.register({ email, password, fullName, role: 'seller' });
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    setUser(null);
    await api.logout();
  };

  const applyUserPatch = (patch: User) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : patch));
  };

  const userRole: UserRole = user?.role ?? 'guest';

  return (
    <AuthContext.Provider value={{ user, userRole, loading, login, register, logout, applyUserPatch }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
