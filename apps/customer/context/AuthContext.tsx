'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { UserRole } from '@arghya/api-client';
import { api } from '../lib/api.js';
import { setCartOwner } from '../store/cartStore.js';
import type { CustomerUser } from '../lib/serverTypes.js';

interface RegisterInput {
  email: string;
  password: string;
  fullName: string;
}

export interface OAuthSessionInput {
  access_token: string;
  refresh_token: string;
  expires_at: number | null;
}

interface AuthContextValue {
  user: CustomerUser | null;
  userRole: UserRole;
  loading: boolean;
  login: (email: string, password: string) => Promise<CustomerUser>;
  register: (input: RegisterInput) => Promise<{ user: CustomerUser }>;
  loginWithGoogle: (session: OAuthSessionInput, mode: 'login' | 'signup') => Promise<{ user: CustomerUser }>;
  logout: () => Promise<void>;
  applyUserPatch: (patch: Partial<CustomerUser>) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // The authenticated user object from the API, or null when signed out.
  const [user, setUser] = useState<CustomerUser | null>(null);
  // True while we check for an existing session on first load, so the app
  // doesn't flash the signed-out header for an already-signed-in visitor.
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function restore() {
      try {
        const me = (await api.me()) as CustomerUser;
        if (active) {
          setCartOwner(me.id);
          setUser(me);
        }
      } catch {
        if (active) {
          setCartOwner(null);
          setUser(null);
        }
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
    const u = (await api.login(email, password)) as CustomerUser;
    setCartOwner(u.id);
    setUser(u);
    return u;
  };

  const register = async ({ email, password, fullName }: RegisterInput) => {
    const data = await api.register({ email, password, fullName, role: 'customer' });
    const registeredUser = data.user as CustomerUser;
    setCartOwner(registeredUser.id);
    setUser(registeredUser);
    return { user: registeredUser };
  };

  // Exchanges a browser-side Google/Supabase session (already established by
  // the OAuth redirect) for our own shaped app session. The storefront only
  // ever creates 'customer' accounts, so `role` is implicit — 'mode' just
  // tells the backend whether this is a first-time signup or a return visit.
  const loginWithGoogle = async (session: OAuthSessionInput, mode: 'login' | 'signup') => {
    const data = await api.oauthSession(session, { mode, role: 'customer' });
    const oauthUser = data.user as CustomerUser;
    setCartOwner(oauthUser.id);
    setUser(oauthUser);
    return { user: oauthUser };
  };

  const logout = async () => {
    // Clear the UI immediately; notifying the server (cookie clear) is
    // best-effort so a slow/unreachable API never blocks signing out.
    setCartOwner(null);
    setUser(null);
    await api.logout();
  };

  // Merge freshly saved profile fields into the in-memory user so the UI
  // reflects the change without a full reload.
  const applyUserPatch = (patch: Partial<CustomerUser>) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : (patch as CustomerUser)));
  };

  const userRole: UserRole = user?.role ?? 'guest';

  return (
    <AuthContext.Provider
      value={{ user, userRole, loading, login, register, loginWithGoogle, logout, applyUserPatch }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
