import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Card, EmptyState } from '@arghya/ui';
import { inr } from '@arghya/utils';
import AdminLayout from '../components/AdminLayout.js';
import { api } from '../lib/api.js';
import { useAsync } from '../lib/useAsync.js';
import { formatDateTime } from '../lib/format.js';

const today = new Date().toLocaleDateString('en-IN', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
});

interface StatCardProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  highlight?: boolean;
}

function StatCard({ label, value, hint, highlight }: StatCardProps) {
  return (
    <Card
      className={`p-4 ${highlight ? 'border border-accent-300 bg-accent-100' : ''}`}
    >
      <div
        className={`text-[11px] uppercase tracking-wider ${
          highlight ? 'text-accent-800' : 'text-neutral-700'
        }`}
      >
        {label}
      </div>
      <div className={`mt-1.5 font-heading text-2xl ${highlight ? 'text-accent-800' : ''}`}>
        {value}
      </div>
      {hint && (
        <div className={`mt-0.5 text-xs ${highlight ? 'text-accent-800' : 'text-neutral-700'}`}>
          {hint}
        </div>
      )}
    </Card>
  );
}

export default function AdminDashboard() {
  const orders = useAsync(() => api.adminOrders(), []);
  const applications = useAsync(() => api.adminApplications('pending'), []);
  const ledger = useAsync(() => api.adminLedger(), []);

  const orderItems = orders.data?.items ?? [];
  const needsAction = orderItems.filter((o) => o.status === 'paid');
  const pendingApps = applications.data?.items ?? [];

  const loadError = orders.error || applications.error || ledger.error;

  return (
    <AdminLayout>
      <div className="mb-6 flex flex-wrap items-end gap-3">
        <div>
          <h1 className="text-2xl">Dashboard</h1>
          <div className="mt-0.5 text-xs text-neutral-700">{today}</div>
        </div>
      </div>

      {loadError && (
        <div className="mb-5 rounded-2xl border border-accent-300 bg-accent-100 px-4 py-3 text-sm text-accent-800">
          Some data could not be loaded from the server ({loadError.message || 'network error'}).
          The screens below show what did load.
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <StatCard
          label="Total orders"
          value={orders.loading ? '—' : orderItems.length}
          hint={orders.error ? 'Could not load' : 'All time'}
        />
        <StatCard
          label="Ready to ship"
          value={orders.loading ? '—' : needsAction.length}
          hint="Paid, awaiting dispatch"
        />
        <StatCard
          label="Seller applications"
          value={applications.loading ? '—' : pendingApps.length}
          hint="Waiting on review"
          highlight={pendingApps.length > 0}
        />
        <StatCard
          label="Gross sales"
          value={ledger.loading ? '—' : inr(ledger.data?.summary?.grossSales ?? 0)}
          hint={ledger.error ? 'Could not load' : `${ledger.data?.summary?.orders ?? 0} paid orders`}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.5fr_1fr]">
        <Card className="p-5">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-lg">Orders needing you</h2>
            <Link to="/orders" className="text-xs font-bold">
              View all orders
            </Link>
          </div>
          {orders.loading ? (
            <p className="text-sm text-neutral-700">Loading orders…</p>
          ) : needsAction.length === 0 ? (
            <EmptyState
              title="Nothing waiting on you"
              description={
                orders.error
                  ? 'Orders could not be loaded from the server.'
                  : 'No paid orders are waiting to be shipped right now.'
              }
            />
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Value</th>
                  <th>Placed</th>
                </tr>
              </thead>
              <tbody>
                {needsAction.slice(0, 6).map((o) => (
                  <tr key={o.id}>
                    <td>
                      <Link to={`/orders/${o.id}`} className="font-bold">
                        {o.id.slice(0, 8)}
                      </Link>
                    </td>
                    <td>{o.customerName ?? 'Guest'}</td>
                    <td>{inr(o.total)}</td>
                    <td>{formatDateTime(o.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <div className="flex flex-col gap-5">
          <Card className="border border-accent-2-300 bg-accent-2-100 p-5">
            <h2 className="mb-3 text-lg text-accent-2-900">Seller applications</h2>
            {applications.loading ? (
              <p className="text-sm text-accent-2-900">Loading…</p>
            ) : pendingApps.length === 0 ? (
              <p className="text-sm text-accent-2-900">
                {applications.error
                  ? 'Could not load applications.'
                  : 'No applications waiting for review.'}
              </p>
            ) : (
              <div className="flex flex-col gap-2.5 text-sm text-accent-2-900">
                {pendingApps.slice(0, 4).map((a) => (
                  <Link
                    key={a.id}
                    to={`/sellers/${a.id}/review`}
                    className="flex items-center justify-between rounded-2xl bg-white/40 px-3 py-2 no-underline text-accent-2-900"
                  >
                    <span className="font-bold">{a.storeName}</span>
                    <span className="text-xs">Review</span>
                  </Link>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="mb-3 text-lg">Platform ledger</h2>
            {ledger.loading ? (
              <p className="text-sm text-neutral-700">Loading…</p>
            ) : ledger.error || !ledger.data ? (
              <p className="text-sm text-neutral-700">Ledger could not be loaded.</p>
            ) : (
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-700">Platform fees</span>
                  <strong>{inr(ledger.data.summary.platformFees)}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-700">Seller payouts</span>
                  <strong>{inr(ledger.data.summary.sellerPayouts)}</strong>
                </div>
                <div className="flex justify-between border-t border-divider pt-2">
                  <span className="text-neutral-700">Unsettled payouts</span>
                  <strong>{inr(ledger.data.summary.unsettledPayouts)}</strong>
                </div>
                <Link to="/commissions" className="mt-1 text-xs font-bold">
                  Open commissions & payouts
                </Link>
              </div>
            )}
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
