import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Card, EmptyState, Tag } from '@arghya/ui';
import { api, ApiError, type SellerApplicationRaw } from '../lib/api.js';

const POLL_MS = 20000;

const STEPS = [
  { key: 'received', label: 'Application received' },
  { key: 'review', label: 'Under review' },
  { key: 'decided', label: 'Seller access granted' },
];

type StepState = 'done' | 'active' | 'rejected' | 'todo';

function stepState(status: SellerApplicationRaw['status'], key: string): StepState {
  if (status === 'approved') return 'done';
  if (status === 'rejected') return key === 'decided' ? 'rejected' : 'done';
  // pending
  if (key === 'received') return 'done';
  if (key === 'review') return 'active';
  return 'todo';
}

function StepDot({ state }: { state: StepState }) {
  if (state === 'done') {
    return (
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent-2-500 text-[11px] font-bold text-accent-900">
        ✓
      </span>
    );
  }
  if (state === 'active') {
    return (
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent text-[11px] font-bold text-bg">
        •
      </span>
    );
  }
  if (state === 'rejected') {
    return (
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent-300 text-[11px] font-bold text-accent-900">
        ✕
      </span>
    );
  }
  return <span className="h-6 w-6 shrink-0 rounded-full border-2 border-neutral-400" />;
}

export default function SellerPending() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [application, setApplication] = useState<SellerApplicationRaw | null>(null);
  const [error, setError] = useState<unknown>(null);

  const load = useCallback(async () => {
    try {
      const { items } = await api.mySellerApplications();
      setApplication(items?.[0] ?? null);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="animate-pulse font-heading text-lg text-neutral-700">Loading your application…</div>
      </div>
    );
  }

  if (error) {
    const isAuthError = error instanceof ApiError && error.status === 401;
    const description = isAuthError
      ? 'Sign in with the account you applied with to check its status.'
      : error instanceof Error
        ? error.message
        : 'Something went wrong talking to Arghya. Try again shortly.';
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg p-6">
        <EmptyState
          title={isAuthError ? 'Sign in to see your application' : "Couldn't load your application"}
          description={description}
          action={
            <Button as={Link} to="/sign-in">
              Go to sign in
            </Button>
          }
        />
      </div>
    );
  }

  if (!application) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg p-6">
        <EmptyState
          title="No application on file"
          description="Apply to sell on Arghya and we'll get back to you within two working days."
          action={
            <Button as={Link} to="/sign-up">
              Apply to sell
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-200 p-4">
      <div className="w-full max-w-3xl">
        <div className="mb-6 flex items-center gap-2.5">
          <span className="dev grid h-8 w-8 place-items-center rounded-full bg-accent pb-0.5 text-base text-accent-2-300">
            ॐ
          </span>
          <span className="font-heading text-lg">Arghya</span>
          <span className="ml-auto text-xs text-neutral-700">
            Application {application.id.slice(0, 8).toUpperCase()}
          </span>
        </div>

        <Card className="p-6 md:p-10">
          {application.status === 'pending' && (
            <Tag variant="warn" className="mb-4 uppercase tracking-wider">
              With a reviewer
            </Tag>
          )}
          {application.status === 'approved' && (
            <Tag variant="live" className="mb-4 uppercase tracking-wider">
              Approved
            </Tag>
          )}
          {application.status === 'rejected' && (
            <Tag variant="mute" className="mb-4 uppercase tracking-wider">
              Not approved
            </Tag>
          )}

          <h1 className="max-w-[22ch] text-3xl leading-tight">
            {application.status === 'approved' && 'You are ready to sell on Arghya'}
            {application.status === 'pending' && 'Your application is being read by a person'}
            {application.status === 'rejected' && "This application wasn't approved"}
          </h1>

          <p className="mt-3 max-w-[55ch] text-sm leading-relaxed text-neutral-700">
            {application.status === 'pending' &&
              'Most applications are answered within two working days. This page checks for updates automatically.'}
            {application.status === 'approved' &&
              `${application.store_name} is live. Sign in again to open your seller console.`}
            {application.status === 'rejected' &&
              'You can update your details and submit a fresh application whenever you are ready.'}
          </p>

          <div className="mt-6 grid gap-6 md:grid-cols-[1fr_260px]">
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between border-b border-divider py-2">
                <span className="text-neutral-700">Store name</span>
                <strong>{application.store_name}</strong>
              </div>
              <div className="flex justify-between border-b border-divider py-2">
                <span className="text-neutral-700">Contact email</span>
                <strong>{application.contact_email}</strong>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-neutral-700">Submitted</span>
                <strong>{new Date(application.created_at).toLocaleDateString()}</strong>
              </div>
            </div>

            <div className="rounded-2xl border border-divider p-4">
              <div className="mb-3 text-[11px] uppercase tracking-wider text-neutral-700">
                Where it stands
              </div>
              <div className="flex flex-col gap-3 text-sm">
                {STEPS.map((step) => (
                  <div key={step.key} className="flex items-start gap-2.5">
                    <StepDot state={stepState(application.status, step.key)} />
                    <span>{step.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            {application.status === 'approved' && (
              <Button
                onClick={() => navigate('/sign-in', { replace: true })}
              >
                Continue to sign in
              </Button>
            )}
            {application.status === 'rejected' && (
              <Button as={Link} to="/sign-up">
                Apply again
              </Button>
            )}
            <Button variant="quiet" onClick={load}>
              Refresh status
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
