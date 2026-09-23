import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, TextField, useToastStore } from '@arghya/ui';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../lib/api.js';

const PERKS = [
  'Weekly payouts, seven days after delivery',
  'We collect from your door and handle the customer',
  'No listing fee, no monthly fee',
  'Every application is read by a person within two working days',
];

interface SignUpForm {
  storeName: string;
  fullName: string;
  email: string;
  password: string;
  contactEmail: string;
}

export default function SellerSignUp() {
  const { applyUserPatch } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<SignUpForm>({
    storeName: '',
    fullName: '',
    email: '',
    password: '',
    contactEmail: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const set = (key: keyof SignUpForm) => (e: ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Registering with role 'customer' (not 'seller') is deliberate: the
      // /seller-applications endpoint is gated to customer accounts, and the
      // seller role itself is only granted once an admin approves this
      // application (see server/src/controllers/auth.controller.js).
      const { user } = await api.register({
        email: form.email,
        password: form.password,
        fullName: form.fullName,
        role: 'customer',
      });
      applyUserPatch(user);

      await api.createSellerApplication({
        store_name: form.storeName,
        contact_email: form.contactEmail || form.email,
      });

      navigate('/pending', { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not submit your application';
      useToastStore.getState().addToast(message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-200 p-4">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl shadow-lg md:grid-cols-2">
        <div className="relative hidden flex-col justify-between overflow-hidden bg-neutral-900 p-10 text-neutral-200 md:flex">
          <Link to="/sign-in" className="flex items-center gap-2.5 text-neutral-100 no-underline">
            <span className="dev flex h-8 w-8 items-center justify-center rounded-full bg-accent-2-500 pb-0.5 text-lg text-accent-900">
              ॐ
            </span>
            <span className="font-heading text-lg">Arghya</span>
          </Link>
          <div>
            <h1 className="max-w-[16ch] text-3xl leading-tight text-neutral-100">
              Sell to people who already know what they're looking for.
            </h1>
            <p className="mt-3 max-w-[36ch] text-sm leading-relaxed text-white/80">
              Arghya's customers arrive with a rite and a date, not a browsing habit — puja kits,
              havan samagri, ghee and festival kits.
            </p>
            <div className="mt-6 flex flex-col gap-2.5 text-sm text-white/85">
              {PERKS.map((perk) => (
                <div key={perk} className="flex gap-2.5">
                  <span className="text-accent-2-500">✓</span>
                  {perk}
                </div>
              ))}
            </div>
          </div>
          <div className="text-xs text-white/60">Already selling? Sign in from the console.</div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 bg-bg p-8 md:p-10">
          <div>
            <h2 className="text-2xl">Apply to sell</h2>
            <p className="mt-1 text-sm text-neutral-700">
              Already applied?{' '}
              <Link to="/pending" className="font-bold">
                Check your status
              </Link>
            </p>
          </div>

          <TextField
            label="Store or firm name"
            id="ss-store"
            required
            placeholder="Kashi Samagri Bhandar"
            value={form.storeName}
            onChange={set('storeName')}
          />
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <TextField
              label="Your name"
              id="ss-name"
              required
              placeholder="As on your GST certificate"
              value={form.fullName}
              onChange={set('fullName')}
            />
            <TextField
              label="Contact email"
              id="ss-contact"
              type="email"
              placeholder="Defaults to your login email"
              value={form.contactEmail}
              onChange={set('contactEmail')}
            />
          </div>
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <TextField
              label="Login email"
              id="ss-email"
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={set('email')}
            />
            <TextField
              label="Password"
              id="ss-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={form.password}
              onChange={set('password')}
            />
          </div>

          <Button type="submit" disabled={submitting} className="mt-2 w-full">
            {submitting ? 'Submitting…' : 'Submit application'}
          </Button>
          <p className="text-center text-[11px] text-neutral-700">
            Most applications are answered within two working days.
          </p>
        </form>
      </div>
    </div>
  );
}
