'use client';

// Browser-side Google OAuth (PKCE) via the official Supabase client.
//
// Supabase runs the whole dance (code verifier + token exchange) and stores
// the resulting session in this tab. We only need to: kick the flow off with
// an "intent" (login vs role-tagged signup), then on /auth/callback hand the
// session to our backend, which validates it and returns our shaped app
// session.
//
// The anon key is public by design; it only ever talks to Supabase Auth for
// this user's own Google login. The service-role key stays server-only.

import { createClient, type Session } from '@supabase/supabase-js';

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isGoogleOAuthConfigured = Boolean(URL && ANON);

const client =
  isGoogleOAuthConfigured && URL && ANON
    ? createClient(URL, ANON, {
        auth: {
          flowType: 'pkce',
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
        },
      })
    : null;

const INTENT_KEY = 'arghya-oauth-intent';

export type OAuthMode = 'login' | 'signup';

interface OAuthIntent {
  mode: OAuthMode;
  role: 'customer' | null;
}

function persistIntent(mode: OAuthMode) {
  sessionStorage.setItem(INTENT_KEY, JSON.stringify({ mode, role: 'customer' }));
}

function readIntent(): OAuthIntent {
  const raw = sessionStorage.getItem(INTENT_KEY);
  sessionStorage.removeItem(INTENT_KEY);
  if (!raw) return { mode: 'login', role: null };
  try {
    return JSON.parse(raw) as OAuthIntent;
  } catch {
    return { mode: 'login', role: null };
  }
}

// Kicks off Google OAuth. `mode` tells the callback page whether this is a
// plain sign-in or a sign-up — the storefront only ever creates customer
// accounts, unlike the seller/admin consoles.
export async function startGoogleOAuth({ mode = 'login' }: { mode?: OAuthMode } = {}): Promise<void> {
  if (!client) {
    throw new Error('Google sign-in is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  }
  persistIntent(mode);
  const redirectTo = `${window.location.origin}/auth/callback`;
  const { error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo },
  });
  if (error) throw new Error(error?.message || 'Could not start Google sign-in.');
  // signInWithOAuth redirects the browser away; if we're still here nothing more to do.
}

export interface FinishGoogleOAuthResult {
  intent: OAuthIntent;
  session: Session | null;
  error: Error | null;
}

// Runs from /auth/callback after Google redirects back. Returns the
// Supabase session plus the intent that was recorded before the redirect.
export async function finishGoogleOAuth(): Promise<FinishGoogleOAuthResult> {
  if (!client) {
    return {
      intent: readIntent(),
      session: null,
      error: new Error('Google sign-in is not configured.'),
    };
  }
  const intent = readIntent();
  const { data, error } = await client.auth.getSession();
  if (error) return { intent, session: null, error };

  // Don't leave the access token / code sitting in the address bar.
  window.history.replaceState({}, document.title, window.location.pathname);

  const session = data?.session ?? null;
  if (session) {
    // The tokens are handed to our backend, which then owns the session via
    // HttpOnly cookies. Do NOT call client.auth.signOut() here: even with
    // { scope: 'local' } it still POSTs to /logout and revokes the session,
    // so the backend's getUser() would reject the very token we just passed
    // it. Instead, stop the browser client from rotating the refresh token
    // and drop its local copy so a later page load cannot auto-refresh a
    // dead session.
    try {
      client.auth.stopAutoRefresh();
    } catch {
      // Non-fatal.
    }
    try {
      // storageKey/storage are `protected` in the installed client's types
      // (an internal-API guard, not a runtime restriction) — this reaches
      // past that the same way the plain-JS original did, to clear the
      // token copy the client's own public API has no method for.
      const authInternals = client.auth as unknown as {
        storageKey: string;
        storage: { removeItem: (key: string) => Promise<void> };
      };
      const key = authInternals.storageKey;
      await authInternals.storage.removeItem(key);
      await authInternals.storage.removeItem(`${key}-user`);
    } catch {
      // Storage can be unavailable; the hand-off still works.
    }
  }

  return { intent, session, error: null };
}
