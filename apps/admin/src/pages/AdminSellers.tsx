import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, EmptyState, useToastStore } from '@arghya/ui';
import AdminLayout from '../components/AdminLayout.js';
import { api, ApiError } from '../lib/api.js';
import { useAsync } from '../lib/useAsync.js';
import { formatDate } from '../lib/format.js';
import type { SellerApplicationListResponse, SellerListResponse } from '../lib/adminTypes.js';

export default function AdminSellers() {
  const addToast = useToastStore((s) => s.addToast);
  // adminSellers()/adminApplications() are declared against the shared
  // SellerSummary/SellerApplication shapes, but the real endpoints answer
  // richer rows (store info, joinedAt, applicant) — see lib/adminTypes.ts.
  const sellers = useAsync(
    () => api.adminSellers() as unknown as Promise<SellerListResponse>,
    []
  );
  const applications = useAsync(
    () => api.adminApplications('pending') as unknown as Promise<SellerApplicationListResponse>,
    []
  );
  const [busyId, setBusyId] = useState<string | null>(null);

  const sellerItems = sellers.data?.items ?? [];
  const pendingApps = applications.data?.items ?? [];

  async function handleRevoke(id: string, name: string) {
    if (!window.confirm(`Revoke ${name}'s seller access? Their listings will be drafted.`)) return;
    setBusyId(id);
    try {
      await api.revokeSeller(id);
      addToast('Seller access revoked.', 'success');
      sellers.reload();
    } catch (err) {
      addToast(err instanceof ApiError ? err.message : 'Could not revoke this seller.', 'error');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl">Sellers</h1>
        <div className="mt-0.5 text-xs text-neutral-700">
          {sellers.loading ? 'Loading…' : `${sellerItems.length} approved`} ·{' '}
          {applications.loading ? 'loading applications…' : `${pendingApps.length} pending review`}
        </div>
      </div>

      <Card className="mb-5 border border-accent-300 bg-accent-100 p-5">
        <h2 className="mb-3 text-lg text-accent-800">Applications waiting on you</h2>
        {applications.loading ? (
          <p className="text-sm text-accent-800">Loading…</p>
        ) : applications.error ? (
          <p className="text-sm text-accent-800">Applications could not be loaded.</p>
        ) : pendingApps.length === 0 ? (
          <p className="text-sm text-accent-800">No applications waiting for review.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {pendingApps.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between rounded-2xl bg-white/50 px-4 py-2.5 text-sm"
              >
                <div>
                  <div className="font-bold text-accent-900">{a.storeName}</div>
                  <div className="text-xs text-accent-800">
                    {a.applicant ?? a.contactEmail} · applied {formatDate(a.createdAt)}
                  </div>
                </div>
                <Link
                  to={`/sellers/${a.id}/review`}
                  className="text-xs font-bold text-accent-800"
                >
                  Review
                </Link>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-5">
        <h2 className="mb-3 text-lg">Approved sellers</h2>
        {sellers.loading ? (
          <p className="text-sm text-neutral-700">Loading sellers…</p>
        ) : sellers.error ? (
          <EmptyState
            title="Could not load sellers"
            description={sellers.error.message || 'The server did not respond. Try again shortly.'}
          />
        ) : sellerItems.length === 0 ? (
          <EmptyState title="No approved sellers yet" />
        ) : (
          <table>
            <thead>
              <tr>
                <th>Seller</th>
                <th>Store</th>
                <th>Joined</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sellerItems.map((s) => (
                <tr key={s.id}>
                  <td className="font-bold">{s.fullName ?? '—'}</td>
                  <td>
                    {s.store?.name ?? '—'}
                    {s.store?.description && (
                      <div className="text-xs text-neutral-700">{s.store.description}</div>
                    )}
                  </td>
                  <td>{formatDate(s.joinedAt)}</td>
                  <td className="text-right">
                    <Button
                      variant="ghost"
                      className="min-h-[32px] px-3 text-xs"
                      disabled={busyId === s.id}
                      onClick={() => handleRevoke(s.id, s.fullName ?? 'this seller')}
                    >
                      Revoke
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </AdminLayout>
  );
}
