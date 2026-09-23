'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ApiError } from '@arghya/api-client';
import { useToastStore, Button, TextField } from '@arghya/ui';
import { useAuth } from '../../context/AuthContext.js';

export default function SignUpPage() {
  const { register } = useAuth();
  const addToast = useToastStore((s) => s.addToast);
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await register({ email, password, fullName });
      router.push('/');
      router.refresh();
    } catch (err) {
      addToast(err instanceof ApiError ? err.message : 'Could not create your account.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="hidden md:flex flex-col justify-between p-12 bg-accent text-accent-2-200 relative overflow-hidden">
        <Link href="/" className="flex items-center gap-2.5 no-underline relative z-10">
          <span className="dev w-8 h-8 rounded-full bg-accent-2-500 text-accent-900 grid place-items-center text-[18px] pb-0.5">
            ॐ
          </span>
          <span className="font-heading text-xl text-bg">Arghya</span>
        </Link>
        <div className="relative z-10">
          <div className="dev text-4xl leading-tight text-accent-2-300">अर्घ्य</div>
          <h1 className="text-[38px] my-3.5 text-bg max-w-[14ch] leading-tight">Everything the ritual asks for.</h1>
          <p className="text-[15px] max-w-[34ch] text-white/85 leading-relaxed m-0">
            Pandit-verified puja kits, havan samagri and bilona gau ghee — delivered before your muhurat.
          </p>
        </div>
        <div className="flex gap-5 text-xs text-white/75 relative z-10">
          <span>Shuddh sourcing</span>
          <span>·</span>
          <span>Pandit-verified kits</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col justify-center px-6 md:px-16 py-12">
        <h2 className="text-[28px] m-0 mb-1.5">Create your account</h2>
        <p className="text-sm text-neutral-700 mb-6">
          Already have one?{' '}
          <Link href="/sign-in" className="font-bold">
            Sign in
          </Link>
        </p>
        <div className="flex flex-col gap-3.5 max-w-[380px]">
          <TextField label="Full name" required autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <TextField
            label="Email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <div>
            <TextField
              label="Password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <p className="text-[11px] text-neutral-700 mt-1.5 m-0">At least 8 characters.</p>
          </div>
          <Button type="submit" disabled={submitting} className="w-full box-border mt-2">
            {submitting ? 'Creating account…' : 'Create account'}
          </Button>
        </div>
        <p className="text-[11px] text-neutral-700 mt-5">
          By continuing you accept the Terms and Privacy Policy.
        </p>
      </form>
    </div>
  );
}
