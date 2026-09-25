import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button, Card, EmptyState, Tag, useToastStore } from '@arghya/ui';
import { inr } from '@arghya/utils';
import type { OrderStatus } from '@arghya/api-client';
import AdminLayout from '../components/AdminLayout.js';
import { api, ApiError } from '../lib/api.js';
import { useAsync } from '../lib/useAsync.js';
import { orderStatusMeta, ORDER_STATUS_TRANSITIONS } from '../lib/orderStatus.js';
import { formatDateTime } from '../lib/format.js';

const TRANSITION_LABEL: Record<OrderStatus, string> = {
  pending: 'Awaiting payment',
  paid: 'Paid',
  shipped: 'Mark shipped',
  delivered: 'Mark delivered',
  cancelled: 'Cancel order',
};

export default function AdminOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const addToast = useToastStore((s) => s.addToast);
  const { data: order, loading, error, reload } = useAsync(() => api.adminOrder(id as string), [id]);
  const [updating, setUpdating] = useState<OrderStatus | null>(null);

  async function handleTransition(status: OrderStatus) {
    setUpdating(status);
    try {
      await api.adminUpdateOrderStatus(id as string, status);
      addToast(`Order marked ${status}.`, 'success');
      reload();
    } catch (err) {
      addToast(err instanceof ApiError ? err.message : 'Could not update the order.', 'error');
    } finally {
      setUpdating(null);
    }
  }

  return (
    <AdminLayout>
      <div className="mb-6 text-xs text-neutral-700">
        <Link to="/orders">Orders</Link> · <strong className="text-text">{id?.slice(0, 8)}</strong>
      </div>

      {loading ? (
        <p className="text-sm text-neutral-700">Loading order…</p>
      ) : error ? (
        <EmptyState
          title="Could not load this order"
          description={error.message || 'The server did not respond. Try again shortly.'}
        />
      ) : !order ? (
        <EmptyState title="Order not found" />
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-start gap-3">
            <div>
              <h1 className="text-2xl">
                {order.customer?.name ?? 'Guest'} · {inr(order.total)}
              </h1>
              <div className="mt-0.5 text-xs text-neutral-700">
                Placed {formatDateTime(order.createdAt)}
                {order.store ? ` · ${order.store}` : ''}
              </div>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Tag variant={orderStatusMeta(order.status).variant}>
                {orderStatusMeta(order.status).label}
              </Tag>
              {(ORDER_STATUS_TRANSITIONS[order.status] ?? []).map((status) => (
                <Button
                  key={status}
                  variant={status === 'cancelled' ? 'ghost' : 'solid'}
                  className="min-h-[38px] text-sm"
                  disabled={updating !== null}
                  onClick={() => handleTransition(status)}
                >
                  {updating === status ? 'Updating…' : TRANSITION_LABEL[status]}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
            <div>
              <Card className="mb-5 p-5">
                <h2 className="mb-3 text-lg">Items</h2>
                <table>
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Qty</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(order.items ?? []).map((item) => (
                      <tr key={item.id}>
                        <td>{item.productName}</td>
                        <td>{item.quantity}</td>
                        <td>{inr(item.lineTotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>

              <Card className="p-5">
                <h2 className="mb-3 text-lg">Customer & shipping</h2>
                <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-neutral-700">Customer</div>
                    <div className="mt-1">{order.customer?.name ?? '—'}</div>
                    <div className="text-neutral-700">{order.customer?.email ?? '—'}</div>
                    <div className="text-neutral-700">{order.customer?.phone ?? '—'}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-neutral-700">
                      Shipping address
                    </div>
                    <div className="mt-1 whitespace-pre-line">
                      {order.shippingAddress
                        ? typeof order.shippingAddress === 'string'
                          ? order.shippingAddress
                          : JSON.stringify(order.shippingAddress)
                        : 'No address on file — pickup order'}
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            <Card className="h-fit p-5 text-sm">
              <div className="mb-2 flex justify-between">
                <span className="text-neutral-700">Subtotal</span>
                <span>{inr(order.subtotal)}</span>
              </div>
              <div className="flex justify-between border-t border-divider pt-2 font-bold">
                <span>Total</span>
                <span>{inr(order.total)}</span>
              </div>
            </Card>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
