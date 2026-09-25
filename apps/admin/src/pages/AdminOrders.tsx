import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, EmptyState, Tag, TabGroup, type TabGroupOption } from '@arghya/ui';
import { inr } from '@arghya/utils';
import type { OrderStatus } from '@arghya/api-client';
import AdminLayout from '../components/AdminLayout.js';
import { api } from '../lib/api.js';
import { useAsync } from '../lib/useAsync.js';
import { orderStatusMeta } from '../lib/orderStatus.js';
import { formatDateTime } from '../lib/format.js';

type FilterKey = OrderStatus | 'all';

const FILTERS: TabGroupOption[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Awaiting payment' },
  { key: 'paid', label: 'Ready to ship' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
];

export default function AdminOrders() {
  const { data, loading, error } = useAsync(() => api.adminOrders(), []);
  const [filter, setFilter] = useState<FilterKey>('all');

  const items = data?.items ?? [];
  const filtered = useMemo(
    () => (filter === 'all' ? items : items.filter((o) => o.status === filter)),
    [items, filter]
  );
  const readyToShip = items.filter((o) => o.status === 'paid').length;

  return (
    <AdminLayout>
      <div className="mb-6 flex flex-wrap items-end gap-3">
        <div>
          <h1 className="text-2xl">Orders</h1>
          <div className="mt-0.5 text-xs text-neutral-700">
            {loading ? 'Loading…' : `${items.length} total · ${readyToShip} ready to ship`}
          </div>
        </div>
        <TabGroup
          className="ml-auto"
          options={FILTERS}
          value={filter}
          onChange={(key) => setFilter(key as FilterKey)}
        />
      </div>

      <Card className="p-5">
        {loading ? (
          <p className="text-sm text-neutral-700">Loading orders…</p>
        ) : error ? (
          <EmptyState
            title="Could not load orders"
            description={error.message || 'The server did not respond. Try again shortly.'}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No orders here"
            description="Nothing matches this filter yet."
          />
        ) : (
          <table>
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Value</th>
                <th>Stage</th>
                <th>Placed</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => {
                const meta = orderStatusMeta(o.status);
                return (
                  <tr key={o.id}>
                    <td>
                      <Link to={`/orders/${o.id}`} className="font-bold">
                        {o.id.slice(0, 8)}
                      </Link>
                    </td>
                    <td>{o.customerName ?? 'Guest'}</td>
                    <td>{o.items?.length ?? 0} items</td>
                    <td>{inr(o.total)}</td>
                    <td>
                      <Tag variant={meta.variant}>{meta.label}</Tag>
                    </td>
                    <td>{formatDateTime(o.createdAt)}</td>
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
