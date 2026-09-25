import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button, Card, EmptyState, Tag, useToastStore, type TagVariant } from '@arghya/ui';
import type { SellerApplicationStatus } from '@arghya/api-client';
import AdminLayout from '../components/AdminLayout.js';
import { api, ApiError } from '../lib/api.js';
import { useAsync } from '../lib/useAsync.js';
import { formatDateTime } from '../lib/format.js';
import type { SellerApplicationListResponse } from '../lib/adminTypes.js';

const STATUS_VARIANT: Record<SellerApplicationStatus, TagVariant> = {
  pending: 'warn',
  approved: 'live',
  rejected: 'mute',
};

export default function AdminSellerReview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const addToast = useToastStore((s) => s.addToast);
  // No status filter: an application already decided (revisited from a link)
  // should still render, not 404.
  const { data, loading, error } = useAsync(
    () => api.adminApplications() as unknown as Promise<SellerApplicationListResponse>,
    []
  );
  const [submitting, setSubmitting] = useState(false);

  const application = useMemo(
    () => (data?.items ?? []).find((a) => a.id === id),
    [data, id]
  );

  async function handleDecision(action: 'approve' | 'reject') {
    setSubmitting(true);
    try {
      await api.reviewApplication(id as string, action);
      addToast(`Application ${action === 'approve' ? 'approved' : 'rejected'}.`, 'success');
      navigate('/sellers');
    } catch (err) {
      addToast(err instanceof ApiError ? err.message : 'Could not record this decision.', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AdminLayout>
      <div className="mb-6 text-xs text-neutral-700">
        <Link to="/sellers">Sellers</Link> ·{' '}
        <strong className="text-text">Application {id?.slice(0, 8)}</strong>
      </div>

      {loading ? (
        <p className="text-sm text-neutral-700">Loading application…</p>
      ) : error ? (
        <EmptyState
          title="Could not load this application"
          description={error.message || 'The server did not respond. Try again shortly.'}
        />
      ) : !application ? (
        <EmptyState title="Application not found" />
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-start gap-3">
            <div>
              <h1 className="text-2xl">{application.storeName}</h1>
              <div className="mt-0.5 text-xs text-neutral-700">
                Applied {formatDateTime(application.createdAt)}
                {application.applicant ? ` · ${application.applicant}` : ''}
              </div>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Tag variant={STATUS_VARIANT[application.status] ?? 'mute'}>
                {application.status}
              </Tag>
              {application.status === 'pending' && (
                <>
                  <Button
                    variant="ghost"
                    className="min-h-[40px] text-sm"
                    disabled={submitting}
                    onClick={() => handleDecision('reject')}
                  >
                    Reject
                  </Button>
                  <Button
                    variant="solid"
                    className="min-h-[40px] text-sm"
                    disabled={submitting}
                    onClick={() => handleDecision('approve')}
                  >
                    Approve seller
                  </Button>
                </>
              )}
            </div>
          </div>

          <Card className="mb-5 p-5">
            <h2 className="mb-3 text-lg">Application details</h2>
            <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-wide text-neutral-700">Store name</dt>
                <dd className="mt-1">{application.storeName}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-neutral-700">Contact email</dt>
                <dd className="mt-1">{application.contactEmail}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-neutral-700">Applicant</dt>
                <dd className="mt-1">{application.applicant ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-neutral-700">Reviewed</dt>
                <dd className="mt-1">
                  {application.reviewedAt ? formatDateTime(application.reviewedAt) : 'Not yet reviewed'}
                </dd>
              </div>
            </dl>
          </Card>

          <Card className="border border-accent-2-300 bg-accent-2-100 p-5 text-sm text-accent-2-900">
            No KYC documents, GST or bank details are collected at application time yet — this
            is everything on file for this seller. Approving flips their account to{' '}
            <strong>seller</strong> and creates their store immediately.
          </Card>
        </>
      )}
    </AdminLayout>
  );
}
