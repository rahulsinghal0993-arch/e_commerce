'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToastStore } from '@arghya/ui';
import { useAuth } from '../../../context/AuthContext.js';
import { finishGoogleOAuth } from '../../../lib/googleAuth.js';

// Landing page for the OAuth redirect (Google). Reads the session the
// Supabase client recovered, swaps it for our app session through the
// backend, then routes home — or surfaces an error and sends the user back.
export default function AuthCallbackPage() {
  const { loginWithGoogle } = useAuth();
  const addToast = useToastStore((s) => s.addToast);
  const router = useRouter();

  useEffect(() => {
    let active = true;

    (async () => {
      const { intent, session, error } = await finishGoogleOAuth();
      if (!active) return;

      if (error || !session) {
        addToast(error?.message || 'Google sign-in could not be completed.', 'error');
        router.replace(intent.mode === 'signup' ? '/sign-up' : '/sign-in');
        return;
      }

      try {
        await loginWithGoogle(
          {
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            expires_at: session.expires_at ?? null,
          },
          intent.mode === 'signup' ? 'signup' : 'login'
        );
        if (!active) return;
        router.replace('/');
        router.refresh();
      } catch (err) {
        if (!active) return;
        addToast(err instanceof Error ? err.message : 'Could not finish Google sign-in.', 'error');
        router.replace(intent.mode === 'signup' ? '/sign-up' : '/sign-in');
      }
    })();

    return () => {
      active = false;
    };
    // Deliberately empty: this exchange must run exactly once on mount, not
    // whenever loginWithGoogle/addToast/router happen to get new identities.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center">
        <div className="dev mb-3 text-5xl text-accent-300">ॐ</div>
        <p className="animate-pulse text-neutral-700">Completing Google sign-in…</p>
      </div>
    </div>
  );
}
