import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, TextField, useToastStore } from '@arghya/ui';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../lib/api.js';

export default function SignIn() {
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const user = await login(email, password);

      if (user.role === 'seller' || user.role === 'admin') {
        navigate('/dashboard', { replace: true });
        return;
      }

      // Signed in fine, but this account never became a seller. It may still
      // have an application in flight from sign-up — send them to check
      // rather than dead-ending on an error.
      const { items } = await api.mySellerApplications();
      if (items?.length) {
        navigate('/pending', { replace: true });
        return;
      }

      // Correct credentials, wrong account type — don't leave a non-seller
      // session sitting in this console.
      await logout();
      useToastStore.getState().addToast('This account is not registered to sell on Arghya.', 'error');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not sign in';
      useToastStore.getState().addToast(message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-200 p-4">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-3xl shadow-lg md:grid-cols-2">
        <div className="relative hidden flex-col justify-between overflow-hidden bg-accent p-10 text-accent-2-200 md:flex">
          <span className="dev flex h-9 w-9 items-center justify-center rounded-full bg-accent-2-500 pb-0.5 text-lg text-accent-900">
            ॐ
          </span>
          <div>
            <div className="dev text-4xl leading-snug text-accent-2-300">अर्घ्य</div>
            <h1 className="mt-3 max-w-[14ch] text-3xl leading-tight text-bg">
              Sell to people who already know what they need.
            </h1>
            <p className="mt-3 max-w-[34ch] text-sm leading-relaxed text-white/85">
              Puja kits, havan samagri, ghee and festival kits — the seller console for Arghya.
            </p>
          </div>
          <div className="text-xs text-white/70">Weekly payouts · Shuddh sourcing · No listing fee</div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col justify-center gap-4 bg-bg p-8 md:p-12">
          <div>
            <h2 className="text-2xl">Seller sign in</h2>
            <p className="mt-1 text-sm text-neutral-700">
              New to Arghya?{' '}
              <Link to="/sign-up" className="font-bold">
                Apply to sell
              </Link>
            </p>
          </div>
          <TextField
            label="Email"
            id="si-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            label="Password"
            id="si-pass"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit" disabled={submitting} className="mt-2 w-full">
            {submitting ? 'Signing in…' : 'Sign in'}
          </Button>
          <p className="text-center text-[11px] text-neutral-700">
            By continuing you accept the Terms and Privacy Policy.
          </p>
        </form>
      </div>
    </div>
  );
}
