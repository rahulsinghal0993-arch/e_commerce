import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button, Card, EmptyState, Tag, useToastStore } from '@arghya/ui';
import { inr, orderStatusMeta } from '@arghya/utils';
import type { OrderStatus } from '@arghya/api-client';
import { api, type SellerOrder } from '../lib/api.js';

interface NextStatus {
  status: OrderStatus;
  label: string;
}

const NEXT_STATUS: Partial<Record<OrderStatus, NextStatus[]>> = {
  pending: [
    { status: 'shipped', label: 'Mark shipped' },
    { status: 'cancelled', label: 'Cancel order' },
  ],
  paid: [
    { status: 'shipped', label: 'Mark shipped' },
    { status: 'cancelled', label: 'Cancel order' },
  ],
  shipped: [{ status: 'delivered', label: 'Mark delivered' }],
};

export default function SellerOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<SellerOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [updating, setUpdating] = useState(false);

  const load = async () => {
    try {
      // No single-order seller endpoint — the order list is the source of
      // truth and is filtered client-side.
      const { items } = await api.sellerOrders();
      setOrder(items.find((o) => o.id === id) ?? null);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const updateStatus = async (status: OrderStatus) => {
    if (!id) return;
    setUpdating(true);
    try {
      await api.updateSellerOrderStatus(id, status);
      useToastStore.getState().addToast('Order updated', 'success');
      await load();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not update the order';
      useToastStore.getState().addToast(message, 'error');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse font-heading text-xl text-neutral-700">Loading order…</div>;
  }

  if (error) {
    const message = error instanceof Error ? error.message : 'Something went wrong reaching Arghya.';
    return (
      <EmptyState
        title="Couldn't load this order"
        description={message}
        action={<Button onClick={load}>Retry</Button>}
      />
    );
  }

  if (!order) {
    return (
      <EmptyState
        title="Order not found"
        description="This order doesn't belong to your store, or no longer exists."
        action={
          <Button as={Link} to="/orders">
            Back to orders
          </Button>
        }
      />
    );
  }

  const actions = NEXT_STATUS[order.status] ?? [];

  return (
    <div>
      <button
        type="button"
        onClick={() => navigate('/orders')}
        className="mb-4 text-xs font-bold text-neutral-700 hover:text-text"
      >
        ← Back to orders
      </button>

      <div className="mb-5 flex flex-wrap items-end gap-3.5">
        <div>
          <h1 className="text-2xl md:text-3xl">{order.id.slice(0, 8).toUpperCase()}</h1>
          <div className="mt-1 text-xs text-neutral-700">
            Placed {new Date(order.createdAt).toLocaleString()}
          </div>
        </div>
        <Tag variant={orderStatusMeta(order.status).variant} className="ml-1">
          {orderStatusMeta(order.status).label}
        </Tag>
        <div className="ml-auto flex gap-2.5">
          {actions.map((a) => (
            <Button
              key={a.status}
              variant={a.status === 'cancelled' ? 'quiet' : 'solid'}
              disabled={updating}
              onClick={() => updateStatus(a.status)}
            >
              {a.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <Card className="p-5">
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Unit price</th>
                  <th>Line total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.productName}</td>
                    <td>{item.quantity}</td>
                    <td>{inr(item.unitPrice)}</td>
                    <td>
                      <strong>{inr(item.lineTotal)}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="flex flex-col gap-4">
          <Card className="p-5 text-sm">
            <h2 className="mb-2.5 text-base">Customer</h2>
            <p className="text-neutral-700">{order.customerName || 'Not shared'}</p>
          </Card>
          <div className="rounded-2xl border border-divider p-5 text-sm">
            <h2 className="mb-2.5 text-base">Order total</h2>
            <div className="flex justify-between border-t border-divider pt-2.5 font-heading text-lg">
              <span>Total</span>
              <span>{inr(order.total)}</span>
            </div>
          </div>
          <p className="text-xs leading-relaxed text-neutral-700">
            The full shipping address isn't available in this view yet — Arghya's dispatch rider
            coordinates pickup and delivery directly.
          </p>
        </div>
      </div>
    </div>
  );
}
