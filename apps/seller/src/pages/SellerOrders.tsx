import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { EmptyState, Button, Tag, TabGroup, useToastStore } from '@arghya/ui';
import { inr, orderStatusMeta } from '@arghya/utils';
import type { OrderStatus } from '@arghya/api-client';
import { api, type SellerOrder } from '../lib/api.js';

interface OrderTab {
  key: string;
  label: string;
  match: (status: OrderStatus) => boolean;
}

// Tab groupings are seller-workflow framing ("what do I need to do"), not
// the order's status itself — the per-row Tag below uses the same
// label/color every app uses for the actual status.
const TABS: OrderTab[] = [
  { key: 'dispatch', label: 'To dispatch', match: (s) => s === 'pending' || s === 'paid' },
  { key: 'shipped', label: 'Shipped', match: (s) => s === 'shipped' },
  { key: 'delivered', label: 'Delivered', match: (s) => s === 'delivered' },
  { key: 'cancelled', label: 'Cancelled', match: (s) => s === 'cancelled' },
  { key: 'all', label: 'All', match: () => true },
];

export default function SellerOrders() {
  const [orders, setOrders] = useState<SellerOrder[] | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('dispatch');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = async () => {
    try {
      const { items } = await api.sellerOrders();
      setOrders(items);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    if (!orders) return [];
    const active = TABS.find((t) => t.key === tab) ?? TABS[TABS.length - 1]!;
    return orders.filter((o) => active.match(o.status));
  }, [orders, tab]);

  const updateStatus = async (orderId: string, status: OrderStatus) => {
    setUpdatingId(orderId);
    try {
      await api.updateSellerOrderStatus(orderId, status);
      useToastStore.getState().addToast('Order updated', 'success');
      await load();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not update the order';
      useToastStore.getState().addToast(message, 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return <div className="animate-pulse font-heading text-xl text-neutral-700">Loading orders…</div>;
  }

  if (error) {
    const message = error instanceof Error ? error.message : 'Something went wrong reaching Arghya.';
    return (
      <EmptyState
        title="Couldn't load your orders"
        description={message}
        action={<Button onClick={load}>Retry</Button>}
      />
    );
  }

  if (!orders) return null;

  const dispatchCount = orders.filter((o) => o.status === 'pending' || o.status === 'paid').length;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end gap-3.5">
        <div>
          <h1 className="text-2xl md:text-3xl">Orders</h1>
          <div className="mt-1 text-xs text-neutral-700">
            {dispatchCount} to dispatch · {orders.length} total
          </div>
        </div>
      </div>

      <TabGroup className="mb-5" options={TABS} value={tab} onChange={setTab} />

      {filtered.length === 0 ? (
        <EmptyState title="No orders here" description="Orders matching this filter will show up here." />
      ) : (
        <div className="overflow-x-auto rounded-3xl bg-surface p-1">
          <table>
            <thead>
              <tr>
                <th>Order</th>
                <th>Item</th>
                <th>Customer</th>
                <th>Value</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => (
                <tr key={order.id}>
                  <td>
                    <Link to={`/orders/${order.id}`} className="font-bold">
                      {order.id.slice(0, 8).toUpperCase()}
                    </Link>
                  </td>
                  <td className="max-w-[260px] truncate">
                    {order.items.map((i) => `${i.productName} ×${i.quantity}`).join(', ')}
                  </td>
                  <td className="text-neutral-700">{order.customerName || '—'}</td>
                  <td>{inr(order.total)}</td>
                  <td>
                    <Tag variant={orderStatusMeta(order.status).variant}>{orderStatusMeta(order.status).label}</Tag>
                  </td>
                  <td>
                    <div className="flex gap-1.5">
                      {(order.status === 'pending' || order.status === 'paid') && (
                        <button
                          type="button"
                          disabled={updatingId === order.id}
                          onClick={() => updateStatus(order.id, 'shipped')}
                          className="rounded-full bg-accent px-3 py-1.5 text-xs font-bold text-bg disabled:opacity-50"
                        >
                          Ship
                        </button>
                      )}
                      {order.status === 'shipped' && (
                        <button
                          type="button"
                          disabled={updatingId === order.id}
                          onClick={() => updateStatus(order.id, 'delivered')}
                          className="rounded-full bg-accent px-3 py-1.5 text-xs font-bold text-bg disabled:opacity-50"
                        >
                          Deliver
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-5 text-xs leading-relaxed text-neutral-700">
        Customer addresses are shown on the order for dispatch only. Open an order for the full shipping
        address and pack list.
      </p>
    </div>
  );
}
