import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { Button, TextField } from '@arghya/ui';
import { useAuth } from '../context/AuthContext.js';
import { ApiError } from '../lib/api.js';

export default function SignIn() {
  const { login, logout, userRole, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Already an authenticated admin — nothing left to do here.
  if (!loading && userRole === 'admin') return <Navigate to="/dashboard" replace />;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const user = await login(email, password);
      if (user?.role !== 'admin') {
        // Correct credentials, wrong account type — don't leave a
        // non-admin session sitting in this console.
        await logout();
        setError('This account does not have admin access.');
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not sign in. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-accent p-12 text-accent-2-200 lg:flex">
        <div className="pointer-events-none absolute inset-[18px] rounded-2xl border border-white/20" />
        <div className="pointer-events-none absolute inset-6 rounded-xl border border-white/10" />
        <div className="relative flex items-center gap-2.5">
          <span className="font-devanagari grid h-9 w-9 place-items-center rounded-full bg-accent-2-500 pb-0.5 text-xl text-accent-900">
            ॐ
          </span>
          <span className="font-heading text-xl text-bg">Arghya</span>
        </div>
        <div className="relative">
          <div className="font-devanagari text-4xl leading-snug text-accent-2-300">अर्घ्य</div>
          <h1 className="my-3 max-w-[14ch] text-4xl leading-tight text-bg">
            Run the whole marketplace from one console.
          </h1>
          <p className="max-w-[34ch] text-[15px] leading-relaxed text-white/85">
            Orders, sellers, catalog approvals and payouts across every Arghya store — admin
            accounts only.
          </p>
        </div>
        <div className="relative flex gap-5 text-xs text-white/75">
          <span>Internal tool</span>
          <span>·</span>
          <span>Accounts are promoted, not self-registered</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col justify-center px-8 py-14 sm:px-16">
        <h2 className="mb-1.5 text-3xl">Sign in</h2>
        <p className="mb-7 text-sm text-neutral-700">
          Admin access only. Ask an existing admin to promote your account.
        </p>

        {error && (
          <div className="mb-4 rounded-2xl border border-accent-300 bg-accent-100 px-4 py-3 text-sm text-accent-800">
            {error}
          </div>
        )}

        <TextField
          id="si-email"
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-3.5"
        />
        <TextField
          id="si-pass"
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-6"
        />

        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </div>
  );
}
