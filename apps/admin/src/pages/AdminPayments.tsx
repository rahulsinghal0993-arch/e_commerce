import { Link } from 'react-router-dom';
import { Card, EmptyState, Tag } from '@arghya/ui';
import { inr } from '@arghya/utils';
import type { OrderStatus } from '@arghya/api-client';
import AdminLayout from '../components/AdminLayout.js';
import { api } from '../lib/api.js';
import { useAsync } from '../lib/useAsync.js';
import { orderStatusMeta } from '../lib/orderStatus.js';
import { formatDateTime } from '../lib/format.js';

const CAPTURED_STATUSES: OrderStatus[] = ['paid', 'shipped', 'delivered'];

export default function AdminPayments() {
  const { data, loading, error } = useAsync(() => api.adminOrders(), []);
  const items = data?.items ?? [];

  const captured = items.filter((o) => CAPTURED_STATUSES.includes(o.status));
  const capturedTotal = captured.reduce((sum, o) => sum + Number(o.total), 0);
  const awaiting = items.filter((o) => o.status === 'pending');
  const awaitingTotal = awaiting.reduce((sum, o) => sum + Number(o.total), 0);
  const cancelled = items.filter((o) => o.status === 'cancelled');

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl">Payments & refunds</h1>
        <div className="mt-0.5 text-xs text-neutral-700">
          Derived from order payment status — there is no dedicated payment gateway log wired up yet.
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3.5 lg:grid-cols-3">
        <Card className="p-4">
          <div className="text-[11px] uppercase tracking-wider text-neutral-700">Captured</div>
          <div className="mt-1.5 font-heading text-2xl">
            {loading ? '—' : inr(capturedTotal)}
          </div>
          <div className="mt-0.5 text-xs text-neutral-700">{captured.length} orders</div>
        </Card>
        <Card className="border border-accent-300 bg-accent-100 p-4">
          <div className="text-[11px] uppercase tracking-wider text-accent-800">
            Awaiting payment
          </div>
          <div className="mt-1.5 font-heading text-2xl text-accent-800">
            {loading ? '—' : inr(awaitingTotal)}
          </div>
          <div className="mt-0.5 text-xs text-accent-800">{awaiting.length} orders</div>
        </Card>
        <Card className="p-4">
          <div className="text-[11px] uppercase tracking-wider text-neutral-700">Cancelled</div>
          <div className="mt-1.5 font-heading text-2xl">
            {loading ? '—' : cancelled.length}
          </div>
          <div className="mt-0.5 text-xs text-neutral-700">orders</div>
        </Card>
      </div>

      <Card className="p-5">
        {loading ? (
          <p className="text-sm text-neutral-700">Loading payments…</p>
        ) : error ? (
          <EmptyState
            title="Could not load payments"
            description={error.message || 'The server did not respond. Try again shortly.'}
          />
        ) : items.length === 0 ? (
          <EmptyState title="No orders yet" description="Payments will appear here as orders come in." />
        ) : (
          <table>
            <thead>
              <tr>
                <th>When</th>
                <th>Order</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((o) => {
                const meta = orderStatusMeta(o.status);
                return (
                  <tr key={o.id}>
                    <td>{formatDateTime(o.createdAt)}</td>
                    <td>
                      <Link to={`/orders/${o.id}`} className="font-bold">
                        {o.id.slice(0, 8)}
                      </Link>
                    </td>
                    <td>{o.customerName ?? 'Guest'}</td>
                    <td>
                      <strong>{inr(o.total)}</strong>
                    </td>
                    <td>
                      <Tag variant={meta.variant}>{meta.label}</Tag>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </AdminLayout>
  );
}
